import { useQuery } from "@tanstack/react-query";
import type { ModelEntry, ProviderGroup } from "../types";
import { STATIC_MODELS, PROVIDER_META } from "../constants";

export function useProviderModels(): ProviderGroup[] {
  const providersQuery = useQuery<any[]>({
    queryKey: ["/api/providers"],
    queryFn: async () => {
      const res = await fetch("/api/providers", { credentials: "include" });
      return res.json();
    },
    staleTime: 30000,
  });

  const openRouterModels = useQuery<ModelEntry[]>({
    queryKey: ["/api/providers/openrouter/models"],
    queryFn: async () => {
      const res = await fetch("/api/providers/openrouter/models", { credentials: "include" });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.models || []).slice(0, 50).map((m: any) => ({
        id: `openrouter/${m.id}`,
        name: m.name,
      }));
    },
    enabled: providersQuery.data?.some((p: any) => p.provider === "openrouter" && p.configured) ?? false,
    staleTime: 60000,
  });

  const groups: ProviderGroup[] = [];
  const providerOrder = ["google", "openrouter", "openai", "anthropic", "ollama"];

  for (const key of providerOrder) {
    const meta = PROVIDER_META[key];
    if (!meta) continue;
    const providerStatus = providersQuery.data?.find((p: any) => p.provider === key);
    const configured = providerStatus?.configured || key === "google";

    let models: ModelEntry[] = [];
    if (key === "openrouter" && configured) {
      models = openRouterModels.data || [];
    } else if (key === "ollama") {
      models = [];
    } else {
      models = STATIC_MODELS[key] || [];
    }

    groups.push({ name: meta.name, key, icon: meta.icon, color: meta.color, configured, models });
  }

  return groups;
}
