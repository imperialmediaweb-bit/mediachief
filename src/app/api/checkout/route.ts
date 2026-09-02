import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/lib/stripe";
import { findPackageById, SUBSCRIPTION_PLANS } from "@/data/packages";
import { SITE } from "@/data/site";

export const runtime = "nodejs";

const checkoutSchema = z.object({
  packageId: z.string().min(1).max(64),
  mode: z
    .enum(["package", "subscription-standard", "subscription-casino"])
    .default("package"),
  email: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { ok: false, error: "Stripe is not configured" },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid data" }, { status: 400 });
  }
  const { packageId, mode, email } = parsed.data;

  let name: string;
  let amountInCents: number;

  if (mode === "package") {
    const pkg = findPackageById(packageId);
    if (!pkg) {
      return NextResponse.json(
        { ok: false, error: "Package not found" },
        { status: 404 }
      );
    }
    name = `${pkg.name} (${pkg.category === "casino" ? "Casino" : "Standard"})`;
    amountInCents = pkg.price * 100;
  } else {
    const sub = SUBSCRIPTION_PLANS.find((s) => s.id === packageId);
    if (!sub) {
      return NextResponse.json(
        { ok: false, error: "Subscription not found" },
        { status: 404 }
      );
    }
    const isCasino = mode === "subscription-casino";
    name = `${sub.name} subscription (${isCasino ? "Casino" : "Standard"})`;
    amountInCents = (isCasino ? sub.priceCasino : sub.priceStandard) * 100;
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: amountInCents,
            product_data: {
              name,
              description:
                "Advertorial / press release publication on the Media Chief network",
            },
          },
          quantity: 1,
        },
      ],
      metadata: { packageId, mode },
      success_url: `${SITE.url}/order/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE.url}/order/cancelled`,
      locale: "en",
      allow_promotion_codes: true,
    });
    return NextResponse.json({ ok: true, url: session.url });
  } catch (err) {
    console.error("[checkout] Stripe error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to create the checkout session" },
      { status: 500 }
    );
  }
}
