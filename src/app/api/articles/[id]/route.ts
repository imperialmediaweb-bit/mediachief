import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb } from "@/db";
import { articles, uploads } from "@/db/schema";
import { sendEmail, wrapEmail, kv, ADMIN_EMAIL } from "@/lib/email";
import { SITE } from "@/data/site";
import { MAX_IMAGES_PER_ARTICLE, folderFor, urlIsInFolder } from "@/lib/cloudinary";

export const runtime = "nodejs";

const patchSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  body: z.string().max(20000).optional(),
  existingUrl: z.string().url().max(500).optional().or(z.literal("")),
  notes: z.string().max(2000).optional(),
  action: z.enum(["save", "submit"]).default("save"),
});

const registerSchema = z.object({
  cloudinaryPublicId: z.string().min(1).max(300),
  url: z.string().url().max(600),
  width: z.number().int().positive().max(20000).optional(),
  height: z.number().int().positive().max(20000).optional(),
  bytes: z.number().int().positive().max(15_000_000).optional(),
});

/** The client's own article, or null when it is not theirs. */
async function ownedArticle(id: string, userId: string) {
  const rows = await getDb()
    .select()
    .from(articles)
    .where(and(eq(articles.id, id), eq(articles.userId, userId)));
  return rows[0] ?? null;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.errors[0]?.message || "Invalid data" },
      { status: 400 }
    );
  }

  const article = await ownedArticle(params.id, userId);
  if (!article) return NextResponse.json({ ok: false, error: "Article not found" }, { status: 404 });

  // Submitted and published articles are locked. A rejected one can be fixed
  // and sent again — on MediaExpres that was a dead end.
  const editable = article.status === "draft" || article.status === "rejected";
  if (!editable) {
    return NextResponse.json(
      { ok: false, error: "This article is already with our editors." },
      { status: 409 }
    );
  }

  const db = getDb();
  const patch: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) patch.title = parsed.data.title;
  if (parsed.data.body !== undefined) patch.body = parsed.data.body || null;
  if (parsed.data.existingUrl !== undefined) patch.existingUrl = parsed.data.existingUrl || null;
  if (parsed.data.notes !== undefined) patch.notes = parsed.data.notes || null;

  const submitting = parsed.data.action === "submit";
  if (submitting) {
    const title = (patch.title as string) ?? article.title;
    const text = (patch.body as string | null) ?? article.body;
    const url = (patch.existingUrl as string | null) ?? article.existingUrl;
    if (!text && !url) {
      return NextResponse.json(
        { ok: false, error: "Add the article text, or a link to it, before sending." },
        { status: 400 }
      );
    }
    patch.status = "submitted";
    patch.submittedAt = new Date();
    patch.rejectionReason = null;

    await db.update(articles).set(patch).where(eq(articles.id, article.id));

    const images = await db
      .select({ url: uploads.url })
      .from(uploads)
      .where(eq(uploads.articleId, article.id));

    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `[Article] ${title}`,
      replyTo: session.user?.email || undefined,
      html: wrapEmail(
        "New article to publish",
        `
        <table style="width:100%;border-collapse:collapse;">
          ${kv("Title", title)}
          ${kv("Client", session.user?.email || "—")}
          ${kv("Existing link", url || "—")}
          ${kv("Photos", images.length ? images.map((i) => i.url).join("<br/>") : "none")}
        </table>
        ${text ? `<p style="margin-top:16px;white-space:pre-wrap;">${escapeHtml(text).slice(0, 4000)}</p>` : ""}
        <p style="margin-top:16px;"><a href="${SITE.url}/admin/articles/${article.id}">Open it in the admin</a></p>
      `
      ),
    });

    return NextResponse.json({ ok: true, status: "submitted" });
  }

  if (Object.keys(patch).length) {
    await db.update(articles).set(patch).where(eq(articles.id, article.id));
  }
  return NextResponse.json({ ok: true, status: article.status });
}

/** Registers an image the browser has just uploaded straight to Cloudinary. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid data" }, { status: 400 });
  }

  const article = await ownedArticle(params.id, userId);
  if (!article) return NextResponse.json({ ok: false, error: "Article not found" }, { status: 404 });

  // The URL must sit in the folder we signed for this client and article,
  // otherwise anyone could attach any image on Cloudinary to their article.
  if (!urlIsInFolder(parsed.data.url, folderFor(userId, article.id))) {
    return NextResponse.json({ ok: false, error: "That image is not yours" }, { status: 400 });
  }

  const db = getDb();
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

  const inserted = await db
    .insert(uploads)
    .values({
      articleId: article.id,
      userId,
      cloudinaryPublicId: parsed.data.cloudinaryPublicId,
      url: parsed.data.url,
      width: parsed.data.width,
      height: parsed.data.height,
      bytes: parsed.data.bytes,
    })
    .returning({ id: uploads.id, url: uploads.url });

  return NextResponse.json({ ok: true, upload: inserted[0] });
}

/** Removes one image from a draft. */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  const uploadId = new URL(req.url).searchParams.get("uploadId");
  if (!uploadId) return NextResponse.json({ ok: false, error: "Missing image" }, { status: 400 });

  const article = await ownedArticle(params.id, userId);
  if (!article) return NextResponse.json({ ok: false, error: "Article not found" }, { status: 404 });
  if (article.status !== "draft" && article.status !== "rejected") {
    return NextResponse.json({ ok: false, error: "This article is locked." }, { status: 409 });
  }

  await getDb()
    .delete(uploads)
    .where(and(eq(uploads.id, uploadId), eq(uploads.userId, userId), eq(uploads.articleId, article.id)));

  return NextResponse.json({ ok: true });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
