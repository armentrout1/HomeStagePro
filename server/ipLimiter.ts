import { Request, Response, NextFunction } from 'express';
import { log } from './vite';

// In-memory store to track IP usage
const ipUsageStore: Record<string, number> = {};

// Free usage limit
const FREE_USAGE_LIMIT = 2;

/**
 * Middleware to track and limit API requests by IP address
 */
export const ipLimiter = (req: Request, res: Response, next: NextFunction) => {
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
      error: "Limit reached. Upgrade to continue."
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
 */
export const getIpUsageStatus = (req: Request, res: Response) => {
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