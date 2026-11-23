import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MapPin, Newspaper, Globe } from "lucide-react";
import { REGION_COUNTS } from "@/data/newspapers";
import { networkStatus } from "@/lib/network-status";
import { NetworkGallery } from "@/components/network/NetworkGallery";

// 23.11.2026 (owner: show buyers the real network, like Media Express does):
// the page now shows every paper with a real screenshot, its latest story and
// sitemap status — no traffic numbers. It stays NOINDEX and every link to a
// paper is NOFOLLOW, so search engines do not tie the papers to Media Chief
// (anti-PBN). To make it public, flip robots below — nothing else.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Our newspaper network",
  description:
    "Media Chief distributes across a nationwide network of 50 newspapers, one in every state.",
  alternates: { canonical: "/our-network" },
  robots: { index: false, follow: false },
};

const REGIONS = [
  {
    name: "Northeast",
    count: REGION_COUNTS.Northeast,
    states: [
      "Connecticut",
      "Maine",
      "Massachusetts",
      "New Hampshire",
      "Rhode Island",
      "Vermont",
      "New Jersey",
      "New York",
      "Pennsylvania",
    ],
  },
  {
    name: "Midwest",
    count: REGION_COUNTS.Midwest,
    states: [
      "Indiana",
      "Michigan",
      "Ohio",
      "Wisconsin",
      "Iowa",
      "Kansas",
      "Minnesota",
      "Missouri",
      "Nebraska",
      "North Dakota",
      "South Dakota",
    ],
  },
  {
    name: "South",
    count: REGION_COUNTS.South,
    states: [
      "Delaware",
      "Florida",
      "Georgia",
      "Maryland",
      "North Carolina",
      "South Carolina",
      "Virginia",
      "West Virginia",
      "Alabama",
      "Kentucky",
      "Mississippi",
      "Tennessee",
      "Arkansas",
      "Louisiana",
      "Oklahoma",
      "Texas",
    ],
  },
  {
    name: "West",
    count: REGION_COUNTS.West,
    states: [
      "Arizona",
      "Colorado",
      "Idaho",
      "Montana",
      "Nevada",
      "New Mexico",
      "Utah",
      "Wyoming",
      "Alaska",
      "California",
      "Hawaii",
      "Oregon",
      "Washington",
    ],
  },
];

const TOTAL =
  REGION_COUNTS.Northeast +
  REGION_COUNTS.Midwest +
  REGION_COUNTS.South +
  REGION_COUNTS.West;

export default async function OurNetworkPage() {
  const papers = await networkStatus();
  const now = Date.now();
  const live = papers.filter((p) => p.latestAt && now - new Date(p.latestAt).getTime() < 48 * 3600 * 1000).length;
  return (
    <>
      <section className="bg-brand-navy text-white">
        <div className="container py-20 text-center">
          <p className="eyebrow text-brand-gold">Nationwide coverage</p>
          <h1 className="h1 mt-3 text-white">The Media Chief network</h1>
          <p className="lead mx-auto mt-6 max-w-2xl text-white/85">
            A solid network of partner newspapers, built over years to give our clients
            maximum nationwide visibility.
          </p>
        </div>
      </section>

      <section className="section bg-slate-50">
        <div className="container">
          <div className="max-w-2xl">
            <p className="eyebrow">See the network</p>
            <h2 className="h2 mt-2">50 real newspapers, one in every state</h2>
            <p className="lead mt-4">
              These are the papers your story is published in. Each card shows the paper&apos;s
              homepage and its latest story, live.{" "}
              {live > 0 && <strong>{live} of {papers.length} papers published a story in the last 48 hours.</strong>}
            </p>
          </div>
          <div className="mt-10">
            <NetworkGallery papers={papers} now={now} />
          </div>
          <div className="mt-10 text-center">
            <Button asChild variant="gold" size="lg">
              <Link href="/offer">Publish in all 50 newspapers</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Newspaper} value={`${TOTAL}`} label="partner newspapers" />
            <StatCard icon={Globe} value="4" label="regions covered" />
            <StatCard icon={MapPin} value={`${TOTAL}`} label="U.S. states" />
          </div>

          <div className="mt-20">
            <div className="max-w-2xl">
              <p className="eyebrow">Distribution by region</p>
              <h2 className="h2 mt-2">Balanced coverage across the country</h2>
              <p className="lead mt-4">
                The network includes one newspaper per state across the four
                census regions. That geographic spread guarantees balanced exposure.
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {REGIONS.map((r) => (
                <div key={r.name} className="rounded-xl border border-slate-200 bg-white p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-xl font-bold text-brand-navy">{r.name}</h3>
                    <span className="inline-flex items-center rounded-full bg-brand-red/10 px-3 py-1 text-sm font-semibold text-brand-red">
                      {r.count} newspapers
                    </span>
                  </div>
                  <p className="mt-4 text-sm text-slate-600">
                    <strong className="text-brand-navy">States covered:</strong>{" "}
                    {r.states.join(" • ")}
                  </p>
                </div>
              ))}
              <div className="rounded-xl border-2 border-brand-gold bg-brand-gold/5 p-6 md:col-span-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-xl font-bold text-brand-navy">
                    Full nationwide reach
                  </h3>
                  <span className="inline-flex items-center rounded-full bg-brand-gold/20 px-3 py-1 text-sm font-semibold text-brand-navy">
                    {TOTAL} states, {TOTAL} newspapers
                  </span>
                </div>
                <p className="mt-4 text-sm text-slate-600">
                  Every state gets its own publication, all included in the{" "}
                  <strong className="text-brand-navy">National 50</strong> package and in every
                  subscription.
                </p>
              </div>
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
