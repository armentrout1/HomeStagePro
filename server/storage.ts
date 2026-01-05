import {
  users,
  type User,
  type InsertUser,
  stagedImages,
  type StagedImage,
  type InsertStagedImage,
  properties,
  type Property,
  type InsertProperty,
  stripePurchases,
  type StripePurchase,
  type InsertStripePurchase,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Staged Image operations
  getStagedImage(id: number): Promise<StagedImage | undefined>;
  getStagedImagesByUserId(userId: number): Promise<StagedImage[]>;
  createStagedImage(image: InsertStagedImage): Promise<StagedImage>;
  
  // Property operations
  getProperty(id: number): Promise<Property | undefined>;
  getPropertiesByUserId(userId: number): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined>;

  // Stripe purchase operations
  createStripePurchase(purchase: InsertStripePurchase): Promise<StripePurchase>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  // Staged Image operations
  async getStagedImage(id: number): Promise<StagedImage | undefined> {
    const [image] = await db.select().from(stagedImages).where(eq(stagedImages.id, id));
    return image || undefined;
  }
  
  async getStagedImagesByUserId(userId: number): Promise<StagedImage[]> {
    return await db.select().from(stagedImages).where(eq(stagedImages.userId, userId));
  }
  
  async createStagedImage(image: InsertStagedImage): Promise<StagedImage> {
    const [stagedImage] = await db
      .insert(stagedImages)
      .values(image)
      .returning();
    return stagedImage;
  }
  
  // Property operations
  async getProperty(id: number): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property || undefined;
  }
  
  async getPropertiesByUserId(userId: number): Promise<Property[]> {
    return await db.select().from(properties).where(eq(properties.userId, userId));
  }
  
  async createProperty(property: InsertProperty): Promise<Property> {
    const [newProperty] = await db
      .insert(properties)
      .values(property)
      .returning();
    return newProperty;
  }
  
  async updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined> {
    const [updatedProperty] = await db
      .update(properties)
      .set(property)
      .where(eq(properties.id, id))
      .returning();
    return updatedProperty || undefined;
  }

  // Stripe purchase operations
  async createStripePurchase(purchase: InsertStripePurchase): Promise<StripePurchase> {
    const [row] = await db.insert(stripePurchases).values(purchase).returning();
    return row;
  }
}

export const storage = new DatabaseStorage();
