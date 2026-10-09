import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getDb } from "@/db";
import { articles, orders, users } from "@/db/schema";
import { findPackageById } from "@/data/packages";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatusBadge } from "@/components/account/StatusBadge";

export const metadata: Metadata = {
  title: "Admin • Orders",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const session = getSession();
  if (!session) redirect("/admin/login?from=/admin/orders");

  const db = getDb();
  const [rows, totals] = await Promise.all([
    db
      .select({
        id: orders.id,
        email: orders.email,
        packageId: orders.packageId,
        amount: orders.amount,
        status: orders.status,
        createdAt: orders.createdAt,
        paidAt: orders.paidAt,
        included: orders.articlesIncluded,
        used: orders.articlesUsed,
        states: orders.newspaperStates,
        sessionId: orders.stripeSessionId,
        clientName: users.name,
        articleId: articles.id,
        articleStatus: articles.status,
      })
      .from(orders)
      .leftJoin(users, eq(users.id, orders.userId))
      .leftJoin(articles, eq(articles.orderId, orders.id))
      .orderBy(desc(orders.createdAt)),
    db
      .select({ total: sql<number>`coalesce(sum(${orders.amount}),0)::int` })
      .from(orders)
      .where(eq(orders.status, "paid")),
  ]);

  const awaiting = rows.filter((r) => r.status === "paid" && !r.articleId).length;

  return (
    <AdminShell title="Orders" description="Every payment, and whether the article has arrived.">
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Collected</p>
          <p className="font-serif text-2xl font-bold text-brand-navy">
            ${((totals[0]?.total ?? 0) / 100).toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Paid, no article yet</p>
          <p className="font-serif text-2xl font-bold text-brand-navy">{awaiting}</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          No orders yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left">
              <tr>
                <th className="px-5 py-3 font-semibold text-brand-navy">Date</th>
                <th className="px-5 py-3 font-semibold text-brand-navy">Client</th>
                <th className="px-5 py-3 font-semibold text-brand-navy">Package</th>
                <th className="px-5 py-3 font-semibold text-brand-navy">Amount</th>
                <th className="px-5 py-3 font-semibold text-brand-navy">Payment</th>
                <th className="px-5 py-3 font-semibold text-brand-navy">Article</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const pkg = findPackageById(r.packageId);
                return (
                  <tr key={`${r.id}-${r.articleId ?? "none"}`} className="border-b border-slate-100 last:border-0">
                    <td className="px-5 py-4 text-slate-600">
                      {(r.paidAt || r.createdAt).toLocaleDateString("en-US")}
                    </td>
                    <td className="px-5 py-4">
                      <span className="block font-medium text-brand-navy">{r.email}</span>
                      {r.clientName && <span className="text-xs text-slate-500">{r.clientName}</span>}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-slate-700">
                        {pkg?.name || (r.packageId === "pick" ? "Chosen newspapers" : r.packageId)}
                      </span>
                      {r.states && <span className="block text-xs text-slate-500">{r.states}</span>}
                    </td>
                    <td className="px-5 py-4 font-medium text-brand-navy">
                      ${(r.amount / 100).toFixed(2)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-5 py-4">
                      {r.articleId ? (
                        <Link
                          href={`/admin/articles/${r.articleId}`}
                          className="text-brand-red hover:underline"
                        >
                          <StatusBadge status={r.articleStatus || "draft"} />
                        </Link>
                      ) : r.status === "paid" ? (
                        <span className="text-xs text-amber-700">waiting for the client</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
