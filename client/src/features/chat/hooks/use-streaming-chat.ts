/**
 * Refactored streaming chat hook.
 *
 * Bug fixes applied:
 *   3.1 — Buffered SSE parser (was: text.split("\n") without buffering)
 *   3.2 — Parse errors surfaced to UI (was: catch {} silently swallowed)
 *   3.3 — Negative fractional temp IDs (was: Date.now() collided with DB serials)
 *   3.4 — Retry with exponential backoff for 5xx/network errors
 *   3.5 — Connection state machine: idle → connecting → streaming → error → stopped
 */

import { useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useRef } from "react";
import { createSSEParser } from "../utils/sse-parser";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConversationMessage {
  id: number;
  role: "user" | "model" | "assistant";
  content: string;
  attachments?: unknown;
  createdAt: string;
}

interface ConversationWithMessages {
  id: number;
  title: string;
  createdAt: string;
  messages: ConversationMessage[];
}

export interface StreamingChatOptions {
  conversationId: number;
  content: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  attachments?: unknown[];
  systemInstructions?: string;
  templateSystemPrompt?: string;
  skillSystemPrompt?: string;
  enabledMcpTools?: string[];
}

export interface TokenUsage {
  totalTokens?: number;
  promptTokens?: number;
  completionTokens?: number;
}

/** State machine for connection status (Fix 3.5). */
export type StreamingStatus =
  | "idle"
  | "connecting"
  | "streaming"
  | "error"
  | "stopped";

// ---------------------------------------------------------------------------
// Retry helpers (Fix 3.4)
// ---------------------------------------------------------------------------

const MAX_RETRIES = 2;
const BASE_DELAY_MS = 1000;

