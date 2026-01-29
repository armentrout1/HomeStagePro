import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { stripePurchases, type InsertStripePurchase, feedbackSubmissions } from "@shared/schema";
import { db } from "./db";
import { getOrCreateUsageEntitlement, ensureDbUsageOnSuccess, grantPaidCredits } from "./usageEntitlements";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  generateStagedRoom,
  saveStagedImage,
  getUserStagedImages,
} from "./openai";
import Stripe from "stripe";
import cookieParser from "cookie-parser";
import {
  generateToken,
  verifyToken,
  checkAccessToken,
  requirePaidAccess,
  setAccessTokenCookie,
  attachEntitlement,
  getTokenIdFromRequest,
  requireAuthedUserId,
} from "./tokenManager";
import { getPlanConfig, resolvePlanId } from "./plans";
import { checkoutSessionLimiter } from "./middleware/checkoutSessionLimiter";
import { stagingRateLimiter } from "./middleware/stagingRateLimiter";
import { feedbackRateLimiter } from "./middleware/feedbackRateLimiter";
import { logSecurityEvent } from "./securityEvents";

const isProd = process.env.NODE_ENV === "production";
const debugLog = (...args: any[]) => {
  if (!isProd) console.log(...args);
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Cookie parser must be registered BEFORE any routes that use cookies
  app.use(cookieParser());

  // Health check endpoint for custom domain validation
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Client routes handled client-side; no server-side redirects needed
  const clientRoutes = [
    '/home-staging-tips',
    '/real-estate-photos',
    '/virtual-vs-traditional',
    '/selling-tips'
  ];
  clientRoutes.forEach(route => {
    app.get(route, (_req, _res, next) => next());
  });
  
  // put application routes here
  // prefix all routes with /api

  // IP / token usage status endpoint
  app.get('/api/usage-status', checkAccessToken, async (req, res) => {
    if (!req.accessTokenPayload) {
      return res.status(402).json({
        status: "payment_required",
        message: "Paid access required.",
      });
    }

    const tokenId = getTokenIdFromRequest(req);

    if (!tokenId) {
      return res.status(500).json({ error: "Failed to determine token identifier" });
    }

    try {
      const entitlement = await getOrCreateUsageEntitlement(tokenId);
      const paidRemaining = Math.max(0, entitlement.paidGranted - entitlement.paidUsed);

      return res.json({
        status: "premium" as const,
        paidGranted: entitlement.paidGranted,
        paidUsed: entitlement.paidUsed,
        paidRemaining,
        totalRemaining: paidRemaining,
        planId: req.accessTokenPayload.planId,
        quality: req.accessTokenPayload.quality,
        expiresAt: new Date(req.accessTokenPayload.expiresAt * 1000).toISOString(),
      });
    } catch (error) {
      console.error("Failed to load usage entitlement", error);
      return res.status(500).json({ error: "Failed to load usage entitlement" });
    }
  });
  
  app.get('/api/public-config', (req, res) => {
    const stripePublicKey = process.env.VITE_STRIPE_PUBLIC_KEY ?? null;
    res.json({ stripePublicKey });
  });
  
  // Initialize Stripe
  const stripe = process.env.STRIPE_SECRET_KEY 
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;
  
  app.get('/api/stripe/status', (req, res) => {
    if (process.env.NODE_ENV === "production") {
      return res.status(404).json({ error: "Not found" });
    }

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

  // OpenAI image generation endpoint with IP-based usage limiting
  app.post(
    "/api/generate-staged-room",
    checkAccessToken,
    requirePaidAccess,
    attachEntitlement,
    stagingRateLimiter,
    ensureDbUsageOnSuccess,
    generateStagedRoom,
  );
  
  // Add a test endpoint to check token status
  app.get('/api/check-token', (req, res) => {
    if (process.env.NODE_ENV === "production") {
      return res.status(404).json({ error: "Not found" });
    }

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
  app.post('/api/staged-images', checkAccessToken, saveStagedImage);
  app.get('/api/users/:userId/staged-images', checkAccessToken, getUserStagedImages);

  const feedbackSchema = z
    .object({
      rating: z.number().int().min(1).max(5),
      goal: z.string().min(1),
      issue: z.string().optional().nullable(),
      freeformFeedback: z.string().optional().nullable(),
      source: z
        .enum(["post_render", "post_download", "post_purchase", "nav_tab"])
        .optional(),
      requestedFeature: z.string().optional().nullable(),
      persona: z.string().optional().nullable(),
      usageFrequency: z.string().optional().nullable(),
      pricingPreference: z.string().optional().nullable(),
      willingnessToPayRange: z.string().optional().nullable(),
      watermarkPreference: z.string().optional().nullable(),
      watermarkTextPreference: z.string().optional().nullable(),
      canPublishTestimonial: z.boolean().optional(),
      testimonialName: z.string().optional().nullable(),
      testimonialCompany: z.string().optional().nullable(),
      canShareBeforeAfter: z.boolean().optional(),
      jobId: z.string().optional().nullable(),
      planType: z.string().optional().nullable(),
      roomType: z.string().optional().nullable(),
      styleSelected: z.string().optional().nullable(),
      deviceType: z.string().optional().nullable(),
      country: z.string().optional().nullable(),
      email: z.string().email().optional().nullable(),
      userId: z.number().int().optional().nullable(),
      clientSubmissionId: z.string().uuid().optional().nullable(),
    })
    .transform((data) => ({
      rating: data.rating,
      goal: data.goal,
      issue: data.issue ?? null,
      freeformFeedback: data.freeformFeedback ?? null,
      source: data.source ?? "nav_tab",
      requestedFeature: data.requestedFeature ?? null,
      persona: data.persona ?? null,
      usageFrequency: data.usageFrequency ?? null,
      pricingPreference: data.pricingPreference ?? null,
      willingnessToPayRange: data.willingnessToPayRange ?? null,
      watermarkPreference: data.watermarkPreference ?? null,
      watermarkTextPreference: data.watermarkTextPreference ?? null,
      canPublishTestimonial: data.canPublishTestimonial ?? false,
      testimonialName: data.testimonialName ?? null,
      testimonialCompany: data.testimonialCompany ?? null,
      canShareBeforeAfter: data.canShareBeforeAfter ?? false,
      jobId: data.jobId ?? null,
      planType: data.planType ?? null,
      roomType: data.roomType ?? null,
      styleSelected: data.styleSelected ?? null,
      deviceType: data.deviceType ?? null,
      country: data.country ?? null,
      email: data.email ?? null,
      userId: data.userId ?? null,
      clientSubmissionId: data.clientSubmissionId ?? null,
    }));

  const createPropertySchema = z.object({
    title: z.string().min(1),
    userId: z.number().int().positive(),
    description: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    price: z.number().int().positive().optional().nullable(),
    bedrooms: z.number().int().min(0).optional().nullable(),
    bathrooms: z.number().int().min(0).optional().nullable(),
    squareFeet: z.number().int().min(0).optional().nullable(),
    featuredImageId: z.number().int().positive().optional().nullable(),
    isStaged: z.boolean().optional(),
  });

  const updatePropertySchema = createPropertySchema.partial();

  app.post("/api/feedback", feedbackRateLimiter, async (req, res) => {
    try {
      const parsed = feedbackSchema.parse(req.body);
      const { clientSubmissionId, ...rest } = parsed;

      const updatePayload = {
        ...rest,
        clientSubmissionId,
      };

      const insertQuery = clientSubmissionId
        ? db
            .insert(feedbackSubmissions)
            .values(updatePayload)
            .onConflictDoUpdate({
              target: feedbackSubmissions.clientSubmissionId,
              set: updatePayload,
            })
        : db.insert(feedbackSubmissions).values(parsed);

      const [inserted] = await insertQuery.returning({ id: feedbackSubmissions.id });

      return res.json({ success: true, id: inserted.id });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid feedback payload", details: err.issues });
      }
      console.error("Failed to save feedback", err);
      return res.status(500).json({ error: "Failed to save feedback" });
    }
  });

  app.get("/api/feedback", async (_req, res) => {
    if (process.env.NODE_ENV === "production") {
      return res.status(404).json({ error: "Not found" });
    }

    try {
      const results = await db
        .select()
        .from(feedbackSubmissions)
        .orderBy(desc(feedbackSubmissions.createdAt))
        .limit(200);

      return res.json(results);
    } catch (err) {
      console.error("Failed to fetch feedback", err);
      return res.status(500).json({ error: "Failed to fetch feedback" });
    }
  });
  
  // Stripe checkout session creation
  app.post('/api/create-checkout-session', checkoutSessionLimiter, async (req, res) => {
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
    const rawBody = (req as any).rawBody as Buffer | undefined;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    debugLog(
      `[stripe_webhook] signature_present=${Boolean(signature)} raw_body_length=${
        rawBody ? rawBody.length : 0
      }`,
    );

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
      logSecurityEvent({
        type: "STRIPE_WEBHOOK_ERROR",
        status: 400,
        message: `signature verification failed: ${(err as Error)?.message ?? "unknown error"}`,
      });
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
            debugLog(
              `[stripe_purchases] inserted event=${event.id} session=${session.id} plan=${purchase.planId} amount=${purchase.amountTotalCents}`,
            );
          } catch (err) {
            const dbError = err as { code?: string };
            if (dbError?.code === "23505") {
              console.warn(
                `Stripe purchase already recorded for event ${event.id}`,
              );
            } else {
              console.error(
                `[stripe_purchases] insert_failed event=${event.id}`,
                err,
              );
              return res
                .status(500)
                .send("Webhook Error: Failed to record purchase");
            }
          }

          const { planId } = session.metadata || {};
          // Generate JWT token based on the plan
          if (planId) {
            debugLog(`Processing completed payment for plan: ${planId}`);
            // Token will be set on session status check
          }
          break;
        }
        default:
          debugLog(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (err) {
      const error = err as Error;
      console.error("Webhook error:", error);
      logSecurityEvent({
        type: "STRIPE_WEBHOOK_ERROR",
        status: 500,
        message: error.message ?? "unknown error",
      });
      res.status(500).send(`Webhook Error: ${error.message}`);
    }
  });
  
  // Check checkout session status and set token in cookie
  app.get('/api/checkout-status', checkAccessToken, async (req, res) => {
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
          console.warn(`[entitlements] missing_or_invalid_plan session=${session_id}`);
          return res
            .status(400)
            .json({ error: "Missing plan ID in session metadata" });
        }

        const planConfig = getPlanConfig(planId);
        if (!planConfig) {
          console.warn(`[entitlements] missing_or_invalid_plan session=${session_id}`);
          return res
            .status(400)
            .json({ error: "Invalid plan ID in session metadata" });
        }

        // Check if credits already granted for this session (idempotency)
        const [existingPurchase] = await db
          .select({ tokenId: stripePurchases.tokenId })
          .from(stripePurchases)
          .where(eq(stripePurchases.checkoutSessionId, session_id as string))
          .limit(1);

        let creditsGranted = false;
        
        // Priority for tokenId:
        // 1. If this session already has a tokenId (idempotency for same session)
        // 2. If user already has a valid token cookie (accumulate credits)
        // 3. Generate new tokenId
        const existingCookieTokenId = getTokenIdFromRequest(req);
        const existingTokenId = existingPurchase?.tokenId || existingCookieTokenId;

        const tokenResult = existingTokenId
          ? generateToken(planId, existingTokenId)
          : generateToken(planId);

        const { token, payload } = tokenResult;
        const decoded = verifyToken(token);
        const tokenId = decoded?.jti ?? decoded?.sub ?? null;

        if (!tokenId) {
          console.warn(`[checkout-status] tokenId_missing session=${session.id} plan=${planId}`);
          setAccessTokenCookie(res, tokenResult);

          const expirationDate = new Date(payload.expiresAt * 1000);
          return res.json({
            status: "complete",
            planName: planLabel ?? planId,
            accessUntil: expirationDate.toISOString(),
            usageAllowed: payload.totalUses,
            usesLeft: payload.usesLeft,
            planId: payload.planId,
            quality: payload.quality,
            creditsGranted,
            price: planConfig.price,
            sessionId: session.id,
          });
        }

        if (!existingPurchase?.tokenId) {
          // Only grant credits if this specific session hasn't already granted them
          try {
            await getOrCreateUsageEntitlement(tokenId);
            await grantPaidCredits(tokenId, planConfig.uses);

            const updated = await db
              .update(stripePurchases)
              .set({ tokenId })
              .where(eq(stripePurchases.checkoutSessionId, session.id))
              .returning();

            if (!updated?.length) {
              console.warn("[entitlements] purchase_row_missing", {
                session: session.id,
                tokenId: tokenId.slice(0, 8),
              });
            }

            const isAccumulating = Boolean(existingCookieTokenId);
            debugLog("[entitlements] granted", {
              plan: planId,
              credits: planConfig.uses,
              session: session.id,
              tokenId: tokenId.slice(0, 8),
              accumulated: isAccumulating,
            });
            creditsGranted = true;
          } catch (err) {
            console.error("[checkout-status] entitlement_grant_failed", {
              session: session.id,
              tokenId: tokenId.slice(0, 8),
              error: err,
            });
          }
        }

        setAccessTokenCookie(res, tokenResult);
        const expirationDate = new Date(payload.expiresAt * 1000);

        return res.json({
          status: "complete",
          planName: planLabel ?? planId,
          accessUntil: expirationDate.toISOString(),
          usageAllowed: payload.totalUses,
          usesLeft: payload.usesLeft,
          planId: payload.planId,
          quality: payload.quality,
          creditsGranted,
          price: planConfig.price,
          sessionId: session.id,
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
  app.get('/api/users/:id', checkAccessToken, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const authedUserId = requireAuthedUserId(req);
    if (authedUserId === null) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (authedUserId !== id) {
      return res.status(403).json({ error: "Access denied" });
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
  app.get('/api/properties/user/:userId', checkAccessToken, async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const authedUserId = requireAuthedUserId(req);
    if (authedUserId === null) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (authedUserId !== userId) {
      return res.status(403).json({ error: "Access denied" });
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
  
  app.post('/api/properties', checkAccessToken, async (req, res) => {
    try {
      const parsed = createPropertySchema.parse(req.body);
      const property = await storage.createProperty(parsed);
      return res.json(property);
    } catch (err) {
      const error = err as Error;
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid payload", details: err.issues });
      }
      return res.status(400).json({ error: error.message });
    }
  });
  
  app.put('/api/properties/:id', checkAccessToken, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid property ID" });
    }
    
    try {
      const parsed = updatePropertySchema.parse(req.body);
      const updatedProperty = await storage.updateProperty(id, parsed);
      if (!updatedProperty) {
        return res.status(404).json({ error: "Property not found" });
      }
      
      return res.json(updatedProperty);
    } catch (err) {
      const error = err as Error;
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid payload", details: err.issues });
      }
      return res.status(400).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
