import { redirect } from "next/navigation";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb } from "@/db";
import { orders, articles } from "@/db/schema";
import { findPackageById } from "@/data/packages";
import { StatusBadge } from "@/components/account/StatusBadge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/account/login");

  const db = getDb();
  const rows = await db
    .select({
      id: orders.id,
      packageId: orders.packageId,
      amount: orders.amount,
      status: orders.status,
      createdAt: orders.createdAt,
      paidAt: orders.paidAt,
      articlesIncluded: orders.articlesIncluded,
      articlesUsed: orders.articlesUsed,
      states: orders.newspaperStates,
      articleId: articles.id,
      articleTitle: articles.title,
    })
    .from(orders)
    .leftJoin(articles, eq(articles.orderId, orders.id))
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));

  return (
    <section className="container py-12">
      <div className="max-w-5xl">
        <p className="eyebrow">My account</p>
        <h1 className="h1 mt-2">Orders</h1>
        <p className="lead mt-3 text-slate-600">
          Every payment you have made and the article that went with it.
        </p>

        {rows.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-slate-600">You have not placed an order yet.</p>
            <Button variant="accent" size="lg" asChild className="mt-5">
              <Link href="/packages">See the packages</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left">
                <tr>
                  <th className="px-5 py-3 font-semibold text-brand-navy">Date</th>
                  <th className="px-5 py-3 font-semibold text-brand-navy">Package</th>
                  <th className="px-5 py-3 font-semibold text-brand-navy">Article</th>
                  <th className="px-5 py-3 font-semibold text-brand-navy">Amount</th>
                  <th className="px-5 py-3 font-semibold text-brand-navy">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const pkg = findPackageById(r.packageId);
                  const left = r.articlesIncluded - r.articlesUsed;
                  return (
                    <tr key={`${r.id}-${r.articleId ?? "none"}`} className="border-b border-slate-100 last:border-0">
                      <td className="px-5 py-4 text-slate-600">
                        {(r.paidAt || r.createdAt).toLocaleDateString("en-US")}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-medium text-brand-navy">
                          {pkg?.name || (r.packageId === "pick" ? "Chosen newspapers" : r.packageId)}
                        </span>
                        {r.states && (
                          <span className="block text-xs text-slate-500">{r.states}</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {r.articleId ? (
                          <Link
                            href={`/account/articles/${r.articleId}`}
                            className="text-brand-red hover:underline"
                          >
                            {r.articleTitle}
                          </Link>
                        ) : left > 0 && r.status === "paid" ? (
                          <Link href="/account/articles/new" className="text-brand-red hover:underline">
                            Send your article →
                          </Link>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        ${(r.amount / 100).toFixed(2)}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
