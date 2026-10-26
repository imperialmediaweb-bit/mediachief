import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getDb } from "@/db";
import { articles, orders, uploads, users } from "@/db/schema";
import { findPackageById } from "@/data/packages";
import { ensureNetworkColumns } from "@/lib/network-schema";
import {
  createCampaign,
  getCampaign,
  networkConfigured,
  publishCampaign,
  reportUrlFor,
  urlsFrom,
  type Placement,
} from "@/lib/network";

export const runtime = "nodejs";
export const maxDuration = 300;

const schema = z.object({
  articleId: z.string().min(1).max(64),
  action: z.enum(["create", "publish", "refresh"]),
  /** Required on create: every placement links back to it. */
  clientUrl: z.string().url().max(500).optional(),
  /** An image for the placements when the client sent no photo of their own. */
  imageUrl: z.string().url().max(600).optional(),
  perRun: z.number().int().min(1).max(50).optional(),
});

/**
 * Hands an order to the publishing network and reads it back.
 *
 * The network is the source of truth for where an article actually went live:
 * it records one placement per site at the moment of insert. Every call here
 * ends by copying those addresses onto the article, so the PDF and Excel
 * report the client downloads is built from what was published rather than
 * from a list somebody typed.
 */
export async function POST(req: NextRequest) {
  // The middleware does not cover /api/admin, so check the signature here.
  if (!getSession()) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }
  if (!networkConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "The network link is not configured. Set NETWORK_URL and NETWORK_KEY on this service in Railway.",
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.errors[0]?.message || "Invalid data" },
      { status: 400 }
    );
  }
  const { articleId, action, clientUrl, imageUrl, perRun } = parsed.data;

  // Before the first query that reads them — see network-schema.ts.
  await ensureNetworkColumns();

  const db = getDb();
  const rows = await db
    .select({
      article: articles,
      order: orders,
      clientEmail: users.email,
      clientName: users.name,
      clientPhone: users.phone,
      clientCompany: users.companyName,
    })
    .from(articles)
    .leftJoin(orders, eq(orders.id, articles.orderId))
    .leftJoin(users, eq(users.id, articles.userId))
    .where(eq(articles.id, articleId));

  const row = rows[0];
  if (!row) return NextResponse.json({ ok: false, error: "Article not found" }, { status: 404 });
  const { article, order } = row;

  if (!order) {
    return NextResponse.json(
      { ok: false, error: "This article has no order behind it, so there is nothing to publish." },
      { status: 409 }
    );
  }
  if (order.status !== "paid") {
    return NextResponse.json(
      { ok: false, error: "The order is not paid. Nothing goes to the network before the money does." },
      { status: 409 }
    );
  }

  // ---- create the campaign
  if (action === "create") {
    if (order.networkOrderId) {
      return NextResponse.json(
        { ok: false, error: "This order is already in the network." },
        { status: 409 }
      );
    }
    if (!clientUrl) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "A client link is required — every placement links back to it. Ask the client where readers should go.",
        },
        { status: 400 }
      );
    }
    const material = (article.body || "").trim();
    if (material.length < 50) {
      return NextResponse.json(
        { ok: false, error: "The article text is too short to publish. The network needs at least 50 characters." },
        { status: 400 }
      );
    }

    const images = await db
      .select({ url: uploads.url })
      .from(uploads)
      .where(eq(uploads.articleId, article.id));

    const created = await createCampaign({
      externalRef: order.id,
      client: row.clientCompany || row.clientName || row.clientEmail || "Media Chief client",
      clientUrl,
      email: row.clientEmail,
      phone: row.clientPhone,
      packageId: order.packageId,
      price: order.amount / 100,
      title: article.title,
      material,
      // The operator's image first: a client who uploaded nothing still ends up
      // with their own cover or logo on the placements rather than nothing.
      images: [...(imageUrl ? [imageUrl] : []), ...images.map((i) => i.url)],
      notes: article.notes,
    });

    if (created.state !== "ok") {
      const reason = created.state === "not-configured" ? "Network not configured" : created.message;
      console.error("[admin/network] create failed:", reason);
      // Deliberately not a 5xx: the edge replaces the body of a 502 with its
      // own error page, and the reason the network refused is the whole point.
      return NextResponse.json({ ok: false, error: reason }, { status: 200 });
    }

    const token = created.data.reportUrl.replace(/^\/report\//, "");
    await db
      .update(orders)
      .set({ networkOrderId: created.data.orderId, networkReportToken: token })
      .where(eq(orders.id, order.id));

    return NextResponse.json({
      ok: true,
      networkOrderId: created.data.orderId,
      reportUrl: reportUrlFor(token),
      placed: 0,
      urls: [],
    });
  }

  // ---- publish and refresh both need the campaign to exist
  if (!order.networkOrderId) {
    return NextResponse.json(
      { ok: false, error: "This order has not been sent to the network yet." },
      { status: 409 }
    );
  }

  if (action === "publish") {
    const run = await publishCampaign(order.networkOrderId, perRun);
    if (run.state === "error") {
      console.error("[admin/network] publish failed:", run.message);
      return NextResponse.json({ ok: false, error: run.message }, { status: 200 });
    }
  }

  const campaign = await getCampaign(order.networkOrderId);
  if (campaign.state !== "ok") {
    const reason = campaign.state === "not-configured" ? "Network not configured" : campaign.message;
    console.error("[admin/network] read failed:", reason);
    return NextResponse.json({ ok: false, error: reason }, { status: 200 });
  }

  const placements: Placement[] = campaign.data.placements || [];
  const urls = urlsFrom(placements);

  // The report the client downloads is built from these, so write them back
  // whichever action we came in on.
  if (urls.length) {
    await db
      .update(articles)
      .set({
        publishedUrls: JSON.stringify(urls),
        status: "published",
        publishedAt: article.publishedAt ?? new Date(),
      })
      .where(eq(articles.id, article.id));
  }

  return NextResponse.json({
    ok: true,
    networkOrderId: order.networkOrderId,
    reportUrl: reportUrlFor(campaign.data.order?.token || order.networkReportToken),
    placed: placements.length,
    urls,
  });
}
