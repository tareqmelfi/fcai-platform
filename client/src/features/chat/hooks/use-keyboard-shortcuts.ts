/**
 * Keyboard shortcuts for the chat interface.
 *
 * Bindings:
 *   Enter       → send message (when input focused)
 *   Shift+Enter → newline (default textarea behavior, no override needed)
 *   Escape      → stop generation (when streaming) OR blur input
 *   Ctrl/Cmd+Shift+N → new conversation
 *   Ctrl/Cmd+/  → focus input
 */

import { useEffect, useCallback, type RefObject } from "react";

interface UseKeyboardShortcutsOptions {
  /** Ref to the chat textarea element. */
  inputRef: RefObject<HTMLTextAreaElement | null>;
  /** Whether AI is currently streaming a response. */
  isStreaming: boolean;
  /** Callback to send the current message. */
  onSend: () => void;
  /** Callback to stop generation. */
  onStopGeneration: () => void;
  /** Callback to create a new conversation. */
  onNewConversation: () => void;
}

export function useKeyboardShortcuts({
  inputRef,
  isStreaming,
  onSend,
  onStopGeneration,
  onNewConversation,
}: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const mod = isMac ? e.metaKey : e.ctrlKey;

      // Escape → stop generation or blur input
      if (e.key === "Escape") {
        if (isStreaming) {
          e.preventDefault();
          onStopGeneration();
        } else {
          // Blur the input to dismiss mobile keyboard, etc.
          inputRef.current?.blur();
        }
        return;
      }

      // Ctrl/Cmd+Shift+N → new conversation
      if (mod && e.shiftKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        onNewConversation();
        return;
      }

      // Ctrl/Cmd+/ → focus input
      if (mod && e.key === "/") {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }
    },
    [isStreaming, onSend, onStopGeneration, onNewConversation, inputRef],
  );

  // Enter to send (only when textarea is focused, no Shift)
  const handleTextareaKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        if (!isStreaming) {
          onSend();
        }
      }
    },
    [isStreaming, onSend],
  );

  // Register global shortcuts
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return {
    /** Attach to textarea's onKeyDown prop. */
    handleTextareaKeyDown,
  };
}
