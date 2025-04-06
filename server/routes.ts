import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateStagedRoom, saveStagedImage, getUserStagedImages } from "./openai";
import { ipLimiter, getIpUsageStatus, resetIpUsage } from "./ipLimiter";
import Stripe from "stripe";
import cookieParser from "cookie-parser";
import { generateToken, verifyToken, checkAccessToken, TokenType } from "./tokenManager";

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
  
  // Initialize Stripe
  const stripe = process.env.STRIPE_SECRET_KEY 
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;
    
  // Use cookie-parser middleware
  app.use(cookieParser());

  // OpenAI image generation endpoint with IP-based usage limiting
  app.post('/api/generate-staged-room', checkAccessToken, ipLimiter, generateStagedRoom);
  
  // Add a test endpoint to check token status
  app.get('/api/check-token', (req, res) => {
    if (req.cookies?.access_token) {
      const payload = verifyToken(req.cookies.access_token);
      if (payload) {
        // Token is valid, return payload
        return res.json({
          valid: true,
          type: payload.type,
          expiresAt: new Date(payload.expiresAt * 1000).toISOString(),
          usageLeft: payload.type === TokenType.PACK_10 ? payload.usageLeft : undefined
        });
      }
    }
    
    return res.json({ valid: false });
  });
  
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
            const { planId } = session.metadata || {};
            // Generate JWT token based on the plan
            if (planId) {
              console.log(`Processing completed payment for plan: ${planId}`);
              // Token will be set on session status check
            }
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
  
  // Check checkout session status and set token in cookie
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
        // Payment was successful, create JWT token
        const { planId, planName } = session.metadata || {};
        
        if (!planId) {
          return res.status(400).json({ error: "Missing plan ID in session metadata" });
        }

        // Generate JWT token based on the plan type
        const token = generateToken(planId);
        
        // Set token as an HTTP-only cookie
        res.cookie('access_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days max
          sameSite: 'lax'
        });
        
        // Get token payload to return plan info to client
        const payload = verifyToken(token);
        
        // Format expiration date for display
        const expirationDate = payload ? new Date(payload.expiresAt * 1000) : null;
        
        return res.json({
          status: 'complete',
          planName,
          accessUntil: expirationDate ? expirationDate.toISOString() : null,
          usageAllowed: payload?.type === TokenType.PACK_10 ? payload.usageLeft : null
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
