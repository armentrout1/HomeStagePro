import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateStagedRoom } from "./openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // OpenAI image generation endpoint
  app.post('/api/generate-staged-room', generateStagedRoom);

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  const httpServer = createServer(app);

  return httpServer;
}
