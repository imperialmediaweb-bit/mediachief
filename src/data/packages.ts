export type PackageCategory = "standard" | "casino";

export interface Package {
  id: string;
  name: string;
  tagline: string;
  price: number;
  currency: "USD";
  newspapers: number;
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
  newspapersPerDistribution: 50;
  priceStandard: number;
  priceCasino: number;
  featured?: boolean;
  description: string;
}

const COMMON_HIGHLIGHTS = [
  "Automatic Facebook distribution",
  "Links delivered within 24h",
  "PDF report with all URLs",
  "Published permanently online",
];

export const STANDARD_PACKAGES: Package[] = [
  {
    id: "local",
    name: "Local",
    tagline: "Single-state coverage",
    price: 150,
    currency: "USD",
    newspapers: 1,
    reach: "1 state newspaper of your choice",
    category: "standard",
    highlights: [
      "1 article in 1 state newspaper (client's choice)",
      "Distribution on the associated Facebook page",
      "Link delivered within 24h",
      "Report with the article URL",
      "Permanently online",
    ],
  },
  {
    id: "regional",
    name: "Regional",
    tagline: "A full region covered",
    price: 500,
    currency: "USD",
    newspapers: 10,
    reach: "10 newspapers from one region (Northeast / Midwest / South / West)",
    category: "standard",
    highlights: [
      "1 article in 10 newspapers from one region",
      "Distribution on the associated Facebook pages",
      "Links delivered within 24h",
      "PDF report with all URLs",
      "Permanently online",
    ],
  },
  {
    id: "national",
    name: "National 50",
    tagline: "Most popular — maximum coverage",
    price: 1500,
    currency: "USD",
    newspapers: 50,
    reach: "50 newspapers — one in every U.S. state",
    category: "standard",
    featured: true,
    badge: "Most popular",
    highlights: [
      "1 article in 50 newspapers (one in every state)",
      "Distribution on 37 Facebook pages",
      "Links delivered within 24h",
      "Complete PDF report",
      "Permanently online",
      "50 SEO backlinks",
    ],
  },
];

export const CASINO_PACKAGES: Package[] = [
  {
    id: "casino-local",
    name: "Casino Local",
    tagline: "iGaming • betting • single state",
    price: 300,
    currency: "USD",
    newspapers: 1,
    reach: "1 state newspaper",
    category: "casino",
    highlights: [
      "1 article in 1 state newspaper",
      "Facebook distribution",
      "Link delivered within 24h + report",
      "Permanently online",
    ],
  },
  {
    id: "casino-regional",
    name: "Casino Regional",
    tagline: "iGaming • betting • one region",
    price: 900,
    currency: "USD",
    newspapers: 10,
    reach: "10 newspapers from one region",
    category: "casino",
    highlights: [
      "1 article in 10 newspapers",
      "Facebook distribution",
      "Links delivered within 24h + report",
      "Permanently online",
    ],
  },
  {
    id: "casino-national",
    name: "Casino National",
    tagline: "iGaming • betting • maximum coverage",
    price: 2500,
    currency: "USD",
    newspapers: 50,
    reach: "50 newspapers — one in every state",
    category: "casino",
    featured: true,
    badge: "Recommended for iGaming",
    highlights: [
      "1 article in 50 newspapers",
      "Distribution on 37 Facebook pages",
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
    newspapersPerDistribution: 50,
    priceStandard: 1300,
    priceCasino: 2300,
    description: "1 article × 50 newspapers per month",
  },
  {
    id: "silver",
    name: "Silver",
    distributionsPerMonth: 2,
    newspapersPerDistribution: 50,
    priceStandard: 2400,
    priceCasino: 4400,
    description: "2 articles × 50 newspapers per month",
  },
  {
    id: "gold",
    name: "Gold",
    distributionsPerMonth: 4,
    newspapersPerDistribution: 50,
    priceStandard: 4500,
    priceCasino: 8500,
    featured: true,
    description: "4 articles × 50 newspapers per month",
  },
  {
    id: "platinum",
    name: "Platinum",
    distributionsPerMonth: 8,
    newspapersPerDistribution: 50,
    priceStandard: 8000,
    priceCasino: 15000,
    description: "8 articles × 50 newspapers per month",
  },
];

export const PRICING_NOTE =
  "The report includes the links and screenshots of the articles published on all 50 sites. Facebook distribution is automatically included in every package, but Facebook page statistics cannot be collected in the report.";

export const SUBSCRIPTION_BENEFITS = [
  "Facebook distribution automatically included",
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
// (/offer-499). These do not appear on /packages next to the full-price tiers.
// ---------------------------------------------------------------------------

export const PROMO_PRICE = 499;
export const PROMO_PRICE_CASINO = 999;
export const PROMO_MONTHLY = 399;
export const PROMO_MONTHLY_CASINO = 799;

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
