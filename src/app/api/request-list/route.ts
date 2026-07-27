import { NextRequest, NextResponse } from "next/server";
import { requestListSchema } from "@/lib/validators";
import { sendEmail, wrapEmail, kv, ADMIN_EMAIL } from "@/lib/email";
import { REGION_COUNTS } from "@/data/newspapers";
import { SITE } from "@/data/site";

export const runtime = "nodejs";

const DAY_MS = 86_400_000;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = requestListSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.errors[0]?.message || "Invalid data" },
      { status: 400 }
    );
  }
  const data = parsed.data;
  if (data.website) return NextResponse.json({ ok: true });

  const firstName = data.name.split(" ")[0];

  // 1) Initial email: network summary + PDF mention
  const customerHtml = wrapEmail(
    "The full list of our 50 partner newspapers",
    `
    <p>Hi ${firstName},</p>
    <p>Thank you for your interest in Media Chief! Here is a summary of our network:</p>
    <table style="width:100%;border-collapse:collapse;margin:20px 0;">
      ${kv("Northeast", `${REGION_COUNTS.Northeast} newspapers`)}
      ${kv("Midwest", `${REGION_COUNTS.Midwest} newspapers`)}
      ${kv("South", `${REGION_COUNTS.South} newspapers`)}
      ${kv("West", `${REGION_COUNTS.West} newspapers`)}
      ${kv("States covered", "all 50 U.S. states")}
      ${kv("Facebook distribution", "37 associated pages")}
    </table>
    <p>The detailed list with the names and domains of all 50 partner newspapers is available as a PDF document. <strong>To protect our network</strong>, we send the document directly by email after a short conversation — a team member will contact you within 24h.</p>
    <p>If you'd like to move faster, just reply to this email with a short description of your project.</p>
    <p style="margin-top:24px;">Best regards,<br/><strong>The Media Chief Team</strong></p>
  `
  );

  await sendEmail({
    to: data.email,
    subject: "The Media Chief network — details for you",
    html: customerHtml,
  });

  // 2) Admin notification — new lead
  const adminHtml = wrapEmail(
    "New lead: newspaper list request",
    `
    <table style="width:100%;border-collapse:collapse;">
      ${kv("Name", data.name)}
      ${kv("Email", data.email)}
      ${kv("Phone", data.phone || "—")}
      ${kv("Company", data.company || "—")}
    </table>
    <p style="margin-top:20px;color:#64748b;">Contact this lead within 24h to send the detailed list and start the sale.</p>
  `
  );
  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `[Lead] Newspaper list request — ${data.name}`,
    html: adminHtml,
    replyTo: data.email,
  });

  // 3) Drip follow-up: day 3 — soft nudge with the entry-level package
  const day3 = new Date(Date.now() + 3 * DAY_MS).toISOString();
  await sendEmail({
    to: data.email,
    subject: "Test the network with a small article",
    scheduledAt: day3,
    replyTo: ADMIN_EMAIL,
    html: wrapEmail(
      "Test the network with a small article",
      `
      <p>Hi ${firstName},</p>
      <p>A few days ago you requested the Media Chief network list. If you'd like to test it risk-free, the <strong>Local ($150)</strong> package publishes your article in a state newspaper of your choice — you get the link within 24h.</p>
      <p style="margin:24px 0;"><a href="${SITE.url}/packages#standard" style="display:inline-block;background:#c1121f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">See the Local package</a></p>
      <p>If you want different coverage (10 newspapers / 50 newspapers / a subscription), just reply to this email and I'll make the right recommendation.</p>
      <p style="margin-top:24px;">Best regards,<br/><strong>The Media Chief Team</strong></p>
      `
    ),
  });

  // 4) Drip follow-up: day 7 — last call with a discount
  const day7 = new Date(Date.now() + 7 * DAY_MS).toISOString();
  await sendEmail({
    to: data.email,
    subject: "Last call — discount on your first article",
    scheduledAt: day7,
    replyTo: ADMIN_EMAIL,
    html: wrapEmail(
      "Discount on your first article — limited offer",
      `
      <p>Hi ${firstName},</p>
      <p>I want to make you a fair offer on your first article. If you choose to publish with us in the next 48h, I'll automatically apply <strong>a discount</strong> to the package you pick.</p>
      <p>Reply to this email with <strong>&ldquo;yes&rdquo;</strong> and I'll confirm the discount right away.</p>
      <p style="margin:24px 0;"><a href="${SITE.url}/packages" style="display:inline-block;background:#c1121f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">See all packages</a></p>
      <p style="margin-top:24px;">Best regards,<br/><strong>The Media Chief Team</strong></p>
      `
    ),
  });

  return NextResponse.json({ ok: true });
}
