import { and, eq, isNotNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { articles } from "@/db/schema";
import { getStripe } from "@/lib/stripe";
import { sendEmail, wrapEmail, ADMIN_EMAIL } from "@/lib/email";
import { getCampaign } from "@/lib/network";

/**
 * 26.10.2026 — reserved payment. The owner: "the client pays, but the money is
 * taken only when they receive the report link; if we don't publish within 72
 * hours, the money stays with them". Stripe: capture_method manual at
 * checkout, capture when the article is published (admin "publish" action, or
 * placements live in the network), cancel after 72 hours.
 *
 * The 72-hour clock starts when we have the article (articles.submitted_at).
 * Without an article the hold lasts as long as Stripe allows (~7 days) and is
 * released at 6 days.
 */

const HOUR = 60 * 60 * 1000;
const PUBLISH_DEADLINE = 72 * HOUR;
const PUBLISH_ALERT = 48 * HOUR;
const NO_ARTICLE_DEADLINE = 6 * 24 * HOUR;
const NO_ARTICLE_ALERT = 5 * 24 * HOUR;

let ensured = false;
export async function ensureReservedColumns(): Promise<void> {
  if (ensured) return;
  await getDb().execute(
    sql`ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "capture_state" text, ADD COLUMN IF NOT EXISTS "reserved_at" timestamp, ADD COLUMN IF NOT EXISTS "reserve_alert_at" timestamp`,
  );
  ensured = true;
}

type Row = {
  id: string;
  email: string;
  amount: number;
  currency: string;
  pi: string | null;
  networkOrderId: number | null;
  createdAt: Date;
  reservedAt: Date | null;
  alertAt: Date | null;
};

async function reservedOrders(where?: ReturnType<typeof sql>): Promise<Row[]> {
  await ensureReservedColumns();
  const r = await getDb().execute(sql`
    SELECT id, email, amount, currency, stripe_payment_intent_id AS pi, network_order_id AS "networkOrderId",
           created_at AS "createdAt", reserved_at AS "reservedAt", reserve_alert_at AS "alertAt"
    FROM "order"
    WHERE capture_state = 'reserved' AND stripe_payment_intent_id IS NOT NULL ${where ? sql`AND ${where}` : sql``}`);
  // postgres-js returns the rows as an array.
  return r as unknown as Row[];
}

const money = (o: Row) => `$${(o.amount / 100).toFixed(2)}`;

/** Marks a freshly paid order as reserved (called from the Stripe webhook). */
export async function markReserved(orderId: string): Promise<void> {
  await ensureReservedColumns();
  await getDb().execute(
    sql`UPDATE "order" SET capture_state = 'reserved', reserved_at = now() WHERE id = ${orderId}`,
  );
}

async function capture(o: Row): Promise<boolean> {
  const stripe = getStripe();
  if (!stripe || !o.pi) return false;
  try {
    await stripe.paymentIntents.capture(o.pi);
    await getDb().execute(
      sql`UPDATE "order" SET capture_state = 'captured', paid_at = now() WHERE id = ${o.id}`,
    );
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[reserved-payment] capture failed:", o.id, message);
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `[Reserved payment] Capture FAILED — ${o.email} — ${money(o)}`,
      html: wrapEmail(
        "Capture failed",
        `<p>The order of <strong>${o.email}</strong> should have been charged, but Stripe did not capture the hold.</p>
        <p>Reason: ${message}</p><p>Order: ${o.id} · PaymentIntent: ${o.pi}</p>`,
      ),
    }).catch(() => {});
    return false;
  }
}

/** Captures the hold of the order an article belongs to — called on publish. */
export async function captureForOrder(orderId: string | null | undefined): Promise<void> {
  if (!orderId) return;
  const rows = await reservedOrders(sql`id = ${orderId}`);
  for (const o of rows) await capture(o);
}

async function articleSince(orderId: string): Promise<Date | null> {
  const [a] = await getDb()
    .select({ at: articles.submittedAt })
    .from(articles)
    .where(and(eq(articles.orderId, orderId), isNotNull(articles.submittedAt)))
    .limit(1);
  return a?.at ?? null;
}

