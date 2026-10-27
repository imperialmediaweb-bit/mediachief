import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { SOURCE_COOKIE } from "@/lib/source";
import { ensureDraftTable } from "@/lib/draft-db";
import { createLimiter, ipFromRequest } from "@/lib/rate-limit";

export const runtime = "nodejs";

const tooMany = createLimiter(20, 10 * 60 * 1000);

const schema = z.object({
  email: z.string().email().max(200),
  name: z.string().trim().max(200).optional(),
  packageId: z.string().trim().max(64).optional(),
  title: z.string().trim().max(200).optional(),
});

/**
 * Remembers an order that was started, so an ad that brought someone to the
 * form is not written off the moment they close the tab.
 *
 * Deliberately not a mailing list: it is written only while somebody is
 * filling in this shop's own order form, it is shown to the operator rather
 * than mailed, and the same address replaces its own row instead of adding
 * another.
 */
export async function POST(req: NextRequest) {
  if (tooMany(ipFromRequest(req))) return NextResponse.json({ ok: true });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ ok: true, saved: false });

  const d = parsed.data;
  const source = req.cookies.get(SOURCE_COOKIE)?.value || null;

  try {
    await ensureDraftTable();
    await getDb().execute(sql`
      INSERT INTO "abandoned_order" ("email", "name", "package_id", "source", "title")
      VALUES (${d.email}, ${d.name || null}, ${d.packageId || null}, ${source}, ${d.title || null})
      ON CONFLICT (lower("email")) DO UPDATE
        SET "name"       = COALESCE(EXCLUDED."name", "abandoned_order"."name"),
            "package_id" = COALESCE(EXCLUDED."package_id", "abandoned_order"."package_id"),
            "title"      = COALESCE(EXCLUDED."title", "abandoned_order"."title"),
            "updated_at" = NOW()
    `);
  } catch (err) {
    console.error("[order/draft]", err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: true, saved: false });
  }

  return NextResponse.json({ ok: true, saved: true });
}
