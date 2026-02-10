/**
 * Single chat message bubble (user or assistant).
 *
 * Wrapped in React.memo because messages are immutable once created —
 * the AI response is fully built server-side and only the streaming
 * placeholder changes. This avoids re-rendering all previous messages
 * on every streaming tick.
 */

import React from "react";
import { Bot, Copy, Check } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageAttachments } from "./MessageAttachments";
import { TemplatedMessage } from "./TemplatedMessage";
import { ExportButton } from "./ExportButton";
import type { OutputTemplate } from "../types";

interface ChatMessageProps {
  role: string;
  content: string;
  attachments?: unknown;
  userInitial?: string;
  template?: OutputTemplate | null;
}

function ChatMessageInner({
  role,
  content,
  attachments,
  userInitial = "U",
  template,
}: ChatMessageProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = React.useCallback(() => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [content]);

  if (role === "user") {
    return (
      <div className="flex items-start gap-3" role="listitem">
        <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
          <AvatarFallback
            className="text-[11px] font-bold"
            style={{ background: "rgba(255,255,255,0.1)", color: "#D1D5DB" }}
          >
            {userInitial}
          </AvatarFallback>
        </Avatar>
        <div
          className="flex-1 p-4 rounded-xl text-[15px] leading-relaxed"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#E5E7EB",
          }}
        >
          <div className="whitespace-pre-wrap">{content}</div>
          {!!attachments && <MessageAttachments attachments={attachments as any[]} />}
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex items-start gap-3" role="listitem">
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
        <TemplatedMessage content={content} template={template || null} />
        <div className="mt-2 flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-all hover:bg-white/5"
            style={{ color: copied ? "#05B6FA" : "rgba(255,255,255,0.35)" }}
            aria-label={copied ? "تم النسخ" : "نسخ الرسالة"}
          >
            {copied ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            {copied ? "تم النسخ" : "نسخ"}
          </button>
          <ExportButton content={content} template={template || null} />
        </div>
      </div>
    </div>
  );
}

export const ChatMessage = React.memo(ChatMessageInner);
