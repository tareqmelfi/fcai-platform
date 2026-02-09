import type { Express, Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { chatStorage } from "./storage";
import { getProviderApiKey } from "../../providers";
import { storage } from "../../storage";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

function detectProvider(model: string): { provider: string; modelId: string } {
  if (model.startsWith("openrouter/")) return { provider: "openrouter", modelId: model.replace("openrouter/", "") };
  if (model.startsWith("gpt-") || model.startsWith("o1-") || model.startsWith("o3-")) return { provider: "openai", modelId: model };
  if (model.startsWith("claude-")) return { provider: "anthropic", modelId: model };
  return { provider: "google", modelId: model || "gemini-2.5-flash" };
}

export function registerChatRoutes(app: Express): void {
  app.get("/api/conversations", async (req: Request, res: Response) => {
    try {
      const conversations = await chatStorage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.get("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      const conversation = await chatStorage.getConversation(id);
      if (!conversation) return res.status(404).json({ error: "Conversation not found" });
      const messages = await chatStorage.getMessagesByConversation(id);
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      const conversation = await chatStorage.createConversation(title || "New Chat");
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.delete("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      await chatStorage.deleteConversation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  app.post("/api/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id as string);
      const { content, model, temperature, maxTokens, topP, attachments, systemInstructions, templateSystemPrompt, skillSystemPrompt } = req.body;

      await chatStorage.createMessage(conversationId, "user", content, attachments || null);

      const messages = await chatStorage.getMessagesByConversation(conversationId);
      const selectedModel = model || "gemini-2.5-flash";
      const { provider, modelId } = detectProvider(selectedModel);

      let systemPrompt = "";
      const conversation = await chatStorage.getConversation(conversationId);
      if (conversation?.projectId) {
        const project = await storage.getProject(conversation.projectId);
        if (project?.systemPrompt) {
          systemPrompt = project.systemPrompt;
        }
      }
      if (!systemPrompt && systemInstructions) {
        systemPrompt = systemInstructions;
      }
      if (templateSystemPrompt) {
        systemPrompt = systemPrompt ? systemPrompt + "\n\n" + templateSystemPrompt : templateSystemPrompt;
      }
      if (skillSystemPrompt) {
        systemPrompt = systemPrompt ? systemPrompt + "\n\n" + skillSystemPrompt : skillSystemPrompt;
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      let fullResponse = "";
      let usage: any = {};

      if (provider === "google") {
        const geminiMessages = messages.map((m) => ({
          role: (m.role === "assistant" ? "model" : m.role) as "user" | "model",
          parts: [{ text: m.content }],
        }));

        const streamConfig: any = {
          model: modelId,
          contents: geminiMessages,
        };
        if (systemPrompt) {
          streamConfig.config = { systemInstruction: systemPrompt };
        }

        const stream = await ai.models.generateContentStream(streamConfig);

        for await (const chunk of stream) {
          const text = chunk.text || "";
          if (text) {
            fullResponse += text;
            res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
          }
        }
      } else if (provider === "openai" || provider === "openrouter") {
        const apiKey = await getProviderApiKey(provider);
        if (!apiKey) throw new Error(`${provider} API key not configured`);

        const url = provider === "openrouter"
          ? "https://openrouter.ai/api/v1/chat/completions"
          : "https://api.openai.com/v1/chat/completions";

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        };
        if (provider === "openrouter") {
          headers["HTTP-Referer"] = "https://falconcore.ai";
          headers["X-Title"] = "Falcon Core AI";
        }

        const chatMessages: any[] = [];
        if (systemPrompt) {
          chatMessages.push({ role: "system", content: systemPrompt });
        }
        chatMessages.push(...messages.map((m) => ({
          role: m.role === "model" ? "assistant" : m.role,
          content: m.content,
        })));

        const body = {
          model: modelId,
          messages: chatMessages,
          stream: true,
          temperature: temperature ?? 0.7,
          max_tokens: maxTokens ?? 4096,
          top_p: topP ?? 1,
          stream_options: { include_usage: true },
        };

        const resp = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
        if (!resp.ok) {
          const errText = await resp.text();
          throw new Error(`${provider} error (${resp.status}): ${errText}`);
        }

        const reader = resp.body?.getReader();
        const decoder = new TextDecoder();
        if (reader) {
          let buffer = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content || "";
                if (delta) {
                  fullResponse += delta;
                  res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
                }
                if (parsed.usage) {
                  usage = {
                    totalTokens: parsed.usage.total_tokens,
                    promptTokens: parsed.usage.prompt_tokens,
                    completionTokens: parsed.usage.completion_tokens,
                  };
                }
              } catch {}
            }
          }
        }
      } else if (provider === "anthropic") {
        const apiKey = await getProviderApiKey("anthropic");
        if (!apiKey) throw new Error("Anthropic API key not configured");

        const chatMsgs = messages
          .filter((m) => m.role !== "system")
          .map((m) => ({
            role: m.role === "model" || m.role === "assistant" ? ("assistant" as const) : ("user" as const),
            content: m.content,
          }));

        const body: any = {
          model: modelId,
          messages: chatMsgs,
          max_tokens: maxTokens ?? 4096,
          temperature: temperature ?? 0.7,
          top_p: topP ?? 1,
          stream: true,
        };
        if (systemPrompt) {
          body.system = systemPrompt;
        }

        const resp = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify(body),
        });

        if (!resp.ok) {
          const errText = await resp.text();
          throw new Error(`Anthropic error (${resp.status}): ${errText}`);
        }

        const reader = resp.body?.getReader();
        const decoder = new TextDecoder();
        if (reader) {
          let buffer = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              try {
                const parsed = JSON.parse(line.slice(6).trim());
                if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                  fullResponse += parsed.delta.text;
                  res.write(`data: ${JSON.stringify({ content: parsed.delta.text })}\n\n`);
                }
                if (parsed.type === "message_start" && parsed.message?.usage) {
                  usage.promptTokens = parsed.message.usage.input_tokens;
                }
                if (parsed.type === "message_delta" && parsed.usage) {
                  usage.completionTokens = parsed.usage.output_tokens;
                  usage.totalTokens = (usage.promptTokens || 0) + parsed.usage.output_tokens;
                }
              } catch {}
            }
          }
        }
      }

      await chatStorage.createMessage(conversationId, "assistant", fullResponse);
      res.write(`data: ${JSON.stringify({ done: true, usage })}\n\n`);
      res.end();
    } catch (error: any) {
      console.error("Error sending message:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: error.message || "Failed to send message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: error.message || "Failed to send message" });
      }
    }
  });
}
