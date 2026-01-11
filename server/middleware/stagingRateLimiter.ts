import rateLimit from "express-rate-limit";
import { logSecurityEvent } from "../securityEvents";

export const stagingRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const tokenId = (req as any).stagingEntitlement?.tokenId;
    if (tokenId) {
      return `token:${tokenId}`;
    }
    return `ip:${req.ip}`;
  },
  handler: (req, res) => {
    const tokenId = (req as any).stagingEntitlement?.tokenId;
    const keyType = tokenId ? "token" : "ip";
    const key = tokenId ?? req.ip ?? "unknown";

    logSecurityEvent({
      type: "STAGING_RATE_LIMITED",
      keyType,
      key: String(key),
      path: req.path,
    });

    return res.status(429).json({
      error: "Too many staging requests. Please wait a moment and try again.",
      code: "RATE_LIMITED",
    });
  },
});
