import type { Metadata } from "next";
import {
  Mail,
  Newspaper,
  Facebook,
  Link as LinkIcon,
  CheckCircle2,
  Globe,
  FileText,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequestListModal } from "@/components/forms/RequestListModal";

export const metadata: Metadata = {
  title: "Advertorial and press release publishing offer",
  description:
    "Advertorial and press release publishing across a network of 50 online newspapers — one in every U.S. state. Local and nationwide coverage in a single placement.",
  alternates: { canonical: "/offer" },
};

const BENEFITS = [
  {
    icon: Newspaper,
    title: "Publication in 50 online newspapers",
    description:
      "Advertorial or press release distributed across a wide network, with audiences between 10,000 and 40,000 unique monthly visitors per publication and over 320,000 in total.",
  },
  {
    icon: Globe,
    title: "50 state newspapers — one per state",
    description:
      "Real local coverage, with newspapers connected to communities in every state of the country.",
  },
  {
    icon: FileText,
    title: "Coast-to-coast exposure",
    description:
      "Nationwide reach in a single placement, from the Northeast to the West Coast.",
  },
  {
    icon: Facebook,
    title: "Distribution on Facebook pages",
    description:
      "Every platform has a Facebook page with 300–10,000 followers, for extra social media exposure.",
  },
  {
    icon: LinkIcon,
    title: "Backlinks from platforms with DA 37+",
    description:
      "Dofollow links from high-authority domains — good for SEO and for brand authority.",
    wide: true,
  },
];

const CONDITIONS = [
  "Permanent article on our site.",
  "One day of exposure on the homepage.",
  "Distribution on our Facebook pages.",
  "3 images and 3 dofollow links included.",
  "Article writing services — on request.",
  "We accept any type of content.",
  "We do not add a sponsored tag to articles.",
];

