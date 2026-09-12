import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/lib/stripe";
import { findPackageById, findSubscriptionPlanById } from "@/data/packages";
import { SITE } from "@/data/site";

export const runtime = "nodejs";

const checkoutSchema = z.object({
  packageId: z.string().min(1).max(64),
  mode: z.enum(["package", "subscription-standard", "subscription-casino"]).default("package"),
  email: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ ok: false, error: "Stripe is not configured" }, { status: 503 });
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

  const successUrl = `${SITE.url}/order/thank-you?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${SITE.url}/order/cancelled`;

  try {
    if (mode === "package") {
      const pkg = findPackageById(packageId);
      if (!pkg) {
        return NextResponse.json({ ok: false, error: "Package not found" }, { status: 404 });
      }
      const name = `${pkg.name} (${pkg.category === "casino" ? "Casino" : "Standard"})`;
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: email,
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: pkg.price * 100,
              product_data: {
                name,
                description: "Advertorial / press release publication on the Media Chief network",
              },
            },
            quantity: 1,
          },
        ],
        metadata: { packageId, mode, category: pkg.category },
        billing_address_collection: "required",
        // Stripe issues the invoice (PDF + hosted page) with the business
        // details from the Stripe account, so the site never has to generate
        // one. Buyers can add their company name and tax ID at checkout.
        customer_creation: "always",
        tax_id_collection: { enabled: true },
        invoice_creation: {
          enabled: true,
          invoice_data: {
            description: `${name} — publication on the ${SITE.name} network (${pkg.newspapers} newspapers)`,
            footer: "Service delivered electronically. Thank you for your order.",
            metadata: { packageId, category: pkg.category },
          },
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
        locale: "en",
        allow_promotion_codes: true,
      });
      return NextResponse.json({ ok: true, url: session.url });
    }

    const plan = findSubscriptionPlanById(packageId);
    if (!plan) {
      return NextResponse.json({ ok: false, error: "Subscription not found" }, { status: 404 });
    }
    const isCasino = mode === "subscription-casino";
    const category = isCasino ? "casino" : "standard";
    const amount = (isCasino ? plan.priceCasino : plan.priceStandard) * 100;
    const name = `${plan.name} subscription (${isCasino ? "Casino" : "Standard"})`;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: amount,
            recurring: { interval: "month" },
            product_data: { name },
          },
          quantity: 1,
        },
      ],
      metadata: { planId: plan.id, category, mode },
      // Subscriptions are invoiced by Stripe every month automatically.
      tax_id_collection: { enabled: true },
      subscription_data: {
        description: `${name} — ${plan.distributionsPerMonth} article/month across the ${SITE.name} network`,
        metadata: {
          planId: plan.id,
          category,
          articlesIncludedPerMonth: String(plan.distributionsPerMonth),
        },
      },
      billing_address_collection: "required",
      success_url: successUrl,
      cancel_url: cancelUrl,
      locale: "en",
      allow_promotion_codes: true,
    });
    return NextResponse.json({ ok: true, url: session.url });
  } catch (err) {
    console.error("[checkout] Stripe error:", err);
    return NextResponse.json({ ok: false, error: "Failed to create the checkout session" }, { status: 500 });
  }
}
