import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getEntitlements } from "@/lib/entitlements";
import { aiConfigured } from "@/lib/ai";
import { ArticleEditor } from "@/components/account/ArticleEditor";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewArticlePage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/account/login");

  const ent = await getEntitlements(userId);

  if (!ent.canSubmit) {
    const usedUp = ent.hasPaid;
    return (
      <section className="container py-16">
        <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <Lock className="h-6 w-6 text-slate-400" />
          </div>
          <h1 className="mt-5 font-serif text-2xl font-bold text-brand-navy">
            {usedUp ? "No articles left" : "Buy a package first"}
          </h1>
          <p className="mt-3 text-slate-600">
            {usedUp
              ? "You have used every article included in your plan. Buy another package, or wait for your subscription to renew next month."
              : "Pick the newspapers you want, pay, and this is where you send us the article."}
          </p>
          <Button variant="accent" size="lg" asChild className="mt-6">
            <Link href="/packages">See the packages</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="container py-12">
      <div className="max-w-3xl">
        <p className="eyebrow">My account</p>
        <h1 className="h1 mt-2">New article</h1>
        <p className="lead mt-3 text-slate-600">
          Write it, paste it, or give us the topic and we draft it. We publish within one business
          day and email you every link.
        </p>

        <div className="mt-8">
          <ArticleEditor
            article={{ id: null, title: "", body: "", existingUrl: "", notes: "", status: "draft" }}
            uploads={[]}
            canGenerate={aiConfigured()}
          />
        </div>
      </div>
    </section>
  );
}
