import { sql } from "drizzle-orm";
import { getDb } from "@/db";

/**
 * 12.11.2026 — bonus: 3 days of paid Facebook promotion, set up by hand.
 * The buyer picks the newspaper (or leaves it to us) on the order form; the
 * choice rides on the order and shows up in the payment email to the owner.
 */
let ensured = false;
export async function ensureFbPromoColumn(): Promise<void> {
  if (ensured) return;
  await getDb().execute(sql`ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "fb_promo" text`);
  ensured = true;
}

export async function setFbPromo(orderId: string, value: string): Promise<void> {
  await ensureFbPromoColumn();
  await getDb().execute(sql`UPDATE "order" SET "fb_promo" = ${value} WHERE "id" = ${orderId}`);
}

export async function fbPromoForSession(sessionId: string): Promise<string | null> {
  await ensureFbPromoColumn();
  const r = (await getDb().execute(
    sql`SELECT "fb_promo" FROM "order" WHERE "stripe_session_id" = ${sessionId} LIMIT 1`
  )) as unknown as { rows?: { fb_promo: string | null }[] } | { fb_promo: string | null }[];
  const rows = Array.isArray(r) ? r : r.rows ?? [];
  return rows[0]?.fb_promo ?? null;
}
