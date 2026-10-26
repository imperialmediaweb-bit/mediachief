import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getDb } from "@/db";
import { articles, orders, users } from "@/db/schema";
import { sendEmail, wrapEmail } from "@/lib/email";
import { reportUrl } from "@/lib/report-link";
import { MESSAGE_TEMPLATES, type MessageContext } from "@/data/client-messages";
import { TOTAL_NEWSPAPERS } from "@/data/newspapers";

export const runtime = "nodejs";

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

const schema = z.object({
  subject: z.string().trim().min(1).max(300),
  body: z.string().trim().min(1).max(20000),
  /** RFC3339; Resend holds the message until then. */
  scheduledAt: z.string().max(40).optional(),
  attachment: z
    .object({
      filename: z.string().trim().min(1).max(200),
      /** base64, without the data: prefix. */
      content: z.string().max(Math.ceil((MAX_ATTACHMENT_BYTES * 4) / 3) + 1024),
    })
    .optional(),
});

/**
 * Writes to the client about their order.
 *
 * The operator used to leave the admin, open their mail client and compose
 * from memory, which is why the same news reached two clients two different
 * ways and why the first paying customer was told nothing at all. The message
 * is prepared from the order's own state, the operator edits it, attaches the
 * receipt or the report if they want, and sends — without the recipient ever
 * being typed by hand.
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!getSession()) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }

  const context = await contextFor(params.id);
  if (!context) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ok: true,
    to: context.to,
    templates: MESSAGE_TEMPLATES.map((t) => ({
      id: t.id,
      label: t.label,
      subject: t.subject(context.vars),
      body: t.body(context.vars),
    })),
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!getSession()) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.errors[0]?.message || "Invalid data" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const context = await contextFor(params.id);
  if (!context) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  if (!context.to) {
    return NextResponse.json(
      { ok: false, error: "This order has no client email address on it." },
      { status: 409 }
    );
  }

  let attachments: { filename: string; content: Buffer }[] | undefined;
  if (d.attachment) {
    const content = Buffer.from(d.attachment.content, "base64");
    if (content.length === 0) {
      return NextResponse.json({ ok: false, error: "That file came through empty." }, { status: 400 });
    }
    if (content.length > MAX_ATTACHMENT_BYTES) {
      return NextResponse.json(
        { ok: false, error: "Attachments have to be under 5 MB." },
        { status: 400 }
      );
    }
    attachments = [{ filename: d.attachment.filename, content }];
  }

  // Blank lines are paragraphs; a bare line break is a line break. What the
  // operator typed is what the client reads.
  const html = wrapEmail(
    d.subject,
    d.body
      .split(/\n\s*\n+/)
      .map((block) => `<p>${escapeHtml(block.trim()).replace(/\n/g, "<br>")}</p>`)
      .join("")
  );

  const sent = await sendEmail({
    to: context.to,
    subject: d.subject,
    html,
    ...(attachments ? { attachments } : {}),
    ...(d.scheduledAt ? { scheduledAt: d.scheduledAt } : {}),
  });

  if (!sent.ok) {
    return NextResponse.json({ ok: false, error: sent.error }, { status: 200 });
  }
  return NextResponse.json({
    ok: true,
    to: context.to,
    messageId: sent.id || null,
    scheduledAt: d.scheduledAt || null,
  });
}

async function contextFor(
  articleId: string
): Promise<{ to: string; vars: MessageContext } | null> {
  const db = getDb();
  const rows = await db
    .select({
      article: articles,
      email: users.email,
      name: users.name,
      amount: orders.amount,
    })
    .from(articles)
    .leftJoin(users, eq(users.id, articles.userId))
    .leftJoin(orders, eq(orders.id, articles.orderId))
    .where(eq(articles.id, articleId));

  const row = rows[0];
  if (!row) return null;

  let placed = 0;
  if (row.article.publishedUrls) {
    try {
      const parsed = JSON.parse(row.article.publishedUrls);
      if (Array.isArray(parsed)) placed = parsed.length;
    } catch {
      placed = 0;
    }
  }

  return {
    to: row.email || "",
    vars: {
      firstName: (row.name || "").trim().split(" ")[0] || "",
      title: row.article.title,
      reportUrl: reportUrl(row.article.id),
      placed,
      total: TOTAL_NEWSPAPERS,
      amount: row.amount ? `$${(row.amount / 100).toFixed(2)}` : "the agreed amount",
    },
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
