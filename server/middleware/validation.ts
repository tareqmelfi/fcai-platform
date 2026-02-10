/**
 * Request validation middleware using Zod schemas.
 *
 * Provides reusable `validateBody()` middleware and pre-built schemas
 * for the chat API endpoints.
 */

import { z, type ZodSchema } from "zod";
import type { Request, Response, NextFunction } from "express";

// ---------------------------------------------------------------------------
// Generic middleware factory
// ---------------------------------------------------------------------------

/**
 * Express middleware that validates `req.body` against the given Zod schema.
 * On failure, responds with 400 and a structured `{ error, details }` payload.
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      }));
      return res.status(400).json({
        error: "Validation failed",
        details,
      });
    }
    // Replace body with parsed (coerced/defaulted) values
    req.body = result.data;
    next();
  };
}

// ---------------------------------------------------------------------------
// Chat schemas
// ---------------------------------------------------------------------------

/** POST /api/conversations */
export const createConversationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
});

/** POST /api/conversations/:id/messages */
export const sendMessageSchema = z.object({
  content: z
    .string()
    .min(1, "Message content is required")
    .max(100_000, "Message is too long (max 100,000 characters)"),
  model: z.string().max(100).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(200_000).optional(),
  topP: z.number().min(0).max(1).optional(),
  attachments: z.array(z.any()).optional(),
  systemInstructions: z.string().max(50_000).optional(),
  templateSystemPrompt: z.string().max(50_000).optional(),
  skillSystemPrompt: z.string().max(50_000).optional(),
});

/** PATCH /api/conversations/:id */
export const updateConversationSchema = z.object({
  title: z.string().min(1).max(200),
});
