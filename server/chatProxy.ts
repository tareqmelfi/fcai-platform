import type { Response } from "express";
import { getProviderApiKey } from "./providers";
import { GoogleGenAI } from "@google/genai";

interface ChatMessage {
  role: string;
  content: string;
}

interface ChatOptions {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

interface StreamResult {
  fullResponse: string;
  totalTokens?: number;
  promptTokens?: number;
  completionTokens?: number;
}

function detectProvider(model: string): { provider: string; modelId: string } {
  if (model.startsWith("openrouter/")) {
    return { provider: "openrouter", modelId: model.replace("openrouter/", "") };
  }
  if (model.startsWith("gpt-") || model.startsWith("o1-") || model.startsWith("o3-")) {
    return { provider: "openai", modelId: model };
  }
  if (model.startsWith("claude-")) {
    return { provider: "anthropic", modelId: model };
  }
  if (model.startsWith("gemini-")) {
    return { provider: "google", modelId: model };
  }
  return { provider: "google", modelId: "gemini-2.5-flash" };
}

async function streamOpenAICompatible(
  url: string,
  apiKey: string,
  options: ChatOptions,
  res: Response,
  extraHeaders?: Record<string, string>,
): Promise<StreamResult> {
  const body: any = {
    model: options.model,
    messages: options.messages.map((m) => ({
      role: m.role === "model" ? "assistant" : m.role,
      content: m.content,
    })),
    stream: true,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 4096,
    top_p: options.topP ?? 1,
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Provider error (${resp.status}): ${errText}`);
  }

  let fullResponse = "";
  let usage: Omit<StreamResult, "fullResponse"> = {};
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

  return { fullResponse, ...usage };
}

async function streamAnthropic(
  apiKey: string,
  options: ChatOptions,
  res: Response,
): Promise<StreamResult> {
  const messages = options.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "model" || m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));

  const systemMsg = options.messages.find((m) => m.role === "system");

  const body: any = {
    model: options.model,
    messages,
    max_tokens: options.maxTokens ?? 4096,
    temperature: options.temperature ?? 0.7,
    top_p: options.topP ?? 1,
    stream: true,
  };
  if (systemMsg) body.system = systemMsg.content;

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

  let fullResponse = "";
  let usage: Omit<StreamResult, "fullResponse"> = {};
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

        try {
          const parsed = JSON.parse(data);
          if (parsed.type === "content_block_delta" && parsed.delta?.text) {
            fullResponse += parsed.delta.text;
            res.write(`data: ${JSON.stringify({ content: parsed.delta.text })}\n\n`);
          }
          if (parsed.type === "message_delta" && parsed.usage) {
            usage.completionTokens = parsed.usage.output_tokens;
          }
          if (parsed.type === "message_start" && parsed.message?.usage) {
            usage.promptTokens = parsed.message.usage.input_tokens;
          }
        } catch {}
      }
    }
  }

  if (usage.promptTokens && usage.completionTokens) {
    usage.totalTokens = usage.promptTokens + usage.completionTokens;
  }

  return { fullResponse, ...usage };
}

async function streamGemini(
  options: ChatOptions,
  res: Response,
): Promise<StreamResult> {
  const apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key not configured (set GOOGLE_API_KEY or AI_INTEGRATIONS_GEMINI_API_KEY)");
  }
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      apiVersion: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL ? "" : undefined,
      baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL || undefined,
    },
  });

  const chatMessages = options.messages.map((m) => ({
    role: m.role === "assistant" ? "model" : (m.role as "user" | "model"),
    parts: [{ text: m.content }],
  }));

  const stream = await ai.models.generateContentStream({
    model: options.model || "gemini-2.5-flash",
    contents: chatMessages,
  });

  let fullResponse = "";
  for await (const chunk of stream) {
    const content = chunk.text || "";
    if (content) {
      fullResponse += content;
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
  }

  return { fullResponse };
}

export async function streamChatResponse(
  options: ChatOptions,
  res: Response,
): Promise<{ fullResponse: string; usage: StreamResult }> {
  const { provider, modelId } = detectProvider(options.model);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let result: StreamResult = { fullResponse: "" };
  const opts = { ...options, model: modelId };

  try {
    if (provider === "openrouter") {
      const apiKey = await getProviderApiKey("openrouter");
      if (!apiKey) throw new Error("OpenRouter API key not configured");
      result = await streamOpenAICompatible(
        "https://openrouter.ai/api/v1/chat/completions",
        apiKey,
        opts,
        res,
        { "HTTP-Referer": "https://falconcore.ai", "X-Title": "Falcon Core AI" },
      );
    } else if (provider === "openai") {
      const apiKey = await getProviderApiKey("openai");
      if (!apiKey) throw new Error("OpenAI API key not configured");
      result = await streamOpenAICompatible(
        "https://api.openai.com/v1/chat/completions",
        apiKey,
        opts,
        res,
      );
    } else if (provider === "anthropic") {
      const apiKey = await getProviderApiKey("anthropic");
      if (!apiKey) throw new Error("Anthropic API key not configured");
      result = await streamAnthropic(apiKey, opts, res);
    } else {
      result = await streamGemini(opts, res);
    }
  } catch (err: any) {
    console.error(`Chat proxy error (${provider}):`, err.message);
    if (!res.headersSent) {
      res.setHeader("Content-Type", "text/event-stream");
    }
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
  }

  return { fullResponse: result.fullResponse, usage: result };
}
