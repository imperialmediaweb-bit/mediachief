import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail, wrapEmail, kv, ADMIN_EMAIL } from "@/lib/email";
import { sendCapiEvent, extractRequestUserData, splitName } from "@/lib/meta-capi";
import { signFbLeadToken } from "@/lib/fb-lead-token";
import { SITE } from "@/data/site";
import { TOTAL_NEWSPAPERS } from "@/data/newspapers";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  phone: z.string().min(9).max(40),
  website: z.string().max(200).optional(),
  eventId: z.string().min(8).max(64).optional(),
});

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;
const log = new Map<string, number[]>();

function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (log.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  log.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX;
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  if (limited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Try again in a few minutes." },
      { status: 429 },
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
      { status: 400 },
    );
  }
  const data = parsed.data;

  // Honeypot
  if (data.website) return NextResponse.json({ ok: true });

  const token = signFbLeadToken({ name: data.name, email: data.email, phone: data.phone });
  const offerUrl = `${SITE.url}/offer/${token}`;
  const firstName = data.name.trim().split(/\s+/)[0];

  const adminResult = await sendEmail({
    to: ADMIN_EMAIL,
    subject: `🔥 [FB Lead] ${data.name} — ${data.phone}`,
    replyTo: data.email,
    html: wrapEmail(
      "New lead — Facebook campaign",
      `
      <p style="margin:0 0 12px;color:#64748b;">Lead from the Facebook ads landing page.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        ${kv("Name", data.name)}
        ${kv("Email", data.email)}
        ${kv("Phone", data.phone)}
        ${kv("Source", "Facebook Ads — /offer-fb")}
        ${kv("IP", ip)}
      </table>
      <p style="margin:16px 0 0;"><a href="${offerUrl}" style="color:#c1121f;">Personalized offer link (sent to the lead automatically)</a></p>
      `,
    ),
  });

  await sendEmail({
    to: data.email,
    subject: "Your personalized offer — Media Chief",
    html: wrapEmail(
      "Your personalized offer — Media Chief",
      `
      <p>Hi ${firstName},</p>
      <p>We've prepared your <strong>personalized offer</strong> with everything you need — packages, pricing and the details of our ${TOTAL_NEWSPAPERS}-newspaper network.</p>
      <p style="margin:24px 0;text-align:center;">
        <a href="${offerUrl}" style="display:inline-block;background:#c1121f;color:white;padding:14px 32px;border-radius:8px;font-weight:700;text-decoration:none;font-size:16px;">
          View my offer →
        </a>
      </p>
      <p style="color:#64748b;font-size:13px;">The link stays valid for 90 days. From the offer page you can place your order or ask us a question.</p>
      <p style="margin-top:24px;">Best regards,<br/><strong>The Media Chief Team</strong></p>
      `,
    ),
  });

  if (!adminResult.ok) {
    return NextResponse.json({ ok: false, error: "Failed to send the email" }, { status: 500 });
  }

  const { firstName: fn, lastName } = splitName(data.name);
  sendCapiEvent({
    eventName: "Lead",
    eventId: data.eventId,
    eventSourceUrl: req.headers.get("referer") || undefined,
    user: { email: data.email, phone: data.phone, firstName: fn, lastName, ...extractRequestUserData(req) },
    customData: { content_name: "Offer FB Landing", content_category: "facebook-ad", lead_source: "facebook" },
  }).catch((err) => console.error("[offer-fb] capi error:", err));

  return NextResponse.json({ ok: true });
}
