import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getDb } from "@/db";
import { articles, users } from "@/db/schema";
import { sendEmail, wrapEmail, kv } from "@/lib/email";
import { SITE } from "@/data/site";
import { sendPublishedEmail } from "@/lib/published-email";

export const runtime = "nodejs";

const schema = z
  .object({
    action: z.enum(["publish", "reject"]),
    publishedUrls: z.array(z.string().url()).max(100).optional(),
    rejectionReason: z.string().max(1000).optional(),
  })
  .refine((v) => v.action !== "publish" || (v.publishedUrls && v.publishedUrls.length > 0), {
    message: "Paste at least one published link",
  });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  // The middleware only does a shallow cookie check and does not cover
  // /api/admin at all, so verify the signature here.
  if (!getSession()) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
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

  const db = getDb();
  const rows = await db
    .select({
      id: articles.id,
      title: articles.title,
      status: articles.status,
      userId: articles.userId,
      email: users.email,
      name: users.name,
    })
    .from(articles)
    .leftJoin(users, eq(users.id, articles.userId))
    .where(eq(articles.id, params.id));

  const article = rows[0];
  if (!article) return NextResponse.json({ ok: false, error: "Article not found" }, { status: 404 });

  const firstName = (article.name || "").split(" ")[0];

  if (parsed.data.action === "publish") {
    const urls = parsed.data.publishedUrls!;
    await db
      .update(articles)
      .set({
        status: "published",
        publishedUrls: JSON.stringify(urls),
        publishedAt: new Date(),
        rejectionReason: null,
      })
      .where(eq(articles.id, article.id));

    if (article.email) {
      await sendPublishedEmail({
        to: article.email,
        name: article.name,
        articleId: article.id,
        title: article.title,
        urls,
      });
    }

    return NextResponse.json({ ok: true, status: "published" });
  }

  const reason = parsed.data.rejectionReason?.trim() || "";
  await db
    .update(articles)
    .set({ status: "rejected", rejectionReason: reason || null })
    .where(eq(articles.id, article.id));

  if (article.email) {
    await sendEmail({
      to: article.email,
      subject: `We need a change — ${article.title}`,
      html: wrapEmail(
        "We sent your article back",
        `
        <p>Hi${firstName ? " " + firstName : ""},</p>
        <p>We could not publish <strong>${escapeHtml(article.title)}</strong> as it stands.</p>
        <table style="width:100%;border-collapse:collapse;">
          ${kv("Reason", reason || "Please get in touch and we will explain.")}
        </table>
        <p style="margin-top:16px;">Your article slot is still yours. Open it, make the change and send it again.</p>
        <p style="margin-top:20px;"><a href="${SITE.url}/account/articles/${article.id}" style="background:#c1121f;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Edit and resend</a></p>
      `
      ),
    });
  }

  return NextResponse.json({ ok: true, status: "rejected" });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
