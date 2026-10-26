import { sql } from "drizzle-orm";
import { getDb } from "@/db";

let ensured = false;
/** The `source` column on orders (lib/source.ts); created here, like the reserved-payment ones. */
export async function ensureSourceColumn(): Promise<void> {
  if (ensured) return;
  await getDb().execute(sql`ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "source" text`);
  ensured = true;
}
