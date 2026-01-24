import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  varchar,
  jsonb,
  bigserial,
  index,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  stagedImages: many(stagedImages),
  properties: many(properties),
}));

// Staged Images table
export const stagedImages = pgTable("staged_images", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  originalImageUrl: text("original_image_url"),
  stagedImageUrl: text("staged_image_url"),
  originalStoragePath: text("original_storage_path"),
  stagedStoragePath: text("staged_storage_path"),
  storageBucket: text("storage_bucket").default("roomstager-images"),
  roomType: varchar("room_type", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStagedImageSchema = createInsertSchema(stagedImages).pick({
  userId: true,
  originalImageUrl: true,
  stagedImageUrl: true,
  originalStoragePath: true,
  stagedStoragePath: true,
  storageBucket: true,
  roomType: true,
});

export type InsertStagedImage = z.infer<typeof insertStagedImageSchema>;
export type StagedImage = typeof stagedImages.$inferSelect;

// Staged Images relations
export const stagedImagesRelations = relations(stagedImages, ({ one }) => ({
  user: one(users, {
    fields: [stagedImages.userId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [stagedImages.id],
    references: [properties.featuredImageId],
  }),
}));

// Properties table
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  address: text("address"),
  price: integer("price"),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  squareFeet: integer("square_feet"),
  featuredImageId: integer("featured_image_id").references(() => stagedImages.id),
  isStaged: boolean("is_staged").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPropertySchema = createInsertSchema(properties).pick({
  userId: true,
  title: true,
  description: true,
  address: true,
  price: true,
  bedrooms: true,
  bathrooms: true,
  squareFeet: true,
  featuredImageId: true,
  isStaged: true,
});

export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;

// Properties relations
export const propertiesRelations = relations(properties, ({ one, many }) => ({
  user: one(users, {
    fields: [properties.userId],
    references: [users.id],
  }),
  featuredImage: one(stagedImages, {
    fields: [properties.featuredImageId],
    references: [stagedImages.id],
  }),
}));

// Stripe purchases table
export const stripePurchases = pgTable("stripe_purchases", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  stripeEventId: text("stripe_event_id").notNull(),
  checkoutSessionId: text("checkout_session_id").notNull(),
  paymentIntentId: text("payment_intent_id"),
  planId: text("plan_id").notNull(),
  planLabel: text("plan_label"),
  amountTotalCents: integer("amount_total_cents").notNull(),
  currency: text("currency").notNull(),
  paymentStatus: text("payment_status").notNull(),
  livemode: boolean("livemode").notNull().default(false),
  environment: text("environment").notNull().default("test"),
  customerEmail: text("customer_email"),
  cardBrand: text("card_brand"),
  cardLast4: text("card_last4"),
  receiptUrl: text("receipt_url"),
  stripeEvent: jsonb("stripe_event"),
  stripeSession: jsonb("stripe_session"),
  tokenId: text("token_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uxStripeEventId: uniqueIndex("ux_stripe_purchases_event_id").on(table.stripeEventId),
  ixCheckoutSessionId: index("ix_stripe_purchases_checkout_session_id").on(table.checkoutSessionId),
  ixPaymentIntentId: index("ix_stripe_purchases_payment_intent_id").on(table.paymentIntentId),
  ixCreatedAt: index("ix_stripe_purchases_created_at").on(table.createdAt.desc()),
}));

export type StripePurchase = typeof stripePurchases.$inferSelect;
export type InsertStripePurchase = typeof stripePurchases.$inferInsert;

export const usageEntitlements = pgTable(
  "usage_entitlements",
  {
    tokenId: text("token_id").notNull(),
    freeGranted: integer("free_granted").notNull().default(2),
    freeUsed: integer("free_used").notNull().default(0),
    paidGranted: integer("paid_granted").notNull().default(0),
    paidUsed: integer("paid_used").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uxUsageEntitlementsToken: uniqueIndex("ux_usage_entitlements_token").on(
      table.tokenId,
    ),
  }),
);

export type UsageEntitlement = typeof usageEntitlements.$inferSelect;
export type InsertUsageEntitlement = typeof usageEntitlements.$inferInsert;

// IP-based free usage tracking (lifetime 2 free per IP)
export const ipFreeUsage = pgTable(
  "ip_free_usage",
  {
    ipHash: text("ip_hash").notNull(),
    freeUsed: integer("free_used").notNull().default(0),
    freeLimit: integer("free_limit").notNull().default(2),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uxIpFreeUsageIpHash: uniqueIndex("ux_ip_free_usage_ip_hash").on(table.ipHash),
  }),
);

export type IpFreeUsage = typeof ipFreeUsage.$inferSelect;
export type InsertIpFreeUsage = typeof ipFreeUsage.$inferInsert;

export const feedbackSubmissions = pgTable("feedback_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  userId: integer("user_id").references(() => users.id),
  email: text("email"),
  source: text("source").notNull().default("nav_tab"),
  goal: text("goal").notNull(),
  rating: integer("rating").notNull(),
  issue: text("issue"),
  requestedFeature: text("requested_feature"),
  persona: text("persona"),
  usageFrequency: text("usage_frequency"),
  pricingPreference: text("pricing_preference"),
  willingnessToPayRange: text("willingness_to_pay_range"),
  watermarkPreference: text("watermark_preference"),
  watermarkTextPreference: text("watermark_text_preference"),
  freeformFeedback: text("freeform_feedback"),
  canPublishTestimonial: boolean("can_publish_testimonial").notNull().default(false),
  testimonialName: text("testimonial_name"),
  testimonialCompany: text("testimonial_company"),
  canShareBeforeAfter: boolean("can_share_before_after").notNull().default(false),
  jobId: text("job_id"),
  planType: text("plan_type"),
  roomType: text("room_type"),
  styleSelected: text("style_selected"),
  deviceType: text("device_type"),
  country: text("country"),
});

export type FeedbackSubmission = typeof feedbackSubmissions.$inferSelect;
export type InsertFeedbackSubmission = typeof feedbackSubmissions.$inferInsert;
