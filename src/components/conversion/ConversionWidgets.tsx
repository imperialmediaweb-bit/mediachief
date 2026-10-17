"use client";

import { usePathname } from "next/navigation";
import { ExitIntentPopup } from "./ExitIntentPopup";
import { StickyMobileCta } from "./StickyMobileCta";
import { CountdownBanner } from "./CountdownBanner";

const COMMERCIAL_PATHS = [
  "/",
  "/packages",
  "/offer",
  "/order",
  "/our-network",
];

const BANNER_PATHS = ["/packages", "/offer"];

/**
 * Pages where nothing may compete for attention: the buyer has already decided
 * and is filling in the order or paying. An exit-intent popup here talks people
 * out of a purchase they were in the middle of making.
 */
const NO_NUDGE_PATHS = ["/order/pay", "/account", "/order/thank-you"];

function matches(pathname: string, paths: string[]): boolean {
  return paths.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function ConversionBanner() {
  const pathname = usePathname();
  if (!pathname || pathname.startsWith("/admin")) return null;
  if (matches(pathname, NO_NUDGE_PATHS)) return null;
  if (!matches(pathname, BANNER_PATHS)) return null;
  return <CountdownBanner />;
}

export function ConversionWidgets() {
  const pathname = usePathname();
  if (!pathname || pathname.startsWith("/admin")) return null;
  if (matches(pathname, NO_NUDGE_PATHS)) return null;
  if (!matches(pathname, COMMERCIAL_PATHS)) return null;
  return (
    <>
      <ExitIntentPopup />
      <StickyMobileCta />
    </>
  );
}