/** Hourly: capture what is already live, alert, release expired holds. */
export async function checkReservations(): Promise<{ captured: number; released: number; alerts: number }> {
  const stripe = getStripe();
  if (!stripe) return { captured: 0, released: 0, alerts: 0 };
  const rows = await reservedOrders();
  const now = Date.now();
  let captured = 0;
  let released = 0;
  let alerts = 0;

  for (const o of rows) {
    // Safety net: placements already live in the network = delivered.
    if (o.networkOrderId) {
      const c = await getCampaign(o.networkOrderId).catch(() => null);
      if (c?.state === "ok" && c.data.placements.some((p) => p.url)) {
        if (await capture(o)) captured++;
        continue;
      }
    }

    const reservedAt = new Date(o.reservedAt ?? o.createdAt).getTime();
    const article = await articleSince(o.id);
    const start = article ? Math.max(reservedAt, article.getTime()) : reservedAt;
    const elapsed = now - start;
    const deadline = article ? PUBLISH_DEADLINE : NO_ARTICLE_DEADLINE;
    const alert = article ? PUBLISH_ALERT : NO_ARTICLE_ALERT;

    if (elapsed >= deadline) {
      try {
        await stripe.paymentIntents.cancel(o.pi!);
      } catch (err) {
        console.error("[reserved-payment] cancel:", o.id, err instanceof Error ? err.message : err);
      }
      await getDb().execute(
        sql`UPDATE "order" SET capture_state = 'released', status = 'canceled' WHERE id = ${o.id}`,
      );
      released++;
      await sendEmail({
        to: o.email,
        replyTo: ADMIN_EMAIL,
        subject: "Your card hold was released — Media Chief",
        html: wrapEmail(
          "Your card hold was released",
          `<p>Hi,</p>
          <p>${
            article
              ? "We could not publish your article within 72 hours of receiving it"
              : "We did not receive your article"
          }, so the ${money(o)} hold on your card was released automatically. You were not charged; your bank frees the amount, usually within a few days.</p>
          <p>If you'd still like to publish, just reply to this email and we'll pick it up again.</p>
          <p>Best regards,<br/><strong>The Media Chief Team</strong></p>`,
        ),
      }).catch(() => {});
      await sendEmail({
        to: ADMIN_EMAIL,
        subject: `[Reserved payment] RELEASED — ${o.email} — ${money(o)}`,
        html: wrapEmail(
          "Hold released",
          `<p>The order of <strong>${o.email}</strong> (${money(o)}) was released automatically: ${
            article ? "not published within 72 hours of the article" : "no article within 6 days"
          }. Nothing was charged.</p>`,
        ),
      }).catch(() => {});
      continue;
    }

    if (elapsed >= alert && !o.alertAt) {
      await sendEmail({
        to: ADMIN_EMAIL,
        subject: `[Reserved payment] ${Math.round((deadline - elapsed) / HOUR)} hours left — ${o.email} — ${money(o)}`,
        html: wrapEmail(
          "Hold close to its deadline",
          `<p>The order of <strong>${o.email}</strong> (${money(o)}) is only reserved on the card.</p>
          <p>${
            article
              ? "Publish it (admin → Articles → Publish) in the next hours, or the hold is released and nothing is charged."
              : "The client has not sent the article yet. If it doesn't arrive, the hold is released automatically."
          }</p>`,
        ),
      }).catch(() => {});
      await getDb().execute(sql`UPDATE "order" SET reserve_alert_at = now() WHERE id = ${o.id}`);
      alerts++;
    }
  }
  return { captured, released, alerts };
}

/** Starts the hourly check, once per server process (production only). */
export function startReservationScheduler(): void {
  if (process.env.NODE_ENV !== "production") return;
  const g = globalThis as unknown as { __reservations?: boolean };
  if (g.__reservations) return;
  g.__reservations = true;
  const run = () =>
    checkReservations()
      .then((r) => console.log("[reserved-payment]", JSON.stringify(r)))
      .catch((e) => console.error("[reserved-payment]", e));
  setTimeout(run, 5 * 60 * 1000);
  setInterval(run, HOUR);
}

