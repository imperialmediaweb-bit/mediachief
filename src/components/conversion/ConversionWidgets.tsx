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

function matches(pathname: string, paths: string[]): boolean {
  return paths.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function ConversionBanner() {
  const pathname = usePathname();
  if (!pathname || pathname.startsWith("/admin")) return null;
  if (!matches(pathname, BANNER_PATHS)) return null;
  return <CountdownBanner />;
}

export function ConversionWidgets() {
  const pathname = usePathname();
  if (!pathname || pathname.startsWith("/admin")) return null;
  if (!matches(pathname, COMMERCIAL_PATHS)) return null;
  return (
    <>
      <ExitIntentPopup />
      <StickyMobileCta />
    </>
  );
}
