"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CreditCard, Loader2, RefreshCw, ChevronDown, Newspaper, ShieldCheck } from "lucide-react";
import { trackPixelEvent } from "@/components/analytics/MetaPixel";
import { trackGaEvent } from "@/components/analytics/GoogleAnalytics";
import { CONTENT_DECLARATION, CONTENT_DECLARATION_ERROR, CONTENT_DECLARATION_WARNING } from "@/lib/content-policy";
import { FormError } from "@/components/forms/FormError";
import {
  PROMO_PRICE,
  PROMO_PRICE_CASINO,
  PROMO_MONTHLY,
  PROMO_MONTHLY_CASINO,
  STANDARD_PACKAGES,
  CASINO_PACKAGES,
  SUBSCRIPTION_PLANS,
} from "@/data/packages";
import { TOTAL_NEWSPAPERS } from "@/data/newspapers";
import { SITE } from "@/data/site";
import { formatPrice } from "@/lib/utils";

const money = (n: number) => `$${formatPrice(n)}`;

// List prices come from the full-price tiers so the strike-through never drifts.
const LIST_ONCE = STANDARD_PACKAGES.find((p) => p.id === "national")?.price ?? 1500;
const LIST_ONCE_CASINO = CASINO_PACKAGES.find((p) => p.id === "casino-national")?.price ?? 2500;
const LIST_MONTHLY = SUBSCRIPTION_PLANS.find((p) => p.id === "bronze")?.priceStandard ?? 1300;
const LIST_MONTHLY_CASINO = SUBSCRIPTION_PLANS.find((p) => p.id === "bronze")?.priceCasino ?? 2300;

// Four combinations: (standard | casino) x (once | monthly).
const OFFERS = {
  once: {
    standard: { packageId: "promo-49", price: PROMO_PRICE, listPrice: money(LIST_ONCE), suffix: "" },
    casino: { packageId: "promo-49-casino", price: PROMO_PRICE_CASINO, listPrice: money(LIST_ONCE_CASINO), suffix: "" },
  },
  monthly: {
    standard: { packageId: "promo-monthly", price: PROMO_MONTHLY, listPrice: `${money(LIST_MONTHLY)}/mo`, suffix: "/mo" },
    casino: { packageId: "promo-monthly", price: PROMO_MONTHLY_CASINO, listPrice: `${money(LIST_MONTHLY_CASINO)}/mo`, suffix: "/mo" },
  },
} as const;

