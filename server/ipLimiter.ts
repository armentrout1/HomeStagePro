import { Request, Response, NextFunction } from "express";
import { createHash } from "crypto";
import { db } from "./db";
import { ipFreeUsage } from "@shared/schema";
import { sql } from "drizzle-orm";
import { log } from "./vite";
import { FREE_QUALITY } from "./plans";
import { hasValidAccess } from "./tokenManager";
import { logSecurityEvent } from "./securityEvents";

// Hash IP for privacy (don't store raw IPs)
const hashIp = (ip: string): string =>
  createHash("sha256").update(ip).digest("hex").slice(0, 16);

// Free usage limit
const FREE_USAGE_LIMIT = 2;
export const DISABLE_USAGE_LIMITS = process.env.DISABLE_USAGE_LIMITS === "true";

if (process.env.NODE_ENV === "production" && DISABLE_USAGE_LIMITS) {
  throw new Error("DISABLE_USAGE_LIMITS must not be enabled in production");
}

const UNLIMITED_USAGE_LIMIT = 999_999;

/**
 * Get the client IP address from the request
 */
const getClientIp = (req: Request): string =>
  req.ip ||
  (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
  "0.0.0.0";

/**
 * Get or create IP free usage record from database
 */
export const getOrCreateIpFreeUsage = async (ipHash: string): Promise<{ freeUsed: number; freeLimit: number }> => {
  const result = await db.execute(sql`
    INSERT INTO ip_free_usage (ip_hash, free_used, free_limit)
    VALUES (${ipHash}, 0, ${FREE_USAGE_LIMIT})
    ON CONFLICT (ip_hash) DO NOTHING
    RETURNING free_used, free_limit
  `);

  if (result.length > 0) {
    const row = result[0] as { free_used: number; free_limit: number };
    return { freeUsed: row.free_used, freeLimit: row.free_limit };
  }

  // Row already existed, fetch it
  const [existing] = await db.execute(sql`
    SELECT free_used, free_limit FROM ip_free_usage WHERE ip_hash = ${ipHash}
  `) as { free_used: number; free_limit: number }[];

  return { freeUsed: existing?.free_used ?? 0, freeLimit: existing?.free_limit ?? FREE_USAGE_LIMIT };
};

/**
 * Consume one free usage for an IP (returns remaining count)
 */
export const consumeIpFreeUsage = async (ipHash: string): Promise<{ freeUsed: number; freeRemaining: number } | null> => {
  const result = await db.execute(sql`
    UPDATE ip_free_usage
    SET free_used = free_used + 1, updated_at = NOW()
    WHERE ip_hash = ${ipHash} AND free_used < free_limit
    RETURNING free_used, free_limit
  `);

  if (!result || result.length === 0) {
    return null; // No free usage remaining
  }

  const row = result[0] as { free_used: number; free_limit: number };
  return {
    freeUsed: row.free_used,
    freeRemaining: Math.max(0, row.free_limit - row.free_used),
  };
};

/**
 * Middleware to track and limit API requests by IP address
 * Bypasses limits if user has a valid access token
 */
export const ipLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (DISABLE_USAGE_LIMITS) {
    return next();
  }

  // If user has a valid access token, bypass IP limiting
  if (hasValidAccess(req)) {
    log("Request has valid access token, bypassing IP limits");
    return next();
  }
  
  // Get the client IP address and hash it
  const clientIp = getClientIp(req);
  const ipHash = hashIp(clientIp);

  try {
    // Ensure record exists
    await getOrCreateIpFreeUsage(ipHash);
    
    // Try to consume one free usage
    const result = await consumeIpFreeUsage(ipHash);
    
    if (!result) {
      // No free usage remaining
      log(`IP ${ipHash.slice(0, 8)}... has no free usage remaining`);
      return res.status(402).json({
        success: false,
        error: "Limit reached. Upgrade to continue.",
        redirect: "/upgrade"
      });
    }

    log(`IP ${ipHash.slice(0, 8)}... used free ${result.freeUsed} of ${FREE_USAGE_LIMIT}, remaining=${result.freeRemaining}`);
    next();
  } catch (err) {
    log(`IP limiter error: ${err}`);

    if (process.env.NODE_ENV === "production") {
      logSecurityEvent({
        type: "USAGE_LIMITER_UNAVAILABLE",
        path: req.path,
        message: String(err),
      });
      return res.status(503).json({
        error: "Usage limiter unavailable. Please try again shortly.",
      });
    }

    return next();
  }
};

/**
 * Get the current usage for an IP address from database
 */
export const getIpUsage = async (ip: string): Promise<number> => {
  const ipHash = hashIp(ip);
  const usage = await getOrCreateIpFreeUsage(ipHash);
  return usage.freeUsed;
};

/**
 * Get the usage count and limit for a specific IP address
 * Also includes information about any active access token
 */
export const getIpUsageStatus = async (req: Request, res: Response) => {
  const clientIp = getClientIp(req);
  const ipHash = hashIp(clientIp);
  
  let freeUsed = 0;
  let freeRemaining = FREE_USAGE_LIMIT;
  
  try {
    const usage = await getOrCreateIpFreeUsage(ipHash);
    freeUsed = usage.freeUsed;
    freeRemaining = Math.max(0, usage.freeLimit - usage.freeUsed);
  } catch (err) {
    log(`Error fetching IP usage: ${err}`);
  }
  
  const freeUsageSummary = {
    freeLimit: FREE_USAGE_LIMIT,
    freeUsed,
    freeRemaining,
  };

  // Check for valid access token first
  if (hasValidAccess(req) && req.accessTokenPayload) {
    // User has a valid access token
    const payload = req.accessTokenPayload;
    const now = Math.floor(Date.now() / 1000);

    const timeRemaining = Math.max(payload.expiresAt - now, 0);

    const response = {
      // Basic status
      usageCount: payload.totalUses - payload.usesLeft,
      limit: payload.totalUses,
      remaining: payload.usesLeft,
      status: "premium" as const,
      planId: payload.planId,
      quality: payload.quality,
      expiresAt: new Date(payload.expiresAt * 1000).toISOString(),
      timeRemainingSeconds: timeRemaining,
      ...freeUsageSummary,
    };

    return res.json(response);
  }

  if (DISABLE_USAGE_LIMITS) {
    return res.json({
      usageCount: 0,
      limit: UNLIMITED_USAGE_LIMIT,
      remaining: UNLIMITED_USAGE_LIMIT,
      status: "unlimited",
      quality: FREE_QUALITY,
      ...freeUsageSummary,
    });
  }

  // If no token, use IP-based limiting
  return res.json({
    usageCount: freeUsed,
    limit: FREE_USAGE_LIMIT,
    remaining: freeRemaining,
    status: freeRemaining === 0 ? "exceeded" : "active",
    quality: FREE_QUALITY,
    ...freeUsageSummary,
  });
};