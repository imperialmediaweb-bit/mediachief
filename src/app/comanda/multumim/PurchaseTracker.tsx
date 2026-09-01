"use client";

import { useEffect, useRef } from "react";
import { trackPurchase } from "@/lib/analytics";

interface PurchaseTrackerProps {
  transactionId: string;
  value: number;
  currency: string;
}

// Ruleaza o singura data per incarcare, ca un refresh sa nu dubleze conversia.
export function PurchaseTracker({
  transactionId,
  value,
  currency,
}: PurchaseTrackerProps) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackPurchase({ transactionId, value, currency });
  }, [transactionId, value, currency]);

  return null;
}
