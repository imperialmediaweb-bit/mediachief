import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getDb } from "@/db";
import { articles, users } from "@/db/schema";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatusBadge } from "@/components/account/StatusBadge";

export const metadata: Metadata = {
  title: "Admin • Articles",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const TABS = [
  { key: "submitted", label: "To publish" },
  { key: "published", label: "Published" },
  { key: "rejected", label: "Sent back" },
  { key: "draft", label: "Drafts" },
  { key: "all", label: "All" },
] as const;

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams?: { status?: string };
}) {
  const session = getSession();
  if (!session) redirect("/admin/login?from=/admin/articles");

  const status = searchParams?.status || "submitted";
  const db = getDb();

  const base = db
    .select({
      id: articles.id,
      title: articles.title,
      status: articles.status,
      createdAt: articles.createdAt,
      submittedAt: articles.submittedAt,
      aiGenerated: articles.aiGenerated,
      email: users.email,
    })
    .from(articles)
    .leftJoin(users, eq(users.id, articles.userId));

  const rows = await (status === "all"
    ? base.orderBy(desc(articles.createdAt))
    : base.where(eq(articles.status, status)).orderBy(desc(articles.createdAt)));

  return (
    <AdminShell title="Articles" description="Everything clients have sent in.">
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/articles?status=${t.key}`}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
              status === t.key
                ? "border-brand-navy bg-brand-navy text-white"
                : "border-slate-300 bg-white text-brand-navy hover:bg-slate-50"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          Nothing here.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left">
              <tr>
                <th className="px-5 py-3 font-semibold text-brand-navy">Title</th>
                <th className="px-5 py-3 font-semibold text-brand-navy">Client</th>
                <th className="px-5 py-3 font-semibold text-brand-navy">Sent</th>
                <th className="px-5 py-3 font-semibold text-brand-navy">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <span className="font-medium text-brand-navy">{a.title}</span>
                    {a.aiGenerated && (
                      <span className="ml-2 rounded-full bg-brand-ivory px-2 py-0.5 text-xs text-brand-navy">
                        AI draft
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-600">{a.email || "—"}</td>
                  <td className="px-5 py-4 text-slate-600">
                    {(a.submittedAt || a.createdAt).toLocaleDateString("en-US")}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/admin/articles/${a.id}`}
                      className="font-medium text-brand-red hover:underline"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
