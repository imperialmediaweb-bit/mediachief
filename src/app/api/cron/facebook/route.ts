import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAllPosts } from "@/lib/mdx";
import { SITE } from "@/data/site";
import { facebookConfigured, postLink, postedSlugs, recordPost } from "@/lib/facebook";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Puts one blog post on the Facebook page.
 *
 * Run it on a schedule — once a day is plenty. It takes the oldest article
 * that has never been posted, so the archive goes out in order and at a human
 * pace rather than forty links in one afternoon, which is what a page looks
 * like just before people stop following it.
 *
 * When everything has been posted it says so and does nothing. A page that
 * recycles the same six links is worse than a quiet one, so running dry is
 * reported rather than worked around.
 */
export async function GET(req: NextRequest) {
  const key =
    req.nextUrl.searchParams.get("key") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";
  const expected = process.env.CRON_SECRET || "";

  if (!expected) {
    return NextResponse.json({ error: "CRON_SECRET is not set" }, { status: 503 });
  }
  const a = Buffer.from(key);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!facebookConfigured()) {
    return NextResponse.json(
      { error: "Set FACEBOOK_PAGE_ID and FACEBOOK_PAGE_TOKEN on this service" },
      { status: 503 }
    );
  }

  const done = await postedSlugs();
  // Oldest first: the archive goes out in the order it was written.
  const next = getAllPosts()
    .slice()
    .reverse()
    .find((p) => !done.has(p.slug));

  if (!next) {
    return NextResponse.json({
      ok: true,
      posted: false,
      reason: "Every article has been posted. Write another one.",
      total: done.size,
    });
  }

  const link = `${SITE.url}/blog/${next.slug}`;
  const message = [next.title, "", next.excerpt].filter(Boolean).join("\n");

  const result = await postLink(message, link);
  await recordPost(next.slug, result);

  if (!result.ok) {
    return NextResponse.json({ ok: false, slug: next.slug, error: result.error }, { status: 200 });
  }
  return NextResponse.json({ ok: true, posted: true, slug: next.slug, postId: result.postId, link });
}
