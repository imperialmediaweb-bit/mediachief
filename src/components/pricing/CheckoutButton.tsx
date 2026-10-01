"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackPixelEvent } from "@/components/analytics/MetaPixel";
import { trackGaEvent } from "@/components/analytics/GoogleAnalytics";

type CheckoutMode = "package" | "subscription-standard" | "subscription-casino";

interface CheckoutButtonProps {
  /** Package id, or subscription plan id when mode is a subscription. */
  packageId: string;
  mode?: CheckoutMode;
  label: string;
  /** For the tracking events only. */
  name: string;
  price: number;
  variant?: "accent" | "default" | "outline" | "gold";
  className?: string;
}

/**
 * Sends the buyer straight to Stripe Checkout. Stripe collects the email,
 * billing address and tax id, and the price is recomputed server-side from
 * the id, so nothing here can set its own amount.
 */
export function CheckoutButton({
  packageId,
  mode = "package",
  label,
  name,
  price,
  variant = "accent",
  className = "",
}: CheckoutButtonProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setBusy(true);
    setError(null);
    trackPixelEvent("InitiateCheckout", { content_name: name, value: price, currency: "USD" });
    trackGaEvent("begin_checkout", { value: price, currency: "USD", items: 1 });
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId, mode }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok || !data.url) {
        throw new Error(data.error || "Could not open the checkout.");
      }
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      <Button variant={variant} size="lg" className="w-full" disabled={busy} onClick={go}>
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Opening checkout…
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4" /> {label}
          </>
        )}
      </Button>
      {error && <p className="mt-2 text-center text-xs text-red-600">{error}</p>}
    </div>
  );
}
