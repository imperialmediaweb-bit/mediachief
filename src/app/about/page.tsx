import type { Metadata } from "next";
import { Target, Users, Award, Handshake } from "lucide-react";
import { Stats } from "@/components/home/Stats";
import { CtaBanner } from "@/components/home/CtaBanner";

export const metadata: Metadata = {
  title: "About us — Media Chief",
  description:
    "Media Chief is a U.S. agency specialized in press release distribution across a network of newspapers covering all 50 states.",
  alternates: { canonical: "/about" },
};

const VALUES = [
  {
    icon: Target,
    title: "Measurable results",
    description:
      "Every published article is documented with a URL and a screenshot. You see exactly what you paid for.",
  },
  {
    icon: Users,
    title: "Clients come first",
    description:
      "Dedicated support, under 2 hours response time during business hours. No bots, just people.",
  },
  {
    icon: Award,
    title: "Editorial quality",
    description:
      "We only publish on active sites with real traffic and proven SEO authority.",
  },
  {
    icon: Handshake,
    title: "Long-term partnership",
    description:
      "Our subscriptions are built for brands that want a consistent press presence.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="bg-brand-navy text-white">
        <div className="container py-20 text-center">
          <p className="eyebrow text-brand-gold">About Media Chief</p>
          <h1 className="h1 mt-3 text-white max-w-3xl mx-auto">
            Making the press accessible to every business
          </h1>
          <p className="lead mx-auto mt-6 max-w-2xl text-white/85">
            We started from a simple question: why should a local business pay enormous sums for
            press coverage, when technology lets us distribute quickly and efficiently to dozens
            of newspapers at once?
          </p>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="eyebrow">Mission</p>
            <h2 className="h2 mt-2">Press releases, within reach of every business</h2>
            <div className="prose-me mt-6 space-y-4">
              <p>
                For years, appearing in the press was a privilege reserved for corporations with
                serious PR budgets. Media Chief changes that.
              </p>
              <p>
                With a network of 50 partner newspapers — one in every U.S. state — and 37
                Facebook pages, we give small businesses, clinics, restaurants, startups and
                marketing agencies access to the visibility that only the big players used to
                afford.
              </p>
              <p>
                All with fixed, transparent pricing, 24h delivery and a complete PDF report —
                documented with links and screenshots.
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-2xl bg-gradient-to-br from-brand-navy to-brand-red p-10 text-white shadow-2xl">
              <blockquote className="font-serif text-2xl leading-relaxed italic">
                &ldquo;We see the press as communication infrastructure — and we want it within
                reach of every business that has something important to say.&rdquo;
              </blockquote>
              <p className="mt-6 text-sm font-semibold text-brand-gold">
                — The Media Chief Team
              </p>
            </div>
          </div>
        </div>
      </section>

      <Stats />

      <section className="section bg-newsprint">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Our values</p>
            <h2 className="h2 mt-2">What we believe in</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="flex gap-5 rounded-xl border border-slate-200 bg-white p-6"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-red/10 text-brand-red">
                  <v.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-semibold text-brand-navy">
                    {v.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">{v.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaBanner />
    </>
  );
}
