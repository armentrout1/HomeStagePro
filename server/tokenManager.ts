import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

import {
  PlanConfig,
  PlanId,
  getExpirationTimestamp,
  getPlanConfig,
  resolvePlanId,
} from "./plans";
import { log } from "./vite";

const TOKEN_SECRET =
  process.env.JWT_SECRET || "staging-app-secret-key-change-in-production";

export interface TokenPayload {
  planId: PlanId;
  tokenType: PlanConfig["tokenType"];
  usesLeft: number;
  totalUses: number;
  expiresAt: number;
  quality: PlanConfig["quality"];
  jti?: string;
  sub?: string;
}

export interface TokenResult {
  token: string;
  payload: TokenPayload;
}

export const ACCESS_TOKEN_COOKIE_NAME = "access_token";

export function generateToken(planIdRaw: string, existingJti?: string): TokenResult {

  const planId = resolvePlanId(planIdRaw);

  if (!planId) {
    throw new Error(`Invalid plan ID: ${planIdRaw}`);
  }

  const config = getPlanConfig(planId);
  if (!config) {
    throw new Error(`No config found for plan: ${planId}`);
  }

  const now = Math.floor(Date.now() / 1000);
  const jti = existingJti || randomUUID();
  const payload: TokenPayload = {
    planId,
    tokenType: config.tokenType,
    usesLeft: config.uses,
    totalUses: config.uses,
    expiresAt: getExpirationTimestamp(config.durationDays, now),
    quality: config.quality,
  };

  return {
    token: jwt.sign(payload, TOKEN_SECRET, {
      jwtid: jti,
      expiresIn: payload.expiresAt - now,
    }),
    payload,
  };
}

export function setAccessTokenCookie(res: Response, result: TokenResult) {
  const expiresAt = new Date(result.payload.expiresAt * 1000);
  const diffMs = expiresAt.getTime() - Date.now();

  if (diffMs <= 0) {
    clearAccessToken(res);
    return;
  }

  res.cookie(ACCESS_TOKEN_COOKIE_NAME, result.token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    domain: ".roomstagerpro.com",
    maxAge: diffMs,
    expires: expiresAt,
  });
  console.log("[cookie] set access_token", {
    path: "/",
    sameSite: "lax",
    secure: true,
  });
}

export function clearAccessToken(res: Response) {
  res.clearCookie(ACCESS_TOKEN_COOKIE_NAME, {
    path: "/",
    domain: ".roomstagerpro.com",
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, TOKEN_SECRET) as TokenPayload;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

export function decrementTokenUsage(
  payload: TokenPayload,
): TokenResult | null {
  if (payload.usesLeft <= 0) {
    return null;
  }

  const updated: TokenPayload = {
    ...payload,
    usesLeft: payload.usesLeft - 1,
  };

  if (updated.usesLeft < 0) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  return {
    token: jwt.sign(updated, TOKEN_SECRET, {
      expiresIn: updated.expiresAt - now,
    }),
    payload: updated,
  };
}

export function checkAccessToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = req.cookies?.[ACCESS_TOKEN_COOKIE_NAME];

  if (!token) {
    return next();
  }

  const payload = verifyToken(token);

  if (!payload) {
    clearAccessToken(res);
    return next();
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.expiresAt < now || payload.usesLeft <= 0) {
    clearAccessToken(res);
    return next();
  }

  req.accessTokenPayload = payload;

  next();
}

export function ensureTokenUsageOnSuccess(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.accessTokenPayload) {
    return next();
  }

  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    if (body?.success && req.accessTokenPayload) {
      const updated = decrementTokenUsage(req.accessTokenPayload);

      if (!updated) {
        clearAccessToken(res);
      } else {
        req.accessTokenPayload = updated.payload;
        setAccessTokenCookie(res, updated);
        log(
          `paid token used :: plan=${updated.payload.planId} remaining=${updated.payload.usesLeft}`,
        );
      }
    }

    return originalJson(body);
  };

  next();
}

export function attachEntitlement(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  if (req.accessTokenPayload) {
    req.stagingEntitlement = {
      planId: req.accessTokenPayload.planId,
      quality: req.accessTokenPayload.quality,
      totalUses: req.accessTokenPayload.totalUses,
      usesLeft: req.accessTokenPayload.usesLeft,
      expiresAt: req.accessTokenPayload.expiresAt,
    };
  }
  next();
}

export function hasValidAccess(req: Request): boolean {
  return !!(req.accessTokenPayload && req.accessTokenPayload.usesLeft > 0);
}

export function getTokenIdFromRequest(req: Request): string | null {
  const payload =
    req.accessTokenPayload ??
    (() => {
      const token = req.cookies?.[ACCESS_TOKEN_COOKIE_NAME];
      return token ? verifyToken(token) : null;
    })();

  if (!payload) {
    return null;
  }

  if (payload.jti && typeof payload.jti === "string") {
    return payload.jti;
  }

  if (payload.sub && typeof payload.sub === "string") {
    return payload.sub;
  }

  return null;
}

declare global {
  namespace Express {
    interface Request {
      accessTokenPayload?: TokenPayload;
      stagingEntitlement?: {
        planId: PlanId;
        quality: PlanConfig["quality"];
        totalUses: number;
        usesLeft: number;
        expiresAt: number;
      };
    }
  }
}