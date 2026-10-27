import { sql } from "drizzle-orm";
import { getDb } from "@/db";

/**
 * Arrivals on the pages that sell, by where the visitor came from.
 *
 * Orders alone cannot tell a channel that sends nobody from one that sends
 * plenty of people who then leave — both show zero sales, and only one is
 * worth fixing rather than cutting. This counts the step before the order.
 *
 * One row per visitor, per page, per day: a refresh or a second look does not
 * inflate it, and nothing here identifies a person. The visitor id is a random
 * value in their own browser with no meaning anywhere else.
 */
let ensured = false;

export async function ensureVisitTable(): Promise<void> {
  if (ensured) return;
  const db = getDb();
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "visit" (
      "id"         serial PRIMARY KEY,
      "visitor_id" text NOT NULL,
      "source"     text,
      "path"       text NOT NULL,
      "day"        date NOT NULL DEFAULT CURRENT_DATE,
      "created_at" timestamptz NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "visit_once_per_day"
      ON "visit" ("visitor_id", "path", "day")
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "visit_source" ON "visit" ("source")`);
  ensured = true;
}

/** The pages worth counting: where someone is being asked to buy. */
export const SELLING_PATHS = ["/offer", "/offer-fb", "/packages", "/order"] as const;

/** The bucket a path belongs to, or null when it is not a page that sells. */
export function sellingBucket(path: string): "offer" | "order" | null {
  if (path.startsWith("/order")) return "order";
  // The Facebook ad lands on /intro-offer; without it the ad's visitors were never counted.
  if (path.startsWith("/offer") || path.startsWith("/intro-offer") || path.startsWith("/packages")) return "offer";
  return null;
}
