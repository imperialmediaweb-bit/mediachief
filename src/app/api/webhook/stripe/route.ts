import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { getStripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe";
import { sendEmail, wrapEmail, kv, ADMIN_EMAIL } from "@/lib/email";
import { getDb } from "@/db";
import { orders, subscriptions, users } from "@/db/schema";
import { findPackageById, findSubscriptionPlanById } from "@/data/packages";
import { SITE } from "@/data/site";

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
    return NextResponse.json({ ok: false, error: "Signature missing" }, { status: 400 });
  }

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[stripe-webhook] signature verification failed", err);
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(stripe, event.data.object as Stripe.Checkout.Session);
        break;
      case "invoice.paid":
      case "invoice.payment_succeeded":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await upsertSubscription(event.data.object as Stripe.Subscription, null);
        break;
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await getDb()
          .update(subscriptions)
          .set({ status: "canceled", updatedAt: new Date() })
          .where(eq(subscriptions.id, sub.id));
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : null;
        if (pi) {
          await getDb()
            .update(orders)
            .set({ status: "refunded" })
            .where(eq(orders.stripePaymentIntentId, pi));
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    // Returning 500 makes Stripe retry, which is what we want: the inserts
    // below are idempotent, so a retry cannot duplicate an order.
    console.error("[stripe-webhook] handler failed for", event.type, err);
    return NextResponse.json({ ok: false, error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// ---------------------------------------------------------------------------

/**
 * Finds or creates the client row. A buyer who has never signed in still gets a
 * user record here, so when they later enter the same address at /account/login
 * the magic link lands on the account that already holds their order.
 */
async function ensureUser(args: {
  email: string;
  name?: string | null;
  phone?: string | null;
  stripeCustomerId?: string | null;
  userIdHint?: string | null;
  address?: Stripe.Address | null;
  company?: { name?: string; taxId?: string };
}): Promise<string | null> {
  const db = getDb();
  const email = args.email.trim().toLowerCase();

  const patch: Record<string, unknown> = {};
  if (args.name) patch.name = args.name;
  if (args.phone) patch.phone = args.phone;
  if (args.stripeCustomerId) patch.stripeCustomerId = args.stripeCustomerId;
  if (args.company?.name) patch.companyName = args.company.name;
  if (args.company?.taxId) patch.companyCui = args.company.taxId;
  if (args.address) {
    const line = [
      args.address.line1,
      args.address.line2,
      args.address.postal_code,
      args.address.city,
      args.address.state,
      args.address.country,
    ]
      .filter(Boolean)
      .join(", ");
    if (line) patch.companyAddress = line;
  }

  if (args.userIdHint) {
    const found = await db.select({ id: users.id }).from(users).where(eq(users.id, args.userIdHint));
    if (found[0]) {
      if (Object.keys(patch).length) await db.update(users).set(patch).where(eq(users.id, found[0].id));
      return found[0].id;
    }
  }

  if (email) {
    const found = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
    if (found[0]) {
      if (Object.keys(patch).length) await db.update(users).set(patch).where(eq(users.id, found[0].id));
      return found[0].id;
    }
    const id = crypto.randomUUID();
    await db.insert(users).values({ id, email, ...patch }).onConflictDoNothing();
    const again = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
    return again[0]?.id ?? id;
  }

  return null;
}

async function handleCheckoutCompleted(stripe: Stripe, session: Stripe.Checkout.Session) {
  const db = getDb();
  const email = (session.customer_details?.email || session.customer_email || "").trim();
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  const userIdHint = session.metadata?.userId || session.client_reference_id || null;

  const taxId = session.customer_details?.tax_ids?.[0]?.value;
  const userId = await ensureUser({
    email,
    name: session.customer_details?.name,
    phone: session.customer_details?.phone,
    stripeCustomerId: customerId ?? null,
    userIdHint,
    address: session.customer_details?.address ?? null,
    company: { taxId: taxId ?? undefined },
  });

  const mode = session.metadata?.mode || session.mode;

  if (session.mode === "payment") {
    const packageId = session.metadata?.packageId || "unknown";
    // "pick" orders buy one run across the states the buyer selected; a normal
    // package buys one run too. Subscriptions are handled separately below.
    await db
      .insert(orders)
      .values({
        userId,
        email: email || "unknown@media-chief.com",
        packageId,
        amount: session.amount_total ?? 0,
        currency: session.currency ?? "usd",
        status: "paid",
        stripeSessionId: session.id,
        stripePaymentIntentId:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
        articlesIncluded: 1,
        articlesUsed: 0,
        newspaperStates: session.metadata?.states ?? null,
        paidAt: new Date(),
      })
      // The unique index on stripe_session_id makes a Stripe retry a no-op.
      .onConflictDoNothing({ target: orders.stripeSessionId });
  }

  if (session.mode === "subscription" && session.subscription) {
    const subId =
      typeof session.subscription === "string" ? session.subscription : session.subscription.id;
    const sub = await stripe.subscriptions.retrieve(subId);
    await upsertSubscription(sub, userId);
  }

  await sendConfirmationEmails(stripe, session, mode);
}

async function upsertSubscription(sub: Stripe.Subscription, userIdHint: string | null) {
  const db = getDb();
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  const planId = sub.metadata?.planId || "";
  const category = sub.metadata?.category || "standard";
  const plan = planId ? findSubscriptionPlanById(planId) : undefined;
  const included = plan?.distributionsPerMonth ?? Number(sub.metadata?.articlesIncludedPerMonth ?? 1);

  let userId = userIdHint || sub.metadata?.userId || null;
  if (!userId && customerId) {
    const found = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.stripeCustomerId, customerId));
    userId = found[0]?.id ?? null;
  }
  if (!userId) {
    console.warn("[stripe-webhook] subscription without a user", sub.id);
    return;
  }

  const periodEnd = new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000);
  const existing = await db.select({ id: subscriptions.id }).from(subscriptions).where(eq(subscriptions.id, sub.id));

  if (existing[0]) {
    await db
      .update(subscriptions)
      .set({
        status: sub.status,
        category,
        planId: planId || undefined,
        articlesIncludedPerMonth: included,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, sub.id));
    return;
  }

  await db
    .insert(subscriptions)
    .values({
      id: sub.id,
      userId,
      stripeCustomerId: customerId ?? "",
      planId: planId || "unknown",
      category,
      status: sub.status,
      articlesIncludedPerMonth: included,
      articlesRemaining: included,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    })
    .onConflictDoNothing();
}

