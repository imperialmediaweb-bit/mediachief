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
 * A one-off package goes to /order first: the buyer writes the article, then
 * pays. Paying up front and being asked for the article afterwards meant
 * paying for a promise, and the article often never arrived.
 *
 * A subscription still opens Stripe directly — there is no single article to
 * collect, the allowance refills every month.
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

    if (mode === "package") {
      window.location.href = `/order?package=${encodeURIComponent(packageId)}`;
      return;
    }

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
            <Loader2 className="h-4 w-4 animate-spin" />{" "}
            {mode === "package" ? "Opening the order form…" : "Opening checkout…"}
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
