/**
 * How fast an order is published across the network.
 *
 * The buyer chooses it, because the ends of the range serve different aims:
 * everything inside half an hour is the loudest possible moment, and a few
 * papers a day reads like coverage building on its own and keeps the story
 * turning up in search for weeks.
 *
 * Two numbers, not one: the same fifty newspapers are sold both as "inside
 * half an hour" and as "five a day for ten days", and those differ in the gap
 * between runs, not in the size of a run. The network stores the same pair and
 * its cron walks due orders, so the pace runs without anybody pressing a
 * button — which is what makes it a service rather than a promise.
 */
export interface PaceOption {
  /** Newspapers in one run. */
  perRun: number;
  /** Minutes to wait before the next run. */
  everyMinutes: number;
  label: string;
  text: string;
}

export const PACES: PaceOption[] = [
  {
    perRun: 10,
    everyMinutes: 5,
    label: "Inside 30 minutes",
    text: "All fifty newspapers within half an hour. The loudest possible moment, and the right choice when the news has a date on it: a launch, an award, a funding round.",
  },
  {
    perRun: 5,
    everyMinutes: 6,
    label: "Over one hour",
    text: "Spread across the hour. Still a single news event, with the papers arriving one after another rather than all in the same minute.",
  },
  {
    perRun: 5,
    everyMinutes: 12,
    label: "Over two hours",
    text: "A morning of coverage. Reads like the story travelling rather than like fifty papers publishing at once.",
  },
  {
    perRun: 5,
    everyMinutes: 18,
    label: "Over three hours",
    text: "Half a working day. The most natural of the same-day options — nobody looking at it would guess the timing was bought.",
  },
  {
    perRun: 10,
    everyMinutes: 60 * 24,
    label: "10 a day — about 5 days",
    text: "A steady week. Loud enough to notice, spread enough that it does not look like one afternoon's work.",
  },
  {
    perRun: 5,
    everyMinutes: 60 * 24,
    label: "5 a day — about 10 days",
    text: "Reads like the press picking the story up on its own, and keeps you surfacing in search results for longer.",
  },
];

export const DEFAULT_PACE = PACES[0]!;

export function paceFor(
  perRun: number | null | undefined,
  everyMinutes: number | null | undefined
): PaceOption {
  return (
    PACES.find((p) => p.perRun === perRun && p.everyMinutes === everyMinutes) || DEFAULT_PACE
  );
}

/** True when this pair is one we offer, rather than a number someone invented. */
export function isOfferedPace(
  perRun: number | null | undefined,
  everyMinutes: number | null | undefined
): boolean {
  return PACES.some((p) => p.perRun === perRun && p.everyMinutes === everyMinutes);
}

/** Plain words for the admin. */
export function paceLabel(
  perRun: number | null | undefined,
  everyMinutes: number | null | undefined
): string {
  if (!perRun || !everyMinutes) return "By hand — no pace chosen";
  const known = PACES.find((p) => p.perRun === perRun && p.everyMinutes === everyMinutes);
  if (known) return known.label;

  const totalMinutes = Math.ceil(50 / perRun) * everyMinutes;
  if (totalMinutes < 90) return `${perRun} at a time, every ${everyMinutes} min`;
  if (totalMinutes < 60 * 36) return `${perRun} at a time, over about ${Math.round(totalMinutes / 60)} hours`;
  return `${perRun} at a time, over about ${Math.round(totalMinutes / (60 * 24))} days`;
}
