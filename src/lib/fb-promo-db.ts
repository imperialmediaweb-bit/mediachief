import { sql } from "drizzle-orm";
import { getDb } from "@/db";

/**
 * 12.11.2026 — bonus: 3 days of paid Facebook promotion, set up by hand.
 * The buyer picks the newspaper (or leaves it to us) on the order form; the
 * choice rides on the order and shows up in the payment email to the owner.
 * Once the ad has run, the admin adds the proof (screenshot from the ads
 * account, the post, the days), and the client's live report shows it — the
 * same block MediaExpres puts in its reports. No amounts, ever.
 */
let ensured = false;
export async function ensureFbPromoColumn(): Promise<void> {
  if (ensured) return;
  const db = getDb();
  await db.execute(sql`ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "fb_promo" text`);
  await db.execute(sql`ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "fb_promo_proof" text`);
  await db.execute(sql`ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "fb_promo_post" text`);
  await db.execute(sql`ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "fb_promo_days" integer`);
  ensured = true;
}

export async function setFbPromo(orderId: string, value: string): Promise<void> {
  await ensureFbPromoColumn();
  await getDb().execute(sql`UPDATE "order" SET "fb_promo" = ${value} WHERE "id" = ${orderId}`);
}

type Rows<T> = { rows?: T[] } | T[];
function rowsOf<T>(r: unknown): T[] {
  const x = r as Rows<T>;
  return Array.isArray(x) ? x : x.rows ?? [];
}

export async function fbPromoForSession(sessionId: string): Promise<string | null> {
  await ensureFbPromoColumn();
  const r = await getDb().execute(
    sql`SELECT "fb_promo" FROM "order" WHERE "stripe_session_id" = ${sessionId} LIMIT 1`
  );
  return rowsOf<{ fb_promo: string | null }>(r)[0]?.fb_promo ?? null;
}

export interface FbPromo {
  choice: string | null;
  proof: string | null;
  post: string | null;
  days: number | null;
}

export async function getFbPromo(orderId: string): Promise<FbPromo> {
  await ensureFbPromoColumn();
  const r = await getDb().execute(
    sql`SELECT "fb_promo", "fb_promo_proof", "fb_promo_post", "fb_promo_days" FROM "order" WHERE "id" = ${orderId} LIMIT 1`
  );
  const x = rowsOf<{ fb_promo: string | null; fb_promo_proof: string | null; fb_promo_post: string | null; fb_promo_days: number | null }>(r)[0];
  return {
    choice: x?.fb_promo ?? null,
    proof: x?.fb_promo_proof ?? null,
    post: x?.fb_promo_post ?? null,
    days: x?.fb_promo_days ?? null,
  };
}

export async function setFbPromoProof(
  orderId: string,
  p: { proof?: string | null; post?: string | null; days?: number | null }
): Promise<void> {
  await ensureFbPromoColumn();
  const cur = await getFbPromo(orderId);
  const proof = p.proof === undefined ? cur.proof : p.proof;
  const post = p.post === undefined ? cur.post : p.post;
  const days = p.days === undefined ? cur.days : p.days;
  await getDb().execute(
    sql`UPDATE "order" SET "fb_promo_proof" = ${proof}, "fb_promo_post" = ${post}, "fb_promo_days" = ${days} WHERE "id" = ${orderId}`
  );
}
