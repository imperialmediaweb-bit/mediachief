import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getDb } from "@/db";
import { sourceLabel } from "@/lib/source";
import { ensureSourceColumn } from "@/lib/source-db";
import { ensureVisitTable } from "@/lib/visit-db";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "Admin • Where buyers come from",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface Row {
  source: string | null;
  reached: number;
  started: number;
  orders: number;
  paid: number;
  revenue: number;
}

/**
 * The whole way down, by channel: who arrived at the offer, who began an
 * order, who finished one, and what was banked.
 *
 * Orders alone cannot tell a channel that sends nobody from one that sends
 * plenty of people who then leave. Both show no sales, and only one of them is
 * worth fixing rather than cutting — which is a budget decision made blind
 * until these four columns sit next to each other.
 */
export default async function SourcesPage() {
  if (!getSession()) redirect("/admin/login?from=/admin/sources");

  await Promise.all([ensureSourceColumn(), ensureVisitTable()]);
  const db = getDb();

  const result = await db.execute(sql`
    WITH visits AS (
      SELECT source,
             COUNT(DISTINCT visitor_id) FILTER (WHERE path LIKE '/offer%' OR path LIKE '/packages%') AS reached,
             COUNT(DISTINCT visitor_id) FILTER (WHERE path LIKE '/order%') AS started
        FROM "visit"
       GROUP BY source
    ),
    sales AS (
      SELECT source,
             COUNT(*)::int AS orders,
             COUNT(*) FILTER (WHERE status = 'paid')::int AS paid,
             COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0)::int AS revenue
        FROM "order"
       GROUP BY source
    )
    SELECT COALESCE(v.source, s.source) AS source,
           COALESCE(v.reached, 0)::int  AS reached,
           COALESCE(v.started, 0)::int  AS started,
           COALESCE(s.orders, 0)::int   AS orders,
           COALESCE(s.paid, 0)::int     AS paid,
           COALESCE(s.revenue, 0)::int  AS revenue
      FROM visits v
      -- Postgres refuses a FULL JOIN on IS NOT DISTINCT FROM; COALESCE keeps the null
      -- (untracked) rows matched and is hash-joinable.
      FULL OUTER JOIN sales s ON COALESCE(s.source, '') = COALESCE(v.source, '')
     ORDER BY 6 DESC, 5 DESC, 2 DESC
  `);

  const rows = (result as unknown as { rows?: Row[] }).rows ?? (result as unknown as Row[]);
  const totals = rows.reduce(
    (a, r) => ({
      reached: a.reached + Number(r.reached),
      started: a.started + Number(r.started),
      orders: a.orders + Number(r.orders),
      paid: a.paid + Number(r.paid),
      revenue: a.revenue + Number(r.revenue),
    }),
    { reached: 0, started: 0, orders: 0, paid: 0, revenue: 0 }
  );

  const pct = (part: number, whole: number) =>
    whole > 0 ? `${Math.round((part / whole) * 100)}%` : "—";

  return (
    <AdminShell
      title="Where buyers come from"
      description="Recorded on the visitor's first page and kept for 90 days, so an ad that brought someone back a week later still gets the credit."
    >
      {rows.length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-slate-600">Nothing recorded yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3 text-right">Saw the offer</th>
                <th className="px-4 py-3 text-right">Began an order</th>
                <th className="px-4 py-3 text-right">Ordered</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={`${r.source ?? "none"}-${i}`} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-brand-navy">
                    {r.source ? sourceLabel(r.source) : "Not tracked"}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">{r.reached || "—"}</td>
                  <td className="px-4 py-3 text-right text-slate-600">
                    {r.started || "—"}
                    {r.reached > 0 && r.started > 0 && (
                      <span className="ml-1 text-xs text-slate-400">{pct(r.started, r.reached)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">{r.orders || "—"}</td>
                  <td className="px-4 py-3 text-right font-medium text-brand-navy">
                    {r.paid || "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-brand-navy">
                    {r.revenue ? `$${(r.revenue / 100).toFixed(2)}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-slate-200 bg-slate-50">
              <tr>
                <td className="px-4 py-3 font-semibold text-brand-navy">All channels</td>
                <td className="px-4 py-3 text-right text-slate-600">{totals.reached}</td>
                <td className="px-4 py-3 text-right text-slate-600">{totals.started}</td>
                <td className="px-4 py-3 text-right text-slate-600">{totals.orders}</td>
                <td className="px-4 py-3 text-right font-medium text-brand-navy">{totals.paid}</td>
                <td className="px-4 py-3 text-right font-bold text-brand-navy">
                  ${(totals.revenue / 100).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <div className="mt-4 space-y-1 text-sm text-slate-500">
        <p>
          <strong>Saw the offer</strong> and <strong>Began an order</strong> count people, once a
          day each — a refresh is not a second visitor, and nothing stored identifies anyone.
        </p>
        <p>
          <strong>Not tracked</strong> is an order or visit from before this existed, or from a
          browser that blocks cookies. <strong>Direct</strong> means no referring page: typed,
          bookmarked, or a link from a message or an email.
        </p>
      </div>
    </AdminShell>
  );
}
