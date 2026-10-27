import { sql } from "drizzle-orm";
import { getDb } from "@/db";

/**
 * Orders that were started and never finished.
 *
 * Nothing was kept about them. Somebody clicked an ad, opened the form, typed
 * their address and left — and all that remained was a "1" in a funnel column
 * with no way to follow it up. The ad was paid for either way.
 *
 * It is saved from the address field, before the form is submitted, and it is
 * never mailed automatically: it appears in the admin and a person decides
 * whether writing to them is appropriate. Automatic mail to someone who did
 * not finish is how a shop starts sending things nobody asked for.
 */
let ensured = false;

export async function ensureDraftTable(): Promise<void> {
  if (ensured) return;
  const db = getDb();
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "abandoned_order" (
      "id"         serial PRIMARY KEY,
      "email"      text NOT NULL,
      "name"       text,
      "package_id" text,
      "source"     text,
      "title"      text,
      "created_at" timestamptz NOT NULL DEFAULT NOW(),
      "updated_at" timestamptz NOT NULL DEFAULT NOW(),
      -- Set once the same address places a real order, so the list only ever
      -- shows people who are genuinely still missing.
      "converted_at" timestamptz
    )
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "abandoned_order_email" ON "abandoned_order" (lower("email"))
  `);
  ensured = true;
}

/** Called when a real order arrives, so the address stops being chased. */
export async function markConverted(email: string): Promise<void> {
  if (!email) return;
  try {
    await ensureDraftTable();
    await getDb().execute(
      sql`UPDATE "abandoned_order" SET "converted_at" = NOW() WHERE lower("email") = lower(${email})`
    );
  } catch {
    // Losing this only means a finished customer stays on a list the operator
    // reads by hand. Not worth failing an order over.
  }
}
