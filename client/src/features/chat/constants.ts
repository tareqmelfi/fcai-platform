import type { ModelEntry } from "./types";

export const STATIC_MODELS: Record<string, ModelEntry[]> = {
  openai: [
    { id: "gpt-4o", name: "GPT-4o", vision: true },
    { id: "gpt-4o-mini", name: "GPT-4o Mini", vision: true },
    { id: "o1-preview", name: "o1-preview" },
    { id: "o3-mini", name: "o3-mini" },
  ],
  anthropic: [
    { id: "claude-4-opus", name: "Claude 4 Opus" },
    { id: "claude-4-sonnet", name: "Claude 4 Sonnet" },
    { id: "claude-3.5-sonnet", name: "Claude 3.5 Sonnet" },
  ],
  google: [
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", active: true },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro" },
  ],
};

export const PROVIDER_META: Record<string, { name: string; icon: string; color: string }> = {
  openrouter: { name: "OpenRouter", icon: "OR", color: "#6366F1" },
  openai: { name: "OpenAI", icon: "O", color: "#10A37F" },
  anthropic: { name: "Anthropic", icon: "A", color: "#D97706" },
  google: { name: "Google AI", icon: "G", color: "#4285F4" },
  ollama: { name: "Ollama", icon: "OL", color: "#9CA3AF" },
};

export const DEFAULT_MODEL = "gemini-2.5-flash";
export const DEFAULT_TEMPERATURE = 0.7;
export const DEFAULT_MAX_TOKENS = 4096;
export const DEFAULT_TOP_P = 1;
