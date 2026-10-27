import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { markReserved } from "@/lib/reserved-payment";
import { and, eq, sql } from "drizzle-orm";
import { getStripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe";
import { sendEmail, wrapEmail, kv, ADMIN_EMAIL } from "@/lib/email";
import { sourceLabel } from "@/lib/source";
import { getDb } from "@/db";
import { articles, orders, subscriptions, users } from "@/db/schema";
import { findPackageById, findSubscriptionPlanById } from "@/data/packages";
import { SITE } from "@/data/site";
import { reportUrl } from "@/lib/report-link";
import { materialUrl } from "@/lib/material-link";
import { PENDING_PAYMENT } from "@/lib/order-ref";

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

  // Set when the article arrived with the order, before payment — the client
  // then has nothing left to send and the emails must not ask for it.
  let articleOnFile = false;
  let reportArticleId: string | null = null;
  // The order a client paid for without sending an article: its link is what
  // they get instead of instructions to go and sign in somewhere.
  let orderIdForMaterial: string | null = null;

  if (session.mode === "payment") {
    const packageId = session.metadata?.packageId || "unknown";
    const orderRef = session.metadata?.orderRef || null;
    const paymentIntentId =
      typeof session.payment_intent === "string" ? session.payment_intent : null;

    // An order placed through /order already exists, saved before payment with
    // the article attached. Move that row onto the real Stripe session instead
    // of inserting a second one.
    let linkedOrderId: string | null = null;
    if (orderRef) {
      const linked = await db
        .update(orders)
        .set({
          status: "paid",
          stripeSessionId: session.id,
          stripePaymentIntentId: paymentIntentId,
          amount: session.amount_total ?? 0,
          ...(userId ? { userId } : {}),
          paidAt: new Date(),
        })
        .where(and(eq(orders.stripeSessionId, orderRef), eq(orders.status, PENDING_PAYMENT)))
        .returning({ id: orders.id });
      linkedOrderId = linked[0]?.id ?? null;

      if (!linkedOrderId) {
        // Either a Stripe retry, which already moved the row, or a reference
        // that never had an order behind it.
        const already = await db
          .select({ id: orders.id })
          .from(orders)
          .where(eq(orders.stripeSessionId, session.id));
        linkedOrderId = already[0]?.id ?? null;
        if (!linkedOrderId) {
          console.error("[stripe-webhook] orderRef with no pending order:", orderRef);
        }
      }
    }

    // 26.10.2026 — reserved payment (capture_method manual): the card is only
    // authorized. The order proceeds as paid; lib/reserved-payment.ts charges
    // it on publication or releases it after 72 hours.
    const reserved = session.payment_status === "unpaid";
    if (reserved && linkedOrderId) await markReserved(linkedOrderId);

    if (linkedOrderId) {
      const waiting = await db
        .select({ id: articles.id, status: articles.status, body: articles.body })
        .from(articles)
        .where(eq(articles.orderId, linkedOrderId))
        .limit(1);
      articleOnFile = Boolean(waiting[0]?.body);
      reportArticleId = waiting[0]?.id ?? null;
      if (!articleOnFile) orderIdForMaterial = linkedOrderId;

      // Hand the article to the editors and spend the order's single slot. The
      // status guard makes a webhook retry a no-op, so one payment can never
      // buy a second publication from the account pages.
      if (waiting[0]) {
        const submitted = await db
          .update(articles)
          .set({ status: "submitted", submittedAt: new Date() })
          .where(and(eq(articles.id, waiting[0].id), eq(articles.status, "draft")))
          .returning({ id: articles.id });
        if (submitted[0]) {
          await db
            .update(orders)
            .set({
              articlesUsed: sql`LEAST(${orders.articlesUsed} + 1, ${orders.articlesIncluded})`,
            })
            .where(eq(orders.id, linkedOrderId));
        }
      }
    } else {
      // A payment that did not come through the order form: the buyer pays
      // first and sends the article from their account afterwards.
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
          stripePaymentIntentId: paymentIntentId,
          articlesIncluded: 1,
          articlesUsed: 0,
          newspaperStates: session.metadata?.states ?? null,
          source: session.metadata?.source ?? null,
          paidAt: new Date(),
        })
        // The unique index on stripe_session_id makes a Stripe retry a no-op.
        .onConflictDoNothing({ target: orders.stripeSessionId });
      if (reserved) {
        const [row] = await db
          .select({ id: orders.id })
          .from(orders)
          .where(eq(orders.stripeSessionId, session.id));
        if (row) await markReserved(row.id);
      }
    }
  }

  if (session.mode === "subscription" && session.subscription) {
    const subId =
      typeof session.subscription === "string" ? session.subscription : session.subscription.id;
    const sub = await stripe.subscriptions.retrieve(subId);
    await upsertSubscription(sub, userId);
  }

  await sendConfirmationEmails(stripe, session, mode, articleOnFile, reportArticleId, orderIdForMaterial);
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
  mode: string,
  /** The article came in with the order, so there is nothing left to ask for. */
  articleOnFile = false,
  /** Article to link the live report to, when it came in with the order. */
  reportArticleId: string | null = null,
  /** The order a client still owes an article on, for the write-it-here link. */
  orderIdForMaterial: string | null = null
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
    subject: `[Stripe ${isSubscription ? "subscription" : "payment"}] ${packageLabel} — $${amount.toFixed(2)} — from ${sourceLabel(session.metadata?.source)}`,
    replyTo: email || undefined,
    html: wrapEmail(
      isSubscription ? "Subscription started — Stripe" : session.payment_status === "unpaid" ? "Payment RESERVED — Stripe (charged on publication)" : "Payment received — Stripe",
      `
      <p>A payment went through on Stripe.</p>
      <table style="width:100%;border-collapse:collapse;">
        ${kv("Package", packageLabel)}
        ${kv("Amount", `$${amount.toFixed(2)}`)}
        ${kv("Client email", email)}
        ${kv("Client name", session.customer_details?.name || "—")}
        ${kv("Came from", sourceLabel(session.metadata?.source))}
        ${kv("Newspapers", session.metadata?.states || "—")}
        ${kv("Article", articleOnFile ? "Already submitted with the order — ready to publish" : "Not yet — the client sends it from their account")}
        ${kv("Invoice", invoiceNumber ? `${invoiceNumber} — ${invoiceUrl}` : "—")}
        ${kv("Session ID", session.id)}
      </table>
      <p style="margin-top:16px;"><a href="${SITE.url}/admin/${articleOnFile ? "articles" : "orders"}">Open the ${articleOnFile ? "articles" : "orders"} page</a></p>
    `
    ),
  });

  if (!email) return;

  await sendEmail({
    to: email,
    subject: isSubscription ? "Subscription active — Media Chief" : session.payment_status === "unpaid" ? "Order confirmed — Media Chief" : "Payment confirmed — Media Chief",
    html: wrapEmail(
      isSubscription ? "Your subscription is active" : "Payment confirmed",
      `
      <p>Hi${firstName ? " " + firstName : ""},</p>
      ${
        session.payment_status === "unpaid"
          ? `<p>Thank you — <strong>$${amount.toFixed(2)}</strong> for <strong>${packageLabel}</strong> is <strong>reserved</strong> on your card, not charged. You are charged only when your article is published and you receive your report. If we don't publish within 72 hours of receiving your article, the hold is released automatically.</p>`
          : `<p>Thank you — we received <strong>$${amount.toFixed(2)}</strong> for <strong>${packageLabel}</strong>.</p>`
      }
      ${
        invoiceUrl
          ? `<p>Your invoice${invoiceNumber ? ` <strong>${invoiceNumber}</strong>` : ""} is ready: <a href="${invoiceUrl}">view it online</a>${invoicePdf ? ` or <a href="${invoicePdf}">download the PDF</a>` : ""}.</p>`
          : ""
      }
      ${
        articleOnFile
          ? `<p><strong>We already have your article — there is nothing left for you to send.</strong> It is with our editors now. We publish within one business day and email you every link, together with the report in PDF and Excel.</p>
      ${
        reportArticleId
          ? `<p style="margin:20px 0;"><a href="${reportUrl(reportArticleId)}" style="display:inline-block;background:#c1121f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Follow your publication live</a></p>
      <p style="color:#64748b;font-size:13px;">That page shows every newspaper and link as soon as it goes live. Keep it — the link is permanent.</p>`
          : ""
      }
      <p>Want to follow it or add photos? Sign in at <a href="${SITE.url}/account/login">${SITE.domain}/account/login</a> with this same address — <strong>${email}</strong>. We email you a link; there is no password.</p>`
          : `<p><strong>Next step: send us your article.</strong> One link, no password, no account to set up:</p>
      ${
        orderIdForMaterial
          ? `<p style="margin:20px 0;"><a href="${materialUrl(orderIdForMaterial)}" style="display:inline-block;background:#c1121f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Write your article here</a></p>
      <p style="color:#64748b;font-size:13px;">It opens straight onto your order. Paste your text, add up to three photos, and send. The link does not expire, so write it whenever it suits you — and open it again later if you spot something to change.</p>`
          : `<p>Go to <a href="${SITE.url}/account/login">${SITE.domain}/account/login</a> with this same address — <strong>${email}</strong> — and open <em>New article</em>.</p>`
      }
      <p>No text ready? Write the facts in any order and tell us in the notes — we shape it and send it back before anything is published.</p>
      <p>We publish within one business day of receiving it and email you every link.</p>`
      }
      <p style="margin-top:24px;">Best regards,<br/><strong>The Media Chief Team</strong></p>
    `
    ),
  });
}
