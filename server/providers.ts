import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { encrypt, decrypt, maskApiKey } from "./encryption";

const PROVIDERS = ["openrouter", "openai", "anthropic", "google", "ollama"] as const;

const PROVIDER_TEST_ENDPOINTS: Record<string, { url: string; method: string }> = {
  openrouter: { url: "https://openrouter.ai/api/v1/models", method: "GET" },
  openai: { url: "https://api.openai.com/v1/models", method: "GET" },
  anthropic: { url: "https://api.anthropic.com/v1/messages", method: "POST" },
};

const STATIC_MODELS: Record<string, Array<{ id: string; name: string; provider: string; vision?: boolean; tools?: boolean }>> = {
  openai: [
    { id: "gpt-4o", name: "GPT-4o", provider: "openai", vision: true, tools: true },
    { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai", vision: true, tools: true },
    { id: "gpt-4-turbo", name: "GPT-4 Turbo", provider: "openai", vision: true, tools: true },
    { id: "o1-preview", name: "o1 Preview", provider: "openai" },
    { id: "o1-mini", name: "o1 Mini", provider: "openai" },
  ],
  anthropic: [
    { id: "claude-4-opus-20250514", name: "Claude 4 Opus", provider: "anthropic", vision: true, tools: true },
    { id: "claude-4-sonnet-20250514", name: "Claude 4 Sonnet", provider: "anthropic", vision: true, tools: true },
    { id: "claude-3.5-sonnet-20241022", name: "Claude 3.5 Sonnet", provider: "anthropic", vision: true, tools: true },
    { id: "claude-3.5-haiku-20241022", name: "Claude 3.5 Haiku", provider: "anthropic", tools: true },
  ],
  google: [
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "google", vision: true, tools: true },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "google", vision: true, tools: true },
  ],
};

