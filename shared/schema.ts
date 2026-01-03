import { pgTable, text, serial, integer, boolean, timestamp, varchar, json } from "drizzle-orm/pg-core";
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
