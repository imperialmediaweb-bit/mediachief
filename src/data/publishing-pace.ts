/**
 * How long until the whole network has the article.
 *
 * The buyer picks a duration, not a rate: "everything within the hour" is what
 * somebody buying publicity actually has an opinion about, while "five a day"
 * is our side of the arithmetic. Both ends of the range are real choices —
 * everything at once is the loudest possible moment, and two weeks reads like
 * the press finding the story on its own and keeps it surfacing in search long
 * after a single day would have gone quiet.
 *
 * Stored as two numbers: newspapers in one run, and minutes before the next.
 * The network keeps the same pair and its cron advances due orders, so the
 * choice is what happens rather than what was promised.
 *
 * Every gap is a multiple of five, because the cron is the heartbeat and it
 * ticks every five minutes. A gap of six would wait for the tick at ten, and
 * the hour the buyer was promised would quietly become an hour and a half.
 */
export interface PaceOption {
  /** Newspapers in one run. Twelve is the most a single run finishes safely. */
  perRun: number;
  /** Minutes before the next run. A multiple of 5. */
  everyMinutes: number;
  label: string;
  text: string;
}

export const PACES: PaceOption[] = [
  {
    perRun: 5,
    everyMinutes: 5,
    label: "Within the hour",
    text: "All fifty newspapers inside an hour — as fast as the network goes. What you want when the news has a date on it: a launch, an award, a funding round.",
  },
  {
    perRun: 5,
    everyMinutes: 20,
    label: "Over three hours",
    text: "Half a working day. Still a single news event, but it builds while people are watching instead of landing in one burst.",
  },
  {
    perRun: 5,
    everyMinutes: 80,
    label: "Over twelve hours",
    text: "Morning to evening. Reads like the story travelling between newsrooms rather than like an announcement being distributed.",
  },
  {
    perRun: 5,
    everyMinutes: 480,
    label: "Over three days",
    text: "Three days, which is how a story that genuinely interests editors tends to spread. Good when you would rather look found than placed.",
  },
  {
    perRun: 2,
    everyMinutes: 840,
    label: "Over two weeks",
    text: "Two papers every half a day for a fortnight. The slowest and the longest-lived: you stay in search results for weeks instead of peaking once.",
  },
];

export const DEFAULT_PACE = PACES[0]!;

/** Roughly how long from the first run to the last, in minutes. */
export function paceTotalMinutes(perRun: number, everyMinutes: number): number {
  return Math.max(0, Math.ceil(50 / perRun) - 1) * everyMinutes;
}

export function paceFor(
  perRun: number | null | undefined,
  everyMinutes: number | null | undefined
): PaceOption {
  return PACES.find((p) => p.perRun === perRun && p.everyMinutes === everyMinutes) || DEFAULT_PACE;
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

  // A pace from an older order, or one set by hand. Say what it means rather
  // than printing two numbers nobody can read at a glance.
  const total = paceTotalMinutes(perRun, everyMinutes);
  const span =
    total < 90
      ? `${total} minutes`
      : total < 60 * 36
        ? `${Math.round(total / 60)} hours`
        : `${Math.round(total / (60 * 24))} days`;
  return `${perRun} at a time, over about ${span}`;
}
