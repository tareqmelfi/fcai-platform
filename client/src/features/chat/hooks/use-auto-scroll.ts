/**
 * Smart auto-scroll hook for chat messages.
 *
 * Behavior:
 * - Auto-scrolls to bottom during streaming (new tokens arrive)
 * - Pauses auto-scroll when user scrolls up (reading history)
 * - Shows "scroll to bottom" indicator when user is scrolled away
 * - Resumes auto-scroll when user scrolls back to bottom
 *
 * Uses IntersectionObserver on a sentinel element at the bottom of the
 * messages list for efficient scroll detection (no scroll event listeners).
 */

import { useRef, useState, useEffect, useCallback } from "react";

interface UseAutoScrollOptions {
  /** Whether new content is being streamed (triggers auto-scroll). */
  isStreaming: boolean;
  /** Dependencies that should trigger a scroll check (e.g., message count). */
  deps?: unknown[];
}

export function useAutoScroll({ isStreaming, deps = [] }: UseAutoScrollOptions) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [userScrolledAway, setUserScrolledAway] = useState(false);

  // Track whether the sentinel (bottom of messages) is visible
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsAtBottom(visible);

        // If user scrolled back to bottom, re-enable auto-scroll
        if (visible) {
          setUserScrolledAway(false);
        }
      },
      {
        root: scrollContainerRef.current,
        // Small threshold so it triggers when sentinel is near the viewport
        rootMargin: "0px 0px 100px 0px",
        threshold: 0,
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Detect user scrolling away during streaming
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !isStreaming) return;

    let lastScrollTop = container.scrollTop;

    const handleScroll = () => {
      const currentScrollTop = container.scrollTop;
      const maxScroll = container.scrollHeight - container.clientHeight;

      // User scrolled up while streaming
      if (currentScrollTop < lastScrollTop && currentScrollTop < maxScroll - 50) {
        setUserScrolledAway(true);
      }

      lastScrollTop = currentScrollTop;
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [isStreaming]);

  // Auto-scroll when streaming and user hasn't scrolled away
  useEffect(() => {
    if (isStreaming && !userScrolledAway) {
      sentinelRef.current?.scrollIntoView({ behavior: "instant" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreaming, userScrolledAway, ...deps]);

  // Scroll to bottom imperatively (for "scroll to bottom" button)
  const scrollToBottom = useCallback(() => {
    setUserScrolledAway(false);
    sentinelRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Auto-scroll on new messages (non-streaming)
  const scrollOnNewMessage = useCallback(() => {
    if (!userScrolledAway) {
      // Use requestAnimationFrame to wait for DOM update
      requestAnimationFrame(() => {
        sentinelRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, [userScrolledAway]);

  return {
    /** Ref for the scroll container (the overflow-auto div). */
    scrollContainerRef,
    /** Ref for the sentinel element (place at end of messages list). */
    sentinelRef,
    /** Whether the view is currently scrolled to the bottom. */
    isAtBottom,
    /** Whether the user manually scrolled away during streaming. */
    userScrolledAway,
    /** Scroll to bottom (use for "scroll to bottom" button). */
    scrollToBottom,
    /** Call after adding a new message to auto-scroll if appropriate. */
    scrollOnNewMessage,
  };
}
