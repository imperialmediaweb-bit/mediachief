import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { MapPin, Newspaper, Facebook, Globe, Mail, ExternalLink } from "lucide-react";
import { RequestListModal } from "@/components/forms/RequestListModal";
import {
  NEWSPAPERS,
  REGION_COUNTS,
  TOTAL_NEWSPAPERS,
  UNCOVERED_STATES,
  type Newspaper as Paper,
} from "@/data/newspapers";

// Kept out of the index: the roster links every property in the network from a
// single page, which is a footprint we do not want search engines to follow.
export const metadata: Metadata = {
  title: "Our newspaper network",
  description:
    "The Media Chief network — one partner newspaper in each of 49 US states, plus Facebook distribution.",
  alternates: { canonical: "/our-network" },
  robots: { index: false, follow: false },
};

const REGIONS = ["Northeast", "Midwest", "South", "West"] as const;

const REGION_BLURB: Record<(typeof REGIONS)[number], string> = {
  Northeast: "Dense, high-income markets from Maine down to Pennsylvania.",
  Midwest: "The industrial and agricultural heartland, state by state.",
  South: "The fastest-growing region in the country, and our largest block.",
  West: "Coast, mountain and desert markets, Alaska and Hawaii included.",
};

function papersIn(region: (typeof REGIONS)[number]): Paper[] {
  return NEWSPAPERS.filter((n) => n.region === region);
}

export default function OurNetworkPage() {
  return (
    <>
      <section className="bg-brand-navy text-white">
        <div className="container py-20 text-center">
          <p className="eyebrow text-brand-gold">Nationwide coverage</p>
          <h1 className="h1 mt-3 text-white">The Media Chief network</h1>
          <p className="lead mx-auto mt-6 max-w-2xl text-white/85">
            {TOTAL_NEWSPAPERS} partner newspapers, one in each state we cover,
            built over years to give our clients maximum nationwide visibility.
          </p>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Newspaper} value={`${TOTAL_NEWSPAPERS}`} label="partner newspapers" />
            <StatCard icon={Facebook} value="35+" label="associated Facebook pages" />
            <StatCard icon={Globe} value="4" label="regions covered" />
            <StatCard icon={MapPin} value={`${TOTAL_NEWSPAPERS}`} label="US states" />
          </div>

          <div className="mt-20">
            <div className="max-w-2xl">
              <p className="eyebrow">The full roster</p>
              <h2 className="h2 mt-2">Every publication, by region</h2>
              <p className="lead mt-4">
                Each state has its own news brand under the Express name. Open any
                of them — they publish every day.
              </p>
            </div>

            <div className="mt-10 space-y-12">
              {REGIONS.map((region) => {
                const papers = papersIn(region);
                return (
                  <div key={region}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b-2 border-brand-navy pb-3">
                      <h3 className="font-serif text-2xl font-bold text-brand-navy">
                        {region}
                      </h3>
                      <span className="text-sm font-semibold text-brand-red">
                        {REGION_COUNTS[region]} newspapers
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">
                      {REGION_BLURB[region]}
                    </p>
                    <ul className="mt-5 grid gap-x-8 gap-y-0 sm:grid-cols-2">
                      {papers.map((paper) => (
                        <li
                          key={paper.name}
                          className="border-b border-slate-200 py-3"
                        >
                          <a
                            href={paper.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-baseline justify-between gap-4"
                          >
                            <span className="font-medium text-brand-navy group-hover:text-brand-red">
                              {paper.name}
                            </span>
                            <span className="inline-flex items-center gap-1 font-mono text-xs text-slate-500 group-hover:text-brand-red">
                              {paper.state}
                              <ExternalLink className="h-3 w-3" />
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            {UNCOVERED_STATES.length > 0 && (
              <div className="mt-12 rounded-xl border-2 border-dashed border-slate-300 p-6">
                <h3 className="font-serif text-lg font-semibold text-brand-navy">
                  Not yet covered
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  {UNCOVERED_STATES.join(", ")} — the one state without a site on
                  the network today. It runs on the same platform, so adding it
                  takes an afternoon rather than a rebuild.
                </p>
              </div>
            )}
          </div>

          <div className="mt-16 rounded-2xl bg-brand-navy p-10 text-white text-center lg:p-16">
            <Mail className="mx-auto h-10 w-10 text-brand-gold" />
            <h3 className="mt-5 font-serif text-3xl font-bold">
              Want the full media kit?
            </h3>
            <p className="mx-auto mt-4 max-w-2xl text-white/85">
              Traffic figures, audience data, ad formats and rates for every
              publication, sent as a PDF. Free, no obligation.
            </p>
            <div className="mt-8">
              <RequestListModal
                trigger={
                  <Button variant="gold" size="lg">
                    <Mail className="h-4 w-4" /> Send me the media kit
                  </Button>
                }
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
      <Icon className="mx-auto h-8 w-8 text-brand-red" />
      <div className="mt-3 font-serif text-4xl font-bold text-brand-navy">{value}</div>
      <div className="mt-1 text-sm text-slate-600">{label}</div>
    </div>
  );
}
