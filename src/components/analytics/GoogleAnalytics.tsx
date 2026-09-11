"use client";

import { useEffect } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";

const GA_ID = process.env.NEXT_PUBLIC_GA4_ID;
const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/** GA4 event from the browser. No-op when gtag is not loaded, so analytics can never break a checkout. */
export function trackGaEvent(name: string, params?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, params || {});
}

function isMeasuredPath(pathname: string | null): boolean {
  if (!pathname) return true;
  return !pathname.startsWith("/admin") && !pathname.startsWith("/account");
}

// One gtag.js serves GA4 and Google Ads. Renders nothing until an ID is set.
export function GoogleAnalytics() {
  const pathname = usePathname();
  const loaderId = GA_ID || ADS_ID;

  // App Router navigates without a reload; gtag only fires page_view on load.
  useEffect(() => {
    if (!GA_ID || !pathname || !isMeasuredPath(pathname)) return;
    if (typeof window.gtag !== "function") return;
    window.gtag("config", GA_ID, { page_path: pathname });
  }, [pathname]);

  if (!loaderId || !isMeasuredPath(pathname)) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${loaderId}`} strategy="afterInteractive" />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
${GA_ID ? `gtag('config', '${GA_ID}');` : ""}
${ADS_ID ? `gtag('config', '${ADS_ID}');` : ""}`}
      </Script>
    </>
  );
}
