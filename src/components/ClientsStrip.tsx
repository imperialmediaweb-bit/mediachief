import fs from "node:fs";
import path from "node:path";
import { CLIENTS } from "@/data/clients";

function isLink(v?: string): boolean {
  return !!v && /^https?:\/\//.test(v);
}

function logoExists(file?: string): boolean {
  if (!file) return false;
  if (isLink(file)) return true;
  try {
    return fs.existsSync(path.join(process.cwd(), "public", "clients", file));
  } catch {
    return false;
  }
}

// "Published through Media Chief" — logos only. A client without a logo file
// is skipped rather than shown as bare text.
export function ClientsStrip({ className = "" }: { className?: string }) {
  const shown = CLIENTS.filter((c) => logoExists(c.logo));
  if (shown.length === 0) return null;

  return (
    <section className={`border-b border-slate-200 bg-white ${className}`} aria-label="Clients">
      <div className="container py-8">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Published through Media Chief
        </p>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-3 md:gap-4">
          {shown.map((c) => {
            const img = (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={isLink(c.logo) ? c.logo : `/clients/${c.logo}`}
                alt={c.name}
                title={c.note ? `${c.name} — ${c.note}` : c.name}
                loading="lazy"
                className="h-9 w-auto max-w-[150px] object-contain md:h-10"
              />
            );
            return (
              <li
                key={c.name}
                className={`flex h-16 items-center justify-center rounded-xl border px-5 shadow-sm ${
                  c.darkCard ? "border-brand-navy bg-brand-navy" : "border-slate-200 bg-white"
                }`}
              >
                {c.site ? (
                  <a href={c.site} target="_blank" rel="noopener noreferrer nofollow">
                    {img}
                  </a>
                ) : (
                  img
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
