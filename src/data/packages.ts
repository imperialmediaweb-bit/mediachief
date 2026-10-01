export type PackageCategory = "standard" | "casino";

export interface Package {
  id: string;
  name: string;
  tagline: string;
  price: number;
  currency: "USD";
  newspapers: number;
  /** What this package costs once the launch period ends. Shown struck through. */
  listPrice?: number;
  reach: string;
  category: PackageCategory;
  featured?: boolean;
  badge?: string;
  highlights: string[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  distributionsPerMonth: number;
  newspapersPerDistribution: number;
  priceStandard: number;
  priceCasino: number;
  /** Post-launch monthly prices, shown struck through. */
  listStandard?: number;
  listCasino?: number;
  featured?: boolean;
  description: string;
}

const COMMON_HIGHLIGHTS = [
  "Submitted to search engines the same day",
  "Links delivered within 24h",
  "PDF report with all URLs",
  "Published permanently online",
];

export const STANDARD_PACKAGES: Package[] = [
  {
    id: "local",
    name: "Local",
    tagline: "Single-state coverage",
    listPrice: 79,
    price: 40,
    currency: "USD",
    newspapers: 1,
    reach: "1 state newspaper of your choice",
    category: "standard",
    highlights: [
      "1 article in 1 state newspaper (client's choice)",
      "Submitted to search engines the same day",
      "Link delivered within 24h",
      "Report with the article URL",
      "Permanently online",
    ],
  },
  {
    id: "regional",
    name: "Regional",
    tagline: "A full region covered",
    listPrice: 189,
    price: 94,
    currency: "USD",
    newspapers: 10,
    reach: "10 newspapers from one region (Northeast / Midwest / South / West)",
    category: "standard",
    highlights: [
      "1 article in 10 newspapers from one region",
      "Submitted to search engines the same day",
      "Links delivered within 24h",
      "PDF report with all URLs",
      "Permanently online",
    ],
  },
  {
    id: "national",
    name: "National 49",
    tagline: "Most popular — maximum coverage",
    listPrice: 299,
    price: 149,
    currency: "USD",
    newspapers: 49,
    reach: "49 newspapers — one in every state we cover",
    category: "standard",
    featured: true,
    badge: "Most popular",
    highlights: [
      "1 article in 49 newspapers (one in every state we cover)",
      "Submitted to search engines the same day",
      "Links delivered within 24h",
      "Complete PDF report",
      "Permanently online",
      "49 SEO backlinks",
    ],
  },
];

export const CASINO_PACKAGES: Package[] = [
  {
    id: "casino-local",
    name: "Casino Local",
    tagline: "iGaming • betting • single state",
    listPrice: 159,
    price: 80,
    currency: "USD",
    newspapers: 1,
    reach: "1 state newspaper",
    category: "casino",
    highlights: [
      "1 article in 1 state newspaper",
      "Submitted to search engines the same day",
      "Link delivered within 24h + report",
      "Permanently online",
    ],
  },
  {
    id: "casino-regional",
    name: "Casino Regional",
    tagline: "iGaming • betting • one region",
    listPrice: 379,
    price: 188,
    currency: "USD",
    newspapers: 10,
    reach: "10 newspapers from one region",
    category: "casino",
    highlights: [
      "1 article in 10 newspapers",
      "Submitted to search engines the same day",
      "Links delivered within 24h + report",
      "Permanently online",
    ],
  },
  {
    id: "casino-national",
    name: "Casino National",
    tagline: "iGaming • betting • maximum coverage",
    listPrice: 599,
    price: 299,
    currency: "USD",
    newspapers: 49,
    reach: "49 newspapers — one in every state we cover",
    category: "casino",
    featured: true,
    badge: "Recommended for iGaming",
    highlights: [
      "1 article in 49 newspapers",
      "Submitted to search engines the same day",
      "Links delivered within 24h",
      "Complete PDF report",
      "Permanently online",
    ],
  },
];

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "bronze",
    name: "Bronze",
    distributionsPerMonth: 1,
    newspapersPerDistribution: 49,
    priceStandard: 129,
    priceCasino: 259,
    listStandard: 259,
    listCasino: 519,
    description: "1 article × 49 newspapers per month",
  },
  {
    id: "silver",
    name: "Silver",
    distributionsPerMonth: 2,
    newspapersPerDistribution: 49,
    priceStandard: 239,
    priceCasino: 479,
    listStandard: 479,
    listCasino: 959,
    description: "2 articles × 49 newspapers per month",
  },
  {
    id: "gold",
    name: "Gold",
    distributionsPerMonth: 4,
    newspapersPerDistribution: 49,
    priceStandard: 449,
    priceCasino: 899,
    listStandard: 899,
    listCasino: 1799,
    featured: true,
    description: "4 articles × 49 newspapers per month",
  },
  {
    id: "platinum",
    name: "Platinum",
    distributionsPerMonth: 8,
    newspapersPerDistribution: 49,
    priceStandard: 799,
    priceCasino: 1599,
    listStandard: 1599,
    listCasino: 3199,
    description: "8 articles × 49 newspapers per month",
  },
];

