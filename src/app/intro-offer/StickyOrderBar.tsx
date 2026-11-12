"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { trackGaEvent } from "@/components/analytics/GoogleAnalytics";

/**
 * 12.11.2026 — on phones the page is long; once the price box has scrolled out
 * of view, a slim bar keeps the order button one tap away.
 */
export function StickyOrderBar({ price, count }: { price: string; count: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const target = document.getElementById("offer");
    if (!target) return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting), { threshold: 0 });
    io.observe(target);
    return () => io.disconnect();
  }, []);
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-brand-navy/95 px-4 py-3 pr-20 backdrop-blur transition-transform duration-300 md:hidden ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <a
        href="/order?package=promo-49"
        onClick={() => trackGaEvent("sticky_order_click", { price })}
        className="flex items-center justify-between gap-3 rounded-xl bg-brand-gold px-4 py-3 font-bold text-brand-navy shadow-lg"
      >
        <span className="text-sm leading-tight">
          {count} US newspapers
          <span className="block text-lg">{price}</span>
        </span>
        <span className="flex items-center gap-1 text-base">
          Order now <ArrowRight className="h-5 w-5" />
        </span>
      </a>
    </div>
  );
}
