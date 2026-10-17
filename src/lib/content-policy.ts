/**
 * The content declaration a buyer ticks before paying.
 *
 * The question has to be asked before any money moves, and the answer has to
 * stay on the order: if the declaration is false, the order is cancelled and
 * the amount is not refunded. One text, imported everywhere it appears, so it
 * cannot drift from page to page.
 */
export const CONTENT_DECLARATION =
  "I confirm the article does not present causes, treatments or cures for diseases " +
  "(cancer, chronic or serious conditions) and does not promote medicines, supplements " +
  "or therapies as an alternative to medical treatment.";

export const CONTENT_DECLARATION_ERROR =
  "Tick the content declaration to continue.";

export const CONTENT_DECLARATION_WARNING =
  "If the declaration turns out to be untrue, the order is cancelled, the article is taken down and the amount paid is not refunded.";

/**
 * Screening the submitted text before any money moves.
 *
 * This is not a censor and it is not decoration. Two separate risks make it
 * worth running at the order step:
 *
 * 1. Stripe's prohibited-business rules. Cannabis, adult services, fake
 *    documents and guaranteed-return schemes are not merely awkward orders —
 *    processing one puts the Stripe account at risk, and the whole business
 *    collects through that single account. These are refused outright, with a
 *    note to contact us instead, because a payment that must be unwound costs
 *    far more than an order we never took.
 *
 * 2. Medical claims. A disease named next to a promise of a cure is the kind
 *    of article that cannot be published once it is read properly. Caught
 *    before the card, a "no" costs an email; caught after, it is a refund.
 *
 * Since the order form collects the article before payment, this runs at
 * exactly the right moment: nothing has been charged yet.
 */

/**
 * Categories we cannot put through Stripe at all. One match is enough: there
 * is no innocent version of an article selling fake diplomas or steroids. The
 * list stays short and concrete — it covers what actually turns up in a paid
 * press release, not the whole penal code.
 */
const PROHIBITED: { term: string; reason: string }[] = [
  // Cannabis and related — prohibited by Stripe regardless of state law.
  { term: "cannabis", reason: "cannabis and related products" },
  { term: "marijuana", reason: "cannabis and related products" },
  { term: "dispensary", reason: "cannabis and related products" },
  { term: "cbd ", reason: "cannabis and related products" },
  { term: "thc", reason: "cannabis and related products" },
  { term: "delta-8", reason: "cannabis and related products" },
  { term: "delta 8", reason: "cannabis and related products" },
  { term: "kratom", reason: "cannabis and related products" },
  { term: "psilocybin", reason: "controlled substances" },
  // Performance and controlled substances.
  { term: "anabolic steroid", reason: "controlled substances" },
  { term: "steroids for sale", reason: "controlled substances" },
  { term: "sarms", reason: "controlled substances" },
  // Forged documents.
  { term: "fake diploma", reason: "forged documents" },
  { term: "fake degree", reason: "forged documents" },
  { term: "fake id", reason: "forged documents" },
  { term: "fake passport", reason: "forged documents" },
  { term: "novelty diploma", reason: "forged documents" },
  { term: "counterfeit", reason: "counterfeit goods" },
  { term: "replica watches", reason: "counterfeit goods" },
  // Adult services.
  { term: "escort service", reason: "adult services" },
  { term: "escorts", reason: "adult services" },
  // Surveillance and intrusion.
  { term: "spy on your spouse", reason: "unlawful surveillance" },
  { term: "phone spy", reason: "unlawful surveillance" },
  { term: "password cracking", reason: "unlawful access" },
  { term: "cloned card", reason: "financial crime" },
  // Weapons Stripe will not process.
  { term: "ghost gun", reason: "restricted weapons" },
  { term: "untraceable firearm", reason: "restricted weapons" },
  // Financial promises that are, by construction, false.
  { term: "guaranteed return", reason: "guaranteed-return scheme" },
  { term: "guaranteed profit", reason: "guaranteed-return scheme" },
  { term: "double your money", reason: "guaranteed-return scheme" },
  { term: "risk-free investment", reason: "guaranteed-return scheme" },
  { term: "get rich quick", reason: "guaranteed-return scheme" },
];

/**
 * Medical screening needs two signals, not one. "Treatment" on its own is
 * ordinary — a dental clinic treats people. A named disease *plus* a promise
 * of curing it is the pattern that has to be read by a human.
 */
const DISEASE = [
  "cancer", "tumor", "tumour", "metastat", "leukemia", "hiv", "aids",
  "diabetes", "sclerosis", "alzheimer", "hepatitis", "psoriasis", "parkinson",
  "autism", "epilepsy",
];

const CURE_CLAIM = [
  "cure", "cures", "curing", "heal", "heals", "healing", "reverse",
  "reverses", "eliminate", "miracle", "alternative to chemotherapy",
  "without chemotherapy", "alkaline water", "detox protocol", "natural remedy",
];

export interface ContentScreening {
  /** We cannot take this through Stripe — refuse the order. */
  blocked: boolean;
  /** Publishable only after a human reads it — alert, do not auto-publish. */
  flagged: boolean;
  /** The terms that matched, so the alert says what tripped it. */
  hits: string[];
  /** Why, in words, for the alert and for the order notes. */
  reason: string | null;
}

export function screenContent(...parts: (string | null | undefined)[]): ContentScreening {
  // Pad the ends so a term written with a trailing space ("cbd ") still
  // matches a word that sits at the very start or end of the text.
  const text = ` ${parts.filter(Boolean).join("\n").toLowerCase()} `;

  const prohibited = PROHIBITED.filter((p) => text.includes(p.term));
  if (prohibited.length) {
    return {
      blocked: true,
      flagged: true,
      hits: prohibited.map((p) => p.term),
      reason: Array.from(new Set(prohibited.map((p) => p.reason))).join(", "),
    };
  }

  const diseases = DISEASE.filter((w) => text.includes(w));
  const claims = CURE_CLAIM.filter((w) => text.includes(w));
  const flagged = diseases.length > 0 && claims.length > 0;

  return {
    blocked: false,
    flagged,
    hits: flagged ? [...diseases, ...claims] : [],
    reason: flagged ? "medical content (a named disease alongside a promise to cure it)" : null,
  };
}

/** Shown to the buyer when we refuse the order. Says what to do next. */
export const PROHIBITED_MESSAGE =
  "We cannot accept this subject through card payment. Our payment provider prohibits it, " +
  "whatever the law in your state. Email us and we will tell you honestly whether we can " +
  "publish it another way.";
