import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PricingGroup } from "@/components/pricing/PricingGroup";
import { SubscriptionTable } from "@/components/pricing/SubscriptionTable";
import { PricingNote } from "@/components/pricing/PricingNote";
import { FAQ } from "@/components/home/FAQ";
import { CtaBanner } from "@/components/home/CtaBanner";
import { RequestListModal } from "@/components/forms/RequestListModal";
import { STANDARD_PACKAGES, CASINO_PACKAGES, PROMO_PRICE, PICK_FIRST, PICK_EACH_MORE, promoDeadlineLabel } from "@/data/packages";
import { TOTAL_NEWSPAPERS } from "@/data/newspapers";
import { formatPrice } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import { PackagesStructuredData } from "@/components/seo/StructuredData";
import { Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Packages and pricing — Distribution across 49 U.S. newspapers",
  description:
    "Media Chief packages: Local ($40), Regional ($94), National 49 ($149). Casino/iGaming variants and Bronze/Silver/Gold/Platinum monthly subscriptions.",
  alternates: { canonical: "/packages" },
};

const deadline = promoDeadlineLabel();

export default function PackagesPage() {
  return (
    <>
      <PackagesStructuredData
        packages={[...STANDARD_PACKAGES, ...CASINO_PACKAGES].map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          currency: "USD",
        }))}
      />

      {/* Hero */}
      <section className="bg-brand-navy text-white">
        <div className="container py-20 text-center">
          <p className="eyebrow text-brand-gold">Transparent pricing</p>
          <h1 className="h1 mt-3 text-white">Packages for every need</h1>
          <p className="lead mx-auto mt-6 max-w-2xl text-white/85">
            From a single article in one state newspaper, to nationwide publication across 50
            newspapers or monthly subscriptions. Pick the package that fits your business.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button variant="gold" size="lg" asChild>
              <a href="#standard">Standard Packages</a>
            </Button>
            <Button variant="outline" size="lg" asChild className="border-white/30 text-white hover:bg-white hover:text-brand-navy">
              <a href="#casino">Casino Packages</a>
            </Button>
            <Button variant="outline" size="lg" asChild className="border-white/30 text-white hover:bg-white hover:text-brand-navy">
              <a href="#subscriptions">Subscriptions</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Standard */}
      <div className="section bg-white">
        <div className="container space-y-24">
          {/* Launch pricing banner — the prices below ARE the offer, so no fake
              struck-through tier here. */}
          <section id="intro-offer" className="scroll-mt-24 overflow-hidden rounded-2xl border-2 border-brand-gold bg-brand-navy text-white">
            <div className="grid gap-8 p-8 lg:grid-cols-[1.4fr_1fr] lg:items-center lg:p-12">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-brand-gold/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-gold">
                  <Sparkles className="h-3.5 w-3.5" />
                  {deadline ? `Launch pricing — until ${deadline}` : "Launch pricing"}
                </span>
                <h2 className="mt-4 font-serif text-3xl font-bold leading-tight sm:text-4xl">
                  Every price below is a launch price
                </h2>
                <p className="mt-4 text-white/85">
                  We opened the network to US clients this autumn, so the prices you see are the
                  opening ones — the struck-through figure beside each is what the package costs
                  afterwards. One article in all {TOTAL_NEWSPAPERS} newspapers is{" "}
                  <strong className="text-brand-gold">${formatPrice(PROMO_PRICE)}</strong> right now.
                  Published within one business day, permanent, with the full list of links in PDF
                  and Excel.
                </p>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/5 p-6 text-center">
                <p className="text-xs uppercase tracking-wider text-white/50">Pay only for what you need</p>
                <p className="mt-2 font-serif text-5xl font-bold text-brand-gold">from ${PICK_FIRST}</p>
                <p className="mt-2 text-sm text-white/70">
                  Tick the newspapers you want. ${PICK_FIRST} for the first, ${PICK_EACH_MORE} for
                  each one after, never more than ${formatPrice(PROMO_PRICE)} for the whole network.
                </p>
                <Button variant="accent" size="lg" asChild className="mt-5 w-full">
                  <Link href="/choose">Pick your newspapers</Link>
                </Button>
                <p className="mt-3 text-xs text-white/60">Card payment · invoice by email · final price</p>
              </div>
            </div>
          </section>

          <PricingGroup
            packages={STANDARD_PACKAGES}
            id="standard"
            eyebrow="For every business"
            title="Standard Packages"
            description="Three simple options based on the coverage you want: single state, regional or nationwide."
          />

          <PricingGroup
            packages={CASINO_PACKAGES}
            id="casino"
            eyebrow="iGaming • betting • casino"
            title="Casino Packages"
            description="Packages built for the iGaming industry, with compliance checks and publication on portals that accept this type of content."
          />

          <section id="subscriptions" className="scroll-mt-24">
            <div className="max-w-3xl">
              <p className="eyebrow">Recurring revenue — permanent discount</p>
              <h2 className="h2 mt-2">Monthly subscriptions</h2>
              <p className="lead mt-4">
                Four monthly plans, each with two prices (standard / casino). The more often you
                publish, the lower your cost per article.
              </p>
            </div>
            <div className="mt-10">
              <SubscriptionTable />
            </div>
          </section>

          <PricingNote />

          {/* Lead Magnet — Request List */}
          <section className="relative overflow-hidden rounded-2xl bg-brand-navy p-10 text-white lg:p-16">
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)",
                backgroundSize: "24px 24px",
              }}
            />
            <div className="relative grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-brand-gold/20 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-brand-gold">
                  <Mail className="h-3.5 w-3.5" /> Free • PDF by email
                </div>
                <h3 className="mt-5 font-serif text-3xl font-bold sm:text-4xl">
                  Want the full list of all 49 newspapers?
                </h3>
                <p className="mt-4 text-white/85 leading-relaxed">
                  Fill in the form and within 2 minutes we&apos;ll email you the PDF with every
                  partner newspaper, the states covered and the publishing details. Zero
                  obligation, zero spam.
                </p>
              </div>
              <div className="flex lg:justify-end">
                <RequestListModal
                  trigger={
                    <Button variant="gold" size="lg" className="whitespace-nowrap">
                      <Mail className="h-4 w-4" /> Send me the PDF
                    </Button>
                  }
                />
              </div>
            </div>
          </section>

          {/* CTA towards order */}
          <section className="rounded-2xl border-2 border-dashed border-brand-red/30 p-10 text-center">
            <h3 className="font-serif text-2xl font-semibold text-brand-navy">
              Need something custom?
            </h3>
            <p className="mt-3 text-slate-600 max-w-xl mx-auto">
              PR agencies, high-volume brands or special campaigns — let&apos;s talk about a
              custom rate.
            </p>
            <Button variant="default" size="lg" asChild className="mt-6">
              <Link href="/contact">Contact us for a custom quote</Link>
            </Button>
          </section>
        </div>
      </div>

      <FAQ />
      <CtaBanner />
    </>
  );
}
