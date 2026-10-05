import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const orderStatusEnum = pgEnum("order_status", [
  "pending_payment",
  "paid",
  "fulfilled",
  "cancelled",
  "refunded",
]);
export const paymentChannelEnum = pgEnum("payment_channel", ["card", "ach", "wise", "mpesa"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "succeeded", "failed"]);
export const payoutStatusEnum = pgEnum("payout_status", ["pending", "paid", "failed"]);
export const categoryKindEnum = pgEnum("category_kind", [
  "groceries",
  "fuel",
  "pharmacy",
  "utilities",
  "school_fees",
  "medical",
  "airtime",
  "other",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    // ISO country of residence; drives which card/ACH rails are offered at checkout.
    senderCountry: text("sender_country").notNull().default("US"),
    ...timestamps,
  },
  (t) => [uniqueIndex("users_email_lower_idx").on(sql`lower(${t.email})`)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

/** A person in Kenya who the sender buys goods or services for. */
export const recipients = pgTable(
  "recipients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    relationship: text("relationship"),
    town: text("town"),
    ...timestamps,
  },
  (t) => [index("recipients_sender_idx").on(t.senderId)],
);

/** A merchant that fulfils value-in-kind orders (supermarket, pharmacy, fuel station, school). */
export const merchants = pgTable(
  "merchants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    kind: categoryKindEnum("kind").notNull(),
    town: text("town").notNull(),
    mpesaPaybill: text("mpesa_paybill"),
    bankAccount: text("bank_account"),
    active: boolean("active").notNull().default(true),
    // Platform fee charged on each order, in basis points (e.g. 300 = 3%).
    feeBps: integer("fee_bps").notNull().default(300),
    ...timestamps,
  },
  (t) => [uniqueIndex("merchants_slug_idx").on(t.slug), index("merchants_kind_town_idx").on(t.kind, t.town)],
);

/** A SKU the merchant offers (specific brand, size, price). */
export const merchantItems = pgTable(
  "merchant_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    merchantId: uuid("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    unit: text("unit").notNull().default("each"),
    priceKes: integer("price_kes").notNull(),
    active: boolean("active").notNull().default(true),
    ...timestamps,
  },
  (t) => [index("merchant_items_merchant_idx").on(t.merchantId)],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => recipients.id, { onDelete: "restrict" }),
    merchantId: uuid("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "restrict" }),
    status: orderStatusEnum("status").notNull().default("pending_payment"),
    // Amount charged to the sender's card, in minor units (cents).
    senderAmount: integer("sender_amount").notNull(),
    senderCurrency: text("sender_currency").notNull().default("USD"),
    // Amount owed to the merchant for the goods, in KES.
    merchantAmountKes: integer("merchant_amount_kes").notNull(),
    // Platform margin + FX spread, in KES.
    feeKes: integer("fee_kes").notNull(),
    // FX rate used, locked at checkout — recorded for reconciliation.
    fxRate: integer("fx_rate_ppm").notNull(),
    pickupCode: text("pickup_code").notNull(),
    fulfilledAt: timestamp("fulfilled_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("orders_pickup_code_idx").on(t.pickupCode),
    index("orders_sender_idx").on(t.senderId, t.createdAt),
    index("orders_merchant_idx").on(t.merchantId, t.status),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    itemId: uuid("item_id")
      .notNull()
      .references(() => merchantItems.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull(),
    priceKes: integer("price_kes").notNull(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    channel: paymentChannelEnum("channel").notNull(),
    status: paymentStatusEnum("status").notNull().default("pending"),
    reference: text("reference").notNull(),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex("payments_reference_idx").on(t.reference)],
);

export const payouts = pgTable(
  "payouts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    merchantId: uuid("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "restrict" }),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "restrict" }),
    status: payoutStatusEnum("status").notNull().default("pending"),
    amountKes: integer("amount_kes").notNull(),
    channel: text("channel").notNull().default("mpesa"),
    externalRef: text("external_ref"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("payouts_merchant_idx").on(t.merchantId, t.createdAt)],
);

export const orderRelations = relations(orders, ({ one, many }) => ({
  sender: one(users, { fields: [orders.senderId], references: [users.id] }),
  recipient: one(recipients, { fields: [orders.recipientId], references: [recipients.id] }),
  merchant: one(merchants, { fields: [orders.merchantId], references: [merchants.id] }),
  items: many(orderItems),
  payments: many(payments),
}));

export type Recipient = typeof recipients.$inferSelect;
export type Merchant = typeof merchants.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Payout = typeof payouts.$inferSelect;
