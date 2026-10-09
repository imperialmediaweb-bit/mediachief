import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getDb } from "@/db";
import { articles, orders, subscriptions, users } from "@/db/schema";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatusBadge } from "@/components/account/StatusBadge";

export const metadata: Metadata = {
  title: "Admin • Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const session = getSession();
  if (!session) redirect("/admin/login?from=/admin");

  const db = getDb();
  const [clients, paid, revenue, waiting, latestArticles, latestOrders, activeSubs] =
    await Promise.all([
      db.select({ n: sql<number>`count(*)::int` }).from(users),
      db.select({ n: sql<number>`count(*)::int` }).from(orders).where(eq(orders.status, "paid")),
      db
        .select({ total: sql<number>`coalesce(sum(${orders.amount}),0)::int` })
        .from(orders)
        .where(eq(orders.status, "paid")),
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(articles)
        .where(eq(articles.status, "submitted")),
      db.select().from(articles).orderBy(desc(articles.createdAt)).limit(5),
      db.select().from(orders).orderBy(desc(orders.createdAt)).limit(5),
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(subscriptions)
        .where(eq(subscriptions.status, "active")),
    ]);

  const waitingCount = waiting[0]?.n ?? 0;

  return (
    <AdminShell title="Dashboard" description="Where the business stands right now.">
      {waitingCount > 0 && (
        <Link
          href="/admin/articles"
          className="mb-8 block rounded-2xl border-2 border-brand-red bg-red-50 p-6 transition hover:bg-red-100"
        >
          <p className="font-serif text-2xl font-bold text-brand-navy">
            {waitingCount} article{waitingCount === 1 ? "" : "s"} waiting to be published
          </p>
          <p className="mt-1 text-sm text-slate-600">Clients have paid and are waiting. Open them →</p>
        </Link>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Clients" value={String(clients[0]?.n ?? 0)} href="/admin/orders" />
        <Stat label="Paid orders" value={String(paid[0]?.n ?? 0)} href="/admin/orders" />
        <Stat label="Collected" value={`$${((revenue[0]?.total ?? 0) / 100).toFixed(2)}`} href="/admin/orders" />
        <Stat label="Active subscriptions" value={String(activeSubs[0]?.n ?? 0)} href="/admin/orders" />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <Panel title="Latest articles" href="/admin/articles">
          {latestArticles.length === 0 ? (
            <Empty>No articles yet.</Empty>
          ) : (
            latestArticles.map((a) => (
              <Link
                key={a.id}
                href={`/admin/articles/${a.id}`}
                className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3 last:border-0 hover:bg-slate-50"
              >
                <span className="truncate font-medium text-brand-navy">{a.title}</span>
                <StatusBadge status={a.status} />
              </Link>
            ))
          )}
        </Panel>

        <Panel title="Latest orders" href="/admin/orders">
          {latestOrders.length === 0 ? (
            <Empty>No orders yet.</Empty>
          ) : (
            latestOrders.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3 last:border-0"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-brand-navy">{o.email}</p>
                  <p className="text-xs text-slate-500">{o.packageId}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-brand-navy">${(o.amount / 100).toFixed(2)}</p>
                  <StatusBadge status={o.status} />
                </div>
              </div>
            ))
          )}
        </Panel>
      </div>
    </AdminShell>
  );
}

function Stat({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:shadow-md">
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 font-serif text-3xl font-bold text-brand-navy">{value}</p>
    </Link>
  );
}

function Panel({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
        <h2 className="font-semibold text-brand-navy">{title}</h2>
        <Link href={href} className="text-sm text-brand-red hover:underline">
          See all
        </Link>
      </div>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-5 py-8 text-center text-sm text-slate-500">{children}</p>;
}
