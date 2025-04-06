import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// Secret for signing tokens - should be in env variables in production
const TOKEN_SECRET = process.env.JWT_SECRET || 'staging-app-secret-key-change-in-production';

// Token types
export enum TokenType {
  DAY_PASS = 'day-pass',    // 24-hour unlimited access
  PACK_10 = 'pack-10',      // 10 stagings
  UNLIMITED = 'unlimited',  // 30-day unlimited access
}

// Token payload interface
export interface TokenPayload {
  type: TokenType;
  usageLeft?: number;       // For pack-10 type
  expiresAt: number;        // Unix timestamp
}

/**
 * Generate a JWT token based on the purchased plan
 */
export function generateToken(planId: string): string {
  let payload: TokenPayload;
  const now = Math.floor(Date.now() / 1000); // Current time in seconds
  
  switch (planId) {
    case 'day-pass':
      // 24 hours unlimited
      payload = {
        type: TokenType.DAY_PASS,
        expiresAt: now + 24 * 60 * 60, // 24 hours from now
      };
      break;
    
    case 'pack-10':
      // 10 stagings with no expiration
      payload = {
        type: TokenType.PACK_10,
        usageLeft: 10,
        expiresAt: now + 365 * 24 * 60 * 60, // 1 year from now (practically no expiration)
      };
      break;
      
    case 'unlimited':
      // 30 days unlimited
      payload = {
        type: TokenType.UNLIMITED,
        expiresAt: now + 30 * 24 * 60 * 60, // 30 days from now
      };
      break;
      
    default:
      throw new Error(`Invalid plan ID: ${planId}`);
  }
  
  return jwt.sign(payload, TOKEN_SECRET, { expiresIn: payload.expiresAt - now });
}

/**
 * Verify and decode a token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, TOKEN_SECRET) as TokenPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Update token usage (for pack-10 type)
 */
export function updateTokenUsage(payload: TokenPayload): string | null {
  if (payload.type !== TokenType.PACK_10 || typeof payload.usageLeft !== 'number') {
    return null;
  }
  
  // Decrement usage
  payload.usageLeft -= 1;
  
  // If no more uses left, return null
  if (payload.usageLeft <= 0) {
    return null;
  }
  
  // Generate a new token with updated usage
  return jwt.sign(payload, TOKEN_SECRET, { expiresIn: payload.expiresAt - Math.floor(Date.now() / 1000) });
}

/**
 * Middleware to check token validity
 */
export function checkAccessToken(req: Request, res: Response, next: NextFunction) {
  // Get token from cookies
  const token = req.cookies?.access_token;
  
  if (!token) {
    // No token, proceed to IP limiting
    return next();
  }
  
  // Verify token
  const payload = verifyToken(token);
  
  if (!payload) {
    // Invalid token, clear it and proceed to IP limiting
    res.clearCookie('access_token');
    return next();
  }
  
  // Check if token is expired
  const now = Math.floor(Date.now() / 1000);
  if (payload.expiresAt < now) {
    // Token expired, clear it and proceed to IP limiting
    res.clearCookie('access_token');
    return next();
  }
  
  // Token is valid
  req.accessTokenPayload = payload;
  
  // If it's a pack-10 token, check and update usage
  if (payload.type === TokenType.PACK_10 && typeof payload.usageLeft === 'number') {
    // Only update usage for generation requests
    if (req.path === '/api/generate-staged-room') {
      const updatedToken = updateTokenUsage(payload);
      
      if (updatedToken) {
        // Set the updated token
        res.cookie('access_token', updatedToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: (payload.expiresAt - now) * 1000, // Convert to milliseconds
        });
      } else {
        // No more uses left, clear the token
        res.clearCookie('access_token');
        
        // Redirect to upgrade page
        return res.status(402).json({
          error: 'Token usage exhausted',
          message: 'You have used all of your staging credits',
          redirect: '/upgrade'
        });
      }
    }
  }
  
  // Allow the request to proceed with a valid token
  next();
}

/**
 * Check if user has valid access (either via token or IP limit)
 */
export function hasValidAccess(req: Request): boolean {
  // If there's a valid token payload, user has access
  return !!req.accessTokenPayload;
}

// Add token payload to Express Request interface
declare global {
  namespace Express {
    interface Request {
      accessTokenPayload?: TokenPayload;
    }
  }
}