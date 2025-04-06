import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateStagedRoom, saveStagedImage, getUserStagedImages } from "./openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for custom domain validation
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  
  // Special no-op route for handling client-side routes on custom domains
  // This helps ensure that client-side routes like /home-staging-tips work on custom domains
  app.get('/home-staging-tips', (req, res, next) => next());
  app.get('/real-estate-photos', (req, res, next) => next());
  app.get('/virtual-vs-traditional', (req, res, next) => next());
  app.get('/selling-tips', (req, res, next) => next());
  
  // put application routes here
  // prefix all routes with /api

  // OpenAI image generation endpoint
  app.post('/api/generate-staged-room', generateStagedRoom);
  
  // Database routes for staged images
  app.post('/api/staged-images', saveStagedImage);
  app.get('/api/users/:userId/staged-images', getUserStagedImages);
  
  // User routes
  app.get('/api/users/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    
    const user = await storage.getUser(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Don't send password back to client
    const { password, ...userData } = user;
    return res.json(userData);
  });
  
  // Property routes
  app.get('/api/properties/user/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    
    const properties = await storage.getPropertiesByUserId(userId);
    return res.json(properties);
  });
  
  app.get('/api/properties/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid property ID" });
    }
    
    const property = await storage.getProperty(id);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }
    
    return res.json(property);
  });
  
  app.post('/api/properties', async (req, res) => {
    try {
      const property = await storage.createProperty(req.body);
      return res.json(property);
    } catch (err) {
      const error = err as Error;
      return res.status(400).json({ error: error.message });
    }
  });
  
  app.put('/api/properties/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid property ID" });
    }
    
    try {
      const updatedProperty = await storage.updateProperty(id, req.body);
      if (!updatedProperty) {
        return res.status(404).json({ error: "Property not found" });
      }
      
      return res.json(updatedProperty);
    } catch (err) {
      const error = err as Error;
      return res.status(400).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
