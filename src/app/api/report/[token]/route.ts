import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { articles, users } from "@/db/schema";
import { articleIdFromToken } from "@/lib/report-link";
import { buildCsv, buildPdf } from "@/lib/report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The client's report, downloadable from the signed link in their email.
 *
 * The signed-in route next door needs an account; this one needs only the
 * token, because the client paid by card and may never set a password. The
 * token is an HMAC over the article id, so it cannot be guessed, and it
 * carries no more than the report page on the same token already shows.
 */
export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const format = (new URL(req.url).searchParams.get("format") || "pdf").toLowerCase();
  if (format !== "pdf" && format !== "csv") {
    return NextResponse.json({ ok: false, error: "Unknown format" }, { status: 400 });
  }

  const id = articleIdFromToken(params.token);
  if (!id) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  const rows = await getDb()
    .select({
      title: articles.title,
      status: articles.status,
      publishedUrls: articles.publishedUrls,
      publishedAt: articles.publishedAt,
      clientName: users.name,
      clientCompany: users.companyName,
    })
    .from(articles)
    .leftJoin(users, eq(users.id, articles.userId))
    .where(eq(articles.id, id));

  const article = rows[0];
  if (!article) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  let urls: string[] = [];
  if (article.publishedUrls) {
    try {
      const parsed = JSON.parse(article.publishedUrls);
      if (Array.isArray(parsed)) urls = parsed.filter((u) => typeof u === "string");
    } catch {
      urls = [];
    }
  }

  if (article.status !== "published" || urls.length === 0) {
    return NextResponse.json(
      { ok: false, error: "The report is ready once the article is published." },
      { status: 409 }
    );
  }

  const data = {
    articleTitle: article.title,
    clientName: article.clientCompany || article.clientName,
    publishedAt: article.publishedAt,
    urls,
  };

  const slug =
    article.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || "report";

  if (format === "csv") {
    // The BOM is what makes Excel read the UTF-8 correctly on Windows.
    return new NextResponse("﻿" + buildCsv(data), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="media-chief-${slug}.csv"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  const pdf = await buildPdf(data);
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="media-chief-${slug}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
