"use client";

import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { NEWSPAPERS, TOTAL_NEWSPAPERS, type Newspaper } from "@/data/newspapers";
import { US_TILE_GRID, ABBR_TO_STATE, stateAbbr } from "@/data/us-states";

interface CoverageMapProps {
  /** Show the domain and let a tile open the site. Off for public pages. */
  links?: boolean;
  className?: string;
}

function bareDomain(url?: string): string {
  if (!url) return "";
  return url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
}

/**
 * Interactive coverage map: one square per state, filled where the network has
 * a newspaper. Hover or focus reads out the paper below the grid; clicking a
 * covered state pins it (and opens the site when `links` is on).
 */
export function CoverageMap({ links = false, className = "" }: CoverageMapProps) {
  const byAbbr = useMemo(() => {
    const m = new Map<string, Newspaper>();
    for (const paper of NEWSPAPERS) {
      const abbr = stateAbbr(paper.state);
      if (abbr) m.set(abbr, paper);
    }
    return m;
  }, []);

  const [hovered, setHovered] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);

  const active = hovered || pinned;
  const activePaper = active ? byAbbr.get(active) : undefined;
  const activeName = active ? ABBR_TO_STATE[active] || active : "";

  return (
    <div className={className}>
      <div
        className="grid gap-1 sm:gap-1.5"
        style={{ gridTemplateColumns: "repeat(12, minmax(0, 1fr))" }}
        onMouseLeave={() => setHovered(null)}
        role="group"
        aria-label={`Coverage map — ${TOTAL_NEWSPAPERS} states covered`}
      >
        {US_TILE_GRID.flatMap((row, r) =>
          row.map((abbr, c) => {
            if (!abbr) return <div key={`${r}-${c}`} aria-hidden="true" />;

            const paper = byAbbr.get(abbr);
            const covered = Boolean(paper);
            const isActive = active === abbr;
            const stateName = ABBR_TO_STATE[abbr] || abbr;

            const base =
              "flex aspect-square items-center justify-center rounded-[3px] font-mono font-semibold leading-none transition-colors";
            const look = covered
              ? isActive
                ? "bg-brand-gold text-brand-navy"
                : "bg-brand-navy text-white hover:bg-brand-red"
              : "border border-dashed border-slate-300 bg-slate-50 text-slate-400";

            return (
              <button
                key={abbr}
                type="button"
                className={`${base} ${look}`}
                style={{ fontSize: "clamp(7px, 1.1vw, 11px)" }}
                onMouseEnter={() => setHovered(abbr)}
                onFocus={() => setHovered(abbr)}
                onBlur={() => setHovered(null)}
                onClick={() => {
                  setPinned(abbr);
                  if (links && paper?.url) window.open(paper.url, "_blank", "noopener");
                }}
                aria-label={
                  covered
                    ? `${stateName} — ${paper!.name}${links && paper!.url ? `, opens ${bareDomain(paper!.url)}` : ""}`
                    : `${stateName} — no newspaper yet`
                }
                aria-pressed={pinned === abbr}
              >
                {abbr}
              </button>
            );
          })
        )}
      </div>

      {/* Readout: fixed height so hovering never shifts the page. */}
      <div className="mt-4 flex min-h-[3.5rem] items-center rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        {activePaper ? (
          <div className="min-w-0">
            <p className="truncate font-serif text-base font-bold text-brand-navy">
              {activePaper.name}
            </p>
            <p className="truncate text-xs text-slate-500">
              {activeName} · {activePaper.region}
              {links && activePaper.url && (
                <>
                  {" · "}
                  <a
                    href={activePaper.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-brand-red hover:underline"
                  >
                    {bareDomain(activePaper.url)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </>
              )}
            </p>
          </div>
        ) : active ? (
          <p className="text-sm text-slate-500">
            <strong className="text-brand-navy">{activeName}</strong> — no newspaper here yet.
          </p>
        ) : (
          <p className="text-sm text-slate-500">
            Hover or tap a state to see its newspaper.
          </p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-[2px] bg-brand-navy" />
          {TOTAL_NEWSPAPERS} states covered
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-[2px] border border-dashed border-slate-300 bg-slate-50" />
          no newspaper yet
        </span>
        <span className="text-slate-400">DC is shown for orientation only.</span>
      </div>
    </div>
  );
}
