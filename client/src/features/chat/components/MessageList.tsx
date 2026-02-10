import React from "react";
import { Bot, ChevronDown } from "lucide-react";
import { ChatMessage, TypingIndicator, TemplatedMessage } from "./index";
import type { MessageType, OutputTemplate } from "../types";

interface MessageListProps {
  messages: MessageType[];
  isStreaming: boolean;
  streamingContent: string;
  selectedTemplate: OutputTemplate | null;
  userInitial: string;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  sentinelRef: React.RefObject<HTMLDivElement>;
  isAtBottom: boolean;
  scrollToBottom: () => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isStreaming,
  streamingContent,
  selectedTemplate,
  userInitial,
  scrollContainerRef,
  sentinelRef,
  isAtBottom,
  scrollToBottom,
}) => {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-6" ref={scrollContainerRef} role="log" aria-label="سجل المحادثة">
      <div className="max-w-3xl mx-auto space-y-6" role="list">
        {messages.map((msg, i) => (
          <div
            key={msg.id}
            className="animate-in fade-in slide-in-from-bottom-2 duration-300"
            style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}
          >
            <ChatMessage
              role={msg.role}
              content={msg.content}
              attachments={msg.attachments}
              userInitial={userInitial}
              template={selectedTemplate}
            />
          </div>
        ))}

        {isStreaming && (
          <div
            className="flex items-start gap-3 animate-in fade-in duration-300"
            aria-live="polite"
            aria-atomic="false"
            role="status"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
              style={{ background: "rgba(5,182,250,0.15)" }}
              aria-hidden="true"
            >
              <Bot className="h-4 w-4" style={{ color: "#05B6FA" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="text-[11px] font-bold mb-2 tracking-wider"
                dir="ltr"
                style={{ color: "#05B6FA", fontFamily: "Rubik, sans-serif" }}
              >
                Falcon AI
              </div>
              {streamingContent ? (
                <div>
                  <TemplatedMessage content={streamingContent} template={selectedTemplate} />
                  <span
                    className="inline-block animate-pulse"
                    style={{ color: "#05B6FA", fontSize: "18px" }}
                    aria-hidden="true"
                  >
                    ▊
                  </span>
                </div>
              ) : (
                <TypingIndicator />
              )}
            </div>
          </div>
        )}

        <div ref={sentinelRef} className="h-1" aria-hidden="true" />
      </div>

      {!isAtBottom && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={scrollToBottom}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all hover:scale-105 shadow-lg"
            style={{
              background: "rgba(5, 182, 250, 0.25)",
              border: "1px solid rgba(5, 182, 250, 0.4)",
              color: "#05B6FA",
              backdropFilter: "blur(12px)",
            }}
            aria-label="الانتقال لأحدث رسالة"
          >
            <ChevronDown className="h-3 w-3" />
            <span>الانتقال للأسفل</span>
          </button>
        </div>
      )}
    </div>
  );
};
