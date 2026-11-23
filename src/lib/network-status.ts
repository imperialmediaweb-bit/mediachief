import { NEWSPAPERS, type Newspaper } from "@/data/newspapers";

/**
 * 23.11.2026 — live status for every paper on /our-network: the latest story
 * (title + time, read from the paper's own RSS feed) and whether its sitemap
 * answers. No traffic numbers, nothing estimated: only what the papers serve.
 * Refreshed at most once an hour (Next fetch cache). A paper that does not
 * answer simply shows without a status — the page never fails because of one.
 */
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 MediaChiefNetworkStatus";

export interface PaperStatus extends Newspaper {
  slug: string;
  host: string;
  shot: string;
  latestTitle: string | null;
  latestUrl: string | null;
  latestAt: string | null;
  sitemapOk: boolean;
}

export function hostOf(url?: string): string {
  try {
    return new URL(url || "").hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function clean(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

async function get(url: string): Promise<Response | null> {
  try {
    return await fetch(url, {
      headers: { "User-Agent": UA },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(6000),
    });
  } catch {
    return null;
  }
}

async function statusOf(p: Newspaper): Promise<PaperStatus> {
  const host = hostOf(p.url);
  const slug = host.split(".")[0];
  const base: PaperStatus = {
    ...p,
    slug,
    host,
    shot: `/network/${slug}-v1.webp`,
    latestTitle: null,
    latestUrl: null,
    latestAt: null,
    sitemapOk: false,
  };
  if (!host) return base;
  const [feed, sitemap] = await Promise.all([get(`https://${host}/feed`), get(`https://${host}/sitemap.xml`)]);
  base.sitemapOk = !!sitemap?.ok;
  if (feed?.ok) {
    try {
      const xml = await feed.text();
      const item = xml.match(/<item>[\s\S]*?<\/item>/)?.[0];
      if (item) {
        const t = item.match(/<title>([\s\S]*?)<\/title>/)?.[1];
        const l = item.match(/<link>([\s\S]*?)<\/link>/)?.[1];
        const d = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1];
        base.latestTitle = t ? clean(t) : null;
        base.latestUrl = l ? clean(l) : null;
        const when = d ? new Date(clean(d)) : null;
        base.latestAt = when && !isNaN(when.getTime()) ? when.toISOString() : null;
      }
    } catch {
      /* the card shows without a status */
    }
  }
  return base;
}

export async function networkStatus(): Promise<PaperStatus[]> {
  return Promise.all(NEWSPAPERS.map(statusOf));
}

export function timeAgo(iso: string | null, now = Date.now()): string | null {
  if (!iso) return null;
  const min = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (min < 60) return `${min || 1} min ago`;
  const h = Math.round(min / 60);
  if (h < 48) return `${h} h ago`;
  return `${Math.round(h / 24)} days ago`;
}
