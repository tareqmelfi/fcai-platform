/**
 * Rate limiting middleware for Express.
 *
 * Two limiters:
 *   - `apiLimiter`  – 60 req/min for general API endpoints
 *   - `chatLimiter` – 10 req/min for chat message sending (expensive AI calls)
 */

import rateLimit from "express-rate-limit";

/** General API rate limiter: 60 requests per minute per IP. */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

/** Chat message rate limiter: 10 messages per minute per IP. */
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many messages, please slow down." },
});
