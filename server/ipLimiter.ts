import { Request, Response, NextFunction } from 'express';
import { log } from './vite';
import { hasValidAccess } from './tokenManager';

// In-memory store to track IP usage
const ipUsageStore: Record<string, number> = {};

// Free usage limit
const FREE_USAGE_LIMIT = 2;
const DISABLE_USAGE_LIMITS = process.env.DISABLE_USAGE_LIMITS === 'true';

/**
 * Middleware to track and limit API requests by IP address
 * Bypasses limits if user has a valid access token
 */
export const ipLimiter = (req: Request, res: Response, next: NextFunction) => {
  if (DISABLE_USAGE_LIMITS) {
    log(`Usage limits disabled via DISABLE_USAGE_LIMITS env var`);
    return next();
  }

  // If user has a valid access token, bypass IP limiting
  if (hasValidAccess(req)) {
    log(`Request has valid access token, bypassing IP limits`);
    return next();
  }
  
  // Get the client IP address
  const clientIp = req.ip || 
                  (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || 
                  '0.0.0.0';
  
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
  // Check for valid access token first
  if (hasValidAccess(req)) {
    // User has a valid access token
    const payload = req.accessTokenPayload!;
    const now = Math.floor(Date.now() / 1000);
    const timeRemaining = payload.expiresAt - now;
    
    // Format expiration time
    let expirationMessage = '';
    
    if (timeRemaining > 86400) {
      // More than a day
      expirationMessage = `${Math.floor(timeRemaining / 86400)} days remaining`;
    } else if (timeRemaining > 3600) {
      // Hours
      expirationMessage = `${Math.floor(timeRemaining / 3600)} hours remaining`;
    } else {
      // Minutes
      expirationMessage = `${Math.floor(timeRemaining / 60)} minutes remaining`;
    }
    
    const response: any = {
      // Basic status
      usageCount: 0,
      limit: 0,
      remaining: 0,
      status: 'premium',
      
      // Token info
      accessToken: {
        type: payload.type,
        expiresAt: new Date(payload.expiresAt * 1000).toISOString(),
        timeRemaining: expirationMessage
      }
    };
    
    // Add usage info for pack tokens
    if (payload.type === 'pack-10' && typeof payload.usageLeft === 'number') {
      response.accessToken.usageLeft = payload.usageLeft;
    }
    
    return res.json(response);
  }

  if (DISABLE_USAGE_LIMITS) {
    return res.json({
      usageCount: 0,
      limit: null,
      remaining: null,
      status: 'unlimited',
    });
  }

  // If no token, use IP-based limiting
  // Get the client IP address
  const clientIp = req.ip || 
                  (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || 
                  '0.0.0.0';
  
  // Get the usage count (0 if the IP isn't in the store yet)
  const usageCount = ipUsageStore[clientIp] || 0;
  
  return res.json({
    usageCount,
    limit: FREE_USAGE_LIMIT,
    remaining: Math.max(0, FREE_USAGE_LIMIT - usageCount),
    status: usageCount > FREE_USAGE_LIMIT ? 'exceeded' : 'active'
  });
};