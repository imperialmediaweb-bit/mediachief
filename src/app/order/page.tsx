import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderForm } from "@/components/forms/OrderForm";
import { CheckCircle2 } from "lucide-react";
import { SITE } from "@/data/site";

export const metadata: Metadata = {
  title: "Order an article — Media Chief",
  description: "Fill in the order form and the Media Chief team will contact you within 2 hours.",
  alternates: { canonical: "/order" },
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams?: { package?: string };
}

const BENEFITS = [
  "Article delivered within 24h",
  "PDF report with all URLs",
  "Facebook distribution included",
  "Permanently published online",
  "Dedicated support by email & phone",
];

export default function OrderPage({ searchParams }: PageProps) {
  const defaultPackageId = searchParams?.package;
  return (
    <section className="bg-white">
      <div className="container grid gap-12 py-16 lg:grid-cols-[1.3fr_1fr] lg:py-20">
        <div className="order-2 lg:order-1">
          <h1 className="h1">Order an article</h1>
          <p className="lead mt-4">
            Fill in the form and a consultant will contact you within 2 hours. We never store
            card details — invoicing happens after we confirm publication.
          </p>
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <Suspense>
              <OrderForm defaultPackageId={defaultPackageId} />
            </Suspense>
          </div>
        </div>
        <aside className="order-1 lg:order-2">
          <div className="sticky top-24 rounded-2xl bg-brand-navy p-8 text-white">
            <p className="eyebrow text-brand-gold">What you get</p>
            <h2 className="mt-2 font-serif text-2xl font-bold">
              Visibility in 50 newspapers + 37 Facebook pages
            </h2>
            <ul className="mt-6 space-y-3">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm text-white/90">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-gold mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 rounded-lg bg-white/5 p-5 border border-white/10">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-gold">
                Not sure which package to pick?
              </p>
              <p className="mt-2 text-sm text-white/80">
                Email us and we&apos;ll recommend the right package for you, free of charge.
              </p>
              <a
                href={`mailto:${SITE.email}`}
                className="mt-3 inline-block text-sm font-semibold text-brand-gold hover:underline"
              >
                {SITE.email} →
              </a>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
