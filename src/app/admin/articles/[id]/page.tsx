import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getDb } from "@/db";
import { articles, orders, uploads, users } from "@/db/schema";
import { findPackageById } from "@/data/packages";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatusBadge } from "@/components/account/StatusBadge";
import { ArticleActions } from "@/components/admin/ArticleActions";

export const metadata: Metadata = {
  title: "Admin • Article",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminArticlePage({ params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) redirect(`/admin/login?from=/admin/articles/${params.id}`);

  const db = getDb();
  const rows = await db
    .select({
      article: articles,
      clientEmail: users.email,
      clientName: users.name,
      clientPhone: users.phone,
      clientCompany: users.companyName,
      orderPackage: orders.packageId,
      orderStates: orders.newspaperStates,
      orderAmount: orders.amount,
    })
    .from(articles)
    .leftJoin(users, eq(users.id, articles.userId))
    .leftJoin(orders, eq(orders.id, articles.orderId))
    .where(eq(articles.id, params.id));

  const row = rows[0];
  if (!row) notFound();
  const a = row.article;

  const images = await db
    .select({ id: uploads.id, url: uploads.url })
    .from(uploads)
    .where(eq(uploads.articleId, a.id));

  let publishedUrls: string[] = [];
  if (a.publishedUrls) {
    try {
      const parsed = JSON.parse(a.publishedUrls);
      if (Array.isArray(parsed)) publishedUrls = parsed.filter((u) => typeof u === "string");
    } catch {
      publishedUrls = [];
    }
  }

  const pkg = row.orderPackage ? findPackageById(row.orderPackage) : undefined;

  return (
    <AdminShell title={a.title}>
      <Link href="/admin/articles" className="-mt-4 mb-6 inline-block text-sm text-slate-500 hover:text-brand-red">
        ← All articles
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={a.status} />
              <span className="text-sm text-slate-500">
                {(a.submittedAt || a.createdAt).toLocaleString("en-US")}
              </span>
              {a.aiGenerated && (
                <span className="rounded-full bg-brand-ivory px-2.5 py-1 text-xs text-brand-navy">
                  AI draft — read it before publishing
                </span>
              )}
            </div>

            {a.existingUrl && (
              <p className="mt-4 text-sm">
                <span className="text-slate-500">Already online at </span>
                <a href={a.existingUrl} target="_blank" rel="noreferrer" className="text-brand-red hover:underline">
                  {a.existingUrl}
                </a>
              </p>
            )}

            {a.body && (
              <pre className="mt-5 whitespace-pre-wrap border-t border-slate-100 pt-5 font-sans text-sm leading-relaxed text-slate-700">
                {a.body}
              </pre>
            )}

            {a.notes && (
              <div className="mt-5 rounded-lg bg-amber-50 p-4 text-sm">
                <p className="font-semibold text-amber-900">Client notes</p>
                <p className="mt-1 whitespace-pre-wrap text-amber-900">{a.notes}</p>
              </div>
            )}
          </div>

          {images.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="font-semibold text-brand-navy">Photos</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                {images.map((img) => (
                  <a key={img.id} href={img.url} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt=""
                      className="h-32 w-32 rounded-lg border border-slate-200 object-cover transition hover:opacity-80"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold text-brand-navy">Client</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <Row label="Email" value={row.clientEmail} />
              <Row label="Name" value={row.clientName} />
              <Row label="Phone" value={row.clientPhone} />
              <Row label="Company" value={row.clientCompany} />
            </dl>
            <h2 className="mt-6 font-semibold text-brand-navy">Order</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <Row label="Package" value={pkg?.name || row.orderPackage} />
              <Row
                label="Paid"
                value={row.orderAmount ? `$${(row.orderAmount / 100).toFixed(2)}` : null}
              />
              <Row label="Newspapers" value={row.orderStates} />
            </dl>
            {row.orderStates && (
              <p className="mt-3 rounded-lg bg-brand-ivory p-3 text-xs text-slate-600">
                Publish only on the states listed above — that is what this client paid for.
              </p>
            )}
          </div>

          <ArticleActions articleId={a.id} status={a.status} publishedUrls={publishedUrls} />

          {a.status === "published" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="font-semibold text-brand-navy">Client report</h2>
              <p className="mt-1 text-sm text-slate-600">
                The same two files the client can download from their account.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={`/api/articles/${a.id}/report?format=pdf`}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-brand-navy hover:bg-slate-50"
                >
                  PDF
                </a>
                <a
                  href={`/api/articles/${a.id}/report?format=csv`}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-brand-navy hover:bg-slate-50"
                >
                  Excel (CSV)
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-brand-navy">{value || "—"}</dd>
    </div>
  );
}
