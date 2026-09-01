"use client";

import Script from "next/script";

const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;
const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;

// Un singur gtag.js deserveste si GA4, si Google Ads. Daca nu e setat
// niciun ID, componenta nu incarca nimic (dev / preview).
export function GoogleAnalytics() {
  const loaderId = GA4_ID || ADS_ID;
  if (!loaderId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${loaderId}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
${GA4_ID ? `gtag('config', '${GA4_ID}');` : ""}
${ADS_ID ? `gtag('config', '${ADS_ID}');` : ""}`}
      </Script>
    </>
  );
}
