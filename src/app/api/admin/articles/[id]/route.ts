import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getDb } from "@/db";
import { articles, users } from "@/db/schema";
import { sendEmail, wrapEmail, kv } from "@/lib/email";
import { SITE } from "@/data/site";
import { reportUrl } from "@/lib/report-link";

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
      await sendEmail({
        to: article.email,
        subject: `Your article is live — ${article.title}`,
        html: wrapEmail(
          "Your article is published",
          `
          <p>Hi${firstName ? " " + firstName : ""},</p>
          <p><strong>${escapeHtml(article.title)}</strong> is now live on ${urls.length} newspaper${urls.length === 1 ? "" : "s"}. Every link below is permanent.</p>
          <ul style="padding-left:18px;">
            ${urls.map((u) => `<li style="margin-bottom:6px;"><a href="${u}">${escapeHtml(u)}</a></li>`).join("")}
          </ul>
          <p style="margin-top:20px;"><a href="${reportUrl(article.id)}" style="background:#c1121f;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Open your full report</a></p>
          <p style="margin-top:8px;font-size:13px;color:#64748b;">The report lists every newspaper with its link. No sign-in needed, and the link is permanent — share it with your team.</p>
          <p style="margin-top:12px;">Download the report: <a href="${SITE.url}/api/articles/${article.id}/report?format=pdf">PDF</a> · <a href="${SITE.url}/api/articles/${article.id}/report?format=csv">Excel</a> — sign in with this address first.</p>
          <p style="margin-top:20px;color:#64748b;font-size:13px;">We publish the article and give you the links. Whether it brings visitors or customers is not something we promise.</p>
        `
        ),
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
