import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { stripePurchases, type InsertStripePurchase } from "@shared/schema";
import { db } from "./db";
import { sql } from "drizzle-orm";
import {
  generateStagedRoom,
  saveStagedImage,
  getUserStagedImages,
} from "./openai";
import { ipLimiter, getIpUsageStatus } from "./ipLimiter";
import Stripe from "stripe";
import cookieParser from "cookie-parser";
import {
  generateToken,
  verifyToken,
  checkAccessToken,
  setAccessTokenCookie,
  attachEntitlement,
  ensureTokenUsageOnSuccess,
} from "./tokenManager";
import { getPlanConfig, resolvePlanId } from "./plans";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for custom domain validation
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // TODO: DEBUG ROUTE - REMOVE BEFORE PRODUCTION
  app.get("/api/stripe-purchases/count", async (req, res) => {
    const debugHeader = req.header("X-Debug-Key");
    const expectedKey = process.env.DEBUG_KEY;

    if (!expectedKey || debugHeader !== expectedKey) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(stripePurchases);

    res.json({ count: Number(result?.count ?? 0) });
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
  app.get('/api/usage-status', checkAccessToken, getIpUsageStatus);
  
  app.get('/api/public-config', (req, res) => {
    const stripePublicKey = process.env.VITE_STRIPE_PUBLIC_KEY ?? null;
    res.json({ stripePublicKey });
  });
  
  // Initialize Stripe
  const stripe = process.env.STRIPE_SECRET_KEY 
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;
  
  app.get('/api/stripe/status', (req, res) => {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let mode: "test" | "live" | "unknown" = "unknown";

    if (secretKey?.startsWith("sk_test_")) {
      mode = "test";
    } else if (secretKey?.startsWith("sk_live_")) {
      mode = "live";
    }

    res.json({
      stripeConfigured: Boolean(secretKey && stripe),
      webhookConfigured: Boolean(webhookSecret),
      mode,
      host: req.get("host") ?? null,
      protocol: req.protocol,
      webhookPath: "/api/webhook",
    });
  });
    
  // Use cookie-parser middleware
  app.use(cookieParser());

  // OpenAI image generation endpoint with IP-based usage limiting
  app.post(
    "/api/generate-staged-room",
    checkAccessToken,
    attachEntitlement,
    ipLimiter,
    ensureTokenUsageOnSuccess,
    generateStagedRoom,
  );
  
  // Add a test endpoint to check token status
  app.get('/api/check-token', (req, res) => {
    if (req.cookies?.access_token) {
      const payload = verifyToken(req.cookies.access_token);
      if (payload) {
        // Token is valid, return payload
        return res.json({
          valid: true,
          planId: payload.planId,
          expiresAt: new Date(payload.expiresAt * 1000).toISOString(),
          usageLeft: payload.usesLeft,
          totalUses: payload.totalUses,
          quality: payload.quality,
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
      const { planId, planName } = req.body;
      if (!planId) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      if (!resolvePlanId(planId)) {
        return res.status(400).json({
          error: "Unknown plan ID",
          allowedPlanIds: ["quick-pack", "value-pack", "pro-monthly"],
        });
      }

      const planConfig = getPlanConfig(planId);
      if (!planConfig) {
        return res.status(400).json({ error: "Unsupported plan" });
      }
      
      let successUrl = `${req.protocol}://${req.get('host')}/thank-you?session_id={CHECKOUT_SESSION_ID}`;
      let cancelUrl = `${req.protocol}://${req.get('host')}/upgrade`;
      
      const planLabel = planName ?? `HomeStagePro ${planId}`;
      const expiresAt =
        planConfig.durationDays === 365
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          : new Date(
              Date.now() + planConfig.durationDays * 24 * 60 * 60 * 1000,
            );

      const metadata: Stripe.Checkout.SessionCreateParams["metadata"] = {
        planId,
        planLabel,
        usesAllowed: String(planConfig.uses),
        quality: planConfig.quality,
      };

      if (planConfig.durationDays) {
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
              unit_amount: planConfig.price * 100,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata,
      });
      
      res.json({ id: session.id, url: session.url });
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

    const signature = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      return res
        .status(400)
        .json({ error: "Webhook signature missing or misconfigured" });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        (req as any).rawBody,
        signature as string,
        webhookSecret,
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return res.status(400).send("Webhook signature verification failed");
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;

          if (session.payment_status !== "paid") {
            break;
          }

          const purchase: InsertStripePurchase = {
            stripeEventId: event.id,
            checkoutSessionId: session.id,
            paymentIntentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : null,
            planId: session.metadata?.planId ?? "unknown",
            planLabel: session.metadata?.planLabel ?? null,
            amountTotalCents: session.amount_total ?? 0,
            currency: session.currency ?? "usd",
            paymentStatus: session.payment_status ?? "unknown",
            livemode: Boolean(event.livemode),
            environment: event.livemode ? "live" : "test",
            customerEmail:
              session.customer_details?.email ??
              session.customer_email ??
              null,
            cardBrand: null,
            cardLast4: null,
            receiptUrl: null,
            stripeEvent: event as any,
            stripeSession: session as any,
          };

          try {
            await storage.createStripePurchase(purchase);
            console.log(
              `[stripe_purchases] inserted event=${event.id} session=${session.id} plan=${purchase.planId} amount=${purchase.amountTotalCents}`,
            );
          } catch (err) {
            const dbError = err as { code?: string };
            if (dbError?.code === "23505") {
              console.warn(
                `Stripe purchase already recorded for event ${event.id}`,
              );
            } else {
              throw err;
            }
          }

          const { planId } = session.metadata || {};
          // Generate JWT token based on the plan
          if (planId) {
            console.log(`Processing completed payment for plan: ${planId}`);
            // Token will be set on session status check
          }
          break;
        }
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (err) {
      const error = err as Error;
      console.error("Webhook error:", error);
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
      
      if (session.payment_status === "paid") {
        const { planId, planLabel } = session.metadata || {};

        if (!planId) {
          return res
            .status(400)
            .json({ error: "Missing plan ID in session metadata" });
        }

        const tokenResult = generateToken(planId);
        setAccessTokenCookie(res, tokenResult);

        const payload = tokenResult.payload;
        const expirationDate = new Date(payload.expiresAt * 1000);

        return res.json({
          status: "complete",
          planName: planLabel ?? planId,
          accessUntil: expirationDate.toISOString(),
          usageAllowed: payload.totalUses,
          usesLeft: payload.usesLeft,
          planId: payload.planId,
          quality: payload.quality,
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
