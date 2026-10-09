import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb } from "@/db";
import { articles, uploads } from "@/db/schema";
import {
  MAX_IMAGES_PER_ARTICLE,
  cloudinaryConfigured,
  folderFor,
  signUpload,
} from "@/lib/cloudinary";

export const runtime = "nodejs";

const schema = z.object({ articleId: z.string().min(1).max(64) });

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  if (!cloudinaryConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Image upload is not configured yet. Email us the photos instead." },
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
    return NextResponse.json({ ok: false, error: "Invalid data" }, { status: 400 });
  }

  const db = getDb();
  const owned = await db
    .select({ id: articles.id, status: articles.status })
    .from(articles)
    .where(and(eq(articles.id, parsed.data.articleId), eq(articles.userId, userId)));

  const article = owned[0];
  if (!article) return NextResponse.json({ ok: false, error: "Article not found" }, { status: 404 });
  if (article.status !== "draft" && article.status !== "rejected") {
    return NextResponse.json(
      { ok: false, error: "This article has been submitted and can no longer be changed." },
      { status: 409 }
    );
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(uploads)
    .where(eq(uploads.articleId, article.id));

  if (count >= MAX_IMAGES_PER_ARTICLE) {
    return NextResponse.json(
      { ok: false, error: `Up to ${MAX_IMAGES_PER_ARTICLE} images per article.` },
      { status: 409 }
    );
  }

  const signed = signUpload(folderFor(userId, article.id));
  if (!signed) {
    return NextResponse.json({ ok: false, error: "Upload is not configured" }, { status: 503 });
  }

  return NextResponse.json({ ok: true, ...signed, remaining: MAX_IMAGES_PER_ARTICLE - count });
}
