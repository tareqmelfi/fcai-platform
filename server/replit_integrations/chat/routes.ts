import type { Express, Request, Response } from "express";
import { chatStorage } from "./storage";
import { streamChatResponse } from "../../chatProxy";
import { storage } from "../../storage";
import {
  validateBody,
  createConversationSchema,
  sendMessageSchema,
  updateConversationSchema,
} from "../../middleware/validation";
import { chatLimiter } from "../../middleware/rateLimiter";

export function registerChatRoutes(app: Express): void {
  // -----------------------------------------------------------------------
  // GET /api/conversations
  // -----------------------------------------------------------------------
  app.get("/api/conversations", async (req: Request, res: Response) => {
    try {
      const conversations = await chatStorage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // -----------------------------------------------------------------------
  // GET /api/conversations/:id
  // -----------------------------------------------------------------------
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

  // -----------------------------------------------------------------------
  // POST /api/conversations
  // -----------------------------------------------------------------------
  app.post(
    "/api/conversations",
    validateBody(createConversationSchema),
    async (req: Request, res: Response) => {
      try {
        const { title } = req.body;
        const conversation = await chatStorage.createConversation(title || "New Chat");
        res.status(201).json(conversation);
      } catch (error) {
        console.error("Error creating conversation:", error);
        res.status(500).json({ error: "Failed to create conversation" });
      }
    },
  );

  // -----------------------------------------------------------------------
  // PATCH /api/conversations/:id  (rename)
  // -----------------------------------------------------------------------
  app.patch(
    "/api/conversations/:id",
    validateBody(updateConversationSchema),
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id as string);
        const updated = await chatStorage.updateConversation(id, req.body);
        if (!updated) return res.status(404).json({ error: "Conversation not found" });
        res.json(updated);
      } catch (error) {
        console.error("Error updating conversation:", error);
        res.status(500).json({ error: "Failed to update conversation" });
      }
    },
  );

  // -----------------------------------------------------------------------
  // DELETE /api/conversations/:id
  // -----------------------------------------------------------------------
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

  // -----------------------------------------------------------------------
  // POST /api/conversations/:id/messages
  //
  // This route handles:
  //   1. Request parsing & validation (Zod)
  //   2. System prompt assembly (project + instructions + template + skill)
  //   3. Message persistence (user message before, assistant message after)
  //
  // Streaming is delegated to `streamChatResponse()` from chatProxy.ts.
  // -----------------------------------------------------------------------
  app.post(
    "/api/conversations/:id/messages",
    chatLimiter,
    validateBody(sendMessageSchema),
    async (req: Request, res: Response) => {
      try {
        const conversationId = parseInt(req.params.id as string);
        const {
          content,
          model,
          temperature,
          maxTokens,
          topP,
          attachments,
          systemInstructions,
          templateSystemPrompt,
          skillSystemPrompt,
        } = req.body;

        // Persist user message
        await chatStorage.createMessage(conversationId, "user", content, attachments || null);

        // Fetch full conversation history for context
        const messages = await chatStorage.getMessagesByConversation(conversationId);
        const selectedModel = model || "gemini-2.5-flash";

        // ----- Build system prompt -----
        let systemPrompt = "";

        // 1. Project-level system prompt
        const conversation = await chatStorage.getConversation(conversationId);
        if (conversation?.projectId) {
          const project = await storage.getProject(conversation.projectId);
          if (project?.systemPrompt) {
            systemPrompt = project.systemPrompt;
          }
        }

        // 2. User-level system instructions (fallback if no project prompt)
        if (!systemPrompt && systemInstructions) {
          systemPrompt = systemInstructions;
        }

        // 3. Template system prompt (appended)
        if (templateSystemPrompt) {
          systemPrompt = systemPrompt
            ? systemPrompt + "\n\n" + templateSystemPrompt
            : templateSystemPrompt;
        }

        // 4. Skill system prompt (appended)
        if (skillSystemPrompt) {
          systemPrompt = systemPrompt
            ? systemPrompt + "\n\n" + skillSystemPrompt
            : skillSystemPrompt;
        }

        // ----- Build messages array for the AI provider -----
        const chatMessages = messages.map((m) => ({
          role: m.role === "model" ? "assistant" : m.role,
          content: m.content,
        }));

        // Prepend system message if present
        if (systemPrompt) {
          chatMessages.unshift({ role: "system", content: systemPrompt });
        }

        // ----- Delegate streaming to chatProxy -----
        const { fullResponse, usage } = await streamChatResponse(
          {
            model: selectedModel,
            messages: chatMessages,
            temperature,
            maxTokens,
            topP,
          },
          res,
        );

        // Persist assistant response
        await chatStorage.createMessage(conversationId, "assistant", fullResponse);

        // Send done event with usage stats
        res.write(`data: ${JSON.stringify({ done: true, usage })}\n\n`);
        res.end();
      } catch (error: any) {
        console.error("Error sending message:", error);
        if (res.headersSent) {
          res.write(
            `data: ${JSON.stringify({ error: error.message || "Failed to send message" })}\n\n`,
          );
          res.end();
        } else {
          res.status(500).json({ error: error.message || "Failed to send message" });
        }
      }
    },
  );

  // -----------------------------------------------------------------------
  // POST /api/conversations/:id/auto-title
  //
  // Uses the cheapest model to generate a short title (3-6 words) from
  // the first user+assistant exchange. Called once after the first reply.
  // -----------------------------------------------------------------------
  app.post("/api/conversations/:id/auto-title", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      const conversation = await chatStorage.getConversation(id);
      if (!conversation) return res.status(404).json({ error: "Conversation not found" });

      // Only auto-title if still using default name
      if (conversation.title !== "New Chat" && conversation.title !== "محادثة جديدة") {
        return res.json({ title: conversation.title, skipped: true });
      }

      const messages = await chatStorage.getMessagesByConversation(id);
      if (messages.length < 2) {
        return res.json({ title: conversation.title, skipped: true });
      }

      // Take first exchange (user + assistant)
      const firstExchange = messages
        .slice(0, 2)
        .map((m) => `${m.role}: ${m.content.slice(0, 300)}`)
        .join("\n");

      // Use cheapest/fastest model for title generation (non-streaming)
      const titlePrompt = [
        {
          role: "system",
          content:
            "Generate a short title (3-6 words) for this conversation. " +
            "If the conversation is in Arabic, respond in Arabic. " +
            "If in English, respond in English. " +
            "Return ONLY the title text, nothing else. No quotes, no punctuation at the end.",
        },
        { role: "user", content: firstExchange },
      ];

      // Use a lightweight non-streaming call via chatProxy
      // We create a mock response that collects the output
      let titleText = "";
      const mockRes = {
        headersSent: false,
        setHeader: () => {},
        write: (chunk: string) => {
          // Parse SSE data lines
          if (typeof chunk === "string") {
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const parsed = JSON.parse(line.slice(6).trim());
                  if (parsed.content) titleText += parsed.content;
                } catch {}
              }
            }
          }
        },
        end: () => {},
      } as any;

      await streamChatResponse(
        {
          model: "gemini-2.5-flash",
          messages: titlePrompt,
          temperature: 0.3,
          maxTokens: 30,
        },
        mockRes,
      );

      // Clean up title
      const cleanTitle = titleText.trim().replace(/^["']|["']$/g, "").slice(0, 100) || "New Chat";

      const updated = await chatStorage.updateConversation(id, { title: cleanTitle });
      res.json({ title: updated?.title || cleanTitle });
    } catch (error) {
      console.error("Error auto-titling conversation:", error);
      res.status(500).json({ error: "Failed to generate title" });
    }
  });
}
