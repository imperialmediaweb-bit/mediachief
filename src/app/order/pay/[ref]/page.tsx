import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, FileText, Lock, ShieldCheck } from "lucide-react";
import { PayNow } from "./PayNow";
import { findOrderByRef, PENDING_PAYMENT } from "@/lib/order-ref";
import { findPackageById } from "@/data/packages";
import { SITE } from "@/data/site";

export const metadata: Metadata = {
  title: "Payment — Media Chief",
  robots: { index: false, follow: false },
};

/**
 * Step two of the order. The article is already saved under this reference;
 * all that is left is the card. Card only, deliberately — Media Chief takes no
 * bank transfers and no WhatsApp orders, so there is nothing to choose.
 */
export default async function PayPage({
  params,
  searchParams,
}: {
  params: { ref: string };
  searchParams?: { paid?: string };
}) {
  const order = await findOrderByRef(params.ref);

  // Once the card clears, the webhook moves the row onto the real Stripe
  // session id, so this reference stops resolving. Stripe sends the buyer back
  // here with ?paid=1, and without this they would land on a 404 having just
  // paid.
  if (!order && searchParams?.paid !== "1") notFound();

  const pkg = order ? findPackageById(order.packageId) : undefined;
  const price = order ? Math.round(order.amount / 100) : 0;
  const label = !order
    ? ""
    : order.packageId === "pick"
      ? `${order.newspaperStates?.split(",").filter(Boolean).length || 0} newspapers of your choice`
      : pkg?.name || order.packageId;

  const paid = !order || order.status === "paid" || searchParams?.paid === "1";

  if (paid) {
    return (
      <div className="bg-slate-50">
        <section className="container max-w-2xl py-16">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
            <h1 className="mt-4 font-serif text-2xl font-bold text-brand-navy">
              Payment received
            </h1>
            <p className="mt-3 text-slate-600">
              Thank you. We have your article and your payment — there is nothing else for you to
              send. We publish within one business day and email you every link, with the report in
              PDF and Excel.
            </p>
            <p className="mt-3 text-sm text-slate-500">
              Your invoice arrives by email in a few minutes. To follow the order, sign in
              {order ? (
                <>
                  {" "}
                  with <strong className="text-brand-navy">{order.email}</strong>
                </>
              ) : (
                " with the email address you paid with"
              )}
              .
            </p>
            <Link
              href="/account/login"
              className="mt-6 inline-block rounded-lg bg-[#c1121f] px-6 py-3 text-sm font-semibold text-white"
            >
              Go to my account
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (!order || order.status !== PENDING_PAYMENT) notFound();

  return (
    <div className="bg-slate-50">
      <section className="bg-brand-navy text-white">
        <div className="container py-12 text-center">
          <h1 className="font-serif text-3xl font-bold md:text-4xl">Payment</h1>
          <p className="mx-auto mt-3 max-w-xl text-white/85">
            We have your article. One step left.
          </p>
        </div>
      </section>

      <section className="container max-w-2xl py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
          <div className="flex items-start gap-3 rounded-xl bg-green-50 p-4">
            <FileText className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
            <p className="text-sm leading-relaxed text-green-900">
              Your article is saved and waiting. It goes to our editors the moment the payment
              clears — and not before.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2 border-y border-slate-100 py-4">
            <div>
              <p className="font-serif text-lg font-bold text-brand-navy">{label}</p>
              <p className="text-sm text-slate-600">One article, a unique version per newspaper</p>
            </div>
            <p className="font-serif text-2xl font-bold text-[#c1121f]">${price}</p>
          </div>

          <div className="mt-6">
            <PayNow orderRef={params.ref} price={price} />
          </div>

          <ul className="mt-6 space-y-2 text-xs text-slate-500">
            <li className="flex items-start gap-2">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Card details are handled by Stripe. They never touch our servers.
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Your billing details and tax ID are collected by Stripe, so the invoice is correct.
            </li>
          </ul>

          <p className="mt-6 text-center text-xs text-slate-500">
            Need to change something in the article? Write to{" "}
            <a href={`mailto:${SITE.email}`} className="font-semibold text-brand-navy">
              {SITE.email}
            </a>{" "}
            and quote <code className="rounded bg-slate-100 px-1 py-0.5">{params.ref.slice(0, 12)}</code>.
          </p>
        </div>
      </section>
    </div>
  );
}
