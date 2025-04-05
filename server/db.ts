import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { log } from "./vite";

// Initialize PostgreSQL client with the connection string from environment
const connectionString = process.env.DATABASE_URL;

// Check if connection string is available
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create a PostgreSQL client
const client = postgres(connectionString, { max: 1 });

// Initialize Drizzle with the PostgreSQL client
export const db = drizzle(client);

// Log database connection status
log("Database connection initialized");