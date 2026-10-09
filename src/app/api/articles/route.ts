import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb } from "@/db";
import { articles } from "@/db/schema";
import { claimArticleSlot, getEntitlements, releaseArticleSlot } from "@/lib/entitlements";

export const runtime = "nodejs";

const createSchema = z.object({
  title: z.string().trim().min(3, "Give the article a title").max(200),
  body: z.string().max(20000).optional(),
  existingUrl: z.string().url("That does not look like a link").max(500).optional().or(z.literal("")),
  notes: z.string().max(2000).optional(),
  aiGenerated: z.boolean().optional(),
});

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  const rows = await getDb()
    .select()
    .from(articles)
    .where(eq(articles.userId, userId))
    .orderBy(desc(articles.createdAt));

  return NextResponse.json({ ok: true, articles: rows });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.errors[0]?.message || "Invalid data" },
      { status: 400 }
    );
  }

  const ent = await getEntitlements(userId);
  if (!ent.canSubmit) {
    return NextResponse.json(
      {
        ok: false,
        error: ent.hasPaid
          ? "You have used every article included in your plan. Buy another package or wait for your subscription to renew."
          : "Buy a package first — then you can send us your article.",
      },
      { status: 403 }
    );
  }

  // Take the slot before writing the article so two tabs cannot spend the same one.
  const claim = await claimArticleSlot(userId);
  if (!claim) {
    return NextResponse.json({ ok: false, error: "No article slot left" }, { status: 403 });
  }

  try {
    const db = getDb();
    const inserted = await db
      .insert(articles)
      .values({
        userId,
        orderId: claim.orderId,
        subscriptionId: claim.subscriptionId,
        title: parsed.data.title,
        body: parsed.data.body || null,
        existingUrl: parsed.data.existingUrl || null,
        notes: parsed.data.notes || null,
        aiGenerated: Boolean(parsed.data.aiGenerated),
        status: "draft",
      })
      .returning({ id: articles.id });

    return NextResponse.json({ ok: true, id: inserted[0].id });
  } catch (err) {
    // Hand the slot back rather than silently charging for nothing.
    await releaseArticleSlot(claim);
    console.error("[articles] create failed", err);
    return NextResponse.json({ ok: false, error: "Could not save the article" }, { status: 500 });
  }
}
