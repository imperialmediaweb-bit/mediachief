import { NextRequest, NextResponse } from "next/server";
import { orderSchema } from "@/lib/validators";
import { sendEmail, wrapEmail, kv, ADMIN_EMAIL } from "@/lib/email";
import { findPackageById, SUBSCRIPTION_PLANS } from "@/data/packages";
import { formatPrice } from "@/lib/utils";

export const runtime = "nodejs";

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;
const requestLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (requestLog.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  requestLog.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "Too many requests. Try again in a few minutes." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.errors[0]?.message || "Invalid data" },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Honeypot: if bots fill website field, silently succeed
  if (data.website) {
    return NextResponse.json({ ok: true });
  }

  let packageLabel = data.packageId;
  let packagePrice = "";
  if (data.packageId.startsWith("sub-")) {
    const sub = SUBSCRIPTION_PLANS.find((s) => s.id === data.packageId.replace("sub-", ""));
    if (sub) {
      packageLabel = `${sub.name} subscription (${sub.description})`;
      packagePrice = `$${formatPrice(sub.priceStandard)}/month (standard) • $${formatPrice(sub.priceCasino)}/month (casino)`;
    }
  } else {
    const pkg = findPackageById(data.packageId);
    if (pkg) {
      packageLabel = `${pkg.name} (${pkg.category === "casino" ? "Casino" : "Standard"})`;
      packagePrice = `$${formatPrice(pkg.price)}`;
    }
  }

  const html = wrapEmail(
    "New Media Chief order",
    `
    <p style="margin:0 0 16px;color:#64748b;">A new order came in through the website form.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      ${kv("Package", packageLabel)}
      ${kv("Price", packagePrice)}
      ${kv("Name", data.name)}
      ${kv("Email", data.email)}
      ${kv("Phone", data.phone)}
      ${kv("Company", data.company || "—")}
      ${kv("Article title", data.articleTitle)}
      ${kv("Existing article URL", data.articleUrl || "—")}
      ${kv("Notes", data.notes || "—")}
    </table>
    ${
      data.articleBody
        ? `<div style="margin-top:20px;padding:16px;background:#F8F5F0;border-radius:8px;"><strong style="color:#0B2545;">Article text:</strong><pre style="white-space:pre-wrap;font-family:inherit;margin:8px 0 0;color:#334155;font-size:14px;">${data.articleBody.replace(/</g, "&lt;")}</pre></div>`
        : ""
    }
    <p style="margin:24px 0 0;color:#64748b;font-size:13px;">
      Reply directly to this email to reach the client.
    </p>
  `
  );

  const adminResult = await sendEmail({
    to: ADMIN_EMAIL,
    subject: `[Order] ${packageLabel} — ${data.name}`,
    html,
    replyTo: data.email,
  });

  // Send confirmation to customer
  const customerHtml = wrapEmail(
    "Order received — Media Chief",
    `
    <p>Hi ${data.name.split(" ")[0]},</p>
    <p>Thank you for choosing Media Chief! We received your order successfully.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      ${kv("Package", packageLabel)}
      ${kv("Price", packagePrice)}
      ${kv("Article title", data.articleTitle)}
    </table>
    <p>Our team will contact you within 2 hours (during business hours) with the billing details and publication confirmation.</p>
    <p style="margin-top:24px;">Best regards,<br/><strong>The Media Chief Team</strong></p>
  `
  );

  await sendEmail({
    to: data.email,
    subject: "We received your order — Media Chief",
    html: customerHtml,
  });

  if (!adminResult.ok) {
    return NextResponse.json({ ok: false, error: "Failed to send the email" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
