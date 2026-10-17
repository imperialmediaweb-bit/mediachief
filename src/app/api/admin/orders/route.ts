import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getDb } from "@/db";
import { orders, users } from "@/db/schema";
import { findPackageById } from "@/data/packages";
import { sendEmail, wrapEmail } from "@/lib/email";
import { SITE } from "@/data/site";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email("Enter the client's email"),
  name: z.string().max(200).optional(),
  packageId: z.string().min(1).max(64),
  amount: z.number().int().min(0).max(1_000_000),
  articlesIncluded: z.number().int().min(1).max(50).default(1),
  newspaperStates: z.string().max(600).optional(),
  notify: z.boolean().default(true),
});

/**
 * Records an order taken outside Stripe — a bank transfer, an invoice, a deal
 * agreed by email. It gives the client the same account access a card payment
 * would, so they can send their article the normal way.
 */
export async function POST(req: NextRequest) {
  if (!getSession()) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.errors[0]?.message || "Invalid data" },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const email = data.email.trim().toLowerCase();
  const db = getDb();

  // Same rule as the Stripe webhook: the order attaches to the account that
  // owns this address, creating it when it does not exist yet.
  let userId: string;
  const found = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (found[0]) {
    userId = found[0].id;
    if (data.name) await db.update(users).set({ name: data.name }).where(eq(users.id, userId));
  } else {
    userId = crypto.randomUUID();
    await db.insert(users).values({ id: userId, email, name: data.name || null });
  }

  const inserted = await db
    .insert(orders)
    .values({
      userId,
      email,
      packageId: data.packageId,
      amount: data.amount,
      currency: "usd",
      status: "paid",
      articlesIncluded: data.articlesIncluded,
      articlesUsed: 0,
      newspaperStates: data.newspaperStates || null,
      paidAt: new Date(),
    })
    .returning({ id: orders.id });

  if (data.notify) {
    const pkg = findPackageById(data.packageId);
    const firstName = (data.name || "").split(" ")[0];
    await sendEmail({
      to: email,
      subject: "Your order is open — send us your article",
      html: wrapEmail(
        "Your order is open",
        `
        <p>Hi${firstName ? " " + firstName : ""},</p>
        <p>We have recorded your order for <strong>${pkg?.name || data.packageId}</strong>. You can send us the article whenever you are ready.</p>
        <ol>
          <li>Go to <a href="${SITE.url}/account/login">${SITE.domain}/account/login</a> and enter this email address — <strong>${email}</strong>.</li>
          <li>We send you a sign-in link. There is no password.</li>
          <li>Open <em>New article</em>, paste your text and add up to three photos. No text ready? Give us the topic and we write it.</li>
        </ol>
        <p>We publish within one business day and email you every link, with the report in PDF and Excel.</p>
        <p style="margin-top:24px;">Best regards,<br/><strong>The Media Chief Team</strong></p>
      `
      ),
    });
  }

  return NextResponse.json({ ok: true, orderId: inserted[0].id, userId });
}
