import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { CheckCircle2, Clock, ExternalLink, Megaphone } from "lucide-react";
import { getDb } from "@/db";
import { articles, orders } from "@/db/schema";
import { NEWSPAPERS, TOTAL_NEWSPAPERS } from "@/data/newspapers";
import { articleIdFromToken, reportToken } from "@/lib/report-link";
import { getCampaign, networkConfigured } from "@/lib/network";
import { getFbPromo, type FbPromo } from "@/lib/fb-promo-db";
import { AutoRefresh } from "./AutoRefresh";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Publication report",
  robots: { index: false, follow: false },
};

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

// Match a published URL to the newspaper it sits on, for the name and state.
const BY_HOST = new Map(
  NEWSPAPERS.filter((n) => n.url).map((n) => [hostOf(n.url!), n] as const)
);

const DATE = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/New_York",
});

interface Row {
  url: string;
  at: Date | null;
}

/**
 * Live publication report — the link the client gets the moment the order
 * exists (12.11.2026, like MediaExpres). The token is either an ORDER token
 * ("o-<id>", made at checkout, before any article is on file) or an article
 * token (the older emails). Links are read live from the network on every
 * load, so each newspaper shows up with its time as soon as it goes out; the
 * page refreshes itself until all of them are in. The Facebook promotion
 * proof sits underneath once we have added it. No amounts, no read counts.
 */
