import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/lib/stripe";
import { findPackageById, findSubscriptionPlanById, pickPrice } from "@/data/packages";
import { NEWSPAPERS } from "@/data/newspapers";
import { stateAbbr } from "@/data/us-states";
import { sourceFromRequest } from "@/lib/source";
import { SITE } from "@/data/site";

export const runtime = "nodejs";

const checkoutSchema = z.object({
  packageId: z.string().min(1).max(64),
  mode: z.enum(["package", "pick", "subscription-standard", "subscription-casino"]).default("package"),
  email: z.string().email().optional(),
  // "pick" only: the states the client selected, and whether it is iGaming.
  states: z.array(z.string().min(2).max(40)).max(60).optional(),
  casino: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ ok: false, error: "Stripe is not configured" }, { status: 503 });
  }
  // Where the client came from (lib/source.ts), carried to the webhook.
  const source = sourceFromRequest(req);

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
  const { packageId, mode, email, states, casino } = parsed.data;

  const successUrl = `${SITE.url}/order/thank-you?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${SITE.url}/order/cancelled`;

  try {
    if (mode === "pick") {
      // Only states we actually publish in count, deduplicated. The price is
      // computed here from that count — never taken from the browser.
      const known = new Map(NEWSPAPERS.map((n) => [n.state || n.name, n]));
      const chosen = Array.from(new Set(states || [])).filter((s) => known.has(s));
      if (chosen.length === 0) {
        return NextResponse.json({ ok: false, error: "Pick at least one newspaper" }, { status: 400 });
      }
      const isCasino = Boolean(casino);
      const amount = pickPrice(chosen.length, isCasino);
      const label = `${chosen.length} newspaper${chosen.length === 1 ? "" : "s"}${isCasino ? " (casino / iGaming)" : ""}`;
      // Stripe caps a metadata value at 500 characters, so store abbreviations.
      const abbrs = chosen.map((s) => stateAbbr(s) || s).join(",").slice(0, 490);

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: email,
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: amount * 100,
              product_data: {
                name: `Publication in ${label}`,
                description: "One article, a unique version on each newspaper you selected",
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          mode,
          packageId: "pick",
          category: isCasino ? "casino" : "standard",
          newspapers: String(chosen.length),
          states: abbrs,
          ...(source ? { source } : {}),
        },
        customer_creation: "always",
        // No invoice on Media Chief: the buyer gets Stripe's card receipt.
        // 26.10.2026 — reserved payment: authorized now, charged on publication.
        payment_intent_data: { receipt_email: email, capture_method: "manual" },
        success_url: successUrl,
        cancel_url: cancelUrl,
        locale: "en",
        allow_promotion_codes: true,
      });
      return NextResponse.json({ ok: true, url: session.url });
    }

    if (mode === "package") {
      const pkg = findPackageById(packageId);
      if (!pkg) {
        return NextResponse.json({ ok: false, error: "Package not found" }, { status: 404 });
      }
      const name = `${pkg.name} (${pkg.category === "casino" ? "Casino" : "Standard"})`;
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
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
        metadata: { packageId, mode, category: pkg.category, ...(source ? { source } : {}) },
        customer_creation: "always",
        // No invoice on Media Chief: the buyer gets Stripe's card receipt.
        // 26.10.2026 — reserved payment: authorized now, charged on publication.
        payment_intent_data: { receipt_email: email, capture_method: "manual" },
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
      metadata: { planId: plan.id, category, mode, ...(source ? { source } : {}) },
      subscription_data: {
        description: `${name} — ${plan.distributionsPerMonth} article/month across the ${SITE.name} network`,
        metadata: {
          planId: plan.id,
          category,
          articlesIncludedPerMonth: String(plan.distributionsPerMonth),
        },
      },
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
