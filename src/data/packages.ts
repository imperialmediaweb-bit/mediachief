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
  name: "Bronze" | "Silver" | "Gold" | "Platinum";
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
  return getAllPackages().find((p) => p.id === id);
}
