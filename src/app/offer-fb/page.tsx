import type { Metadata } from "next";
import { OfferFbForm } from "./OfferFbForm";
import { Newspaper, Clock, ShieldCheck, TrendingUp, Star } from "lucide-react";
import { STANDARD_PACKAGES } from "@/data/packages";
import { TOTAL_NEWSPAPERS } from "@/data/newspapers";
import { formatPrice } from "@/lib/utils";

const prices = STANDARD_PACKAGES.map((p) => p.price);
const FROM = formatPrice(Math.min(...prices));
const TO = formatPrice(Math.max(...prices));

export const metadata: Metadata = {
  title: `Get published in ${TOTAL_NEWSPAPERS} US newspapers — Special offer`,
  description: `Press release distribution across ${TOTAL_NEWSPAPERS} US news sites. PDF report with screenshots within 24h. From $${FROM}.`,
  robots: { index: false, follow: false },
};

export default function OfferFbPage() {
  return (
    <div className="bg-gradient-to-b from-[#F8F5F0] to-white">
      <section className="mx-auto max-w-5xl px-4 py-12 md:py-20">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-red/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-red">
              <Star className="h-3 w-3 fill-current" /> Special offer
            </span>
            <h1 className="mt-4 font-serif text-3xl font-bold leading-tight text-brand-navy md:text-5xl">
              Get your story in{" "}
              <span className="text-brand-red">{TOTAL_NEWSPAPERS} US newspapers</span>{" "}
              in a single day
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              Your press release published across the Media Chief network — {TOTAL_NEWSPAPERS}{" "}
              online newspapers with real, Google-indexed traffic. PDF report with screenshots
              within 24h.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <Newspaper className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-red" />
                <span>
                  <strong className="text-brand-navy">{TOTAL_NEWSPAPERS} online newspapers</strong>,
                  each on its own domain, one per state
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-red" />
                <span>
                  <strong className="text-brand-navy">Published within 24h</strong> of
                  order confirmation
                </span>
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-red" />
                <span>
                  <strong className="text-brand-navy">PDF report</strong> with screenshots and
                  verifiable links
                </span>
              </li>
              <li className="flex items-start gap-3">
                <TrendingUp className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-red" />
                <span>
                  <strong className="text-brand-navy">Nationwide visibility</strong> from
                  the Northeast to the West Coast
                </span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border-2 border-brand-red/20 bg-white p-6 shadow-xl md:p-8">
            <div className="mb-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Get the offer by email
              </p>
              <h2 className="mt-1 font-serif text-2xl font-bold text-brand-navy">
                Your personalized offer with full pricing and details
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Fill in the form and we&apos;ll email you the packages, the pricing and the
                network details.
              </p>
            </div>
            <OfferFbForm />
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <div className="grid gap-6 md:grid-cols-3">
            <TrustCard
              number={`${TOTAL_NEWSPAPERS}`}
              label="news sites"
              subline="one in every state we cover"
            />
            <TrustCard
              number="2 years"
              label="publishing daily"
              subline="aged domains, indexed by Google"
            />
            <TrustCard
              number="24h"
              label="delivery time"
              subline="from order confirmation"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="text-center font-serif text-2xl font-bold text-brand-navy">
          Frequently asked questions
        </h2>
        <div className="mt-8 space-y-4">
          <FaqItem
            q="How much does it cost?"
            a={`Packages start at $${FROM} (one state newspaper) and go up to $${TO} (the whole network, nationwide coverage). You get the full details by email after filling in the form.`}
          />
          <FaqItem
            q="Are these real newspapers?"
            a={`Yes. The Media Chief network runs ${TOTAL_NEWSPAPERS} of its own domains, one per state, each publishing daily with real SEO traffic and Google indexing.`}
          />
          <FaqItem
            q="How do I get proof it was published?"
            a="Within 24h of confirmation you receive a PDF report with the URL of every published article, plus screenshots."
          />
          <FaqItem
            q="Can I write the article myself?"
            a="Yes. Send us your text, or on request we write it for you with AI based on your brief."
          />
        </div>
      </section>
    </div>
  );
}

function TrustCard({ number, label, subline }: { number: string; label: string; subline: string }) {
  return (
    <div className="text-center">
      <p className="font-serif text-4xl font-bold text-brand-red">{number}</p>
      <p className="mt-1 text-sm font-semibold uppercase tracking-wider text-brand-navy">{label}</p>
      <p className="mt-1 text-xs text-slate-500">{subline}</p>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-xl border border-slate-200 bg-white p-4">
      <summary className="cursor-pointer list-none font-semibold text-brand-navy marker:hidden">
        <span className="flex items-center justify-between">
          {q}
          <span className="text-brand-red transition-transform group-open:rotate-45">+</span>
        </span>
      </summary>
      <p className="mt-3 text-sm text-slate-600">{a}</p>
    </details>
  );
}
