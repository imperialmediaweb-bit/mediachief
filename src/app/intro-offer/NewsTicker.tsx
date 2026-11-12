import { NEWSPAPERS } from "@/data/newspapers";

/** 12.11.2026 — a slow, endless strip of the real newspaper names under the hero. */
export function NewsTicker() {
  const names = NEWSPAPERS.map((n) => n.name);
  const row = [...names, ...names];
  return (
    <div className="relative mt-10 overflow-hidden border-y border-white/10 bg-white/[0.03] py-3 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      <style>{`@keyframes mc-ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}@media (prefers-reduced-motion:reduce){.mc-ticker{animation:none!important}}`}</style>
      <div className="mc-ticker flex w-max gap-8 whitespace-nowrap" style={{ animation: "mc-ticker 90s linear infinite" }}>
        {row.map((n, i) => (
          <span key={i} className="flex items-center gap-2 font-serif text-sm font-semibold text-white/70">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-gold" />
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}
