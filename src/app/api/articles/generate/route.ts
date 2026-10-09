import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { aiConfigured, generateArticle } from "@/lib/ai";
import { getEntitlements } from "@/lib/entitlements";

export const runtime = "nodejs";
export const maxDuration = 60;

const schema = z.object({
  topic: z.string().trim().min(10, "Tell us a bit more about the topic").max(500),
  keyPoints: z.string().max(2000).optional(),
  audience: z.string().max(200).optional(),
  tone: z.string().max(100).optional(),
  companyName: z.string().max(200).optional(),
  website: z.string().max(300).optional(),
});

// Drafting costs money per call, so cap it per client. In-memory: good enough
// for a single instance, and the entitlement check below is the real gate.
const RATE_MAX = 5;
const RATE_WINDOW_MS = 60_000;
const calls = new Map<string, number[]>();

function rateLimited(userId: string): boolean {
  const now = Date.now();
  const recent = (calls.get(userId) || []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  calls.set(userId, recent);
  return recent.length > RATE_MAX;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  if (!aiConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Article drafting is not switched on yet." },
      { status: 503 }
    );
  }

  const ent = await getEntitlements(userId);
  if (!ent.hasPaid) {
    return NextResponse.json(
      { ok: false, error: "Buy a package first — then we can draft it for you." },
      { status: 403 }
    );
  }

  if (rateLimited(userId)) {
    return NextResponse.json(
      { ok: false, error: "Too many drafts in a row. Wait a minute and try again." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.errors[0]?.message || "Invalid data" },
      { status: 400 }
    );
  }

  try {
    const article = await generateArticle(parsed.data);
    return NextResponse.json({ ok: true, ...article });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not draft the article";
    console.error("[articles/generate]", err);
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
