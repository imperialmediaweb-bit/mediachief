"use client";

import { useMemo, useState } from "react";
import { Loader2, Check } from "lucide-react";
import { NEWSPAPERS, TOTAL_NEWSPAPERS, type Newspaper } from "@/data/newspapers";
import {
  pickPrice,
  pickCapAt,
  PICK_FIRST,
  PICK_FIRST_CASINO,
  PICK_EACH_MORE,
  PICK_EACH_MORE_CASINO,
} from "@/data/packages";
import { CONTENT_DECLARATION, CONTENT_DECLARATION_ERROR } from "@/lib/content-policy";
import { Button } from "@/components/ui/button";
import { trackPixelEvent } from "@/components/analytics/MetaPixel";
import { trackGaEvent } from "@/components/analytics/GoogleAnalytics";

const REGIONS = ["Northeast", "Midwest", "South", "West"] as const;

/** Each paper covers one state, so the state name is a stable id. */
function keyOf(paper: Newspaper): string {
  return paper.state || paper.name;
}

export function NewspaperPicker() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [casino, setCasino] = useState(false);
  const [email, setEmail] = useState("");
  const [declared, setDeclared] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const byRegion = useMemo(
    () =>
      REGIONS.map((region) => ({
        region,
        papers: NEWSPAPERS.filter((p) => p.region === region),
      })),
    []
  );

  const count = selected.size;
  const price = pickPrice(count, casino);
  const capAt = pickCapAt(casino);
  const atCap = count >= capAt;
  const step = casino ? PICK_EACH_MORE_CASINO : PICK_EACH_MORE;
  const first = casino ? PICK_FIRST_CASINO : PICK_FIRST;
  const nextPrice = pickPrice(count + 1, casino);

  const toggle = (k: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  const selectAll = () =>
    setSelected(new Set(NEWSPAPERS.map(keyOf)));

  const clear = () => setSelected(new Set());

  async function checkout() {
    setError(null);
    if (count === 0) return setError("Pick at least one newspaper.");
    if (!email.includes("@")) return setError("Enter a valid email address.");
    if (!declared) return setError(CONTENT_DECLARATION_ERROR);

    setBusy(true);
    trackPixelEvent("InitiateCheckout", {
      content_name: `Pick your own — ${count} newspapers`,
      value: price,
      currency: "USD",
    });
    trackGaEvent("begin_checkout", { value: price, currency: "USD", items: count });

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: "pick",
          mode: "pick",
          email,
          states: Array.from(selected),
          casino,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok || !data.url) {
        throw new Error(data.error || "Could not start the checkout.");
      }
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start">
      {/* The list */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <p className="text-sm text-slate-600">
            <strong className="text-brand-navy">{count}</strong> of {TOTAL_NEWSPAPERS} selected
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
            >
              Select all {TOTAL_NEWSPAPERS}
            </button>
            <button
              type="button"
              onClick={clear}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-7">
          {byRegion.map(({ region, papers }) => (
            <div key={region}>
              <h3 className="font-headline text-sm font-bold uppercase tracking-wide text-brand-navy">
                {region}
                <span className="ml-2 font-sans text-xs font-normal text-slate-400">
                  {papers.length} newspapers
                </span>
              </h3>
              <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                {papers.map((paper) => {
                  const k = keyOf(paper);
                  const on = selected.has(k);
                  return (
                    <li key={k}>
                      <label
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${
                          on
                            ? "border-brand-navy bg-brand-navy/5 text-brand-navy"
                            : "border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => toggle(k)}
                          className="h-4 w-4 accent-[#c1121f]"
                        />
                        <span className="min-w-0 flex-1 truncate">{paper.name}</span>
                        <span className="shrink-0 font-mono text-xs text-slate-400">
                          {paper.state}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* The price and checkout */}
      <div className="lg:sticky lg:top-24">
        <div className="rounded-2xl border-2 border-brand-navy bg-brand-navy p-6 text-white">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-gold">
            Your selection
          </p>
          <p className="mt-3 font-serif text-5xl font-bold">${price}</p>
          <p className="mt-1 text-sm text-white/70">
            {count === 0
              ? "Pick newspapers to see the price"
              : `${count} newspaper${count === 1 ? "" : "s"}, one article each`}
          </p>

          <p className="mt-4 rounded-lg bg-white/5 p-3 text-xs leading-relaxed text-white/70">
            {atCap ? (
              <>
                You have reached the whole-network price — adding more newspapers costs nothing
                extra. Select all {TOTAL_NEWSPAPERS} for the same ${price}.
              </>
            ) : count === 0 ? (
              <>
                ${first} for the first newspaper, ${step} for each one after that. From {capAt}{" "}
                newspapers up you pay the whole-network price and nothing more.
              </>
            ) : (
              <>
                The next newspaper takes it to ${nextPrice}. From {capAt} newspapers up the price
                stops at ${pickPrice(capAt, casino)}, however many you add.
              </>
            )}
          </p>

          <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm text-white/85">
            <input
              type="checkbox"
              checked={casino}
              onChange={(e) => setCasino(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#c1121f]"
            />
            <span>My article is casino, betting or iGaming content</span>
          </label>

          <div className="mt-5 space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-brand-gold focus:outline-none"
            />
            <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-white/70">
              <input
                type="checkbox"
                checked={declared}
                onChange={(e) => setDeclared(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#c1121f]"
              />
              <span>{CONTENT_DECLARATION}</span>
            </label>
          </div>

          {error && (
            <p className="mt-3 rounded-lg bg-red-500/15 px-3 py-2 text-xs text-red-200">{error}</p>
          )}

          <Button
            variant="accent"
            size="lg"
            className="mt-5 w-full"
            disabled={busy || count === 0}
            onClick={checkout}
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Opening checkout…
              </>
            ) : (
              <>
                <Check className="h-4 w-4" /> Pay ${price}
              </>
            )}
          </Button>
          <p className="mt-3 text-center text-xs text-white/50">
            Card payment · invoice by email · final price
          </p>
        </div>
      </div>
    </div>
  );
}
