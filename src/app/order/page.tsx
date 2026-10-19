import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileText, CreditCard, Newspaper } from "lucide-react";
import { OrderIntakeForm } from "./OrderIntakeForm";
import { resolveOrder } from "@/lib/order-pricing";
import { NEWSPAPERS } from "@/data/newspapers";
import { SITE } from "@/data/site";

export const metadata: Metadata = {
  title: "Order an article — Media Chief",
  description: "Send us your article, then pay by card. We publish within one business day.",
  alternates: { canonical: "/order" },
  robots: { index: false, follow: false },
};

const STEPS = [
  {
    icon: FileText,
    title: "1. Send your article",
    text: "Your text and photos, or we write it for you. Nothing charged at this step.",
  },
  {
    icon: CreditCard,
    title: "2. Pay by card",
    text: "Card payment through Stripe. Your receipt is emailed automatically.",
  },
  {
    icon: Newspaper,
    title: "3. We publish in 24h",
    text: "Every link emailed to you, with the report in PDF and Excel.",
  },
];

interface PageProps {
  searchParams?: { package?: string; states?: string; casino?: string };
}

/**
 * The order in its natural sequence: first what gets published, then payment.
 * It used to go straight to Stripe and ask for the article afterwards, which
 * meant the buyer paid for a promise before giving us anything to publish.
 */
export default function OrderPage({ searchParams }: PageProps) {
  const packageId = searchParams?.package || "national";
  // Full state names, as the newspaper picker passes them.
  const states = (searchParams?.states || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const casino = searchParams?.casino === "1";

  const resolved = resolveOrder({ packageId, states, casino });
  if (!resolved) notFound();

  const count =
    resolved.packageId === "pick"
      ? resolved.newspapers
      : resolved.newspapers ?? NEWSPAPERS.length;

  return (
    <div className="bg-slate-50">
      <section className="bg-brand-navy text-white">
        <div className="container py-12 text-center">
          <h1 className="font-serif text-3xl font-bold md:text-4xl">Order an article</h1>
          <p className="mx-auto mt-3 max-w-2xl text-white/85">
            {resolved.label} — <strong className="text-brand-gold">${resolved.amount}</strong>, final
            price. Send us the article first, pay on the next page.
          </p>
        </div>
      </section>

      <section className="container max-w-3xl py-10">
        <div className="grid gap-4 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl border border-slate-200 bg-white p-4">
              <Icon className="h-5 w-5 text-[#c1121f]" />
              <p className="mt-2 font-serif text-sm font-bold text-brand-navy">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <p className="font-serif text-lg font-bold text-brand-navy">{resolved.label}</p>
              <p className="text-sm text-slate-600">
                {resolved.description}
                {count ? ` — ${count} newspaper${count === 1 ? "" : "s"}` : ""}
              </p>
            </div>
            <p className="font-serif text-2xl font-bold text-[#c1121f]">${resolved.amount}</p>
          </div>

          <OrderIntakeForm
            packageId={resolved.packageId}
            label={resolved.label}
            price={resolved.amount}
            states={resolved.packageId === "pick" ? states : undefined}
            casino={casino}
          />
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Questions before you order? Write to{" "}
          <a href={`mailto:${SITE.email}`} className="font-semibold text-brand-navy hover:underline">
            {SITE.email}
          </a>
          .
        </p>
      </section>
    </div>
  );
}
