import { db } from "./db";
import {
  agents, tasks, knowledgeDocs, providerSettings, userPreferences,
  projects, projectFiles, outputTemplates, skills, mcpServers, webhooks,
  marketplaceCategories, marketplaceAgents, marketplaceInstalls, marketplaceRatings,
  type Agent, type InsertAgent, type UpdateAgentRequest,
  type Task, type InsertTask, type UpdateTaskRequest,
  type KnowledgeDoc, type InsertKnowledgeDoc,
  type ProviderSetting, type UserPreference,
  type Project, type InsertProject, type ProjectFile, type InsertProjectFile,
  type OutputTemplate, type InsertOutputTemplate,
  type Skill, type InsertSkill,
  type McpServer, type InsertMcpServer,
  type Webhook, type InsertWebhook,
  type MarketplaceCategory, type InsertMarketplaceCategory,
  type MarketplaceAgent, type InsertMarketplaceAgent,
  type MarketplaceInstall, type InsertMarketplaceInstall,
  type MarketplaceRating, type InsertMarketplaceRating,
} from "@shared/schema";
import { eq, desc, and, or, isNull, ilike, sql, asc } from "drizzle-orm";

export interface IStorage {
  getAgents(): Promise<Agent[]>;
  getAgent(id: number): Promise<Agent | undefined>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: number, updates: UpdateAgentRequest): Promise<Agent>;

  getTasks(agentId?: number, status?: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, updates: UpdateTaskRequest): Promise<Task>;

  getKnowledgeDocs(): Promise<KnowledgeDoc[]>;
  createKnowledgeDoc(doc: InsertKnowledgeDoc): Promise<KnowledgeDoc>;

  getProviderSettings(): Promise<ProviderSetting[]>;
  getProviderSetting(provider: string): Promise<ProviderSetting | undefined>;
  upsertProviderSetting(provider: string, apiKey: string): Promise<ProviderSetting>;
  updateProviderStatus(provider: string, status: string): Promise<ProviderSetting | undefined>;
  deleteProviderSetting(provider: string): Promise<void>;

  getPreference(key: string): Promise<string | undefined>;
  setPreference(key: string, value: string): Promise<UserPreference>;
  getAllPreferences(): Promise<UserPreference[]>;

  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, updates: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<void>;

  getProjectFiles(projectId: number): Promise<ProjectFile[]>;
  getProjectFile(id: number): Promise<ProjectFile | undefined>;
  createProjectFile(file: InsertProjectFile): Promise<ProjectFile>;
  deleteProjectFile(id: number): Promise<void>;

  getOutputTemplates(): Promise<OutputTemplate[]>;
  getOutputTemplate(id: number): Promise<OutputTemplate | undefined>;
  createOutputTemplate(template: InsertOutputTemplate): Promise<OutputTemplate>;
  updateOutputTemplate(id: number, updates: Partial<InsertOutputTemplate>): Promise<OutputTemplate | undefined>;
  deleteOutputTemplate(id: number): Promise<void>;

  getSkills(): Promise<Skill[]>;
  getSkill(id: number): Promise<Skill | undefined>;
  createSkill(skill: InsertSkill): Promise<Skill>;
  updateSkill(id: number, updates: Partial<InsertSkill>): Promise<Skill | undefined>;
  deleteSkill(id: number): Promise<void>;

  getMcpServers(userId?: string): Promise<McpServer[]>;
  getMcpServer(id: number): Promise<McpServer | undefined>;
  createMcpServer(server: InsertMcpServer): Promise<McpServer>;
  updateMcpServer(id: number, updates: Partial<InsertMcpServer>): Promise<McpServer | undefined>;
  deleteMcpServer(id: number): Promise<void>;

  getWebhooks(userId?: string): Promise<Webhook[]>;
  getWebhook(id: number): Promise<Webhook | undefined>;
  createWebhook(webhook: InsertWebhook): Promise<Webhook>;
  updateWebhook(id: number, updates: Partial<InsertWebhook>): Promise<Webhook | undefined>;
  deleteWebhook(id: number): Promise<void>;

  getMarketplaceCategories(): Promise<MarketplaceCategory[]>;
  createMarketplaceCategory(cat: InsertMarketplaceCategory): Promise<MarketplaceCategory>;

  getMarketplaceAgents(opts?: { search?: string; category?: string; sort?: string; featured?: boolean }): Promise<MarketplaceAgent[]>;
  getMarketplaceAgent(id: number): Promise<MarketplaceAgent | undefined>;
  createMarketplaceAgent(agent: InsertMarketplaceAgent): Promise<MarketplaceAgent>;
  updateMarketplaceAgent(id: number, updates: Partial<InsertMarketplaceAgent>): Promise<MarketplaceAgent | undefined>;
  deleteMarketplaceAgent(id: number): Promise<void>;
  getMyMarketplaceAgents(creatorId: string): Promise<MarketplaceAgent[]>;

  getMarketplaceInstalls(userId: string): Promise<(MarketplaceInstall & { agent?: MarketplaceAgent })[]>;
  getMarketplaceInstall(userId: string, agentId: number): Promise<MarketplaceInstall | undefined>;
  createMarketplaceInstall(install: InsertMarketplaceInstall): Promise<MarketplaceInstall>;
  deleteMarketplaceInstall(userId: string, agentId: number): Promise<void>;

  getMarketplaceRatings(agentId: number): Promise<MarketplaceRating[]>;
  getUserMarketplaceRating(userId: string, agentId: number): Promise<MarketplaceRating | undefined>;
  createMarketplaceRating(rating: InsertMarketplaceRating): Promise<MarketplaceRating>;
  updateMarketplaceAgentRating(agentId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getAgents(): Promise<Agent[]> {
    return await db.select().from(agents).orderBy(agents.id);
  }

  async getAgent(id: number): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));
    return agent;
  }

  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const [agent] = await db.insert(agents).values(insertAgent).returning();
    return agent;
  }

  async updateAgent(id: number, updates: UpdateAgentRequest): Promise<Agent> {
    const [updated] = await db.update(agents)
      .set(updates)
      .where(eq(agents.id, id))
      .returning();
    return updated;
  }

  async getTasks(agentId?: number, status?: string): Promise<Task[]> {
    const conditions = [];
    if (agentId) conditions.push(eq(tasks.agentId, agentId));
    if (status) conditions.push(eq(tasks.status, status));

    if (conditions.length > 0) {
      return await db.select().from(tasks)
        .where(conditions.length === 1 ? conditions[0] : and(...conditions))
        .orderBy(desc(tasks.createdAt));
    }

    return await db.select().from(tasks).orderBy(desc(tasks.createdAt));
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(insertTask).returning();
    return task;
  }

  async updateTask(id: number, updates: UpdateTaskRequest): Promise<Task> {
    const [updated] = await db.update(tasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return updated;
  }

  async getKnowledgeDocs(): Promise<KnowledgeDoc[]> {
    return await db.select().from(knowledgeDocs).orderBy(desc(knowledgeDocs.createdAt));
  }

  async createKnowledgeDoc(insertDoc: InsertKnowledgeDoc): Promise<KnowledgeDoc> {
    const [doc] = await db.insert(knowledgeDocs).values(insertDoc).returning();
    return doc;
  }

  async getProviderSettings(): Promise<ProviderSetting[]> {
    return await db.select().from(providerSettings).orderBy(providerSettings.provider);
  }

  async getProviderSetting(provider: string): Promise<ProviderSetting | undefined> {
    const [setting] = await db.select().from(providerSettings).where(eq(providerSettings.provider, provider));
    return setting;
  }

  async upsertProviderSetting(provider: string, apiKey: string): Promise<ProviderSetting> {
    const existing = await this.getProviderSetting(provider);
    if (existing) {
      const [updated] = await db.update(providerSettings)
        .set({ apiKey, isActive: true, updatedAt: new Date(), status: "configured" })
        .where(eq(providerSettings.provider, provider))
        .returning();
      return updated;
    }
    const [created] = await db.insert(providerSettings)
      .values({ provider, apiKey, isActive: true, status: "configured" })
      .returning();
    return created;
  }

  async updateProviderStatus(provider: string, status: string): Promise<ProviderSetting | undefined> {
    const [updated] = await db.update(providerSettings)
      .set({ status, lastTested: new Date(), updatedAt: new Date() })
      .where(eq(providerSettings.provider, provider))
      .returning();
    return updated;
  }

  async deleteProviderSetting(provider: string): Promise<void> {
    await db.delete(providerSettings).where(eq(providerSettings.provider, provider));
  }

  async getPreference(key: string): Promise<string | undefined> {
    const [pref] = await db.select().from(userPreferences).where(eq(userPreferences.key, key));
    return pref?.value;
  }

  async setPreference(key: string, value: string): Promise<UserPreference> {
    const existing = await this.getPreference(key);
    if (existing !== undefined) {
      const [updated] = await db.update(userPreferences)
        .set({ value, updatedAt: new Date() })
        .where(eq(userPreferences.key, key))
        .returning();
      return updated;
    }
    const [created] = await db.insert(userPreferences)
      .values({ key, value })
      .returning();
    return created;
  }

  async getAllPreferences(): Promise<UserPreference[]> {
    return await db.select().from(userPreferences);
  }

  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db.insert(projects).values(insertProject).returning();
    return project;
  }

  async updateProject(id: number, updates: Partial<InsertProject>): Promise<Project | undefined> {
    const [updated] = await db.update(projects)
      .set(updates)
      .where(eq(projects.id, id))
      .returning();
    return updated;
  }

  async deleteProject(id: number): Promise<void> {
    await db.delete(projectFiles).where(eq(projectFiles.projectId, id));
    await db.delete(projects).where(eq(projects.id, id));
  }

  async getProjectFiles(projectId: number): Promise<ProjectFile[]> {
    return await db.select().from(projectFiles)
      .where(eq(projectFiles.projectId, projectId))
      .orderBy(projectFiles.name);
  }

  async getProjectFile(id: number): Promise<ProjectFile | undefined> {
    const [file] = await db.select().from(projectFiles).where(eq(projectFiles.id, id));
    return file;
  }

  async createProjectFile(insertFile: InsertProjectFile): Promise<ProjectFile> {
    const [file] = await db.insert(projectFiles).values(insertFile).returning();
    return file;
  }

  async deleteProjectFile(id: number): Promise<void> {
    await db.delete(projectFiles).where(eq(projectFiles.id, id));
  }

  async getOutputTemplates(): Promise<OutputTemplate[]> {
    return await db.select().from(outputTemplates).orderBy(outputTemplates.id);
  }

  async getOutputTemplate(id: number): Promise<OutputTemplate | undefined> {
    const [template] = await db.select().from(outputTemplates).where(eq(outputTemplates.id, id));
    return template;
  }

  async createOutputTemplate(insertTemplate: InsertOutputTemplate): Promise<OutputTemplate> {
    const [template] = await db.insert(outputTemplates).values(insertTemplate).returning();
    return template;
  }

  async updateOutputTemplate(id: number, updates: Partial<InsertOutputTemplate>): Promise<OutputTemplate | undefined> {
    const [updated] = await db.update(outputTemplates)
      .set(updates)
      .where(eq(outputTemplates.id, id))
      .returning();
    return updated;
  }

  async deleteOutputTemplate(id: number): Promise<void> {
    await db.delete(outputTemplates).where(eq(outputTemplates.id, id));
  }

  async getSkills(): Promise<Skill[]> {
    return await db.select().from(skills).orderBy(skills.id);
  }

  async getSkill(id: number): Promise<Skill | undefined> {
    const [skill] = await db.select().from(skills).where(eq(skills.id, id));
    return skill;
  }

  async createSkill(insertSkill: InsertSkill): Promise<Skill> {
    const [skill] = await db.insert(skills).values(insertSkill).returning();
    return skill;
  }

  async updateSkill(id: number, updates: Partial<InsertSkill>): Promise<Skill | undefined> {
    const [updated] = await db.update(skills)
      .set(updates)
      .where(eq(skills.id, id))
      .returning();
    return updated;
  }

  async deleteSkill(id: number): Promise<void> {
    await db.delete(skills).where(eq(skills.id, id));
  }

  async getMcpServers(userId?: string): Promise<McpServer[]> {
    if (userId) {
      return await db.select().from(mcpServers)
        .where(or(eq(mcpServers.userId, userId), isNull(mcpServers.userId)))
        .orderBy(mcpServers.id);
    }
    return await db.select().from(mcpServers).orderBy(mcpServers.id);
  }

  async getMcpServer(id: number): Promise<McpServer | undefined> {
    const [server] = await db.select().from(mcpServers).where(eq(mcpServers.id, id));
    return server;
  }

  async createMcpServer(insertServer: InsertMcpServer): Promise<McpServer> {
    const [server] = await db.insert(mcpServers).values(insertServer).returning();
    return server;
  }

  async updateMcpServer(id: number, updates: Partial<InsertMcpServer>): Promise<McpServer | undefined> {
    const [updated] = await db.update(mcpServers)
      .set(updates)
      .where(eq(mcpServers.id, id))
      .returning();
    return updated;
  }

  async deleteMcpServer(id: number): Promise<void> {
    await db.delete(mcpServers).where(eq(mcpServers.id, id));
  }

  async getWebhooks(userId?: string): Promise<Webhook[]> {
    if (userId) {
      return await db.select().from(webhooks)
        .where(or(eq(webhooks.userId, userId), isNull(webhooks.userId)))
        .orderBy(webhooks.id);
    }
    return await db.select().from(webhooks).orderBy(webhooks.id);
  }

  async getWebhook(id: number): Promise<Webhook | undefined> {
    const [webhook] = await db.select().from(webhooks).where(eq(webhooks.id, id));
    return webhook;
  }

  async createWebhook(insertWebhook: InsertWebhook): Promise<Webhook> {
    const [webhook] = await db.insert(webhooks).values(insertWebhook).returning();
    return webhook;
  }

  async updateWebhook(id: number, updates: Partial<InsertWebhook>): Promise<Webhook | undefined> {
    const [updated] = await db.update(webhooks)
      .set(updates)
      .where(eq(webhooks.id, id))
      .returning();
    return updated;
  }

  async deleteWebhook(id: number): Promise<void> {
    await db.delete(webhooks).where(eq(webhooks.id, id));
  }

  async getMarketplaceCategories(): Promise<MarketplaceCategory[]> {
    return await db.select().from(marketplaceCategories).orderBy(asc(marketplaceCategories.sortOrder));
  }

  async createMarketplaceCategory(cat: InsertMarketplaceCategory): Promise<MarketplaceCategory> {
    const [created] = await db.insert(marketplaceCategories).values(cat).returning();
    return created;
  }

  async getMarketplaceAgents(opts?: { search?: string; category?: string; sort?: string; featured?: boolean }): Promise<MarketplaceAgent[]> {
    const conditions = [eq(marketplaceAgents.isPublished, true)];
    if (opts?.category) conditions.push(eq(marketplaceAgents.category, opts.category));
    if (opts?.featured) conditions.push(eq(marketplaceAgents.isFeatured, true));
    if (opts?.search) {
      conditions.push(
        or(
          ilike(marketplaceAgents.name, `%${opts.search}%`),
          ilike(marketplaceAgents.nameEn, `%${opts.search}%`),
          ilike(marketplaceAgents.description, `%${opts.search}%`),
          ilike(marketplaceAgents.descriptionEn, `%${opts.search}%`),
          sql`${opts.search} = ANY(${marketplaceAgents.tags})`
        )!
      );
    }

    let orderBy;
    switch (opts?.sort) {
      case "downloads": orderBy = desc(marketplaceAgents.downloadsCount); break;
      case "rating": orderBy = desc(marketplaceAgents.ratingAvg); break;
      case "newest": orderBy = desc(marketplaceAgents.createdAt); break;
      default: orderBy = desc(marketplaceAgents.downloadsCount);
    }

    return await db.select().from(marketplaceAgents)
      .where(and(...conditions))
      .orderBy(orderBy);
  }

  async getMarketplaceAgent(id: number): Promise<MarketplaceAgent | undefined> {
    const [agent] = await db.select().from(marketplaceAgents).where(eq(marketplaceAgents.id, id));
    return agent;
  }

  async createMarketplaceAgent(agent: InsertMarketplaceAgent): Promise<MarketplaceAgent> {
    const [created] = await db.insert(marketplaceAgents).values(agent).returning();
    return created;
  }

  async updateMarketplaceAgent(id: number, updates: Partial<InsertMarketplaceAgent>): Promise<MarketplaceAgent | undefined> {
    const [updated] = await db.update(marketplaceAgents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(marketplaceAgents.id, id))
      .returning();
    return updated;
  }

  async deleteMarketplaceAgent(id: number): Promise<void> {
    await db.delete(marketplaceInstalls).where(eq(marketplaceInstalls.marketplaceAgentId, id));
    await db.delete(marketplaceRatings).where(eq(marketplaceRatings.marketplaceAgentId, id));
    await db.delete(marketplaceAgents).where(eq(marketplaceAgents.id, id));
  }

  async getMyMarketplaceAgents(creatorId: string): Promise<MarketplaceAgent[]> {
    return await db.select().from(marketplaceAgents)
      .where(eq(marketplaceAgents.creatorId, creatorId))
      .orderBy(desc(marketplaceAgents.createdAt));
  }

  async getMarketplaceInstalls(userId: string): Promise<(MarketplaceInstall & { agent?: MarketplaceAgent })[]> {
    const results = await db.select({
      install: marketplaceInstalls,
      agent: marketplaceAgents,
    }).from(marketplaceInstalls)
      .leftJoin(marketplaceAgents, eq(marketplaceInstalls.marketplaceAgentId, marketplaceAgents.id))
      .where(eq(marketplaceInstalls.userId, userId));
    return results.map(r => ({ ...r.install, agent: r.agent || undefined }));
  }

  async getMarketplaceInstall(userId: string, agentId: number): Promise<MarketplaceInstall | undefined> {
    const [install] = await db.select().from(marketplaceInstalls)
      .where(and(eq(marketplaceInstalls.userId, userId), eq(marketplaceInstalls.marketplaceAgentId, agentId)));
    return install;
  }

  async createMarketplaceInstall(install: InsertMarketplaceInstall): Promise<MarketplaceInstall> {
    const [created] = await db.insert(marketplaceInstalls).values(install).returning();
    await db.update(marketplaceAgents)
      .set({ downloadsCount: sql`${marketplaceAgents.downloadsCount} + 1` })
      .where(eq(marketplaceAgents.id, install.marketplaceAgentId));
    return created;
  }

  async deleteMarketplaceInstall(userId: string, agentId: number): Promise<void> {
    await db.delete(marketplaceInstalls)
      .where(and(eq(marketplaceInstalls.userId, userId), eq(marketplaceInstalls.marketplaceAgentId, agentId)));
  }

  async getMarketplaceRatings(agentId: number): Promise<MarketplaceRating[]> {
    return await db.select().from(marketplaceRatings)
      .where(eq(marketplaceRatings.marketplaceAgentId, agentId))
      .orderBy(desc(marketplaceRatings.createdAt));
  }

  async getUserMarketplaceRating(userId: string, agentId: number): Promise<MarketplaceRating | undefined> {
    const [rating] = await db.select().from(marketplaceRatings)
      .where(and(eq(marketplaceRatings.userId, userId), eq(marketplaceRatings.marketplaceAgentId, agentId)));
    return rating;
  }

  async createMarketplaceRating(rating: InsertMarketplaceRating): Promise<MarketplaceRating> {
    const [created] = await db.insert(marketplaceRatings).values(rating).returning();
    await this.updateMarketplaceAgentRating(rating.marketplaceAgentId);
    return created;
  }

  async updateMarketplaceAgentRating(agentId: number): Promise<void> {
    const ratings = await this.getMarketplaceRatings(agentId);
    const count = ratings.length;
    const avg = count > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / count : 0;
    await db.update(marketplaceAgents)
      .set({ ratingAvg: avg, ratingsCount: count })
      .where(eq(marketplaceAgents.id, agentId));
  }
}

export const storage = new DatabaseStorage();
