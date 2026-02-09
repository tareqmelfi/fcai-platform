import type { Express } from "express";
import { storage } from "./storage";
import { z } from "zod";

const createAgentSchema = z.object({
  name: z.string().min(1, "اسم الوكيل مطلوب"),
  nameEn: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  descriptionEn: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  systemPrompt: z.string().nullable().optional(),
  tools: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).nullable().optional(),
  priceType: z.enum(["free", "premium"]).optional().default("free"),
  price: z.string().optional().default("0"),
  isPublished: z.boolean().optional().default(false),
  isFeatured: z.boolean().optional().default(false),
  version: z.string().optional().default("1.0"),
  screenshots: z.array(z.string()).optional().default([]),
});

const rateSchema = z.object({
  rating: z.number().int().min(1).max(5),
  review: z.string().nullable().optional(),
});

export function registerMarketplaceRoutes(app: Express) {
  app.get("/api/marketplace/categories", async (_req, res) => {
    try {
      const categories = await storage.getMarketplaceCategories();
      res.json(categories);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get("/api/marketplace/featured", async (_req, res) => {
    try {
      const agents = await storage.getMarketplaceAgents({ featured: true });
      res.json(agents);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch featured agents" });
    }
  });

  app.get("/api/marketplace/installed", async (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const installs = await storage.getMarketplaceInstalls((req.user as any).id);
      res.json(installs);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch installed agents" });
    }
  });

  app.get("/api/marketplace/my-agents", async (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const agents = await storage.getMyMarketplaceAgents((req.user as any).id);
      res.json(agents);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch your agents" });
    }
  });

  app.get("/api/marketplace/:id", async (req, res) => {
    try {
      const agent = await storage.getMarketplaceAgent(Number(req.params.id));
      if (!agent) return res.status(404).json({ message: "Agent not found" });
      res.json(agent);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch agent" });
    }
  });

  app.get("/api/marketplace/:id/ratings", async (req, res) => {
    try {
      const ratings = await storage.getMarketplaceRatings(Number(req.params.id));
      res.json(ratings);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch ratings" });
    }
  });

  app.get("/api/marketplace", async (req, res) => {
    try {
      const { search, category, sort } = req.query;
      const agents = await storage.getMarketplaceAgents({
        search: search as string | undefined,
        category: category as string | undefined,
        sort: sort as string | undefined,
      });
      res.json(agents);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch marketplace agents" });
    }
  });

  app.post("/api/marketplace", async (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const parsed = createAgentSchema.parse(req.body);
      const agent = await storage.createMarketplaceAgent({
        ...parsed,
        creatorId: (req.user as any).id,
      });
      res.status(201).json(agent);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create agent" });
    }
  });

  app.put("/api/marketplace/:id", async (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const existing = await storage.getMarketplaceAgent(Number(req.params.id));
      if (!existing) return res.status(404).json({ message: "Agent not found" });
      if (existing.creatorId !== (req.user as any).id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const updated = await storage.updateMarketplaceAgent(Number(req.params.id), req.body);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Failed to update agent" });
    }
  });

  app.delete("/api/marketplace/:id", async (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const existing = await storage.getMarketplaceAgent(Number(req.params.id));
      if (!existing) return res.status(404).json({ message: "Agent not found" });
      if (existing.creatorId !== (req.user as any).id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.deleteMarketplaceAgent(Number(req.params.id));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete agent" });
    }
  });

  app.post("/api/marketplace/:id/install", async (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const userId = (req.user as any).id;
      const agentId = Number(req.params.id);
      const existing = await storage.getMarketplaceInstall(userId, agentId);
      if (existing) {
        return res.status(400).json({ message: "Already installed" });
      }
      const agent = await storage.getMarketplaceAgent(agentId);
      if (!agent) return res.status(404).json({ message: "Agent not found" });

      await storage.createMarketplaceInstall({ userId, marketplaceAgentId: agentId, isActive: true });

      await storage.createSkill({
        userId,
        name: agent.name,
        description: agent.description,
        icon: agent.icon,
        systemPrompt: agent.systemPrompt,
        tools: agent.tools || [],
        color: null,
        isDefault: false,
        isActive: true,
      });

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to install agent" });
    }
  });

  app.delete("/api/marketplace/:id/install", async (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const userId = (req.user as any).id;
      const agentId = Number(req.params.id);
      await storage.deleteMarketplaceInstall(userId, agentId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to uninstall agent" });
    }
  });

  app.post("/api/marketplace/:id/rate", async (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const userId = (req.user as any).id;
      const agentId = Number(req.params.id);
      const parsed = rateSchema.parse(req.body);

      const existing = await storage.getUserMarketplaceRating(userId, agentId);
      if (existing) {
        return res.status(400).json({ message: "Already rated" });
      }

      const created = await storage.createMarketplaceRating({
        userId,
        marketplaceAgentId: agentId,
        rating: parsed.rating,
        review: parsed.review || null,
      });
      res.json(created);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Failed to rate agent" });
    }
  });
}
