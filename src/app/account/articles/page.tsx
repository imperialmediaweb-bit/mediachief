import { redirect } from "next/navigation";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb } from "@/db";
import { articles } from "@/db/schema";
import { getEntitlements } from "@/lib/entitlements";
import { StatusBadge } from "@/components/account/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ArticlesPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/account/login");

  const [rows, ent] = await Promise.all([
    getDb().select().from(articles).where(eq(articles.userId, userId)).orderBy(desc(articles.createdAt)),
    getEntitlements(userId),
  ]);

  return (
    <section className="container py-12">
      <div className="max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">My account</p>
            <h1 className="h1 mt-2">Articles</h1>
            <p className="lead mt-3 text-slate-600">
              {ent.articlesRemaining !== null
                ? `${ent.articlesRemaining} article${ent.articlesRemaining === 1 ? "" : "s"} left on your subscription this month.`
                : "Everything you have sent us, and where each one stands."}
            </p>
          </div>
          {ent.canSubmit && (
            <Button variant="accent" size="lg" asChild>
              <Link href="/account/articles/new">
                <Plus className="h-4 w-4" /> New article
              </Link>
            </Button>
          )}
        </div>

        {rows.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-slate-600">
              {ent.canSubmit
                ? "Nothing sent yet. Write it yourself or let us draft it."
                : "Buy a package first, then send us your article."}
            </p>
            <Button variant="accent" size="lg" asChild className="mt-5">
              <Link href={ent.canSubmit ? "/account/articles/new" : "/packages"}>
                {ent.canSubmit ? "Start your first article" : "See the packages"}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left">
                <tr>
                  <th className="px-5 py-3 font-semibold text-brand-navy">Title</th>
                  <th className="px-5 py-3 font-semibold text-brand-navy">Sent</th>
                  <th className="px-5 py-3 font-semibold text-brand-navy">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-5 py-4">
                      <span className="font-medium text-brand-navy">{a.title}</span>
                      {a.aiGenerated && (
                        <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-brand-ivory px-2 py-0.5 text-xs text-brand-navy">
                          <Sparkles className="h-3 w-3" /> drafted for you
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {(a.submittedAt || a.createdAt).toLocaleDateString("en-US")}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/account/articles/${a.id}`}
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
      </div>
    </section>
  );
}