export const PRICING_NOTE =
  "The report includes the links and screenshots of the articles published on all 49 sites.";

export const SUBSCRIPTION_BENEFITS = [
  "Every article submitted to search engines",
  "Consolidated monthly PDF report",
  "Publishing priority",
  "Dedicated subscription support",
];

export function getAllPackages(): Package[] {
  return [...STANDARD_PACKAGES, ...CASINO_PACKAGES];
}

export function findPackageById(id: string): Package | undefined {
  return [...getAllPackages(), ...PROMO_PACKAGES].find((p) => p.id === id);
}

export function findSubscriptionPlanById(id: string): SubscriptionPlan | undefined {
  return [...SUBSCRIPTION_PLANS, ...PROMO_SUBSCRIPTION_PLANS].find((p) => p.id === id);
}

// ---------------------------------------------------------------------------
// Introductory offer — sold only through the dedicated landing page
// (/intro-offer) and shown on /packages as a limited offer for new clients.
// ---------------------------------------------------------------------------

export const PROMO_PRICE = 149;
export const PROMO_PRICE_CASINO = 299;
export const PROMO_MONTHLY = 129;
export const PROMO_MONTHLY_CASINO = 259;

export const PROMO_PACKAGES: Package[] = [
  {
    id: "promo-49",
    name: "Intro offer — the whole network",
    tagline: "Limited offer — nationwide coverage",
    price: PROMO_PRICE,
    currency: "USD",
    newspapers: 49,
    reach: "One newspaper in every state we cover",
    category: "standard",
    highlights: [
      "1 article across the whole network",
      "A unique version on every site — no duplicate content",
      "Links delivered within 1 business day",
      "The full list of links, in PDF and Excel",
      "Permanently online",
    ],
  },
  {
    id: "promo-49-casino",
    name: "Intro offer — casino / iGaming",
    tagline: "Limited offer — iGaming content",
    price: PROMO_PRICE_CASINO,
    currency: "USD",
    newspapers: 49,
    reach: "One newspaper in every state we cover",
    category: "casino",
    highlights: [
      "1 article across the whole network",
      "Compliance review for gambling content",
      "Links delivered within 1 business day",
      "The full list of links, in PDF and Excel",
      "Permanently online",
    ],
  },
];

// Cheaper than the one-time price — the reason to subscribe.
export const PROMO_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "promo-monthly",
    name: "Intro Monthly",
    distributionsPerMonth: 1,
    newspapersPerDistribution: 50,
    priceStandard: PROMO_MONTHLY,
    priceCasino: PROMO_MONTHLY_CASINO,
    description: "1 article across the whole network, every month — intro price",
  },
];

// Rolling deadline for the intro offer: the first one is 25 September (end
// of day, Eastern), then every 14 days, never past 31 December. The page
// revalidates hourly, so the label rolls over on its own.
export const PROMO_ROLLING = {
  anchorIso: "2026-09-25T23:59:59-04:00",
  periodDays: 14,
  hardEndIso: "2026-12-31T23:59:59-05:00",
};

export function currentPromoDeadline(now: number = Date.now()): Date | null {
  const anchor = new Date(PROMO_ROLLING.anchorIso).getTime();
  const hardEnd = new Date(PROMO_ROLLING.hardEndIso).getTime();
  if (now >= hardEnd) return null;
  const period = PROMO_ROLLING.periodDays * 86_400_000;
  let t = anchor;
  while (t <= now) t += period;
  return new Date(Math.min(t, hardEnd));
}

/** "September 25" — the current deadline, or null once the offer has ended. */
export function promoDeadlineLabel(now: number = Date.now()): string | null {
  const d = currentPromoDeadline(now);
  if (!d) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    timeZone: "America/New_York",
  }).format(d);
}

// ---------------------------------------------------------------------------
// Pick-your-own: the client chooses the newspapers, the price drops as the
// selection grows, and the whole network is never more than the intro price.
// The UI shows this and the checkout API recomputes it — the browser is never
// trusted with a price.
// ---------------------------------------------------------------------------

export const PICK_FIRST = 40;
export const PICK_FIRST_CASINO = 80;
export const PICK_EACH_MORE = 6;
export const PICK_EACH_MORE_CASINO = 12;

/** What `count` newspapers cost, capped at the whole-network intro price. */
export function pickPrice(count: number, casino = false): number {
  const n = Math.max(0, Math.floor(count));
  if (n === 0) return 0;
  const first = casino ? PICK_FIRST_CASINO : PICK_FIRST;
  const step = casino ? PICK_EACH_MORE_CASINO : PICK_EACH_MORE;
  const cap = casino ? PROMO_PRICE_CASINO : PROMO_PRICE;
  return Math.min(cap, first + (n - 1) * step);
}

/** The smallest selection that already costs the whole-network price. */
export function pickCapAt(casino = false): number {
  const first = casino ? PICK_FIRST_CASINO : PICK_FIRST;
  const step = casino ? PICK_EACH_MORE_CASINO : PICK_EACH_MORE;
  const cap = casino ? PROMO_PRICE_CASINO : PROMO_PRICE;
  return Math.ceil((cap - first) / step) + 1;
}