// The selector renders twice on the page (hero + final CTA). Module-level
// state keeps both instances in sync, so the buyer cannot pick one variant at
// the top and pay for another at the bottom.
type Selection = { isCasino: boolean; monthly: boolean };
let selection: Selection = { isCasino: false, monthly: false };
const listeners = new Set<() => void>();
const serverSnapshot: Selection = { isCasino: false, monthly: false };
function setSelection(patch: Partial<Selection>) {
  selection = { ...selection, ...patch };
  listeners.forEach((fn) => fn());
}
function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function useSelection(): Selection {
  return useSyncExternalStore(subscribe, () => selection, () => serverSnapshot);
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

export function PromoOffer({ showPrice = true }: { showPrice?: boolean }) {
  const { isCasino, monthly } = useSelection();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Email is asked here, before Stripe: whoever leaves on the Stripe page
  // would otherwise be unknown and unrecoverable.
  const [askEmail, setAskEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [declared, setDeclared] = useState(false);
  const emailFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (askEmail) emailFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [askEmail]);

  const offer = OFFERS[monthly ? "monthly" : "once"][isCasino ? "casino" : "standard"];

  function start() {
    if (loading) return;
    setError(null);
    trackPixelEvent("InitiateCheckout", {
      content_name: `Offer 499 — ${isCasino ? "casino" : "standard"}${monthly ? " monthly" : ""}`,
      content_category: "promo",
      value: offer.price,
      currency: "USD",
    });
    trackGaEvent("begin_checkout", { value: offer.price, currency: "USD" });
    setAskEmail(true);
  }

  async function go() {
    if (loading) return;
    const clean = email.trim();
    if (!EMAIL_RE.test(clean)) {
      setError("Enter a valid email address — that is where the receipt and the report go.");
      return;
    }
    if (!declared) {
      setError(CONTENT_DECLARATION_ERROR);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: clean,
          packageId: offer.packageId,
          mode: monthly ? (isCasino ? "subscription-casino" : "subscription-standard") : "package",
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok || !body.url) throw new Error(body.error || "Something went wrong");
      window.location.href = body.url;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Once / Monthly */}
      <div className="mx-auto flex max-w-xs overflow-hidden rounded-full border border-white/20 bg-white/5 p-1 text-sm font-semibold">
        {([[false, "One time"], [true, "Monthly"]] as [boolean, string][]).map(([m, label]) => (
          <button
            key={label}
            type="button"
            onClick={() => setSelection({ monthly: m })}
            className={`flex-1 rounded-full px-4 py-3 transition ${
              monthly === m ? "bg-brand-gold text-brand-navy" : "text-white/70 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {showPrice && (
        <div className="mt-8 flex items-end justify-center gap-4">
          <div className="text-right">
            <p className="text-sm uppercase tracking-wider text-white/50">Regular price</p>
            <p className="font-serif text-3xl font-bold text-white/40 line-through">{offer.listPrice}</p>
          </div>
          <div className="text-left">
            <p className="text-sm uppercase tracking-wider text-brand-gold">Now</p>
            <p className="font-serif text-6xl font-bold text-brand-gold md:text-7xl">
              {money(offer.price)}
              {offer.suffix && <span className="text-2xl font-normal text-white/60 md:text-3xl">{offer.suffix}</span>}
            </p>
          </div>
        </div>
      )}

      {monthly && (
        <p className="mx-auto mt-3 flex max-w-md items-center justify-center gap-2 text-sm text-white/70">
          <RefreshCw className="h-3.5 w-3.5" />
          1 new article across all {TOTAL_NEWSPAPERS} newspapers, every month — {money(isCasino ? PROMO_PRICE_CASINO - PROMO_MONTHLY_CASINO : PROMO_PRICE - PROMO_MONTHLY)} less than the one-time price. Cancel any time.
        </p>
      )}

      {/* Collapsed by design: most buyers have nothing to do with gambling. */}
      <details open={isCasino} className="mx-auto mt-5 max-w-md rounded-xl border border-white/15 bg-white/5 text-left">
        <summary className="cursor-pointer list-none px-4 py-2.5 text-sm text-white/65 hover:text-white/90">
          Is the article about casino, betting or iGaming?{" "}
          <span className="underline decoration-dotted underline-offset-2">Different rate — tap here</span>
        </summary>
        <label className="flex cursor-pointer items-start gap-3 px-4 pb-4 pt-1">
          <input
            type="checkbox"
            checked={isCasino}
            onChange={(e) => setSelection({ isCasino: e.target.checked })}
            className="mt-0.5 h-6 w-6 shrink-0 accent-brand-gold"
          />
          <span className="text-sm text-white/80">
            Yes, the article is about <strong className="text-white">casino, betting or iGaming</strong>
            <span className="mt-1 block text-white/55">
              This category is {money(monthly ? PROMO_MONTHLY_CASINO : PROMO_PRICE_CASINO)}
              {monthly ? "/mo" : ""} — extra compliance work (state gambling rules, responsible-gaming
              notices). Ticking this is required for articles in the niche.
            </span>
          </span>
        </label>
      </details>

      {askEmail ? (
        <form
          noValidate
          ref={emailFormRef}
          onSubmit={(e) => {
            e.preventDefault();
            void go();
          }}
          className="mt-6 rounded-xl border border-white/20 bg-white/5 p-4"
        >
          <label className="block text-left">
            <span className="text-sm font-semibold text-white">Your email — the receipt and the report go there</span>
            <input
              type="email"
              autoFocus
              required
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              placeholder="name@company.com"
              className="mt-2 w-full rounded-lg border border-white/20 bg-white px-4 py-3 text-base text-brand-navy placeholder:text-slate-400 focus:border-brand-gold focus:outline-none"
            />
            <span className="mt-1.5 block text-xs text-white/60">
              Double-check it — a typo here means no receipt and no report. Problems? Write to {SITE.email}.
            </span>
          </label>

          <label className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-300/40 bg-amber-400/10 p-3 text-left">
            <input
              type="checkbox"
              name="contentDeclaration"
              checked={declared}
              onChange={(ev) => setDeclared(ev.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-brand-gold"
            />
            <span className="text-xs leading-relaxed text-white/85">
              {CONTENT_DECLARATION}{" "}
              <a href="/legal/terms" target="_blank" rel="noreferrer" className="font-semibold text-brand-gold underline">
                Content rules
              </a>
              <span className="mt-1 block text-white/60">{CONTENT_DECLARATION_WARNING}</span>
            </span>
          </label>

          <FormError
            message={error}
            className="mt-4 rounded-lg border border-red-400/40 bg-red-500/15 px-3 py-2 text-center text-sm font-semibold text-red-200"
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-4 inline-flex w-full flex-col items-center justify-center gap-0.5 rounded-lg bg-brand-red px-6 py-3.5 font-bold text-white shadow-xl shadow-brand-red/30 transition hover:bg-brand-red/90 disabled:opacity-60"
          >
            <span className="inline-flex items-center gap-2 text-base">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
              Pay by card — {money(offer.price)}{offer.suffix}
            </span>
            <span className="text-xs font-normal text-white/80">secure Stripe checkout, then you send the article</span>
          </button>
          <p className="mt-3 text-center text-xs text-white/60">
            {money(offer.price)}{offer.suffix} · receipt by email · published within 1 business day
          </p>
        </form>
      ) : (
        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={start}
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-red px-8 py-4 text-lg font-bold text-white shadow-xl shadow-brand-red/30 transition hover:bg-brand-red/90 disabled:opacity-60 sm:w-auto"
          >
            <CreditCard className="h-5 w-5" />
            {monthly ? "Subscribe" : "Order now"} — {money(offer.price)}{offer.suffix}
          </button>
          <p className="inline-flex items-center gap-1.5 text-sm text-white/75">
            <ShieldCheck className="h-4 w-4 text-brand-gold" />
            Not published within 1 business day? Full refund.
          </p>
          <a
            href="#newspapers"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-brand-gold/60 bg-brand-gold/10 px-6 py-3 text-base font-bold text-brand-gold transition hover:border-brand-gold hover:bg-brand-gold/20 sm:w-auto"
          >
            <Newspaper className="h-5 w-5" />
            See all {TOTAL_NEWSPAPERS} newspapers
            <ChevronDown className="h-4 w-4" />
          </a>
          <a href="#faq" className="text-xs font-medium text-white/60 underline underline-offset-4 transition hover:text-white/90">
            A question before you order? Answers below ↓
          </a>
        </div>
      )}

      {/* What happens after payment, said before payment. */}
      <div className="mt-5 rounded-xl border border-white/15 bg-white/5 p-4 text-left">
        <p className="text-xs font-bold uppercase tracking-wider text-brand-gold">What happens after payment</p>
        <ol className="mt-2 space-y-1.5 text-sm text-white/85">
          <li>
            <strong className="text-white">1.</strong> You come back to a short form where you send the article and up to 3 images.
          </li>
          <li>
            <strong className="text-white">2.</strong> No article yet? <strong className="text-white">We write it</strong> — give us your website and a sentence or two. You read it and can change it before it goes live.
          </li>
          <li>
            <strong className="text-white">3.</strong> We publish within 1 business day on every newspaper. Orders placed in the evening or at the weekend go live the next business day.
          </li>
          <li>
            <strong className="text-white">4.</strong> You get the list of all {TOTAL_NEWSPAPERS} links by email, in PDF and Excel — the document you forward to whoever needs it.
          </li>
        </ol>
      </div>
    </div>
  );
}
