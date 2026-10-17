import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb } from "@/db";
import { articles, uploads } from "@/db/schema";
import { aiConfigured } from "@/lib/ai";
import { ArticleEditor } from "@/components/account/ArticleEditor";
import { StatusBadge } from "@/components/account/StatusBadge";
import { ExternalLink, FileDown, Sheet } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function ArticlePage({ params }: { params: { id: string } }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/account/login");

  const db = getDb();
  const rows = await db
    .select()
    .from(articles)
    .where(and(eq(articles.id, params.id), eq(articles.userId, userId)));
  const article = rows[0];
  if (!article) notFound();

  const images = await db
    .select({ id: uploads.id, url: uploads.url })
    .from(uploads)
    .where(eq(uploads.articleId, article.id));

  let publishedUrls: string[] = [];
  if (article.publishedUrls) {
    try {
      const parsed = JSON.parse(article.publishedUrls);
      if (Array.isArray(parsed)) publishedUrls = parsed.filter((u) => typeof u === "string");
    } catch {
      publishedUrls = [];
    }
  }

  return (
    <section className="container py-12">
      <div className="max-w-3xl">
        <Link href="/account/articles" className="text-sm text-slate-500 hover:text-brand-red">
          ← All articles
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="h1">{article.title}</h1>
          <StatusBadge status={article.status} />
        </div>

        {publishedUrls.length > 0 && (
          <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-6">
            <h2 className="font-serif text-xl font-bold text-brand-navy">
              Published on {publishedUrls.length} newspaper{publishedUrls.length === 1 ? "" : "s"}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Every link below is permanent. Copy them into your own site or send them to clients.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button variant="accent" asChild>
                <a href={`/api/articles/${article.id}/report?format=pdf`}>
                  <FileDown className="h-4 w-4" /> Download the PDF report
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href={`/api/articles/${article.id}/report?format=csv`}>
                  <Sheet className="h-4 w-4" /> Download for Excel
                </a>
              </Button>
            </div>

            <ul className="mt-5 space-y-2">
              {publishedUrls.map((url) => (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 break-all font-mono text-sm text-brand-red hover:underline"
                  >
                    {url}
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8">
          <ArticleEditor
            article={{
              id: article.id,
              title: article.title,
              body: article.body || "",
              existingUrl: article.existingUrl || "",
              notes: article.notes || "",
              status: article.status,
              rejectionReason: article.rejectionReason,
            }}
            uploads={images}
            canGenerate={aiConfigured()}
          />
        </div>
      </div>
    </section>
  );
}
