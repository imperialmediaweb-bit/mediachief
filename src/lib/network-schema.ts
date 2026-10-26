import { sql } from "drizzle-orm";
import { getDb } from "@/db";

/**
 * Makes sure the two columns the network link writes to exist.
 *
 * They are declared in the Drizzle schema and the start command runs
 * `drizzle-kit push`, but the columns did not arrive on the deploy that needed
 * them and the first real campaign failed with
 * `column order.network_order_id does not exist` — a 500 with an empty body,
 * on a paid order, with a client waiting.
 *
 * So the route no longer trusts the deploy step to have run. This is the same
 * approach the publishing network uses for its own order tables, for the same
 * reason: a column that only exists if a separate step happened is a column
 * that will one day be missing.
 *
 * ADD COLUMN IF NOT EXISTS is idempotent, and the flag keeps it to one trip
 * per process rather than one per request.
 */
let ensured = false;

export async function ensureNetworkColumns(): Promise<void> {
  if (ensured) return;
  const db = getDb();
  await db.execute(sql`ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "network_order_id" integer`);
  await db.execute(sql`ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "network_report_token" text`);
  ensured = true;
}
