import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import {
  NEWSPAPERS,
  REGION_COUNTS,
  TOTAL_NEWSPAPERS,
  UNCOVERED_STATES,
  type Newspaper as Paper,
} from "@/data/newspapers";

// Private roster: every property in the network, linked. Kept out of search
// engines (noindex here + disallowed in robots.ts) and out of the sitemap and
// navigation — share the URL directly with whoever needs it.
export const metadata: Metadata = {
  title: "Network list",
  robots: { index: false, follow: false, nocache: true },
};

const REGIONS = ["Northeast", "Midwest", "South", "West"] as const;

function papersIn(region: (typeof REGIONS)[number]): Paper[] {
  return NEWSPAPERS.filter((n) => n.region === region);
}

function bareDomain(url?: string): string {
  if (!url) return "";
  return url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
}

export default function NetworkListPage() {
  return (
    <section className="bg-white">
      <div className="container max-w-4xl py-14 lg:py-20">
        <p className="eyebrow">The network</p>
        <h1 className="h1 mt-2">Every site, by region</h1>
        <p className="lead mt-4">
          {TOTAL_NEWSPAPERS} live news sites, one per state, grouped by US census
          region. Click any name to open it.
        </p>

        <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-2 border-y border-slate-200 py-4 font-mono text-sm text-slate-500">
          <div><dt className="sr-only">Sites</dt><dd><strong className="text-brand-navy">{TOTAL_NEWSPAPERS}</strong> live sites</dd></div>
          <div><dt className="sr-only">Regions</dt><dd><strong className="text-brand-navy">4</strong> regions</dd></div>
          {UNCOVERED_STATES.length > 0 && (
            <div><dt className="sr-only">Uncovered</dt><dd><strong className="text-brand-navy">{UNCOVERED_STATES.length}</strong> state open — {UNCOVERED_STATES.join(", ")}</dd></div>
          )}
        </dl>

        <div className="mt-12 space-y-12">
          {REGIONS.map((region) => (
            <div key={region}>
              <div className="flex items-baseline justify-between gap-4 border-b-2 border-brand-navy pb-2">
                <h2 className="font-headline text-lg font-bold uppercase tracking-wide text-brand-navy">
                  {region}
                </h2>
                <span className="font-mono text-xs text-slate-500">
                  {REGION_COUNTS[region]} sites
                </span>
              </div>
              <ul>
                {region === "Midwest" &&
                  UNCOVERED_STATES.map((state) => (
                    <li
                      key={state}
                      className="flex items-baseline gap-4 border-b border-slate-200 bg-slate-50 px-2 py-3 text-slate-400"
                    >
                      <span className="w-8 font-mono text-xs">—</span>
                      <span>{state} — no site yet</span>
                    </li>
                  ))}
                {papersIn(region).map((paper) => (
                  <li key={paper.name} className="border-b border-slate-200">
                    <a
                      href={paper.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group grid grid-cols-[2rem_1fr] items-baseline gap-x-4 px-2 py-3 hover:bg-slate-50 sm:grid-cols-[2rem_14rem_1fr]"
                    >
                      <span className="font-mono text-xs text-slate-400">
                        {stateAbbr(paper.state)}
                      </span>
                      <span className="font-semibold text-brand-navy group-hover:text-brand-red">
                        {paper.name}
                      </span>
                      <span className="col-start-2 inline-flex items-center gap-1 font-mono text-xs text-slate-500 group-hover:text-brand-red sm:col-start-3 sm:justify-self-end">
                        {bareDomain(paper.url)}
                        <ExternalLink className="h-3 w-3" />
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

const ABBR: Record<string, string> = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA",
  Colorado: "CO", Connecticut: "CT", Delaware: "DE", Florida: "FL", Georgia: "GA",
  Hawaii: "HI", Idaho: "ID", Illinois: "IL", Indiana: "IN", Iowa: "IA", Kansas: "KS",
  Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD", Massachusetts: "MA",
  Michigan: "MI", Minnesota: "MN", Mississippi: "MS", Missouri: "MO", Montana: "MT",
  Nebraska: "NE", Nevada: "NV", "New Hampshire": "NH", "New Jersey": "NJ",
  "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND",
  Ohio: "OH", Oklahoma: "OK", Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI",
  "South Carolina": "SC", "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT",
  Vermont: "VT", Virginia: "VA", Washington: "WA", "West Virginia": "WV",
  Wisconsin: "WI", Wyoming: "WY",
};

function stateAbbr(state?: string): string {
  return (state && ABBR[state]) || "";
}