export default function OfferPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-brand-navy text-white">
        <div className="container py-20 text-center">
          <p className="eyebrow text-brand-gold">Publishing offer</p>
          <h1 className="h1 mt-3 text-white">
            Advertorials and press releases in 50 U.S. newspapers
          </h1>
          <p className="lead mx-auto mt-6 max-w-2xl text-white/85">
            A network of 50 online newspapers — one for every U.S. state. Local
            and nationwide visibility in a single placement.
          </p>
          <div className="mt-8">
            <RequestListModal
              successHref="/packages"
              successCtaLabel="See pricing now"
              trigger={
                <Button variant="gold" size="lg">
                  <Mail className="h-4 w-4" /> Get the newspaper list and pricing
                </Button>
              }
            />
          </div>
          <p className="mt-4 text-xs text-white/60">
            Free PDF by email • the list of all 50 publications • zero spam
          </p>
        </div>
      </section>

      {/* Coverage */}
      <section className="section bg-white">
        <div className="container">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Newspaper}
              value="50"
              label="online newspapers, 10–40k unique visitors/month, 320k+ total"
            />
            <StatCard
              icon={Globe}
              value="50"
              label="states covered, one newspaper each"
            />
            <StatCard
              icon={FileText}
              value="4"
              label="regions: Northeast, Midwest, South, West"
            />
            <StatCard
              icon={Facebook}
              value="300–10k"
              label="followers per associated Facebook page"
            />
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="section bg-slate-50">
        <div className="container">
          <div className="max-w-2xl">
            <p className="eyebrow">What the offer includes</p>
            <h2 className="h2 mt-2">What you get with every publication</h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className={`rounded-xl border border-slate-200 bg-white p-6 ${
                  b.wide ? "md:col-span-2" : ""
                }`}
              >
                <b.icon className="h-8 w-8 text-brand-red" />
                <h3 className="mt-4 font-serif text-xl font-bold text-brand-navy">
                  {b.title}
                </h3>
                <p className="mt-3 text-slate-600">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages descriptive — no price CTA, only lead magnet */}
      <section className="section bg-white">
        <div className="container">
          <div className="max-w-2xl text-center mx-auto">
            <p className="eyebrow">Promotion packages</p>
            <h2 className="h2 mt-2">Choose the right coverage</h2>
            <p className="lead mt-4">
              Two simple options: a single portal or the whole network. You get
              the complete rates and monthly subscriptions in the PDF with the
              newspaper list.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <PackageCard
              eyebrow="Single placement"
              title="Advertorial / press release on a single portal"
              points={[
                "Publication on one online portal of your choice",
                "You get the direct link to the published article",
                "Ideal for testing a publication",
              ]}
            />
            <PackageCard
              eyebrow="Network of 50 portals"
              title="One article distributed across the whole network"
              points={[
                "Your article appears on all 50 online portals",
                "Complete report with 50 links to the published articles",
                "Maximum visibility from a single placement",
              ]}
              highlight
            />
          </div>
        </div>
      </section>

      {/* Conditions */}
      <section className="section bg-slate-50">
        <div className="container">
          <div className="max-w-2xl">
            <p className="eyebrow">Publishing conditions</p>
            <h2 className="h2 mt-2">What we offer for every article</h2>
          </div>
          <ul className="mt-10 grid gap-4 md:grid-cols-2">
            {CONDITIONS.map((c) => (
              <li
                key={c}
                className="flex items-start gap-3 rounded-xl bg-white p-5 border border-slate-200"
              >
                <CheckCircle2 className="h-5 w-5 text-brand-red shrink-0 mt-0.5" />
                <span className="text-slate-700">{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Payment */}
      <section className="section bg-white">
        <div className="container">
          <div className="rounded-2xl border border-slate-200 p-10">
            <div className="flex items-center gap-4">
              <CreditCard className="h-8 w-8 text-brand-red" />
              <h2 className="font-serif text-2xl font-bold text-brand-navy">
                Payment methods
              </h2>
            </div>
            <p className="mt-4 text-slate-600">
              Card payment or bank transfer, with an invoice and a service
              agreement — everything you need for B2B accounting.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA: single lead magnet */}
      <section className="bg-brand-navy text-white">
        <div className="container py-16 text-center">
          <Mail className="mx-auto h-10 w-10 text-brand-gold" />
          <h2 className="h2 mt-5 text-white">
            Get the list of all 50 newspapers and the full pricing
          </h2>
          <p className="lead mt-4 mx-auto max-w-2xl text-white/85">
            Free PDF by email within 2 minutes: the complete list of
            publications, the rates per package and the monthly subscriptions.
            No obligation, no spam.
          </p>
          <div className="mt-8">
            <RequestListModal
              successHref="/packages"
              successCtaLabel="See pricing now"
              trigger={
                <Button variant="gold" size="lg">
                  <Mail className="h-4 w-4" /> Get the offer by email
                </Button>
              }
            />
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
      <div className="mt-3 font-serif text-4xl font-bold text-brand-navy">
        {value}
      </div>
      <div className="mt-1 text-sm text-slate-600">{label}</div>
    </div>
  );
}

function PackageCard({
  eyebrow,
  title,
  points,
  highlight = false,
}: {
  eyebrow: string;
  title: string;
  points: string[];
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "rounded-2xl p-8 bg-brand-navy text-white"
          : "rounded-2xl p-8 border-2 border-slate-200 bg-white"
      }
    >
      <p className={`eyebrow ${highlight ? "text-brand-gold" : ""}`}>
        {eyebrow}
      </p>
      <h3
        className={`mt-3 font-serif text-2xl font-bold ${
          highlight ? "text-white" : "text-brand-navy"
        }`}
      >
        {title}
      </h3>
      <ul
        className={`mt-6 space-y-3 ${
          highlight ? "text-white/90" : "text-slate-600"
        }`}
      >
        {points.map((p) => (
          <li key={p} className="flex items-start gap-3">
            <CheckCircle2
              className={`h-5 w-5 shrink-0 mt-0.5 ${
                highlight ? "text-brand-gold" : "text-brand-red"
              }`}
            />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
