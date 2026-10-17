import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getSession } from "@/lib/auth";
import { getDb } from "@/db";
import { articles, users } from "@/db/schema";
import { buildCsv, buildPdf } from "@/lib/report";

export const runtime = "nodejs";

/**
 * The published-link report. The client downloads their own; an operator signed
 * into the admin can download anyone's, to attach it to an email by hand.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const format = (new URL(req.url).searchParams.get("format") || "pdf").toLowerCase();
  if (format !== "pdf" && format !== "csv") {
    return NextResponse.json({ ok: false, error: "Unknown format" }, { status: 400 });
  }

  const isAdmin = Boolean(getSession());
  const session = isAdmin ? null : await auth();
  const userId = session?.user?.id;
  if (!isAdmin && !userId) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }

  const db = getDb();
  const rows = await db
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
    .where(
      isAdmin
        ? eq(articles.id, params.id)
        : and(eq(articles.id, params.id), eq(articles.userId, userId!))
    );

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
