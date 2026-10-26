import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { articles, orders, uploads, users } from "@/db/schema";
import { folderFor } from "@/lib/cloudinary";
import { screenshotSite } from "@/lib/site-screenshot";
import { resolveOrder } from "@/lib/order-pricing";
import { newOrderRef, PENDING_PAYMENT } from "@/lib/order-ref";
import { createLimiter, ipFromRequest } from "@/lib/rate-limit";
import { PROHIBITED_MESSAGE, screenContent } from "@/lib/content-policy";
import { sendEmail, wrapEmail, kv, ADMIN_EMAIL } from "@/lib/email";
import { SITE } from "@/data/site";
import { DEFAULT_PACE, isOfferedPace } from "@/data/publishing-pace";

export const runtime = "nodejs";

/** The form is public, so one address cannot open a hundred orders a minute. */
const tooMany = createLimiter(10, 10 * 60 * 1000);

const schema = z.object({
  packageId: z.string().min(1).max(64),
  states: z.array(z.string().min(2).max(40)).max(60).optional(),
  casino: z.boolean().optional(),

  email: z.string().email("Enter a valid email address"),
  name: z.string().trim().max(200).optional(),
  company: z.string().trim().max(200).optional(),
  website: z.string().trim().max(300).optional(),

  // "have" — the text is below. "write" — we write it from the brief.
  // "later" — nothing yet; they send it from their account after paying.
  articleMode: z.enum(["have", "write", "later"]),
  title: z.string().trim().max(200).optional(),
  body: z.string().max(20000).optional(),
  brief: z.string().max(4000).optional(),
  imageUrls: z.array(z.string().url().max(500)).max(3).optional(),
  /** The pace: newspapers per run, and minutes between runs. A pair we do not
   *  offer is replaced by the default rather than refused. */
  publishingPace: z.number().int().min(1).max(50).optional(),
  publishingEveryMinutes: z.number().int().min(1).max(60 * 24 * 7).optional(),

  agreed: z.literal(true, {
    errorMap: () => ({ message: "Please confirm the declaration before continuing" }),
  }),
});

/**
 * Step one of the order: what gets published. No payment happens here — the
 * row is saved with status `pending_payment` and the buyer is sent to
 * /order/pay/<ref> to pay by card.
 *
 * The old flow sent people straight to Stripe and asked for the article
 * afterwards, which means paying for a promise. This way the article is
 * already in hand when the card is charged, and an order that is never paid
 * simply sits there: `pending_payment` is not a status getEntitlements()
 * counts, so it unlocks nothing and never reaches the editors.
 */
