import { SITE } from "@/data/site";

/** "The company billing you" — shown where a buyer is about to pay. */
export function CompanyDetails({ dark = false, className = "" }: { dark?: boolean; className?: string }) {
  const l = SITE.legal;
  if (!l) return null;
  const box = dark ? "rounded-xl border border-white/15 bg-white/5 p-5" : "rounded-xl border border-slate-200 bg-slate-50 p-5";
  const label = dark ? "text-white/50" : "text-slate-500";
  const value = dark ? "font-semibold text-white" : "font-semibold text-brand-navy";
  return (
    <div className={`${box} ${className}`}>
      <h3 className={`text-xs font-semibold uppercase tracking-wider ${label}`}>The company billing you</h3>
      <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-[auto_1fr]">
        <dt className={label}>Company</dt>
        <dd className={value}>{l.companyName}</dd>
        <dt className={label}>Registration</dt>
        <dd className={value}>{l.registration}</dd>
        <dt className={label}>Address</dt>
        <dd className={value}>{l.address}</dd>
      </dl>
      {l.note && <p className={`mt-3 text-xs ${label}`}>{l.note}</p>}
    </div>
  );
}
