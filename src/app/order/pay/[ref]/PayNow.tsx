"use client";

import { useState } from "react";
import { AlertCircle, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Opens Stripe Checkout for an order that is already saved and waiting.
 * The prop is `orderRef`, not `ref` — React treats `ref` as special and would
 * never pass it through.
 */
export function PayNow({ orderRef, price }: { orderRef: string; price: number }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/order/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref: orderRef }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok || !data.url) {
        throw new Error(data.error || "Could not open the payment page.");
      }
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <div>
      <Button variant="accent" size="lg" className="w-full" disabled={busy} onClick={go}>
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Opening secure payment…
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4" /> Pay ${price} by card
          </>
        )}
      </Button>
      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
