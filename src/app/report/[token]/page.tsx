import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { CheckCircle2, Clock, ExternalLink } from "lucide-react";
import { getDb } from "@/db";
import { articles } from "@/db/schema";
import { NEWSPAPERS, TOTAL_NEWSPAPERS } from "@/data/newspapers";
import { articleIdFromToken } from "@/lib/report-link";
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

/**
 * Live publication report — the link in the client's emails. It shows the
 * article's progress and, once it is live, every newspaper with its link.
 */
export default async function ReportPage({ params }: { params: { token: string } }) {
  const id = articleIdFromToken(params.token);
  if (!id) notFound();

  const rows = await getDb()
    .select({
      title: articles.title,
      status: articles.status,
      publishedUrls: articles.publishedUrls,
      createdAt: articles.createdAt,
      submittedAt: articles.submittedAt,
      publishedAt: articles.publishedAt,
    })
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1);
  const a = rows[0];
  if (!a) notFound();

  let urls: string[] = [];
  try {
    urls = a.publishedUrls ? (JSON.parse(a.publishedUrls) as string[]) : [];
  } catch {
    urls = [];
  }
  const live = a.status === "published" && urls.length > 0;
  const steps = [
    { label: "Order received", at: a.createdAt, done: true },
    { label: "With our editors", at: a.submittedAt, done: Boolean(a.submittedAt) || live },
    { label: `Live in ${live ? urls.length : TOTAL_NEWSPAPERS} newspapers`, at: a.publishedAt, done: live },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      {!live && <AutoRefresh seconds={60} />}
      <p className="text-xs font-semibold uppercase tracking-widest text-[#c1121f]">
        Publication report {live ? "" : "· updates live"}
      </p>
      <h1 className="mt-2 font-serif text-2xl font-bold text-brand-navy sm:text-3xl">
        {a.title}
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
              {s.done && s.at ? `${DATE.format(s.at)} ET` : s.done ? "Done" : "Within 24 hours"}
            </p>
          </li>
        ))}
      </ol>

      {live ? (
        <>
          <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-serif text-xl font-bold text-brand-navy">
              Your {urls.length} links
            </h2>
            <p className="text-xs text-slate-500">Permanent · dofollow · indexed by search engines</p>
          </div>
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Newspaper</th>
                  <th className="hidden px-4 py-3 sm:table-cell">State</th>
                  <th className="px-4 py-3">Link</th>
                </tr>
              </thead>
              <tbody>
                {urls.map((u, i) => {
                  const paper = BY_HOST.get(hostOf(u));
                  return (
                    <tr key={u} className="border-t border-slate-100">
                      <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-brand-navy">
                        {paper?.name || hostOf(u)}
                      </td>
                      <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">
                        {paper?.state || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {/* The address itself, not a word that hides it: this
                            is the page a client forwards as proof, and "Open"
                            proves nothing on a printout or in a screenshot. */}
                        <a
                          href={u}
                          target="_blank"
                          rel="noopener"
                          className="inline-flex items-start gap-1 break-all text-[#c1121f] hover:underline"
                        >
                          <span className="font-mono text-xs">{u}</span>
                          <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="mt-10 rounded-xl bg-slate-50 p-5 text-sm leading-relaxed text-slate-600">
          Your article is being published across our {TOTAL_NEWSPAPERS} newspapers, one in every
          state. This page refreshes by itself — every link appears here as soon as it is live, and
          we email you the moment it is done. Keep this link: it stays valid permanently.
        </p>
      )}
    </div>
  );
}
