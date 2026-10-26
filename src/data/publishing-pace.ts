/**
 * How fast an order is published across the network.
 *
 * The buyer chooses it, because the two ends of the range serve different
 * aims: everything in one day is the loudest possible moment, and a few papers
 * a day reads like coverage building on its own and keeps the story turning up
 * in search for weeks. The value stored is newspapers per day, so the number
 * means the same thing to the form, the admin and the network.
 */
export interface PaceOption {
  perDay: number;
  label: string;
  text: string;
}

export const PACES: PaceOption[] = [
  {
    perDay: 50,
    label: "All at once — within 24 hours",
    text: "Every newspaper on the same day. The strongest single moment, and the right choice when the news has a date on it: a launch, an award, a funding round.",
  },
  {
    perDay: 10,
    label: "10 a day — about 5 days",
    text: "A steady week of coverage. Loud enough to notice, spread enough that it does not look bought on one afternoon.",
  },
  {
    perDay: 5,
    label: "5 a day — about 10 days",
    text: "Reads like the press picking the story up on its own, and keeps you surfacing in search results for longer.",
  },
];

export const DEFAULT_PACE = 50;

export function paceFor(perDay: number | null | undefined): PaceOption {
  return PACES.find((p) => p.perDay === perDay) || PACES[0]!;
}

/** Plain words for the admin and the receipt. */
export function paceLabel(perDay: number | null | undefined): string {
  if (!perDay || perDay >= 50) return "All at once, within 24 hours";
  return `${perDay} newspapers a day — about ${Math.ceil(50 / perDay)} days`;
}
