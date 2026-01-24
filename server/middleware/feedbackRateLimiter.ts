import rateLimit from "express-rate-limit";

import { logSecurityEvent } from "../securityEvents";

export const feedbackRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logSecurityEvent({
      type: "FEEDBACK_RATE_LIMITED",
      status: 429,
      message: `ip=${req.ip} path=${req.path}`,
    });

    res.status(429).json({
      error: "Too many feedback submissions. Please wait and try again.",
      code: "RATE_LIMITED",
    });
  },
});
