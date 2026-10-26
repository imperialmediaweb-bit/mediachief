import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// -------------------- NextAuth tables --------------------

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique().notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  // Billing / company details (for the invoice)
  phone: text("phone"),
  companyName: text("company_name"),
  companyCui: text("company_cui"),
  companyRegNo: text("company_reg_no"),
  companyAddress: text("company_address"),
  // Stripe
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compositePk: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

// -------------------- Domain tables --------------------

export const subscriptions = pgTable("subscription", {
  id: text("id").primaryKey(), // Stripe subscription id
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  stripeCustomerId: text("stripe_customer_id").notNull(),
  planId: text("plan_id").notNull(), // bronze | silver | gold | platinum
  category: text("category").notNull(), // standard | casino
  status: text("status").notNull(), // active | past_due | canceled | trialing | unpaid | incomplete
  articlesIncludedPerMonth: integer("articles_included_per_month").notNull(),
  articlesRemaining: integer("articles_remaining").notNull().default(0),
  currentPeriodEnd: timestamp("current_period_end", { mode: "date" }).notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orders = pgTable("order", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  email: text("email").notNull(),
  packageId: text("package_id").notNull(),
  amount: integer("amount").notNull(), // in cents
  currency: text("currency").notNull().default("usd"),
  status: text("status").notNull().default("pending"), // pending | paid | refunded | canceled
  stripeSessionId: text("stripe_session_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  // How many articles this order entitles the buyer to, and how many are used.
  // A one-off package buys one publication run; without this an order could be
  // spent over and over.
  articlesIncluded: integer("articles_included").notNull().default(1),
  articlesUsed: integer("articles_used").notNull().default(0),
  // "pick" orders carry the chosen states so the operator knows where to publish.
  newspaperStates: text("newspaper_states"),
  // The campaign this order became in the publishing network, and the token of
  // its public report page. Set once the order is handed over.
  networkOrderId: integer("network_order_id"),
  networkReportToken: text("network_report_token"),
  // Newspapers per day, as the buyer chose it on the order form. Null means
  // they did not choose, which is read as all at once.
  publishingPace: integer("publishing_pace"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  paidAt: timestamp("paid_at"),
}, (t) => ({
  // Stripe retries webhook deliveries; without this a retry inserts a duplicate.
  stripeSessionIdx: uniqueIndex("order_stripe_session_id_idx").on(t.stripeSessionId),
  userIdx: index("order_user_id_idx").on(t.userId),
}));

export const articles = pgTable("article", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  orderId: text("order_id").references(() => orders.id, { onDelete: "set null" }),
  subscriptionId: text("subscription_id").references(() => subscriptions.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  body: text("body"),
  notes: text("notes"),
  existingUrl: text("existing_url"),
  aiGenerated: boolean("ai_generated").default(false).notNull(),
  status: text("status").notNull().default("draft"), // draft | submitted | published | rejected
  publishedUrls: text("published_urls"), // JSON array string
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  submittedAt: timestamp("submitted_at"),
  publishedAt: timestamp("published_at"),
});

export const uploads = pgTable("upload", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  articleId: text("article_id")
    .notNull()
    .references(() => articles.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  cloudinaryPublicId: text("cloudinary_public_id").notNull(),
  url: text("url").notNull(),
  kind: text("kind").notNull().default("image"),
  width: integer("width"),
  height: integer("height"),
  bytes: integer("bytes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