export default async function ReportPage({ params }: { params: { token: string } }) {
  const id = articleIdFromToken(params.token);
  if (!id) notFound();
  const db = getDb();

  const orderCols = {
    id: orders.id,
    status: orders.status,
    createdAt: orders.createdAt,
    networkOrderId: orders.networkOrderId,
  };
  const articleCols = {
    id: articles.id,
    title: articles.title,
    status: articles.status,
    publishedUrls: articles.publishedUrls,
    createdAt: articles.createdAt,
    submittedAt: articles.submittedAt,
    publishedAt: articles.publishedAt,
    orderId: articles.orderId,
  };

  let order: { id: string; status: string; createdAt: Date; networkOrderId: number | null } | null = null;
  let article: {
    id: string;
    title: string;
    status: string;
    publishedUrls: string | null;
    createdAt: Date;
    submittedAt: Date | null;
    publishedAt: Date | null;
    orderId: string | null;
  } | null = null;

  if (id.startsWith("o-")) {
    const o = await db.select(orderCols).from(orders).where(eq(orders.id, id.slice(2))).limit(1);
    order = o[0] ?? null;
    if (!order) notFound();
    const a = await db
      .select(articleCols)
      .from(articles)
      .where(eq(articles.orderId, order.id))
      .orderBy(desc(articles.createdAt))
      .limit(1);
    article = a[0] ?? null;
  } else {
    const a = await db.select(articleCols).from(articles).where(eq(articles.id, id)).limit(1);
    article = a[0] ?? null;
    if (!article) notFound();
    if (article.orderId) {
      const o = await db.select(orderCols).from(orders).where(eq(orders.id, article.orderId)).limit(1);
      order = o[0] ?? null;
    }
  }

  // Links: live from the network when the order is linked to a campaign there,
  // otherwise the addresses saved on the article.
  let rows: Row[] = [];
  if (order?.networkOrderId && networkConfigured()) {
    const c = await getCampaign(order.networkOrderId);
    if (c.state === "ok") {
      rows = c.data.placements
        .filter((p) => typeof p.url === "string" && /^https?:\/\//.test(p.url))
        .map((p) => ({ url: p.url as string, at: p.placed_at ? new Date(p.placed_at) : null }));
    }
  }
  if (!rows.length && article?.publishedUrls) {
    try {
      rows = (JSON.parse(article.publishedUrls) as string[]).map((u) => ({
        url: u,
        at: article?.publishedAt ?? null,
      }));
    } catch {
      rows = [];
    }
  }
  rows.sort((x, y) => (x.at?.getTime() ?? 0) - (y.at?.getTime() ?? 0));

  const promo: FbPromo | null = order ? await getFbPromo(order.id).catch(() => null) : null;

  const paid = order ? order.status === "paid" : true;
  const done = article?.status === "published" && rows.length >= TOTAL_NEWSPAPERS;
  const promoDone = Boolean(promo?.proof || promo?.post);

  const steps = [
    { label: paid ? "Order paid" : "Order received", at: order?.createdAt ?? article?.createdAt ?? null, done: true },
    { label: "Article with our editors", at: article?.submittedAt ?? null, done: Boolean(article?.submittedAt) || rows.length > 0 },
    {
      label: rows.length ? `Live in ${rows.length} of ${TOTAL_NEWSPAPERS} newspapers` : `Live in ${TOTAL_NEWSPAPERS} newspapers`,
      at: rows.length ? rows[rows.length - 1].at : null,
      done: rows.length > 0,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      {!(done && (promoDone || !promo?.choice)) && <AutoRefresh seconds={60} />}
      <p className="text-xs font-semibold uppercase tracking-widest text-[#c1121f]">
        Publication report {done ? "" : "· updates live"}
      </p>
      <h1 className="mt-2 font-serif text-2xl font-bold text-brand-navy sm:text-3xl">
        {article?.title && article.title !== "Untitled" ? article.title : "Your Media Chief order"}
      </h1>

      <ol className="mt-8 grid gap-3 sm:grid-cols-3">
        {steps.map((s) => (
          <li
            key={s.label}
            className={`rounded-xl border p-4 ${s.done ? "border-green-200 bg-green-50" : "border-slate-200 bg-white"}`}
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-brand-navy">
              {s.done ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Clock className="h-4 w-4 text-slate-400" />
              )}
              {s.label}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {s.done && s.at ? `${DATE.format(s.at)} ET` : s.done ? "Done" : article ? "Within 24 hours" : "Waiting for your article"}
            </p>
          </li>
        ))}
      </ol>

      {rows.length ? (
        <>
          <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-serif text-xl font-bold text-brand-navy">
              Your {rows.length} links{done ? "" : ` · ${TOTAL_NEWSPAPERS - rows.length} more on the way`}
            </h2>
            <p className="text-xs text-slate-500">Permanent · dofollow · indexed by search engines</p>
          </div>
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Newspaper</th>
                  <th className="hidden px-4 py-3 sm:table-cell">Published (ET)</th>
                  <th className="px-4 py-3">Link</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const paper = BY_HOST.get(hostOf(r.url));
                  return (
                    <tr key={r.url} className="border-t border-slate-100 align-top">
                      <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-brand-navy">
                        {paper?.name || hostOf(r.url)}
                        {paper?.state ? <span className="block text-xs font-normal text-slate-500">{paper.state}</span> : null}
                        {r.at ? <span className="block text-xs font-normal text-slate-500 sm:hidden">{DATE.format(r.at)}</span> : null}
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 text-slate-600 sm:table-cell">
                        {r.at ? DATE.format(r.at) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {/* The address itself, not a word that hides it: this
                            is the page a client forwards as proof. */}
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener"
                          className="inline-flex items-start gap-1 break-all text-[#c1121f] hover:underline"
                        >
                          <span className="font-mono text-xs">{r.url}</span>
                          <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {article && (
            <p className="mt-3 text-xs text-slate-500">
              Download:{" "}
              <a className="text-[#c1121f] hover:underline" href={`/api/report/${reportToken(article.id)}?format=pdf`}>PDF</a>
              {" · "}
              <a className="text-[#c1121f] hover:underline" href={`/api/report/${reportToken(article.id)}?format=csv`}>Excel (CSV)</a>
            </p>
          )}
        </>
      ) : (
        <p className="mt-10 rounded-xl bg-slate-50 p-5 text-sm leading-relaxed text-slate-600">
          {article
            ? `Your article is being published across our ${TOTAL_NEWSPAPERS} newspapers, one in every state.`
            : "As soon as we have your article, it goes out across our newspapers, one in every state."}{" "}
          This page refreshes by itself — every link appears here, with its date and time, as soon as
          it is live. Keep this link: it stays valid permanently.
        </p>
      )}

      {promo?.choice && (
        <section className="mt-10 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="flex items-center gap-2 font-serif text-xl font-bold text-brand-navy">
            <Megaphone className="h-5 w-5 text-[#c1121f]" /> Paid Facebook promotion
          </h2>
          {promoDone ? (
            <>
              <p className="mt-2 text-sm text-slate-600">
                Created and run{promo.days ? ` for ${promo.days} days` : ""}, targeting the audience of{" "}
                <strong>{promo.choice}</strong>.
              </p>
              {promo.post && (
                <p className="mt-2 text-sm">
                  <a href={promo.post} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-[#c1121f] hover:underline">
                    See the promoted post <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </p>
              )}
              {promo.proof && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={promo.proof}
                  alt="Screenshot from the advertising account"
                  className="mt-4 w-full rounded-lg border border-slate-200"
                />
              )}
            </>
          ) : (
            <p className="mt-2 text-sm text-slate-600">
              3 days, on <strong>{promo.choice}</strong>. We start it after your article is live, and
              the proof from the advertising account appears here.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
