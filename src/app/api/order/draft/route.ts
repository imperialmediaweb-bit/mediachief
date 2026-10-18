import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ARTICLE_KINDS, aiConfigured, generateArticle } from "@/lib/ai";
import { fetchSiteContext } from "@/lib/site-context";
import { createLimiter, ipFromRequest } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Drafts the article inside the order form, before payment — the same flow as
 * MediaExpres: the buyer gives a website (and optionally keywords and links),
 * reads the draft on screen, edits it, then pays. No sign-in, so it is capped
 * per IP; each draft costs money.
 */
const limited = createLimiter(4, 10 * 60_000);

const schema = z
  .object({
    website: z.string().trim().max(300).optional().or(z.literal("")),
    brief: z.string().trim().max(2000).optional().or(z.literal("")),
    companyName: z.string().trim().max(200).optional().or(z.literal("")),
    kind: z.enum(ARTICLE_KINDS).optional(),
    keyword: z.string().trim().max(120).optional().or(z.literal("")),
    links: z.string().trim().max(1500).optional().or(z.literal("")),
  })
  .refine((d) => Boolean(d.website) || (d.brief?.length ?? 0) >= 10, {
    message: "Give us your website or a few lines about what to say.",
  });

export async function POST(req: NextRequest) {
  if (!aiConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Instant drafting is offline right now — we'll write it for you after you order." },
      { status: 503 }
    );
  }
  if (limited(ipFromRequest(req))) {
    return NextResponse.json(
      { ok: false, error: "Too many drafts in a row. Wait a few minutes and try again." },
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
  const d = parsed.data;

  const site = d.website ? await fetchSiteContext(d.website) : null;
  if (!site && !d.brief) {
    return NextResponse.json(
      { ok: false, error: "We couldn't open that website. Check the address, or add a few lines about what to say." },
      { status: 422 }
    );
  }

  try {
    const article = await generateArticle({
      topic: d.brief || `Introduce the company behind ${site?.url} to readers.`,
      companyName: d.companyName || undefined,
      website: site?.url || d.website || undefined,
      kind: d.kind,
      keyword: d.keyword || undefined,
      links: d.links || undefined,
      siteContext: site
        ? [site.title, site.description, site.text].filter(Boolean).join("\n")
        : undefined,
    });
    return NextResponse.json({ ok: true, ...article });
  } catch (err) {
    console.error("[order/draft]", err);
    const message = err instanceof Error ? err.message : "Could not draft the article";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
