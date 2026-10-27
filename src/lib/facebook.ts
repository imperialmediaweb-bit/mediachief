import { sql } from "drizzle-orm";
import { getDb } from "@/db";

/**
 * Posting to the Media Chief Facebook page.
 *
 * The page had five followers and a reader said so in the comments on a paid
 * ad — which is the worst possible place to find out, because anyone weighing
 * up a press-release service checks whether the people selling it can get
 * their own page read.
 *
 * One page, one token: the publishing network's version juggles fifty pages
 * with an OAuth flow and per-page tokens, and none of that machinery earns its
 * keep here. The token is a long-lived page token in the environment, so
 * nothing about it lives in the database or passes through a browser.
 */
const GRAPH = "https://graph.facebook.com/v21.0";

export function facebookConfigured(): boolean {
  return Boolean(process.env.FACEBOOK_PAGE_ID && process.env.FACEBOOK_PAGE_TOKEN);
}

let ensured = false;

/** What has been posted, so nothing goes out twice. */
export async function ensureFacebookTable(): Promise<void> {
  if (ensured) return;
  const db = getDb();
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "facebook_post" (
      "id"         serial PRIMARY KEY,
      "slug"       text NOT NULL,
      "post_id"    text,
      "posted_at"  timestamptz NOT NULL DEFAULT NOW(),
      "error"      text
    )
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "facebook_post_slug" ON "facebook_post" ("slug")
      WHERE "error" IS NULL
  `);
  ensured = true;
}

export interface FacebookResult {
  ok: boolean;
  postId?: string;
  error?: string;
}

/**
 * Publishes a link post. Facebook builds the preview card from the page's own
 * Open Graph tags, so the image and description come from the article itself
 * rather than being described twice and drifting apart.
 */
export async function postLink(message: string, link: string): Promise<FacebookResult> {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const token = process.env.FACEBOOK_PAGE_TOKEN;
  if (!pageId || !token) return { ok: false, error: "Facebook is not configured" };

  try {
    const res = await fetch(`${GRAPH}/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, link, access_token: token }),
    });
    const data = (await res.json()) as { id?: string; error?: { message?: string } };

    if (!res.ok || !data.id) {
      const error = data.error?.message || `Facebook refused with HTTP ${res.status}`;
      console.error("[facebook] post failed:", error);
      return { ok: false, error };
    }
    console.log(`[facebook] posted ${data.id} — ${link}`);
    return { ok: true, postId: data.id };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Facebook did not answer";
    console.error("[facebook] post failed:", error);
    return { ok: false, error };
  }
}

/** The slugs already on the page, so the next run picks something else. */
export async function postedSlugs(): Promise<Set<string>> {
  await ensureFacebookTable();
  const result = await getDb().execute(
    sql`SELECT "slug" FROM "facebook_post" WHERE "error" IS NULL`
  );
  const rows = (result as unknown as { rows?: { slug: string }[] }).rows ??
    (result as unknown as { slug: string }[]);
  return new Set(rows.map((r) => r.slug));
}

export async function recordPost(slug: string, result: FacebookResult): Promise<void> {
  await ensureFacebookTable();
  await getDb().execute(sql`
    INSERT INTO "facebook_post" ("slug", "post_id", "error")
    VALUES (${slug}, ${result.postId || null}, ${result.ok ? null : result.error || "unknown"})
    ON CONFLICT DO NOTHING
  `);
}
