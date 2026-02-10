/**
 * Buffered SSE (Server-Sent Events) parser.
 *
 * Fixes the critical bug where `text.split("\n")` without buffering
 * causes JSON data split across ReadableStream chunks to fail silently.
 *
 * This uses the same pattern as the server-side chatProxy.ts (lines 85-87):
 *   buffer += decoded;
 *   lines = buffer.split("\n");
 *   buffer = lines.pop() || "";
 *
 * The last element of split() may be a partial line, so we keep it in the
 * buffer and process it on the next chunk.
 */

export interface SSEEvent {
  /** The event type, e.g. "message" (default for `data:` lines). */
  event?: string;
  /** The parsed JSON data from the `data:` field. */
  data: unknown;
  /** Raw string data before parsing (useful for debugging). */
  raw: string;
}

export interface SSEParseError {
  /** The raw line that failed to parse. */
  raw: string;
  /** The parse error. */
  error: Error;
}

export type SSECallback = (event: SSEEvent) => void;
export type SSEErrorCallback = (err: SSEParseError) => void;

/**
 * Creates a buffered SSE line parser.
 *
 * Usage:
 * ```ts
 * const parser = createSSEParser(
 *   (event) => console.log(event.data),
 *   (err) => console.warn('SSE parse error:', err.raw, err.error)
 * );
 *
 * // Feed chunks from ReadableStream
 * while (true) {
 *   const { done, value } = await reader.read();
 *   if (done) break;
 *   parser.feed(decoder.decode(value, { stream: true }));
 * }
 *
 * // Flush any remaining buffer
 * parser.flush();
 * ```
 */
export function createSSEParser(
  onEvent: SSECallback,
  onError?: SSEErrorCallback,
) {
  let buffer = "";

  function processLine(line: string): void {
    // Skip empty lines (SSE uses double newlines as event separators)
    if (!line.trim()) return;

    // Only process data lines
    if (!line.startsWith("data: ")) return;

    const raw = line.slice(6).trim();

    // Skip SSE terminator
    if (raw === "[DONE]") return;

    try {
      const data = JSON.parse(raw);
      onEvent({ data, raw });
    } catch (error) {
      // Surface error instead of silently swallowing it
      onError?.({
        raw,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }

  return {
    /**
     * Feed a chunk of text from the ReadableStream decoder.
     * Handles buffering of partial lines across chunks.
     */
    feed(chunk: string): void {
      buffer += chunk;
      const lines = buffer.split("\n");
      // Last element is either empty (line ended with \n) or a partial line.
      // Keep it in the buffer for the next chunk.
      buffer = lines.pop() || "";

      for (const line of lines) {
        processLine(line);
      }
    },

    /**
     * Process any remaining data in the buffer.
     * Call this when the stream is done.
     */
    flush(): void {
      if (buffer.trim()) {
        processLine(buffer);
      }
      buffer = "";
    },

    /**
     * Reset the parser state. Useful for reconnection scenarios.
     */
    reset(): void {
      buffer = "";
    },
  };
}
