import { findPackageById, pickPrice } from "@/data/packages";
import { NEWSPAPERS } from "@/data/newspapers";
import { stateAbbr } from "@/data/us-states";

export interface ResolvedOrder {
  packageId: string;
  /** Dollars. Computed here from the id, never read from the browser. */
  amount: number;
  label: string;
  description: string;
  /** Comma-separated state abbreviations for a "pick" order, otherwise null. */
  states: string | null;
  newspapers: number | null;
  casino: boolean;
}

/**
 * Turns what the order form posted into the one thing that must not be
 * negotiable — the price. Both the intake route and the payment route go
 * through here, so a buyer cannot set their own amount in either step.
 */
export function resolveOrder(input: {
  packageId: string;
  states?: string[];
  casino?: boolean;
}): ResolvedOrder | null {
  if (input.packageId === "pick") {
    // Only states we actually publish in count, deduplicated.
    const known = new Set(NEWSPAPERS.map((n) => n.state || n.name));
    const chosen = Array.from(new Set(input.states || [])).filter((s) => known.has(s));
    if (chosen.length === 0) return null;

    const casino = Boolean(input.casino);
    const label = `${chosen.length} newspaper${chosen.length === 1 ? "" : "s"}${
      casino ? " (casino / iGaming)" : ""
    }`;
    return {
      packageId: "pick",
      amount: pickPrice(chosen.length, casino),
      label: `Publication in ${label}`,
      description: "One article, a unique version on each newspaper you selected",
      // Stripe caps a metadata value at 500 characters, so store abbreviations.
      states: chosen.map((s) => stateAbbr(s) || s).join(",").slice(0, 490),
      newspapers: chosen.length,
      casino,
    };
  }

  const pkg = findPackageById(input.packageId);
  if (!pkg) return null;
  return {
    packageId: pkg.id,
    amount: pkg.price,
    label: pkg.name,
    description: pkg.reach,
    states: null,
    newspapers: pkg.newspapers,
    casino: pkg.category === "casino",
  };
}
