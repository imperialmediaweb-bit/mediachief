import type { Metadata } from "next";
import { NewspaperPicker } from "@/components/NewspaperPicker";
import {
  PICK_FIRST,
  PICK_EACH_MORE,
  PROMO_PRICE,
  pickCapAt,
} from "@/data/packages";
import { TOTAL_NEWSPAPERS } from "@/data/newspapers";

export const metadata: Metadata = {
  title: `Pick your newspapers — from $${PICK_FIRST}`,
  description: `Choose the newspapers you want, from a single state to all ${TOTAL_NEWSPAPERS}. $${PICK_FIRST} for the first, $${PICK_EACH_MORE} for each one after, never more than $${PROMO_PRICE} for the whole network.`,
  alternates: { canonical: "/choose" },
};

export const revalidate = 3600;

export default function ChoosePage() {
  const capAt = pickCapAt();
  return (
    <>
      <section className="bg-brand-navy text-white">
        <div className="container py-14 lg:py-20">
          <p className="eyebrow text-brand-gold">Build your own</p>
          <h1 className="h1 mt-3 text-white">Pick the newspapers you want</h1>
          <p className="lead mt-5 max-w-2xl text-white/85">
            One state, a handful, or the whole country. Your article is published on every
            newspaper you tick, with a different version on each, and you get the list of links
            within one business day.
          </p>
          <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-t border-white/15 pt-6">
            <div>
              <dt className="text-xs uppercase tracking-wider text-white/50">First newspaper</dt>
              <dd className="font-serif text-3xl font-bold text-brand-gold">${PICK_FIRST}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-white/50">Each one after</dt>
              <dd className="font-serif text-3xl font-bold text-brand-gold">+${PICK_EACH_MORE}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-white/50">
                {capAt}+ newspapers, up to all {TOTAL_NEWSPAPERS}
              </dt>
              <dd className="font-serif text-3xl font-bold text-brand-gold">${PROMO_PRICE}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container">
          <NewspaperPicker />
        </div>
      </section>

      <section className="bg-brand-ivory border-t border-slate-200">
        <div className="container py-12">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-2xl font-bold text-brand-navy">
              What happens after you pay
            </h2>
            <ol className="mt-6 space-y-3 text-left text-sm text-slate-600">
              <li>
                <strong className="text-brand-navy">1.</strong> You pay by card and the receipt
                and invoice arrive by email straight away.
              </li>
              <li>
                <strong className="text-brand-navy">2.</strong> You send us the article, or just
                the topic and we write it.
              </li>
              <li>
                <strong className="text-brand-navy">3.</strong> Within one business day it is
                live on every newspaper you picked, and we email you the full list of links in
                PDF and Excel.
              </li>
            </ol>
            <p className="mt-6 text-xs text-slate-500">
              We publish the article and hand you the links. We do not promise traffic, customers
              or search rankings.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
