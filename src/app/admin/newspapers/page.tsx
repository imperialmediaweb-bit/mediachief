import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { NEWSPAPERS, REGION_COUNTS } from "@/data/newspapers";
import { LogoutButton } from "./LogoutButton";

export const metadata: Metadata = {
  title: "Admin • Newspapers",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminNewspapersPage() {
  const session = getSession();
  if (!session) redirect("/admin/login?from=/admin/newspapers");

  const byRegion = {
    Northeast: NEWSPAPERS.filter((n) => n.region === "Northeast"),
    Midwest: NEWSPAPERS.filter((n) => n.region === "Midwest"),
    South: NEWSPAPERS.filter((n) => n.region === "South"),
    West: NEWSPAPERS.filter((n) => n.region === "West"),
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Logo />
            <span className="rounded-full bg-brand-red/10 px-3 py-1 text-xs font-semibold text-brand-red">
              Admin Panel
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-600">Hi, {session.username}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="container py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-brand-navy">Newspaper list</h1>
            <p className="mt-2 text-sm text-slate-600">
              The complete network of partner newspapers — <strong>confidential, not publicly
              exposed</strong>. Total: <strong>{NEWSPAPERS.length} newspapers</strong>.
            </p>
          </div>
          <Link
            href="/"
            className="text-sm text-brand-red hover:underline"
          >
            ← Back to site
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <StatPill label="Northeast" value={REGION_COUNTS.Northeast} tone="gold" />
          <StatPill label="Midwest" value={REGION_COUNTS.Midwest} />
          <StatPill label="South" value={REGION_COUNTS.South} />
          <StatPill label="West" value={REGION_COUNTS.West} />
        </div>

        <div className="mt-10 space-y-8">
          {Object.entries(byRegion).map(([region, items]) => (
            <section key={region}>
              <h2 className="font-serif text-xl font-semibold text-brand-navy">
                {region} <span className="text-sm font-normal text-slate-500">({items.length})</span>
              </h2>
              <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Newspaper</th>
                      <th className="px-4 py-3 text-left">State</th>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-left">URL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((n, i) => (
                      <tr key={`${n.name}-${i}`} className="border-t border-slate-100">
                        <td className="px-4 py-3 font-medium text-brand-navy">{n.name}</td>
                        <td className="px-4 py-3 text-slate-600">{n.state || "—"}</td>
                        <td className="px-4 py-3 text-slate-600">{n.type}</td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                          {n.url || <span className="text-slate-400">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm text-amber-900">
            <strong>Security:</strong> This page is blocked in <code>robots.txt</code> and carries
            a <code>noindex, nofollow</code> meta tag. Do NOT share screenshots of this page and do
            not add links to it in public content. Our network is protected by anonymity.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "gold";
}) {
  return (
    <div
      className={`rounded-lg border bg-white p-4 ${
        tone === "gold" ? "border-brand-gold/50 bg-brand-gold/5" : "border-slate-200"
      }`}
    >
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1 font-serif text-3xl font-bold text-brand-navy">{value}</div>
    </div>
  );
}
