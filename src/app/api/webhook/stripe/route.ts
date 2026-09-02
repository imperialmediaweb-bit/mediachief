import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe";
import { sendEmail, wrapEmail, kv, ADMIN_EMAIL } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { ok: false, error: "Stripe webhook is not configured" },
      { status: 503 }
    );
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json(
      { ok: false, error: "Signature missing" },
      { status: 400 }
    );
  }

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[stripe-webhook] signature verification failed", err);
    return NextResponse.json(
      { ok: false, error: "Invalid signature" },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const email =
      session.customer_details?.email || session.customer_email || "";
    const amount = (session.amount_total || 0) / 100;
    const packageLabel = session.metadata?.packageId || "—";
    const firstName = (session.customer_details?.name || "").split(" ")[0] || "";

    const adminHtml = wrapEmail(
      "Payment received — Stripe",
      `
      <p>A payment was processed successfully through Stripe.</p>
      <table style="width:100%;border-collapse:collapse;">
        ${kv("Package", packageLabel)}
        ${kv("Amount", `$${amount.toFixed(2)}`)}
        ${kv("Client email", email)}
        ${kv("Client name", session.customer_details?.name || "—")}
        ${kv("Session ID", session.id)}
      </table>
      <p style="margin-top:16px;color:#64748b;">Contact the client for the article details.</p>
    `
    );

    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `[Stripe payment] ${packageLabel} — $${amount.toFixed(2)}`,
      html: adminHtml,
      replyTo: email || undefined,
    });

    if (email) {
      const customerHtml = wrapEmail(
        "Payment confirmed — Media Chief",
        `
        <p>Hi${firstName ? " " + firstName : ""},</p>
        <p>Thank you for your payment! We received <strong>$${amount.toFixed(2)}</strong> for the <strong>${packageLabel}</strong> package.</p>
        <p>A member of our team will email you within 2 hours (during business hours) with the publishing details.</p>
        <p style="margin-top:24px;">Best regards,<br/><strong>The Media Chief Team</strong></p>
      `
      );
      await sendEmail({
        to: email,
        subject: "Payment confirmed — Media Chief",
        html: customerHtml,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
