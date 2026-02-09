import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";

interface Conversation {
  id: number;
  title: string;
  createdAt: string;
}

interface Message {
  id: number;
  role: "user" | "model" | "assistant";
  content: string;
  attachments?: any;
  createdAt: string;
}

interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

export function useConversations() {
  return useQuery({
    queryKey: ["/api/conversations"],
    queryFn: async () => {
      const res = await fetch("/api/conversations", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return (await res.json()) as Conversation[];
    },
  });
}

export function useConversation(id: number | null) {
  return useQuery({
    queryKey: ["/api/conversations", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await fetch(`/api/conversations/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch conversation");
      return (await res.json()) as ConversationWithMessages;
    },
    enabled: !!id,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create conversation");
      return (await res.json()) as Conversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete conversation");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });
}

interface StreamingChatOptions {
  conversationId: number;
  content: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  attachments?: any[];
  systemInstructions?: string;
  templateSystemPrompt?: string;
  skillSystemPrompt?: string;
  enabledMcpTools?: string[];
}

export function useStreamingChat() {
  const queryClient = useQueryClient();
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [lastUsage, setLastUsage] = useState<any>(null);

  const sendMessage = useCallback(
    async ({ conversationId, content, model, temperature, maxTokens, topP, attachments, systemInstructions, templateSystemPrompt, skillSystemPrompt, enabledMcpTools }: StreamingChatOptions) => {
      setIsStreaming(true);
      setStreamingContent("");
      setLastUsage(null);

      queryClient.setQueryData(
        ["/api/conversations", conversationId],
        (old: ConversationWithMessages | undefined) => {
          if (!old) return old;
          return {
            ...old,
            messages: [
              ...old.messages,
              {
                id: Date.now(),
                role: "user" as const,
                content,
                createdAt: new Date().toISOString(),
              },
            ],
          };
        }
      );

      try {
        const res = await fetch(`/api/conversations/${conversationId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, model, temperature, maxTokens, topP, attachments, systemInstructions, templateSystemPrompt, skillSystemPrompt, enabledMcpTools }),
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to send message");

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value, { stream: true });
            const lines = text.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.content) {
                    accumulated += data.content;
                    setStreamingContent(accumulated);
                  }
                  if (data.done) {
                    if (data.usage) setLastUsage(data.usage);
                    break;
                  }
                } catch {}
              }
            }
          }
        }

        setIsStreaming(false);
        setStreamingContent("");

        queryClient.invalidateQueries({ queryKey: ["/api/conversations", conversationId] });
        queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      } catch (error) {
        setIsStreaming(false);
        setStreamingContent("");
        throw error;
      }
    },
    [queryClient]
  );

  return { sendMessage, streamingContent, isStreaming, lastUsage };
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: number; content: string }) => {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to send message");
      return true;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", variables.conversationId] });
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/conversations", variables.conversationId] });
      }, 1000);
    },
  });
}
