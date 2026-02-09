import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertAgent, type Agent } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useAgents() {
  return useQuery({
    queryKey: [api.agents.list.path],
    queryFn: async () => {
      const res = await fetch(api.agents.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch agents");
      return api.agents.list.responses[200].parse(await res.json());
    },
  });
}

export function useAgent(id: number) {
  return useQuery({
    queryKey: [api.agents.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.agents.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch agent");
      return api.agents.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateAgent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertAgent) => {
      const res = await fetch(api.agents.create.path, {
        method: api.agents.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create agent");
      }
      return api.agents.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.agents.list.path] });
      toast({ title: "Success", description: "Agent deployed successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<InsertAgent>) => {
      const url = buildUrl(api.agents.update.path, { id });
      const res = await fetch(url, {
        method: api.agents.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update agent");
      return api.agents.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.agents.list.path] });
      toast({ title: "Updated", description: "Agent configuration updated" });
    },
  });
}
