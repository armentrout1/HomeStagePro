import {
  fulfillCheckout,
  activateGrant,
  registerAccessRoutes,
  appOrigin,
} from "./access";
import { registerStagingJobs } from "./stagingJobs";
import { registerEmailWebhook } from "./emailDelivery";
import { recordBillingAdjustment } from "./billingAdjustments";
import { newCheckoutBinding, setCheckoutBinding, canActivateCheckout, analyticsOrderId } from "./checkoutAccess";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  stripePurchases,
  type InsertStripePurchase,
  feedbackSubmissions,
} from "@shared/schema";
import { db, client } from "./db";
import {
  getOrCreateUsageEntitlement,
  ensureDbUsageOnSuccess,
  grantPaidCredits,
} from "./usageEntitlements";
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
import { ipLimiter, getIpUsageStatus } from "./ipLimiter";

const isProd = process.env.NODE_ENV === "production";
const debugLog = (...args: any[]) => {
  if (!isProd) console.log(...args);
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Cookie parser must be registered BEFORE any routes that use cookies
  app.use(cookieParser());
  registerEmailWebhook(app);

  // Health check endpoint for custom domain validation
  app.get("/api/health", async (_req, res) => {
    try {
      const [ready] =
        await client`SELECT to_regclass('public.access_grants') IS NOT NULL AND to_regclass('public.staging_jobs') IS NOT NULL AND to_regclass('public.access_email_outbox') IS NOT NULL
          AND to_regclass('public.staging_work') IS NOT NULL AND to_regclass('public.access_email_delivery') IS NOT NULL AND to_regclass('public.billing_refunds') IS NOT NULL AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='staging_jobs' AND column_name='purged_at') AS ready`;
      res
        .status(ready.ready ? 200 : 503)
        .json({ status: ready.ready ? "ok" : "migration_required" });
    } catch {
      res.status(503).json({ status: "database_unavailable" });
    }
  });

  // Client routes handled client-side; no server-side redirects needed
  const clientRoutes = [
    "/home-staging-tips",
    "/real-estate-photos",
    "/virtual-vs-traditional",
    "/selling-tips",
  ];
  clientRoutes.forEach((route) => {
    app.get(route, (_req, _res, next) => next());
  });

  // put application routes here
  // prefix all routes with /api

  // IP / token usage status endpoint
  app.get("/api/usage-status", checkAccessToken, async (req, res) => {
    if (!req.accessTokenPayload) {
      // If no token, check IP-based usage status
      return res.json({
        status: "payment_required",
        remaining: 0,
        totalRemaining: 0,
        message: "Choose a credit pack or reopen your email access link.",
      });
    }

    const tokenId = getTokenIdFromRequest(req);

    if (!tokenId) {
      return res
        .status(500)
        .json({ error: "Failed to determine token identifier" });
    }

    try {
      const entitlement = await getOrCreateUsageEntitlement(tokenId);
      const paidRemaining = Math.max(
        0,
        entitlement.paidGranted - entitlement.paidUsed,
      );

      return res.json({
        status: paidRemaining > 0 ? "premium" : "payment_required",
        paidGranted: entitlement.paidGranted,
        paidUsed: entitlement.paidUsed,
        paidRemaining,
        totalRemaining: paidRemaining,
        planId: req.accessTokenPayload.planId,
        quality: req.accessTokenPayload.quality,
        expiresAt: new Date(
          req.accessTokenPayload.expiresAt * 1000,
        ).toISOString(),
      });
    } catch (error) {
      console.error("Failed to load usage entitlement", error);
      return res
        .status(500)
        .json({ error: "Failed to load usage entitlement" });
    }
  });

  app.get("/api/public-config", (req, res) => {
    const stripePublicKey = process.env.VITE_STRIPE_PUBLIC_KEY ?? null;
    res.json({ stripePublicKey });
  });

  // Initialize Stripe
  const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;

  app.get("/api/stripe/status", (req, res) => {
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

  registerAccessRoutes(app);
  registerStagingJobs(app);

  // Add a test endpoint to check token status
  app.get("/api/check-token", (req, res) => {
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
  app.post("/api/staged-images", checkAccessToken, (_req, res) =>
    res
      .status(410)
      .json({ error: "Images are saved automatically during staging." }),
  );
  app.get(
    "/api/users/:userId/staged-images",
    checkAccessToken,
    getUserStagedImages,
  );

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

      const [inserted] = await insertQuery.returning({
        id: feedbackSubmissions.id,
      });

      return res.json({ success: true, id: inserted.id });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid feedback payload", details: err.issues });
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
  app.post(
    "/api/create-checkout-session",
    checkoutSessionLimiter,
    async (req, res) => {
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

        let successUrl = `${appOrigin()}/thank-you?session_id={CHECKOUT_SESSION_ID}`;
        let cancelUrl = `${appOrigin()}/upgrade`;

        const planLabel =
          planId === "pro-monthly"
            ? "Pro Pack (30 days)"
            : planId === "value-pack"
              ? "Value Pack"
              : "Quick Pack";
        const expiresAt =
          planConfig.durationDays === 365
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            : new Date(
                Date.now() + planConfig.durationDays * 24 * 60 * 60 * 1000,
              );

        const binding = newCheckoutBinding();
        const metadata: Stripe.Checkout.SessionCreateParams["metadata"] = {
          browserBinding: binding.hash,
          planId,
          planLabel,
          usesAllowed: String(planConfig.uses),
          quality: planConfig.quality,
        };

        if (planConfig.durationDays) {
          metadata.expiresAt = expiresAt.toISOString();
        }

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: planLabel,
                  description: `AI Room Staging - ${planLabel}`,
                },
                unit_amount: planConfig.price * 100,
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata,
        });

        setCheckoutBinding(res, session.id, binding.secret);
        res.json({ id: session.id, url: session.url });
      } catch (error) {
        console.error("Error creating checkout session:", error);
        res.status(500).json({ error: "Failed to create checkout session" });
      }
    },
  );

  // Stripe webhook for payment events
  app.post("/api/webhook", async (req, res) => {
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
      console.error("Webhook signature verification failed");
      logSecurityEvent({
        type: "STRIPE_WEBHOOK_ERROR",
        status: 400,
        message: `signature verification failed: ${(err as Error)?.message ?? "unknown error"}`,
      });
      return res.status(400).send("Webhook signature verification failed");
    }

    try {
      switch (event.type) {
        case "refund.created":
        case "refund.updated":
        case "refund.failed":
        case "charge.refunded":
        case "charge.dispute.created":
        case "charge.dispute.updated":
        case "charge.dispute.closed": {
          const object=event.data.object as any;
          const isDispute=event.type.startsWith("charge.dispute.");
          const chargeId=event.type==="charge.refunded" ? object.id : typeof object.charge==="string" ? object.charge : object.charge?.id;
          if(!chargeId) throw new Error("Billing event is missing its charge");
          const charge=await stripe.charges.retrieve(chargeId);
          const paymentIntentId=typeof charge.payment_intent==="string" ? charge.payment_intent : charge.payment_intent?.id;
          if(!paymentIntentId) break;
          // Adopt existing checkout records even when refund/dispute delivery wins the webhook race.
          const sessions=await stripe.checkout.sessions.list({payment_intent:paymentIntentId,limit:10});
          for(const session of sessions.data) if(getPlanConfig(session.metadata?.planId) && session.payment_status==="paid") await fulfillCheckout(session);
          if(isDispute) {
            const dispute=await stripe.disputes.retrieve(object.id);
            const blocked=!["won","warning_closed"].includes(dispute.status);
            await recordBillingAdjustment({eventId:event.id,paymentIntentId,kind:event.type,eventCreated:event.created,disputed:blocked});
          } else {
            // Use current refund objects, including failed/canceled refunds, rather than a stale cumulative charge snapshot.
            for await(const refund of stripe.refunds.list({charge:chargeId,limit:100})) {
              await recordBillingAdjustment({eventId:`${event.id}:${refund.id}`,paymentIntentId,kind:event.type,eventCreated:event.created,refund:{id:refund.id,amount:refund.amount,status:refund.status||"pending"}});
            }
          }
          break;
        }
        case "checkout.session.completed":
        case "checkout.session.async_payment_succeeded": {
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
              session.customer_details?.email ?? session.customer_email ?? null,
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
            if ((dbError?.code || (err as any)?.cause?.code) === "23505") {
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

          const grant = await fulfillCheckout(session);
          // The return page can win the race before the webhook purchase row exists.
          await client`UPDATE stripe_purchases SET token_id=${grant.token_id} WHERE checkout_session_id=${session.id}`;
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
  app.get("/api/checkout-status", checkAccessToken, async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe is not configured" });
    }

    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({ error: "Missing session ID" });
    }

    try {
      const session = await stripe.checkout.sessions.retrieve(
        session_id as string,
      );

      if (session.payment_status === "paid") {
        if (!canActivateCheckout(req, session)) {
          return res.status(403).json({ error: "Open the private link in your purchase email to access this pack on this device.", code: "EMAIL_ACCESS_REQUIRED" });
        }
        const grant = await fulfillCheckout(session);
        if (!activateGrant(res, grant))
          return res.status(410).json({
            error:
              "This pack has expired. Open your latest access link or choose a new pack.",
          });
        const entitlement = await getOrCreateUsageEntitlement(grant.token_id);
        const plan = getPlanConfig(grant.plan_id)!;
        res.set("Cache-Control", "no-store");
        return res.json({
          status: "complete",
          planName: session.metadata?.planLabel || grant.plan_id,
          accessUntil: new Date(grant.expires_at).toISOString(),
          usageAllowed: Math.max(
            0,
            entitlement.paidGranted - entitlement.paidUsed,
          ),
          planId: grant.plan_id,
          price: plan.price,
          orderId: analyticsOrderId(session.id),
          livePayment: session.livemode,
          emailDeliveryConfigured: Boolean(
            process.env.RESEND_API_KEY && process.env.ACCESS_EMAIL_FROM,
          ),
        });
      } else if (session.status === "open") {
        return res.json({ status: "processing" });
      } else {
        return res.json({ status: "canceled" });
      }
    } catch (err) {
      const error = err as Error;
      console.error("Error checking session status:", error);
      return res.status(500).json({ error: "Failed to check payment status" });
    }
  });

  // User routes
  app.get("/api/users/:id", checkAccessToken, async (req, res) => {
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
  app.get(
    "/api/properties/user/:userId",
    checkAccessToken,
    async (req, res) => {
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
    },
  );

  app.get("/api/properties/:id", checkAccessToken, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid property ID" });
    }

    const property = await storage.getProperty(id);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    if (
      requireAuthedUserId(req) === null ||
      property.userId !== requireAuthedUserId(req)
    )
      return res.status(403).json({ error: "Access denied" });
    return res.json(property);
  });

  app.post("/api/properties", checkAccessToken, async (req, res) => {
    try {
      const parsed = createPropertySchema.parse(req.body);
      const owner = requireAuthedUserId(req);
      if (owner === null || parsed.userId !== owner)
        return res.status(403).json({ error: "Access denied" });
      const property = await storage.createProperty(parsed);
      return res.json(property);
    } catch (err) {
      const error = err as Error;
      if (err instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid payload", details: err.issues });
      }
      return res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/properties/:id", checkAccessToken, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid property ID" });
    }

    try {
      const parsed = updatePropertySchema.parse(req.body);
      const owner = requireAuthedUserId(req);
      const existing = await storage.getProperty(id);
      if (owner === null || !existing || existing.userId !== owner)
        return res.status(403).json({ error: "Access denied" });
      const updatedProperty = await storage.updateProperty(id, {
        ...parsed,
        userId: owner,
      });
      if (!updatedProperty) {
        return res.status(404).json({ error: "Property not found" });
      }

      return res.json(updatedProperty);
    } catch (err) {
      const error = err as Error;
      if (err instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Invalid payload", details: err.issues });
      }
      return res.status(400).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
