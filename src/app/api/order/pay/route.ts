import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/lib/stripe";
import { SITE } from "@/data/site";
import { sourceFromRequest } from "@/lib/source";
import { findOrderByRef, PENDING_PAYMENT } from "@/lib/order-ref";
import { findPackageById } from "@/data/packages";
import { createLimiter, ipFromRequest } from "@/lib/rate-limit";

export const runtime = "nodejs";

const tooMany = createLimiter(20, 10 * 60 * 1000);

const schema = z.object({ ref: z.string().min(10).max(80) });

/**
 * Step two: the article is already saved, now take the money. Card only —
 * Media Chief has no bank transfer and no WhatsApp, so there is nothing to
 * choose between here, which is why this opens Stripe directly.
 *
 * The amount comes from the stored order, which was priced server-side at
 * intake, so this step cannot be talked into a different number either.
 */
export async function POST(req: NextRequest) {
  if (tooMany(ipFromRequest(req))) {
    return NextResponse.json({ ok: false, error: "Too many attempts. Try again shortly." }, { status: 429 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ ok: false, error: "Card payment is unavailable right now." }, { status: 503 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid data" }, { status: 400 });
  }
  const { ref } = parsed.data;

  const order = await findOrderByRef(ref);
  if (!order) {
    return NextResponse.json({ ok: false, error: "We cannot find that order." }, { status: 404 });
  }
  if (order.status !== PENDING_PAYMENT) {
    return NextResponse.json({ ok: false, error: "This order is already paid." }, { status: 409 });
  }

  // Where the client came from (lib/source.ts), carried to the webhook email.
  const source = order.source || sourceFromRequest(req);
  const pkg = findPackageById(order.packageId);
  const name =
    order.packageId === "pick"
      ? `Publication in ${order.newspaperStates?.split(",").length || 0} newspapers`
      : pkg?.name || order.packageId;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: order.email,
      line_items: [
        {
          price_data: {
            currency: order.currency || "usd",
            unit_amount: order.amount,
            product_data: {
              name,
              description: "One article, a unique version on every newspaper in your order",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        mode: "package",
        packageId: order.packageId,
        // This is what lets the webhook find the article already waiting.
        orderRef: ref,
        ...(order.newspaperStates ? { states: order.newspaperStates } : {}),
        ...(source ? { source } : {}),
      },
      payment_intent_data: {
        // 26.10.2026 — reserved payment: the card is only authorized here and
        // charged on publication (lib/reserved-payment.ts).
        capture_method: "manual",
        description: `${name} — ${order.email}`,
        metadata: { orderRef: ref },
        // No invoice on Media Chief: the buyer gets Stripe's card receipt.
        receipt_email: order.email,
      },
      customer_creation: "always",
      allow_promotion_codes: true,
      success_url: `${SITE.url}/order/pay/${ref}?paid=1`,
      cancel_url: `${SITE.url}/order/pay/${ref}`,
    });
    return NextResponse.json({ ok: true, url: session.url });
  } catch (err) {
    console.error("[order/pay] stripe:", err);
    return NextResponse.json(
      { ok: false, error: "Could not open the card payment. Please try again." },
      { status: 500 }
    );
  }
}
