import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateStagedRoom, saveStagedImage, getUserStagedImages } from "./openai";
import { ipLimiter, getIpUsageStatus, resetIpUsage } from "./ipLimiter";
import Stripe from "stripe";
import crypto from "crypto";

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// Store access tokens temporarily (in production, this would be in a database)
const accessTokens: Record<string, {
  token: string;
  expiresAt: Date;
  planId: string;
  planName: string;
  usageAllowed?: number;
  usageCount: number;
}> = {};

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for custom domain validation
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  
  // Create a fallback route for client-side routing
  const clientRoutes = [
    '/home-staging-tips',
    '/real-estate-photos',
    '/virtual-vs-traditional',
    '/selling-tips'
  ];
  
  // Handle all client routes and send index.html
  clientRoutes.forEach(route => {
    app.get(route, (req, res, next) => {
      if (req.headers.accept?.includes('text/html')) {
        return res.redirect('/');
      }
      next();
    });
  });
  
  // put application routes here
  // prefix all routes with /api

  // IP usage status endpoint
  app.get('/api/usage-status', getIpUsageStatus);
  
  // Check for access token in request headers
  const checkAccessToken = (req: any, res: any, next: any) => {
    // Get token from authorization header or query param
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      // If no token, pass to IP limiter
      return next();
    }
    
    // Check if token exists and is valid
    const accessData = accessTokens[token];
    if (!accessData) {
      // Token doesn't exist, pass to IP limiter
      return next();
    }
    
    // Check if token is expired
    if (new Date() > accessData.expiresAt) {
      // Token expired, delete it and pass to IP limiter
      delete accessTokens[token];
      return next();
    }
    
    // Check usage limits for usage-based plans
    if (accessData.usageAllowed !== undefined) {
      if (accessData.usageCount >= accessData.usageAllowed) {
        // Usage limit reached
        return res.status(402).json({
          success: false,
          error: "Usage limit reached for this plan"
        });
      }
      
      // Increment usage count
      accessData.usageCount++;
    }
    
    // Valid token, bypass IP limits
    req.accessToken = token;
    req.accessData = accessData;
    
    // Reset IP usage for this request to ensure they don't count against free tier
    if (req.ip) {
      resetIpUsage(req.ip);
    }
    
    return next();
  };
  
  // OpenAI image generation endpoint with IP-based usage limiting
  app.post('/api/generate-staged-room', checkAccessToken, ipLimiter, generateStagedRoom);
  
  // Database routes for staged images
  app.post('/api/staged-images', saveStagedImage);
  app.get('/api/users/:userId/staged-images', getUserStagedImages);
  
  // Stripe checkout session creation
  app.post('/api/create-checkout-session', async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe is not configured" });
    }
    
    try {
      const { planId, planName, amount } = req.body;
      
      if (!planId || !amount) {
        return res.status(400).json({ error: "Missing required parameters" });
      }
      
      let successUrl = `${req.protocol}://${req.get('host')}/thank-you?session_id={CHECKOUT_SESSION_ID}`;
      let cancelUrl = `${req.protocol}://${req.get('host')}/upgrade`;
      
      // Handle plans differently based on ID
      let metadata: any = {
        planId,
        planName
      };
      
      let expiresAt;
      if (planId === 'day-pass') {
        // 1-day pass: Set expiration to 24 hours from now
        expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        metadata.expiresAt = expiresAt.toISOString();
      } else if (planId === 'pack-10') {
        // 10 stagings: Set usage limit to 10
        metadata.usageAllowed = 10;
      } else if (planId === 'unlimited') {
        // Unlimited monthly: Set expiration to 30 days from now
        expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        metadata.expiresAt = expiresAt.toISOString();
      }
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: planName,
                description: `AI Room Staging - ${planName}`,
              },
              unit_amount: amount * 100, // convert dollars to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata
      });
      
      res.json({ id: session.id });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });
  
  // Stripe webhook for payment events
  app.post('/api/webhook', async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe is not configured" });
    }
    
    const payload = req.body;
    
    try {
      const event = payload;
      
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          
          if (session.payment_status === 'paid') {
            // Payment was successful, create access token
            const token = crypto.randomBytes(16).toString('hex');
            const { planId, planName, expiresAt, usageAllowed } = session.metadata || {};
            
            // Set expiration date
            let tokenExpires;
            if (expiresAt) {
              tokenExpires = new Date(expiresAt);
            } else {
              // Default: 10 years (for usage-based plans)
              tokenExpires = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000);
            }
            
            // Store token
            accessTokens[token] = {
              token,
              expiresAt: tokenExpires,
              planId: planId || 'unknown',
              planName: planName || 'Unknown Plan',
              usageAllowed: usageAllowed ? parseInt(usageAllowed) : undefined,
              usageCount: 0
            };
            
            console.log(`Created access token for session ${session.id}: ${token}`);
          }
          break;
        }
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
      
      res.json({ received: true });
    } catch (err) {
      const error = err as Error;
      console.error('Webhook error:', error);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  });
  
  // Check checkout session status
  app.get('/api/checkout-status', async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe is not configured" });
    }
    
    const { session_id } = req.query;
    
    if (!session_id) {
      return res.status(400).json({ error: "Missing session ID" });
    }
    
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id as string);
      
      if (session.payment_status === 'paid') {
        // Payment was successful, create access token
        let tokenValue = crypto.randomBytes(16).toString('hex');
        const { planId, planName, expiresAt, usageAllowed } = session.metadata || {};
        
        // Set expiration date
        let tokenExpires;
        if (expiresAt) {
          tokenExpires = new Date(expiresAt);
        } else {
          // Default: 10 years (for usage-based plans)
          tokenExpires = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000);
        }
        
        // Store token if it doesn't already exist
        if (!Object.values(accessTokens).find(at => at.planId === planId && at.expiresAt.getTime() === tokenExpires.getTime())) {
          accessTokens[tokenValue] = {
            token: tokenValue,
            expiresAt: tokenExpires,
            planId: planId || 'unknown',
            planName: planName || 'Unknown Plan',
            usageAllowed: usageAllowed ? parseInt(usageAllowed) : undefined,
            usageCount: 0
          };
          
          console.log(`Created access token for session ${session.id}: ${tokenValue}`);
        } else {
          // Token already exists, find it
          const existingToken = Object.entries(accessTokens).find(([_, at]) => 
            at.planId === planId && at.expiresAt.getTime() === tokenExpires.getTime()
          )?.[0];
          
          if (existingToken) {
            tokenValue = existingToken;
          }
        }
        
        return res.json({
          status: 'complete',
          planName,
          accessUntil: expiresAt,
          usageAllowed: usageAllowed ? parseInt(usageAllowed) : undefined,
          accessToken: tokenValue
        });
      } else if (session.status === 'open') {
        return res.json({ status: 'processing' });
      } else {
        return res.json({ status: 'canceled' });
      }
    } catch (err) {
      const error = err as Error;
      console.error('Error checking session status:', error);
      return res.status(500).json({ error: 'Failed to check payment status' });
    }
  });
  
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
