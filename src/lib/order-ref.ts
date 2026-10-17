import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orders } from "@/db/schema";

/**
 * An order sent from /order *before* payment lives under a reference like
 * `ord_<uuid>`, parked in the stripe_session_id column. When the card goes
 * through, the webhook swaps that reference for the real Stripe session id, so
 * from that moment the row is indistinguishable from any other paid order and
 * the admin, the account pages and the report all treat it the same way.
 *
 * Until then its status is `pending_payment`, which getEntitlements() does not
 * count — an unpaid order unlocks nothing and never reaches the editors.
 */
export const PENDING_PAYMENT = "pending_payment";

export function newOrderRef(): string {
  return `ord_${crypto.randomUUID()}`;
}

export function isOrderRef(ref: string): boolean {
  return /^ord_[0-9a-f-]{36}$/.test(ref);
}

/** The order behind a reference, whatever its status, or null. */
export async function findOrderByRef(ref: string) {
  if (!isOrderRef(ref)) return null;
  const rows = await getDb().select().from(orders).where(eq(orders.stripeSessionId, ref)).limit(1);
  return rows[0] ?? null;
}
