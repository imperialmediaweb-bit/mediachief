import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyFbLeadToken } from "@/lib/fb-lead-token";
import { sendEmail, wrapEmail, ADMIN_EMAIL } from "@/lib/email";

const schema = z.object({
  token: z.string().min(10),
  question: z.string().min(3).max(2000),
});

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const lead = verifyFbLeadToken(parsed.data.token);
  if (!lead) return NextResponse.json({ ok: false, error: "Invalid token" }, { status: 400 });

  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `❓ Offer question — ${lead.name}`,
    replyTo: lead.email,
    html: wrapEmail(
      `Question from ${lead.name}`,
      `
      <p><strong>From:</strong> ${escapeHtml(lead.name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(lead.email)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(lead.phone)}</p>
      <div style="background:#f8f5f0;border-left:4px solid #c1121f;padding:16px;border-radius:4px;margin:16px 0;">
        <p style="margin:0;font-size:16px;">${escapeHtml(parsed.data.question).replace(/\n/g, "<br/>")}</p>
      </div>
      <p style="color:#64748b;font-size:12px;">Reply directly to their email: ${escapeHtml(lead.email)}</p>
      `,
    ),
  });

  return NextResponse.json({ ok: true });
}
