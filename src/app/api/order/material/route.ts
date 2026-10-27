import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { articles, orders, uploads } from "@/db/schema";
import { orderIdFromMaterialToken } from "@/lib/material-link";
import { PROHIBITED_MESSAGE, screenContent } from "@/lib/content-policy";
import { createLimiter, ipFromRequest } from "@/lib/rate-limit";
import { sendEmail, wrapEmail, kv, ADMIN_EMAIL } from "@/lib/email";
import { SITE } from "@/data/site";

export const runtime = "nodejs";

const tooMany = createLimiter(20, 10 * 60 * 1000);

const schema = z.object({
  token: z.string().min(8).max(200),
  title: z.string().trim().min(3).max(200),
  body: z.string().trim().min(50).max(20000),
  imageUrls: z.array(z.string().url().max(600)).max(3).optional(),
  notes: z.string().trim().max(2000).optional(),
});

/**
 * Receives the article from a client who paid first and wrote later.
 *
 * The token is the only credential, and it is an HMAC over one order id, so
 * it opens that order and nothing else. The article is attached to the order
 * the same way the order form attaches one, so everything downstream — the
 * admin, the network, the report — sees no difference.
 */
export async function POST(req: NextRequest) {
  if (tooMany(ipFromRequest(req))) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Try again in a few minutes." },
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

  const orderId = orderIdFromMaterialToken(d.token);
  if (!orderId) {
    return NextResponse.json({ ok: false, error: "This link is not valid." }, { status: 404 });
  }

  const db = getDb();
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) {
    return NextResponse.json({ ok: false, error: "This link is not valid." }, { status: 404 });
  }

  const screening = screenContent(`${d.title}\n${d.body}`);
  if (screening.blocked) {
    return NextResponse.json({ ok: false, error: PROHIBITED_MESSAGE }, { status: 422 });
  }

  // An article may already exist for this order — they opened the link twice,
  // or sent a correction. Replace its text rather than making a second one.
  const [existing] = await db
    .select({ id: articles.id })
    .from(articles)
    .where(and(eq(articles.orderId, order.id)));

  let articleId: string;
  const notes = [
    d.notes?.trim() || null,
    screening.flagged ? `NEEDS A HUMAN READ — ${screening.reason}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  if (existing) {
    await db
      .update(articles)
      .set({
        title: d.title,
        body: d.body,
        notes: notes || null,
        status: "submitted",
        submittedAt: new Date(),
      })
      .where(eq(articles.id, existing.id));
    articleId = existing.id;
  } else {
    const [created] = await db
      .insert(articles)
      .values({
        userId: order.userId!,
        orderId: order.id,
        title: d.title,
        body: d.body,
        notes: notes || null,
        status: "submitted",
        submittedAt: new Date(),
      })
      .returning({ id: articles.id });
    if (!created) {
      return NextResponse.json(
        { ok: false, error: "Could not save your article. Please try again." },
        { status: 500 }
      );
    }
    articleId = created.id;
  }

  if (d.imageUrls?.length && order.userId) {
    await db.delete(uploads).where(eq(uploads.articleId, articleId));
    await db.insert(uploads).values(
      d.imageUrls.map((url) => ({
        articleId,
        userId: order.userId!,
        cloudinaryPublicId: url.split("/").pop()?.split(".")[0] || url.slice(-40),
        url,
        kind: "image" as const,
      }))
    );
  }

  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `[Article received] ${d.title} — ${order.email}`,
    html: wrapEmail(
      "A paid order just sent its article",
      `
      <table style="width:100%;border-collapse:collapse;">
        ${kv("Client", order.email || "—")}
        ${kv("Package", order.packageId)}
        ${kv("Headline", d.title)}
        ${kv("Photos", String(d.imageUrls?.length || 0))}
        ${screening.flagged ? kv("Flagged", screening.reason || "—") : ""}
      </table>
      <p style="margin-top:16px;"><a href="${SITE.url}/admin/articles/${articleId}">Open it in the admin</a></p>
    `
    ),
  });

  return NextResponse.json({ ok: true, articleId });
}
