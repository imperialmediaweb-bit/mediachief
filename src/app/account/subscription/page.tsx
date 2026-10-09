import { redirect } from "next/navigation";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb } from "@/db";
import { subscriptions } from "@/db/schema";
import { findSubscriptionPlanById } from "@/data/packages";
import { StatusBadge } from "@/components/account/StatusBadge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function SubscriptionPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/account/login");

  const rows = await getDb()
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt));

  const active = rows.find((s) => s.status === "active" || s.status === "trialing");

  return (
    <section className="container py-12">
      <div className="max-w-3xl">
        <p className="eyebrow">My account</p>
        <h1 className="h1 mt-2">Subscription</h1>

        {!active ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-slate-600">
              You do not have an active subscription. A subscription publishes an article across the
              network every month, at a lower price than buying one at a time.
            </p>
            <Button variant="accent" size="lg" asChild className="mt-5">
              <Link href="/packages#subscriptions">See the subscriptions</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border-2 border-brand-navy bg-brand-navy p-8 text-white">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-white/60">Your plan</p>
                <p className="mt-1 font-serif text-3xl font-bold">
                  {findSubscriptionPlanById(active.planId)?.name || active.planId}
                </p>
                <p className="mt-1 text-sm text-white/70">
                  {active.category === "casino" ? "Casino / iGaming" : "Standard"}
                </p>
              </div>
              <StatusBadge status={active.status} />
            </div>

            <dl className="mt-8 grid gap-6 sm:grid-cols-3">
              <div>
                <dt className="text-xs uppercase tracking-wider text-white/50">Articles left</dt>
                <dd className="mt-1 font-serif text-3xl font-bold text-brand-gold">
                  {active.articlesRemaining}
                </dd>
                <dd className="text-xs text-white/60">of {active.articlesIncludedPerMonth} this month</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-white/50">Renews</dt>
                <dd className="mt-1 text-lg font-semibold">
                  {active.currentPeriodEnd.toLocaleDateString("en-US")}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-white/50">After that</dt>
                <dd className="mt-1 text-lg font-semibold">
                  {active.cancelAtPeriodEnd ? "Ends" : "Renews automatically"}
                </dd>
              </div>
            </dl>

            {active.articlesRemaining > 0 && (
              <Button variant="accent" size="lg" asChild className="mt-8">
                <Link href="/account/articles/new">Send this month&apos;s article</Link>
              </Button>
            )}
          </div>
        )}

        {rows.length > 1 && (
          <div className="mt-10">
            <h2 className="font-serif text-xl font-bold text-brand-navy">History</h2>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-left">
                  <tr>
                    <th className="px-5 py-3 font-semibold text-brand-navy">Plan</th>
                    <th className="px-5 py-3 font-semibold text-brand-navy">Started</th>
                    <th className="px-5 py-3 font-semibold text-brand-navy">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr key={s.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-5 py-4 font-medium text-brand-navy">
                        {findSubscriptionPlanById(s.planId)?.name || s.planId}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {s.createdAt.toLocaleDateString("en-US")}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={s.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
