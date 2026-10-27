import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { CheckCircle2 } from "lucide-react";
import { getDb } from "@/db";
import { articles, orders } from "@/db/schema";
import { findPackageById } from "@/data/packages";
import { TOTAL_NEWSPAPERS } from "@/data/newspapers";
import { orderIdFromMaterialToken } from "@/lib/material-link";
import { MaterialForm } from "./MaterialForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Send us your article",
  robots: { index: false, follow: false },
};

/**
 * Where a client who paid first writes their article.
 *
 * The link in their email opens here directly. No account, no password, no
 * second email to wait for — they have already paid, and every step between
 * them and the text is a step where the order stops.
 */
export default async function MaterialPage({ params }: { params: { token: string } }) {
  const orderId = orderIdFromMaterialToken(params.token);
  if (!orderId) notFound();

  const db = getDb();
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) notFound();

  const [existing] = await db
    .select({ title: articles.title, body: articles.body, status: articles.status })
    .from(articles)
    .where(and(eq(articles.orderId, order.id)));

  const pkg = findPackageById(order.packageId);
  const published = existing?.status === "published";

  return (
    <div className="bg-slate-50 py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#c1121f]">
          Your order
        </p>
        <h1 className="mt-2 font-serif text-2xl font-bold text-brand-navy sm:text-3xl">
          Send us your article
        </h1>
        <p className="mt-3 text-slate-600">
          {pkg?.name || order.packageId} — paid, and your slot on {TOTAL_NEWSPAPERS} US newspapers
          is held. Write it whenever you are ready; this link does not expire.
        </p>

        {published ? (
          <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
            <h2 className="mt-4 font-serif text-2xl font-bold text-brand-navy">
              This article is already published
            </h2>
            <p className="mt-3 text-slate-700">
              Check the report link in your email for every newspaper and link. If something needs
              correcting, reply to that email and we will fix it across the network.
            </p>
          </div>
        ) : (
          <div className="mt-8">
            <MaterialForm
              token={params.token}
              initialTitle={existing?.title && existing.title !== "Untitled" ? existing.title : ""}
              initialBody={existing?.body || ""}
            />
          </div>
        )}
      </div>
    </div>
  );
}