export function registerProviderRoutes(app: Express): void {
  app.get("/api/providers", async (_req: Request, res: Response) => {
    try {
      const settings = await storage.getProviderSettings();
      const result = PROVIDERS.map((p) => {
        const setting = settings.find((s) => s.provider === p);
        return {
          provider: p,
          configured: !!setting?.apiKey,
          isActive: setting?.isActive ?? false,
          status: setting?.status ?? "unconfigured",
          lastTested: setting?.lastTested,
          maskedKey: setting?.apiKey ? maskApiKey(decrypt(setting.apiKey)) : null,
        };
      });
      res.json(result);
    } catch (error) {
      console.error("Error fetching providers:", error);
      res.status(500).json({ error: "Failed to fetch providers" });
    }
  });

  app.post("/api/providers/:provider/key", async (req: Request, res: Response) => {
    try {
      const provider = req.params.provider as string;
      const { apiKey } = req.body;
      if (!apiKey || typeof apiKey !== "string") {
        return res.status(400).json({ error: "API key is required" });
      }
      const encrypted = encrypt(apiKey);
      const setting = await storage.upsertProviderSetting(provider, encrypted);
      res.json({
        provider: setting.provider,
        configured: true,
        isActive: setting.isActive,
        status: setting.status,
        maskedKey: maskApiKey(apiKey),
      });
    } catch (error) {
      console.error("Error saving provider key:", error);
      res.status(500).json({ error: "Failed to save API key" });
    }
  });

  app.delete("/api/providers/:provider/key", async (req: Request, res: Response) => {
    try {
      await storage.deleteProviderSetting(req.params.provider as string);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting provider key:", error);
      res.status(500).json({ error: "Failed to delete API key" });
    }
  });

  app.post("/api/providers/:provider/test", async (req: Request, res: Response) => {
    try {
      const provider = req.params.provider as string;
      const setting = await storage.getProviderSetting(provider);

      if (!setting?.apiKey) {
        return res.json({ success: false, error: "API key not configured" });
      }

      const apiKey = decrypt(setting.apiKey);
      let success = false;
      let errorMsg = "";

      try {
        if (provider === "openrouter") {
          const resp = await fetch("https://openrouter.ai/api/v1/models", {
            headers: { Authorization: `Bearer ${apiKey}` },
          });
          success = resp.ok;
          if (!success) errorMsg = `HTTP ${resp.status}`;
        } else if (provider === "openai") {
          const resp = await fetch("https://api.openai.com/v1/models", {
            headers: { Authorization: `Bearer ${apiKey}` },
          });
          success = resp.ok;
          if (!success) errorMsg = `HTTP ${resp.status}`;
        } else if (provider === "anthropic") {
          const resp = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01",
              "content-type": "application/json",
            },
            body: JSON.stringify({
              model: "claude-3.5-haiku-20241022",
              max_tokens: 1,
              messages: [{ role: "user", content: "hi" }],
            }),
          });
          success = resp.ok || resp.status === 429;
          if (!success) errorMsg = `HTTP ${resp.status}`;
        } else {
          success = true;
        }
      } catch (err: any) {
        errorMsg = err.message || "Connection failed";
      }

      await storage.updateProviderStatus(provider, success ? "connected" : "error");
      res.json({ success, error: errorMsg || undefined });
    } catch (error) {
      console.error("Error testing provider:", error);
      res.status(500).json({ error: "Failed to test connection" });
    }
  });

  app.get("/api/providers/models", async (_req: Request, res: Response) => {
    try {
      const settings = await storage.getProviderSettings();
      const allModels: Array<{
        id: string;
        name: string;
        provider: string;
        providerId?: string;
        vision?: boolean;
        tools?: boolean;
        contextLength?: number;
      }> = [];

      allModels.push(...STATIC_MODELS.google);

      for (const setting of settings) {
        if (!setting.apiKey || !setting.isActive) continue;

        if (setting.provider === "openrouter") {
          try {
            const apiKey = decrypt(setting.apiKey);
            const resp = await fetch("https://openrouter.ai/api/v1/models", {
              headers: { Authorization: `Bearer ${apiKey}` },
            });
            if (resp.ok) {
              const data = (await resp.json()) as any;
              const orModels = (data.data || [])
                .filter((m: any) => m.id && m.name)
                .slice(0, 100)
                .map((m: any) => ({
                  id: `openrouter/${m.id}`,
                  name: m.name,
                  provider: "openrouter",
                  providerId: m.id,
                  contextLength: m.context_length,
                }));
              allModels.push(...orModels);
            }
          } catch (err) {
            console.error("Error fetching OpenRouter models:", err);
          }
        } else if (setting.provider === "openai") {
          allModels.push(...STATIC_MODELS.openai);
        } else if (setting.provider === "anthropic") {
          allModels.push(...STATIC_MODELS.anthropic);
        }
      }

      res.json(allModels);
    } catch (error) {
      console.error("Error fetching models:", error);
      res.status(500).json({ error: "Failed to fetch models" });
    }
  });

  app.get("/api/preferences", async (_req: Request, res: Response) => {
    try {
      const prefs = await storage.getAllPreferences();
      const result: Record<string, string> = {};
      for (const p of prefs) {
        result[p.key] = p.value;
      }
      res.json(result);
    } catch (error) {
      console.error("Error fetching preferences:", error);
      res.status(500).json({ error: "Failed to fetch preferences" });
    }
  });

  app.post("/api/preferences", async (req: Request, res: Response) => {
    try {
      const updates = req.body as Record<string, string>;
      for (const [key, value] of Object.entries(updates)) {
        await storage.setPreference(key, String(value));
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving preferences:", error);
      res.status(500).json({ error: "Failed to save preferences" });
    }
  });
}

export async function getProviderApiKey(provider: string): Promise<string | null> {
  const setting = await storage.getProviderSetting(provider);
  if (!setting?.apiKey) return null;
  return decrypt(setting.apiKey);
}