export async function POST(req: NextRequest) {
  if (tooMany(ipFromRequest(req))) {
    return NextResponse.json(
      { ok: false, error: "Too many orders from this connection. Try again later." },
      { status: 429 }
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.errors[0]?.message || "Invalid data" },
      { status: 400 }
    );
  }
  const d = parsed.data;
  const chosenPace = isOfferedPace(d.publishingPace, d.publishingEveryMinutes)
    ? { perRun: d.publishingPace!, everyMinutes: d.publishingEveryMinutes! }
    : DEFAULT_PACE;

  const resolved = resolveOrder({
    packageId: d.packageId,
    states: d.states,
    casino: d.casino,
  });
  if (!resolved) {
    return NextResponse.json(
      { ok: false, error: "That package no longer exists. Please pick one again." },
      { status: 400 }
    );
  }

  // The article has to be here now, or explicitly deferred.
  if (d.articleMode === "have" && !d.body?.trim()) {
    return NextResponse.json(
      { ok: false, error: "Paste the article text, or choose one of the other two options." },
      { status: 400 }
    );
  }
  if (d.articleMode === "write" && !d.brief?.trim() && !d.website?.trim()) {
    return NextResponse.json(
      { ok: false, error: "Tell us what to write about, or give us your website." },
      { status: 400 }
    );
  }

  // Screened here, before a card is ever shown. Stripe's prohibited categories
  // are refused outright — processing one risks the account the whole business
  // collects through, and that is not worth a single order.
  const screening = screenContent(d.title, d.body, d.brief, d.company, d.website);
  if (screening.blocked) {
    console.warn("[order/submit] refused:", screening.reason, screening.hits.slice(0, 6));
    return NextResponse.json({ ok: false, error: PROHIBITED_MESSAGE }, { status: 422 });
  }

  const db = getDb();
  const email = d.email.trim().toLowerCase();

  // Same rule as the Stripe webhook: the order attaches to the account that
  // owns this address, creating it when it does not exist yet. Creating it
  // before payment is harmless — an account with no paid order can do nothing.
  const patch: Record<string, unknown> = {};
  if (d.name) patch.name = d.name;
  if (d.company) patch.companyName = d.company;

  let userId: string;
  const found = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (found[0]) {
    userId = found[0].id;
    if (Object.keys(patch).length) await db.update(users).set(patch).where(eq(users.id, userId));
  } else {
    userId = crypto.randomUUID();
    await db.insert(users).values({ id: userId, email, ...patch }).onConflictDoNothing();
    const again = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
    userId = again[0]?.id ?? userId;
  }

  const ref = newOrderRef();
  const inserted = await db
    .insert(orders)
    .values({
      userId,
      email,
      packageId: resolved.packageId,
      amount: resolved.amount * 100,
      currency: "usd",
      status: PENDING_PAYMENT,
      // The reference parks here until the card goes through; the webhook then
      // replaces it with the real Stripe session id.
      stripeSessionId: ref,
      articlesIncluded: 1,
      articlesUsed: 0,
      newspaperStates: resolved.states,
      publishingPace: chosenPace.perRun,
      publishingEveryMinutes: chosenPace.everyMinutes,
    })
    .returning({ id: orders.id });

  const orderId = inserted[0]?.id;
  if (!orderId) {
    return NextResponse.json(
      { ok: false, error: "Could not save the order. Please try again." },
      { status: 500 }
    );
  }

  // "later" leaves no article behind on purpose: after paying, the client uses
  // the normal account flow, which claims the article slot at that point.
  if (d.articleMode !== "later") {
    const notes = [
      d.articleMode === "write" ? "WE WRITE IT. Brief from the client:" : null,
      d.articleMode === "write" ? d.brief?.trim() || null : null,
      d.website ? `Website: ${d.website.trim()}` : null,
      d.imageUrls?.length ? `Images supplied as links:\n${d.imageUrls.join("\n")}` : null,
      screening.flagged ? `NEEDS A HUMAN READ — ${screening.reason}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const [article] = await db.insert(articles).values({
      userId,
      orderId,
      title: d.title?.trim() || (d.articleMode === "write" ? "To be written by Media Chief" : "Untitled"),
      body: d.articleMode === "have" ? d.body?.trim() || null : null,
      existingUrl: null,
      notes: notes || null,
      status: "draft",
    }).returning({ id: articles.id });

    // No photos but a website: screenshot it as the article image, like
    // MediaExpres. Runs in the background so the buyer is not kept waiting.
    if (article && !d.imageUrls?.length && d.website?.trim()) {
      const articleId = article.id;
      void screenshotSite(d.website, folderFor(userId, articleId))
        .then((shot) =>
          shot
            ? db.insert(uploads).values({
                articleId,
                userId,
                cloudinaryPublicId: shot.publicId,
                url: shot.url,
                kind: "image",
                bytes: shot.bytes,
              })
            : null
        )
        .catch((e) => console.warn("[order/submit] screenshot", e));
    }
  }

  // Medical claims are not refused, but they must not be published on the
  // strength of an automatic check. The alert goes out now, while the buyer is
  // still on the payment page and nothing has been charged.
  if (screening.flagged) {
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `[Review before publishing] ${resolved.label} — ${email}`,
      replyTo: email,
      html: wrapEmail(
        "An order needs reading before it is published",
        `
        <p>This order passed the payment screen but matched the medical-claims check. Read it
        before it goes out — the money may already be in.</p>
        <table style="width:100%;border-collapse:collapse;">
          ${kv("Why", screening.reason || "—")}
          ${kv("Matched", screening.hits.slice(0, 10).join(", "))}
          ${kv("Client", email)}
          ${kv("Company", d.company || "—")}
          ${kv("Package", resolved.label)}
          ${kv("Reference", ref)}
        </table>
        <p style="margin-top:16px;"><a href="${SITE.url}/admin/articles">Open the articles page</a></p>
      `
      ),
    }).catch((err) => console.error("[order/submit] review alert failed:", err));
  }

  return NextResponse.json({
    ok: true,
    ref,
    url: `/order/pay/${ref}`,
    amount: resolved.amount,
    label: resolved.label,
  });
}
