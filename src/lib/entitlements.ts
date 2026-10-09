import { and, desc, eq, gt, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { orders, subscriptions } from "@/db/schema";

export interface Entitlements {
  /** The buyer has something that lets them submit an article right now. */
  canSubmit: boolean;
  /** They have paid at least once, so the newspaper list and uploads unlock. */
  hasPaid: boolean;
  /** Articles left on the active subscription this month, null when none. */
  articlesRemaining: number | null;
  /** The oldest paid order with an unused article slot, if any. */
  openOrderId: string | null;
  subscriptionId: string | null;
}

const ACTIVE = ["active", "trialing"];

/**
 * What a signed-in client is allowed to do. A one-off order buys a fixed number
 * of publication runs and is consumed when an article is created against it; a
 * subscription refills every month from the Stripe invoice webhook.
 */
export async function getEntitlements(userId: string): Promise<Entitlements> {
  const db = getDb();

  const [paidOrders, subs] = await Promise.all([
    db
      .select({
        id: orders.id,
        articlesIncluded: orders.articlesIncluded,
        articlesUsed: orders.articlesUsed,
      })
      .from(orders)
      .where(and(eq(orders.userId, userId), eq(orders.status, "paid")))
      .orderBy(orders.createdAt),
    db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), inArray(subscriptions.status, ACTIVE)))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1),
  ]);

  const sub = subs[0];
  const openOrder = paidOrders.find((o) => o.articlesUsed < o.articlesIncluded);
  const articlesRemaining = sub ? sub.articlesRemaining : null;

  return {
    hasPaid: paidOrders.length > 0 || Boolean(sub),
    canSubmit: Boolean(openOrder) || Boolean(sub && sub.articlesRemaining > 0),
    articlesRemaining,
    openOrderId: openOrder?.id ?? null,
    subscriptionId: sub?.id ?? null,
  };
}

/**
 * Claims one article slot, atomically, so two requests cannot spend the same
 * one. Returns what was charged, or null when there was nothing left to spend.
 */
export async function claimArticleSlot(
  userId: string
): Promise<{ orderId: string | null; subscriptionId: string | null } | null> {
  const db = getDb();

  // Prefer the subscription: it refills next month, an order does not.
  const subs = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        inArray(subscriptions.status, ACTIVE),
        gt(subscriptions.articlesRemaining, 0)
      )
    )
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  if (subs[0]) {
    const claimed = await db
      .update(subscriptions)
      .set({ articlesRemaining: sql`${subscriptions.articlesRemaining} - 1`, updatedAt: new Date() })
      .where(and(eq(subscriptions.id, subs[0].id), gt(subscriptions.articlesRemaining, 0)))
      .returning({ id: subscriptions.id });
    if (claimed[0]) return { orderId: null, subscriptionId: claimed[0].id };
  }

  const open = await db
    .select({ id: orders.id })
    .from(orders)
    .where(
      and(
        eq(orders.userId, userId),
        eq(orders.status, "paid"),
        sql`${orders.articlesUsed} < ${orders.articlesIncluded}`
      )
    )
    .orderBy(orders.createdAt)
    .limit(1);

  if (open[0]) {
    const claimed = await db
      .update(orders)
      .set({ articlesUsed: sql`${orders.articlesUsed} + 1` })
      .where(
        and(
          eq(orders.id, open[0].id),
          sql`${orders.articlesUsed} < ${orders.articlesIncluded}`
        )
      )
      .returning({ id: orders.id });
    if (claimed[0]) return { orderId: claimed[0].id, subscriptionId: null };
  }

  return null;
}

/** Gives a slot back when an article is deleted before it was ever submitted. */
export async function releaseArticleSlot(claim: {
  orderId: string | null;
  subscriptionId: string | null;
}) {
  const db = getDb();
  if (claim.subscriptionId) {
    await db
      .update(subscriptions)
      .set({ articlesRemaining: sql`${subscriptions.articlesRemaining} + 1`, updatedAt: new Date() })
      .where(eq(subscriptions.id, claim.subscriptionId));
    return;
  }
  if (claim.orderId) {
    await db
      .update(orders)
      .set({ articlesUsed: sql`GREATEST(${orders.articlesUsed} - 1, 0)` })
      .where(eq(orders.id, claim.orderId));
  }
}
