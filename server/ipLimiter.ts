import { Request, Response, NextFunction } from "express";
import { log } from "./vite";
import { FREE_QUALITY } from "./plans";
import { hasValidAccess } from "./tokenManager";


// In-memory store to track IP usage
const ipUsageStore: Record<string, number> = {};

// Free usage limit
const FREE_USAGE_LIMIT = 2;
export const DISABLE_USAGE_LIMITS = process.env.DISABLE_USAGE_LIMITS === "true";
const UNLIMITED_USAGE_LIMIT = 999_999;

/**
 * Get the client IP address from the request
 */
const getClientIp = (req: Request): string =>
  req.ip ||
  (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
  "0.0.0.0";

/**
 * Middleware to track and limit API requests by IP address
 * Bypasses limits if user has a valid access token
 */
export const ipLimiter = (
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
  
  // Get the client IP address
  const clientIp = getClientIp(req);

  // Initialize count if it doesn't exist
  if (!ipUsageStore[clientIp]) {
    ipUsageStore[clientIp] = 0;
  }
  
  // Increment the usage count
  ipUsageStore[clientIp]++;

  // Log the usage for debugging
  log(`IP ${clientIp} made request ${ipUsageStore[clientIp]} of ${FREE_USAGE_LIMIT}`);
  
  // Check if the limit has been reached
  if (ipUsageStore[clientIp] > FREE_USAGE_LIMIT) {
    return res.status(402).json({
      success: false,
      error: "Limit reached. Upgrade to continue.",
      redirect: "/upgrade"
    });
  }
  
  // Continue to the next middleware or route handler
  next();
};

/**
 * Get the current usage for an IP address
 */
export const getIpUsage = (ip: string): number => {
  return ipUsageStore[ip] || 0;
};

/**
 * Reset usage for an IP (for testing or administrative purposes)
 */
export const resetIpUsage = (ip: string): void => {
  ipUsageStore[ip] = 0;
};

/**
 * Get all current IP usage data
 */
export const getAllIpUsage = (): Record<string, number> => {
  return { ...ipUsageStore };
};

/**
 * Get the usage count and limit for a specific IP address
 * Also includes information about any active access token
 */
export const getIpUsageStatus = (req: Request, res: Response) => {
  const clientIp = getClientIp(req);
  const freeUsed = ipUsageStore[clientIp] || 0;
  const freeRemaining = Math.max(0, FREE_USAGE_LIMIT - freeUsed);
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