/** Monthly renewal: refill the article allowance. */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subId =
    typeof (invoice as unknown as { subscription?: string }).subscription === "string"
      ? (invoice as unknown as { subscription: string }).subscription
      : null;
  if (!subId) return;

  const db = getDb();
  const rows = await db.select().from(subscriptions).where(eq(subscriptions.id, subId));
  const row = rows[0];
  if (!row) return;

  const plan = findSubscriptionPlanById(row.planId);
  const included = plan?.distributionsPerMonth ?? row.articlesIncludedPerMonth;

  await db
    .update(subscriptions)
    .set({
      articlesIncludedPerMonth: included,
      articlesRemaining: included,
      status: "active",
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, subId));
}

async function sendConfirmationEmails(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
  mode: string
) {
  const email = (session.customer_details?.email || session.customer_email || "").trim();
  const amount = (session.amount_total || 0) / 100;
  const packageId = session.metadata?.packageId || session.metadata?.planId || "—";
  const pkg = findPackageById(packageId);
  const plan = findSubscriptionPlanById(packageId);
  const packageLabel = pkg?.name || (plan ? `${plan.name} subscription` : packageId);
  const firstName = (session.customer_details?.name || "").split(" ")[0] || "";
  const isSubscription = mode === "subscription" || session.mode === "subscription";

  let invoiceUrl = "";
  let invoicePdf = "";
  let invoiceNumber = "";
  const invoiceId = typeof session.invoice === "string" ? session.invoice : session.invoice?.id;
  if (invoiceId) {
    try {
      const invoice = await stripe.invoices.retrieve(invoiceId);
      invoiceUrl = invoice.hosted_invoice_url || "";
      invoicePdf = invoice.invoice_pdf || "";
      invoiceNumber = invoice.number || "";
    } catch (err) {
      console.error("[stripe-webhook] could not load invoice", invoiceId, err);
    }
  }

  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `[Stripe ${isSubscription ? "subscription" : "payment"}] ${packageLabel} — $${amount.toFixed(2)}`,
    replyTo: email || undefined,
    html: wrapEmail(
      isSubscription ? "Subscription started — Stripe" : "Payment received — Stripe",
      `
      <p>A payment went through on Stripe.</p>
      <table style="width:100%;border-collapse:collapse;">
        ${kv("Package", packageLabel)}
        ${kv("Amount", `$${amount.toFixed(2)}`)}
        ${kv("Client email", email)}
        ${kv("Client name", session.customer_details?.name || "—")}
        ${kv("Newspapers", session.metadata?.states || "—")}
        ${kv("Invoice", invoiceNumber ? `${invoiceNumber} — ${invoiceUrl}` : "—")}
        ${kv("Session ID", session.id)}
      </table>
      <p style="margin-top:16px;"><a href="${SITE.url}/admin/orders">Open the orders page</a></p>
    `
    ),
  });

  if (!email) return;

  await sendEmail({
    to: email,
    subject: isSubscription ? "Subscription active — Media Chief" : "Payment confirmed — Media Chief",
    html: wrapEmail(
      isSubscription ? "Your subscription is active" : "Payment confirmed",
      `
      <p>Hi${firstName ? " " + firstName : ""},</p>
      <p>Thank you — we received <strong>$${amount.toFixed(2)}</strong> for <strong>${packageLabel}</strong>.</p>
      ${
        invoiceUrl
          ? `<p>Your invoice${invoiceNumber ? ` <strong>${invoiceNumber}</strong>` : ""} is ready: <a href="${invoiceUrl}">view it online</a>${invoicePdf ? ` or <a href="${invoicePdf}">download the PDF</a>` : ""}.</p>`
          : ""
      }
      <p><strong>Next step: send us your article.</strong></p>
      <ol>
        <li>Go to <a href="${SITE.url}/account/login">${SITE.domain}/account/login</a> and enter this same email address — <strong>${email}</strong>.</li>
        <li>We email you a sign-in link. No password to remember.</li>
        <li>Inside, open <em>New article</em>, paste your text and add up to three photos. No text ready? Give us the topic and we write it.</li>
      </ol>
      <p>We publish within one business day of receiving it and email you every link.</p>
      <p style="margin-top:24px;">Best regards,<br/><strong>The Media Chief Team</strong></p>
    `
    ),
  });
}
