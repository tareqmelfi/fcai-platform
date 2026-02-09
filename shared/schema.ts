import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Import Auth and Chat models from integrations
export * from "./models/auth";
export * from "./models/chat";

// === AGENTS ===
export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(), // 'hr', 'sales', 'tech_support'
  description: text("description").notNull(),
  avatar: text("avatar"), // URL to avatar image
  isActive: boolean("is_active").default(true),
  config: jsonb("config"), // Specific configuration for the agent
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAgentSchema = createInsertSchema(agents).omit({ id: true, createdAt: true });

// === TASKS ===
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'in_progress', 'completed', 'failed'
  agentId: integer("agent_id").references(() => agents.id),
  result: text("result"),
  priority: text("priority").default("medium"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true, updatedAt: true });

// === KNOWLEDGE BASE ===
export const knowledgeDocs = pgTable("knowledge_docs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").default("general"),
  tags: text("tags").array(),
  embedding: jsonb("embedding"), // Store embedding as JSON array for now (or pgvector if available)
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertKnowledgeDocSchema = createInsertSchema(knowledgeDocs).omit({ id: true, createdAt: true });

// === PROVIDER SETTINGS ===
export const providerSettings = pgTable("provider_settings", {
  id: serial("id").primaryKey(),
  provider: text("provider").notNull().unique(),
  apiKey: text("api_key"),
  isActive: boolean("is_active").default(false),
  lastTested: timestamp("last_tested"),
  status: text("status").default("unconfigured"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProviderSettingSchema = createInsertSchema(providerSettings).omit({ id: true, createdAt: true, updatedAt: true });

// === USER PREFERENCES ===
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserPreferenceSchema = createInsertSchema(userPreferences).omit({ id: true, updatedAt: true });

// === OUTPUT TEMPLATES ===
export const outputTemplates = pgTable("output_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  systemPrompt: text("system_prompt"),
  css: text("css"),
  headerHtml: text("header_html"),
  footerHtml: text("footer_html"),
  isBuiltin: boolean("is_builtin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOutputTemplateSchema = createInsertSchema(outputTemplates).omit({ id: true, createdAt: true });

// === SKILLS ===
export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  systemPrompt: text("system_prompt"),
  tools: jsonb("tools").$type<string[]>().default([]),
  color: text("color"),
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSkillSchema = createInsertSchema(skills).omit({ id: true, createdAt: true });

// === MCP SERVERS ===
export const mcpServers = pgTable("mcp_servers", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'stdio', 'sse', 'http'
  url: text("url"),
  command: text("command"),
  args: text("args").array(),
  envVars: jsonb("env_vars"),
  isActive: boolean("is_active").default(false),
  status: text("status").default("disconnected"), // 'connected', 'disconnected', 'error'
  tools: jsonb("tools"), // discovered tools from server
  lastConnected: timestamp("last_connected"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMcpServerSchema = createInsertSchema(mcpServers).omit({ id: true, createdAt: true });

// === WEBHOOKS ===
export const webhooks = pgTable("webhooks", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  name: text("name").notNull(),
  url: text("url").notNull(),
  secret: text("secret"),
  type: text("type").notNull().default("n8n"), // 'n8n', 'zapier', 'custom'
  isActive: boolean("is_active").default(true),
  lastTriggered: timestamp("last_triggered"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWebhookSchema = createInsertSchema(webhooks).omit({ id: true, createdAt: true });

// === MARKETPLACE CATEGORIES ===
export const marketplaceCategories = pgTable("marketplace_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameEn: text("name_en").notNull(),
  icon: text("icon"),
  sortOrder: integer("sort_order").default(0),
});

export const insertMarketplaceCategorySchema = createInsertSchema(marketplaceCategories).omit({ id: true });

// === MARKETPLACE AGENTS ===
export const marketplaceAgents = pgTable("marketplace_agents", {
  id: serial("id").primaryKey(),
  creatorId: text("creator_id"),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  description: text("description"),
  descriptionEn: text("description_en"),
  icon: text("icon"),
  category: text("category"),
  systemPrompt: text("system_prompt"),
  tools: jsonb("tools").$type<string[]>().default([]),
  tags: text("tags").array(),
  priceType: text("price_type").default("free"),
  price: numeric("price").default("0"),
  downloadsCount: integer("downloads_count").default(0),
  ratingAvg: real("rating_avg").default(0),
  ratingsCount: integer("ratings_count").default(0),
  isPublished: boolean("is_published").default(false),
  isFeatured: boolean("is_featured").default(false),
  version: text("version").default("1.0"),
  screenshots: jsonb("screenshots").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMarketplaceAgentSchema = createInsertSchema(marketplaceAgents).omit({ id: true, createdAt: true, updatedAt: true, downloadsCount: true, ratingAvg: true, ratingsCount: true });

// === MARKETPLACE INSTALLS ===
export const marketplaceInstalls = pgTable("marketplace_installs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  marketplaceAgentId: integer("marketplace_agent_id").notNull().references(() => marketplaceAgents.id),
  installedAt: timestamp("installed_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

export const insertMarketplaceInstallSchema = createInsertSchema(marketplaceInstalls).omit({ id: true, installedAt: true });

// === MARKETPLACE RATINGS ===
export const marketplaceRatings = pgTable("marketplace_ratings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  marketplaceAgentId: integer("marketplace_agent_id").notNull().references(() => marketplaceAgents.id),
  rating: integer("rating").notNull(),
  review: text("review"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMarketplaceRatingSchema = createInsertSchema(marketplaceRatings).omit({ id: true, createdAt: true });

// === RELATIONS ===
export const agentsRelations = relations(agents, ({ many }) => ({
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  agent: one(agents, {
    fields: [tasks.agentId],
    references: [agents.id],
  }),
}));

export const marketplaceAgentsRelations = relations(marketplaceAgents, ({ many }) => ({
  installs: many(marketplaceInstalls),
  ratings: many(marketplaceRatings),
}));

export const marketplaceInstallsRelations = relations(marketplaceInstalls, ({ one }) => ({
  agent: one(marketplaceAgents, {
    fields: [marketplaceInstalls.marketplaceAgentId],
    references: [marketplaceAgents.id],
  }),
}));

export const marketplaceRatingsRelations = relations(marketplaceRatings, ({ one }) => ({
  agent: one(marketplaceAgents, {
    fields: [marketplaceRatings.marketplaceAgentId],
    references: [marketplaceAgents.id],
  }),
}));

// === TYPES ===
export type Agent = typeof agents.$inferSelect;
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type KnowledgeDoc = typeof knowledgeDocs.$inferSelect;
export type InsertKnowledgeDoc = z.infer<typeof insertKnowledgeDocSchema>;
export type ProviderSetting = typeof providerSettings.$inferSelect;
export type InsertProviderSetting = z.infer<typeof insertProviderSettingSchema>;
export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreference = z.infer<typeof insertUserPreferenceSchema>;
export type OutputTemplate = typeof outputTemplates.$inferSelect;
export type InsertOutputTemplate = z.infer<typeof insertOutputTemplateSchema>;

export type Skill = typeof skills.$inferSelect;
export type InsertSkill = z.infer<typeof insertSkillSchema>;
export type McpServer = typeof mcpServers.$inferSelect;
export type InsertMcpServer = z.infer<typeof insertMcpServerSchema>;
export type Webhook = typeof webhooks.$inferSelect;
export type InsertWebhook = z.infer<typeof insertWebhookSchema>;

export type MarketplaceCategory = typeof marketplaceCategories.$inferSelect;
export type InsertMarketplaceCategory = z.infer<typeof insertMarketplaceCategorySchema>;
export type MarketplaceAgent = typeof marketplaceAgents.$inferSelect;
export type InsertMarketplaceAgent = z.infer<typeof insertMarketplaceAgentSchema>;
export type MarketplaceInstall = typeof marketplaceInstalls.$inferSelect;
export type InsertMarketplaceInstall = z.infer<typeof insertMarketplaceInstallSchema>;
export type MarketplaceRating = typeof marketplaceRatings.$inferSelect;
export type InsertMarketplaceRating = z.infer<typeof insertMarketplaceRatingSchema>;

// API Request Types
export type CreateAgentRequest = InsertAgent;
export type UpdateAgentRequest = Partial<InsertAgent>;
export type CreateTaskRequest = InsertTask;
export type UpdateTaskRequest = Partial<InsertTask>;
export type CreateKnowledgeDocRequest = InsertKnowledgeDoc;
