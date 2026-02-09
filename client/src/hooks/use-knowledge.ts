import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type InsertKnowledgeDoc } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useKnowledge() {
  return useQuery({
    queryKey: [api.knowledge.list.path],
    queryFn: async () => {
      const res = await fetch(api.knowledge.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch knowledge base");
      return api.knowledge.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateKnowledgeDoc() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertKnowledgeDoc) => {
      const res = await fetch(api.knowledge.create.path, {
        method: api.knowledge.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to add document");
      return api.knowledge.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.knowledge.list.path] });
      toast({ title: "Document Added", description: "Knowledge base updated successfully." });
    },
  });
}