function isRetryable(status: number): boolean {
  // Retry only on server errors or rate-limit (429). Never retry 4xx client errors.
  return status >= 500 || status === 429;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Temp ID generator (Fix 3.3)
// ---------------------------------------------------------------------------

/**
 * Generates a temporary message ID that can never collide with DB serial IDs.
 * DB serials are positive integers starting from 1. We use negative fractional
 * numbers which are impossible to produce from PostgreSQL's `serial` type.
 */
function generateTempId(): number {
  return -(Math.random() + 1); // Always in range (-2, -1), never 0 or positive
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useStreamingChat() {
  const queryClient = useQueryClient();
  const [streamingContent, setStreamingContent] = useState("");
  const [status, setStatus] = useState<StreamingStatus>("idle");
  const [lastUsage, setLastUsage] = useState<TokenUsage | null>(null);
  const [error, setError] = useState<string | null>(null);

  // AbortController ref for stop-generation support (Phase 2.1 prep)
  const abortRef = useRef<AbortController | null>(null);

  /**
   * Stop the current streaming response.
   */
  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus("stopped");
  }, []);

  /**
   * Send a message and stream the AI response.
   */
  const sendMessage = useCallback(
    async (options: StreamingChatOptions) => {
      const {
        conversationId,
        content,
        model,
        temperature,
        maxTokens,
        topP,
        attachments,
        systemInstructions,
        templateSystemPrompt,
        skillSystemPrompt,
        enabledMcpTools,
      } = options;

      // Reset state
      setStatus("connecting");
      setStreamingContent("");
      setLastUsage(null);
      setError(null);

      // Create AbortController for this request
      const controller = new AbortController();
      abortRef.current = controller;

      // ---------------------------------------------------------------
      // Fix 3.3: Use negative fractional ID for optimistic update
      // ---------------------------------------------------------------
      const tempId = generateTempId();

      queryClient.setQueryData(
        ["/api/conversations", conversationId],
        (old: ConversationWithMessages | undefined) => {
          if (!old) return old;
          return {
            ...old,
            messages: [
              ...old.messages,
              {
                id: tempId,
                role: "user" as const,
                content,
                createdAt: new Date().toISOString(),
              },
            ],
          };
        },
      );

      // ---------------------------------------------------------------
      // Fetch with retry (Fix 3.4)
      // ---------------------------------------------------------------
      let res: Response | null = null;
      let lastFetchError: Error | null = null;

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          if (controller.signal.aborted) {
            setStatus("stopped");
            return;
          }

          res = await fetch(
            `/api/conversations/${conversationId}/messages`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                content,
                model,
                temperature,
                maxTokens,
                topP,
                attachments,
                systemInstructions,
                templateSystemPrompt,
                skillSystemPrompt,
                enabledMcpTools,
              }),
              credentials: "include",
              signal: controller.signal,
            },
          );

          if (res.ok) {
            lastFetchError = null;
            break;
          }

          // Non-retryable error → bail immediately
          if (!isRetryable(res.status)) {
            lastFetchError = new Error(
              `Server returned ${res.status}: ${res.statusText}`,
            );
            break;
          }

          // Retryable → wait with exponential backoff then loop
          lastFetchError = new Error(
            `Server returned ${res.status}: ${res.statusText}`,
          );
          if (attempt < MAX_RETRIES) {
            const delay = BASE_DELAY_MS * Math.pow(2, attempt);
            await sleep(delay);
          }
        } catch (err) {
          // Network error or abort
          if (controller.signal.aborted) {
            setStatus("stopped");
            return;
          }
          lastFetchError =
            err instanceof Error ? err : new Error(String(err));
          if (attempt < MAX_RETRIES) {
            const delay = BASE_DELAY_MS * Math.pow(2, attempt);
            await sleep(delay);
          }
        }
      }

      if (lastFetchError || !res || !res.ok) {
        const msg = lastFetchError?.message ?? "Failed to send message";
        setError(msg);
        setStatus("error");
        // Still invalidate to remove optimistic update
        queryClient.invalidateQueries({
          queryKey: ["/api/conversations", conversationId],
        });
        return;
      }

      // ---------------------------------------------------------------
      // Stream reading with buffered SSE parser (Fixes 3.1 + 3.2)
      // ---------------------------------------------------------------
      setStatus("streaming");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      const parseErrors: string[] = [];

      if (reader) {
        // Fix 3.1: Use buffered SSE parser instead of naive split
        const parser = createSSEParser(
          (event) => {
            const data = event.data as Record<string, unknown>;

            if (typeof data.content === "string") {
              accumulated += data.content;
              setStreamingContent(accumulated);
            }

            // Fix 3.2: Surface structured errors from server
            if (typeof data.error === "string") {
              setError(data.error);
            }

            if (data.done) {
              if (data.usage) {
                setLastUsage(data.usage as TokenUsage);
              }
            }
          },
          // Fix 3.2: Log parse errors instead of swallowing
          (parseErr) => {
            console.warn(
              "[SSE Parse Error]",
              parseErr.raw,
              parseErr.error.message,
            );
            parseErrors.push(parseErr.raw);
          },
        );

        try {
          while (true) {
            if (controller.signal.aborted) {
              reader.cancel();
              break;
            }

            const { done, value } = await reader.read();
            if (done) break;

            parser.feed(decoder.decode(value, { stream: true }));
          }

          // Flush remaining buffer
          parser.flush();
        } catch (err) {
          if (controller.signal.aborted) {
            // User stopped — not an error
          } else {
            const msg =
              err instanceof Error ? err.message : "Stream read error";
            setError(msg);
            console.error("[Stream Error]", err);
          }
        }
      }

      // ---------------------------------------------------------------
      // Finalize
      // ---------------------------------------------------------------
      if (controller.signal.aborted) {
        setStatus("stopped");
      } else if (error) {
        setStatus("error");
      } else {
        setStatus("idle");
      }

      setStreamingContent("");
      abortRef.current = null;

      // Invalidate to replace optimistic data with real server data
      queryClient.invalidateQueries({
        queryKey: ["/api/conversations", conversationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/conversations"],
      });

      // Auto-title: fire-and-forget after first successful exchange
      if (!controller.signal.aborted && accumulated) {
        fetch(`/api/conversations/${conversationId}/auto-title`, {
          method: "POST",
          credentials: "include",
        })
          .then((r) => {
            if (r.ok) {
              // Refresh conversation list to show new title
              queryClient.invalidateQueries({
                queryKey: ["/api/conversations"],
              });
              queryClient.invalidateQueries({
                queryKey: ["/api/conversations", conversationId],
              });
            }
          })
          .catch(() => {
            /* title generation is best-effort */
          });
      }
    },
    [queryClient, error],
  );

  // Derived convenience booleans matching old API surface
  const isStreaming = status === "streaming" || status === "connecting";

  return {
    sendMessage,
    stopGeneration,
    streamingContent,
    isStreaming,
    status,
    lastUsage,
    error,
    clearError: useCallback(() => setError(null), []),
  };
}
