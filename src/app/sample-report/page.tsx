import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { NEWSPAPERS, TOTAL_NEWSPAPERS } from "@/data/newspapers";
import { SITE } from "@/data/site";

export const metadata: Metadata = {
  title: `Example publication report — ${SITE.name}`,
  description:
    "What you receive once your article is published: every newspaper by name, with a direct link to your article, on a page you can share.",
  alternates: { canonical: "/sample-report" },
};

function hostOf(url: string | undefined): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/**
 * The report, shown before anyone buys.
 *
 * "You get a report with all the links" is a sentence; this is the thing
 * itself, so the question becomes whether the coverage is worth the money
 * rather than whether any of it is real.
 *
 * The newspapers and their addresses are the real network. The article
 * addresses are not: a convincing link that answers 404 would be worse than
 * no example at all, so they are greyed out, not clickable, and shown as the
 * pattern a real one follows.
 */
export default function SampleReportPage() {
  const papers = NEWSPAPERS.filter((n) => n.url);

  return (
    <div className="bg-slate-50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>This is an example.</strong> It shows the page you get once your article is
          published — your own headline, your own links, and the date each newspaper ran it. The
          newspapers below are the real network; the article addresses are shown as a pattern,
          because yours do not exist until you publish.
        </div>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#c1121f]">
            Publication report
          </p>
          <h1 className="mt-2 font-serif text-2xl font-bold text-brand-navy sm:text-3xl">
            Your headline goes here
          </h1>

          <ol className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Order received", at: "The moment you pay" },
              { label: "With our editors", at: "Same day" },
              { label: `Live in ${TOTAL_NEWSPAPERS} newspapers`, at: "Within the hour, if you choose" },
            ].map((s) => (
              <li key={s.label} className="rounded-xl border border-green-200 bg-green-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-brand-navy">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  {s.label}
                </div>
                <p className="mt-1 text-xs text-slate-500">{s.at}</p>
              </li>
            ))}
          </ol>

          <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-serif text-xl font-bold text-brand-navy">
              Your {TOTAL_NEWSPAPERS} links
            </h2>
            <p className="text-xs text-slate-500">
              Permanent · dofollow · indexed by search engines
            </p>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
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
                {papers.map((paper, i) => (
                  <tr key={paper.name} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-brand-navy">{paper.name}</td>
                    <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">
                      {paper.state || "National"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="break-all font-mono text-xs text-slate-400">
                        {hostOf(paper.url)}/business/your-headline
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-6 text-sm leading-relaxed text-slate-600">
            Your real report updates itself while publication is in progress — each newspaper
            appears the moment your article is live on it. It opens without a sign-in, the link
            never expires, and it downloads as a PDF or a spreadsheet. We publish the article and
            give you the links; whether it brings visitors or customers is not something we
            promise.
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/packages"
            className="inline-flex items-center gap-2 rounded-lg bg-[#c1121f] px-6 py-3 font-semibold text-white hover:bg-[#a50f1a]"
          >
            See the packages <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
