import { and, eq, gte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { articles, orders, uploads, users } from "@/db/schema";
import { findPackageById } from "@/data/packages";
import { DEFAULT_PACE } from "@/data/publishing-pace";
import { screenContent } from "@/lib/content-policy";
import { sendEmail, wrapEmail, kv, ADMIN_EMAIL } from "@/lib/email";
import { ensureNetworkColumns } from "@/lib/network-schema";
import { sendPublishedEmail } from "@/lib/published-email";
import { captureForOrder } from "@/lib/reserved-payment";
import { createCampaign, getCampaign, networkConfigured, publishCampaign, urlsFrom } from "@/lib/network";

/**
 * 23.11.2026 (owner: "verifici tu singur și publici, și îi trimiți imediat
 * link-ul"): a paid order whose article passes the checks goes to the network
 * on its own, the card is charged and the client gets the links — the same
 * steps the admin's Create + Publish buttons run. Anything that does not pass
 * stays in the admin queue and the admin gets an email with the reason.
 *
 * Off without a deploy: AUTO_PUBLISH=0. Daily cap: AUTO_PUBLISH_PER_DAY (10).
 */
const running = new Set<string>();

type Verdict = { ok: boolean; reason: string };

function words(s: string): number {
  return s.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
}

function linksIn(s: string): string[] {
  return Array.from(new Set(s.match(/https?:\/\/[^\s"'<>)\]]+/g) || []));
}

/** The client's link: the website from the order form, else the first link in the text. */
function clientUrlFrom(notes: string | null, body: string): string | null {
  const site = notes?.match(/Website:\s*(\S+)/i)?.[1];
  const raw = site || linksIn(body)[0];
  if (!raw) return null;
  try {
    return new URL(/^https?:\/\//.test(raw) ? raw : `https://${raw}`).toString();
  } catch {
    return null;
  }
}

async function aiReview(title: string, body: string, casino: boolean): Promise<Verdict> {
  const prompt = `You review a paid sponsored article before it is published on 50 US local news sites.
Answer ONLY with JSON: {"ok": true|false, "reason": "<short reason in English>"}.
Reject (ok=false) if ANY of these is true:
- it is not a real article (test text, gibberish, a few lines, a list of links, placeholder);
- it is not in English;
- illegal or adult content, drugs, weapons, hate, scams, get-rich-quick, crypto investment promises;
- ${casino ? "gambling is ALLOWED for this order" : "gambling, casino or betting content (not allowed on this package)"};
- medical claims that something cures or treats a disease;
- it attacks or accuses a named real person or company;
- fake news presented as real events.
Otherwise ok=true. Ordinary business promotion is fine.

TITLE: ${title}

ARTICLE:
${body.slice(0, 12000)}`;

  const openai = process.env.OPENAI_API_KEY;
  const anthropic = process.env.ANTHROPIC_API_KEY;
  let text = "";
  try {
    if (openai) {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${openai}` },
        body: JSON.stringify({
          model: process.env.AUTO_PUBLISH_MODEL || "gpt-4o-mini",
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: prompt }],
        }),
        signal: AbortSignal.timeout(60_000),
      });
      if (r.ok) text = ((await r.json()) as { choices?: { message?: { content?: string } }[] }).choices?.[0]?.message?.content || "";
    }
    if (!text && anthropic) {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": anthropic, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: process.env.AUTO_PUBLISH_CLAUDE_MODEL || "claude-haiku-5-5",
          max_tokens: 200,
          messages: [{ role: "user", content: prompt }],
        }),
        signal: AbortSignal.timeout(60_000),
      });
      if (r.ok) text = ((await r.json()) as { content?: { text?: string }[] }).content?.[0]?.text || "";
    }
  } catch (e) {
    return { ok: false, reason: `AI check failed: ${e instanceof Error ? e.message : String(e)}` };
  }
  const json = text.match(/\{[\s\S]*\}/)?.[0];
  if (!json) return { ok: false, reason: "AI check unavailable — left for a human" };
  try {
    const v = JSON.parse(json) as { ok?: unknown; reason?: unknown };
    return { ok: v.ok === true, reason: String(v.reason || "") };
  } catch {
    return { ok: false, reason: "AI check gave no clear answer — left for a human" };
  }
}

/** A picture that does not open is left out rather than sent broken to 50 sites. */
async function imageOk(url: string): Promise<boolean> {
  try {
    const r = await fetch(url, { method: "GET", signal: AbortSignal.timeout(15_000) });
    return r.ok && (r.headers.get("content-type") || "").startsWith("image/");
  } catch {
    return false;
  }
}

/** A dead client link (404, 410, no such site) stops the automatic run. 403/429 are
 *  sites that refuse robots, not dead links. */
async function deadLinks(urls: string[]): Promise<string[]> {
  const dead: string[] = [];
  await Promise.all(
    urls.map(async (u) => {
      try {
        const r = await fetch(u, {
          redirect: "follow",
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0 Safari/537.36" },
          signal: AbortSignal.timeout(15_000),
        });
        if (r.status === 404 || r.status === 410 || r.status >= 500) dead.push(`${u} (${r.status})`);
      } catch {
        dead.push(`${u} (does not open)`);
      }
    })
  );
  return dead;
}

async function tellAdmin(subject: string, title: string, lines: [string, string][]) {
  await sendEmail({
    to: ADMIN_EMAIL,
    subject,
    html: wrapEmail(
      title.slice(0, 120),
      `<table style="width:100%;border-collapse:collapse;">${lines.map(([k, v]) => kv(k, v)).join("")}</table>`
    ),
  }).catch(() => undefined);
}

export async function autoPublish(articleId: string): Promise<{ state: string; reason?: string }> {
  if (process.env.AUTO_PUBLISH === "0") return { state: "off" };
  if (!networkConfigured()) return { state: "off", reason: "network not configured" };
  if (running.has(articleId)) return { state: "busy" };
  running.add(articleId);
  try {
    await ensureNetworkColumns();
    const db = getDb();
    const [row] = await db
      .select({ article: articles, order: orders, email: users.email, name: users.name, phone: users.phone, company: users.companyName })
      .from(articles)
      .leftJoin(orders, eq(orders.id, articles.orderId))
      .leftJoin(users, eq(users.id, articles.userId))
      .where(eq(articles.id, articleId));
    if (!row?.order) return { state: "skip", reason: "no order" };
    const { article, order } = row;
    if (order.status !== "paid" || order.networkOrderId || article.status !== "submitted") {
      return { state: "skip", reason: "not paid, already in the network or not submitted" };
    }
    const body = (article.body || "").trim();
    const title = article.title || "";

    const refuse = async (reason: string) => {
      await tellAdmin(`Media Chief: NOT auto-published — ${reason.slice(0, 80)}`, title, [
        ["Order", order.id],
        ["Client", row.email || "-"],
        ["Reason", reason],
        ["What to do", "Read it in /admin/articles and publish by hand, or ask the client."],
      ]);
      return { state: "held", reason };
    };

    // Mechanical checks first — free, and they keep the obvious cases away from the AI.
    const limit = Number(process.env.AUTO_PUBLISH_PER_DAY || 10);
    const since = new Date(Date.now() - 24 * 3600 * 1000);
    const [{ n }] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(articles)
      .where(and(eq(articles.status, "published"), gte(articles.publishedAt, since)));
    if (n >= limit) return refuse(`daily cap reached (${limit} in 24h)`);
    if (words(body) < 150) return refuse(`article too short (${words(body)} words; it may be a "write it for me" order)`);
    const screening = screenContent(title, body);
    if (screening.blocked || screening.flagged) return refuse(`content filter: ${screening.reason}`);
    if (linksIn(body).length > 3) return refuse(`${linksIn(body).length} links in the text (max 3)`);
    const clientUrl = clientUrlFrom(article.notes, body);
    if (!clientUrl) return refuse("no client website or link found");

    const dead = await deadLinks(Array.from(new Set([clientUrl, ...linksIn(body)])));
    if (dead.length) return refuse(`dead link: ${dead.join(", ")}`);

    const casino = findPackageById(order.packageId)?.category === "casino";
    const verdict = await aiReview(title, body, casino);
    if (!verdict.ok) return refuse(`AI review: ${verdict.reason}`);

    const all = await db.select({ url: uploads.url }).from(uploads).where(eq(uploads.articleId, article.id));
    const checked = await Promise.all(all.map(async (i) => ((await imageOk(i.url)) ? i : null)));
    const images = checked.filter((i): i is { url: string } => i !== null);
    const droppedImages = all.length - images.length;
    const created = await createCampaign({
      externalRef: order.id,
      client: row.company || row.name || row.email || "Media Chief client",
      clientUrl,
      email: row.email,
      phone: row.phone,
      packageId: order.packageId,
      price: order.amount / 100,
      title,
      material: body,
      images: images.map((i) => i.url),
      notes: article.notes,
      identicalText: order.identicalText ?? false,
      pacePerRun: order.publishingPace,
      paceEveryMinutes: order.publishingEveryMinutes,
    });
    if (created.state !== "ok") {
      return refuse(`network refused the campaign: ${created.state === "not-configured" ? "not configured" : created.message}`);
    }
    const token = created.data.reportUrl.replace(/^\/report\//, "");
    await db.update(orders).set({ networkOrderId: created.data.orderId, networkReportToken: token }).where(eq(orders.id, order.id));

    const run = await publishCampaign(created.data.orderId, order.publishingPace ?? DEFAULT_PACE.perRun);
    if (run.state === "error") return refuse(`campaign created, first publish failed: ${run.message}`);

    const campaign = await getCampaign(created.data.orderId);
    const urls = campaign.state === "ok" ? urlsFrom(campaign.data.placements || []) : [];
    if (!urls.length) return refuse("campaign created, but no live links yet — check it in admin");

    await db
      .update(articles)
      .set({ publishedUrls: JSON.stringify(urls), status: "published", publishedAt: new Date() })
      .where(eq(articles.id, article.id));
    await captureForOrder(order.id).catch((e: unknown) => console.error("[auto-publish] capture:", e));
    if (row.email) {
      await sendPublishedEmail({ to: row.email, name: row.company || row.name, articleId: article.id, title, urls });
    }
    await tellAdmin(`Media Chief: auto-published (${urls.length} links so far)`, title, [
      ["Order", order.id],
      ["Client", row.email || "-"],
      ["Client link", clientUrl],
      ["AI review", verdict.reason || "ok"],
      ["Text", order.identicalText ? "identical on every site (client's choice)" : "rewritten per site"],
      ["Pace", `${order.publishingPace ?? DEFAULT_PACE.perRun} sites every ${order.publishingEveryMinutes ?? "default"} min`],
      ["Photos", `${images.length} sent${droppedImages ? `, ${droppedImages} broken left out` : ""}`],
    ]);
    return { state: "published" };
  } catch (e) {
    console.error("[auto-publish]", e);
    return { state: "error", reason: e instanceof Error ? e.message : String(e) };
  } finally {
    running.delete(articleId);
  }
}
