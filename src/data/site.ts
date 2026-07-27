export const SITE = {
  name: "Media Chief",
  domain: "media-chief.com",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://media-chief.com",
  tagline: "Your article in 50 U.S. newspapers — one in every state — within 24h",
  description:
    "Press release distribution service across 50 U.S. newspapers (one in every state) + 37 Facebook pages. 24h delivery, PDF report, permanent links.",
  email: "contact@media-chief.com",
  phone: "+1 (555) 000-0000",
  address: "New York, NY, United States",
  schedule: "Monday – Friday, 9:00 AM – 6:00 PM ET",
  social: {
    facebook: "https://facebook.com/mediachief",
    linkedin: "https://linkedin.com/company/mediachief",
  },
};

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/packages", label: "Packages" },
  { href: "/our-network", label: "Our Network" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export const FOOTER_LINKS = {
  services: [
    { href: "/packages#standard", label: "Standard Packages" },
    { href: "/packages#casino", label: "Casino Packages" },
    { href: "/packages#subscriptions", label: "Monthly Subscriptions" },
    { href: "/offer", label: "Advertorial Offer" },
    { href: "/order", label: "Order an Article" },
  ],
  company: [
    { href: "/about", label: "About Us" },
    { href: "/blog", label: "Blog" },
    { href: "/contact", label: "Contact" },
    { href: "/our-network", label: "Our Network" },
  ],
  legal: [
    { href: "/legal/terms", label: "Terms & Conditions" },
    { href: "/legal/privacy", label: "Privacy Policy" },
    { href: "/legal/cookies", label: "Cookie Policy" },
  ],
};

export const STATS = [
  { value: "50", label: "partner newspapers" },
  { value: "37", label: "Facebook pages" },
  { value: "24h", label: "delivery time" },
  { value: "10k+", label: "articles published" },
];
