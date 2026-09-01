import { trackPixelEvent } from "@/components/analytics/MetaPixel";

const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
const LEAD_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL;
const ORDER_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_ORDER_LABEL;
const PURCHASE_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL;

const CURRENCY = "RON";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

type EventParams = Record<string, unknown>;

function gtagEvent(name: string, params: EventParams = {}) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", name, params);
}

// Conversiile Google Ads au nevoie de ID-ul contului + eticheta conversiei.
// Fara ele evenimentul GA4 se trimite oricum, doar conversia Ads e sarita.
function adsConversion(label: string | undefined, params: EventParams = {}) {
  if (!ADS_ID || !label) return;
  gtagEvent("conversion", { send_to: `${ADS_ID}/${label}`, ...params });
}

/** Lead: cineva si-a lasat emailul (lista de ziare, formular de contact). */
export function trackLead(source: string, value?: number) {
  trackPixelEvent("Lead", {
    content_name: source,
    ...(value ? { value, currency: CURRENCY } : {}),
  });
  gtagEvent("generate_lead", {
    event_label: source,
    ...(value ? { value, currency: CURRENCY } : {}),
  });
  adsConversion(LEAD_LABEL, value ? { value, currency: CURRENCY } : {});
}

/** Comanda trimisa prin formular — intentie ferma, dar inca neplatita. */
export function trackOrderSubmitted(args: {
  packageId: string;
  packageName: string;
  value?: number;
}) {
  const { packageId, packageName, value } = args;
  const money = value ? { value, currency: CURRENCY } : {};

  trackPixelEvent("InitiateCheckout", {
    content_name: packageName,
    content_ids: [packageId],
    content_type: "product",
    ...money,
  });
  gtagEvent("begin_checkout", {
    items: [{ item_id: packageId, item_name: packageName }],
    ...money,
  });
  adsConversion(ORDER_LABEL, money);
}

/** Plata confirmata de Stripe — singurul eveniment cu bani reali in spate. */
export function trackPurchase(args: {
  transactionId: string;
  value: number;
  currency?: string;
}) {
  const { transactionId, value } = args;
  const currency = args.currency || CURRENCY;

  trackPixelEvent("Purchase", { value, currency }, transactionId);
  gtagEvent("purchase", { transaction_id: transactionId, value, currency });
  adsConversion(PURCHASE_LABEL, {
    value,
    currency,
    transaction_id: transactionId,
  });
}
