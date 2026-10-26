import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { SOURCE_COOKIE } from "@/lib/source";
import { ensureVisitTable, sellingBucket } from "@/lib/visit-db";
import { createLimiter, ipFromRequest } from "@/lib/rate-limit";

export const runtime = "nodejs";

const tooMany = createLimiter(60, 10 * 60 * 1000);

const schema = z.object({
  path: z.string().min(1).max(200),
  visitorId: z.string().min(8).max(64),
});

/**
 * Counts one arrival on a page that sells.
 *
 * The source is read from the cookie on this server rather than taken from the
 * browser, so what lands in the table is what the site itself recorded. A
 * repeat within the same day is dropped by the unique index, not by trusting
 * the caller.
 */
export async function POST(req: NextRequest) {
  if (tooMany(ipFromRequest(req))) {
    return NextResponse.json({ ok: true, counted: false });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const path = parsed.data.path.split("?")[0] || "/";
  if (!sellingBucket(path)) return NextResponse.json({ ok: true, counted: false });

  const source = req.cookies.get(SOURCE_COOKIE)?.value || null;

  try {
    await ensureVisitTable();
    await getDb().execute(sql`
      INSERT INTO "visit" ("visitor_id", "source", "path")
      VALUES (${parsed.data.visitorId}, ${source}, ${path})
      ON CONFLICT ("visitor_id", "path", "day") DO NOTHING
    `);
  } catch (err) {
    // Counting is not worth failing a page view over.
    console.error("[track/visit]", err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: true, counted: false });
  }

  return NextResponse.json({ ok: true, counted: true });
}
