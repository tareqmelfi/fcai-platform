import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import { registerProviderRoutes } from "./providers";
import { registerProjectRoutes } from "./projects";
import { registerMarketplaceRoutes } from "./marketplace";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  registerChatRoutes(app);
  registerImageRoutes(app);
  registerProviderRoutes(app);
  registerProjectRoutes(app);
  registerMarketplaceRoutes(app);

  app.get(api.agents.list.path, async (req, res) => {
    const agents = await storage.getAgents();
    res.json(agents);
  });

  app.get(api.agents.get.path, async (req, res) => {
    const agent = await storage.getAgent(Number(req.params.id));
    if (!agent) return res.status(404).json({ message: "Agent not found" });
    res.json(agent);
  });

  app.post(api.agents.create.path, async (req, res) => {
    try {
      const input = api.agents.create.input.parse(req.body);
      const agent = await storage.createAgent(input);
      res.status(201).json(agent);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put(api.agents.update.path, async (req, res) => {
    try {
      const input = api.agents.update.input.parse(req.body);
      const agent = await storage.updateAgent(Number(req.params.id), input);
      if (!agent) return res.status(404).json({ message: "Agent not found" });
      res.json(agent);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.tasks.list.path, async (req, res) => {
    const agentId = req.query.agentId ? Number(req.query.agentId) : undefined;
    const status = req.query.status as string | undefined;
    const tasks = await storage.getTasks(agentId, status);
    res.json(tasks);
  });

  app.post(api.tasks.create.path, async (req, res) => {
    try {
      const input = api.tasks.create.input.parse(req.body);
      const task = await storage.createTask(input);
      res.status(201).json(task);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch(api.tasks.update.path, async (req, res) => {
    try {
      const input = api.tasks.update.input.parse(req.body);
      const task = await storage.updateTask(Number(req.params.id), input);
      if (!task) return res.status(404).json({ message: "Task not found" });
      res.json(task);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.knowledge.list.path, async (req, res) => {
    const docs = await storage.getKnowledgeDocs();
    res.json(docs);
  });

  app.post(api.knowledge.create.path, async (req, res) => {
    try {
      const input = api.knowledge.create.input.parse(req.body);
      const doc = await storage.createKnowledgeDoc(input);
      res.status(201).json(doc);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get("/api/system-instructions", async (req, res) => {
    try {
      const value = await storage.getPreference("system_instructions");
      res.json({ instructions: value || "" });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch system instructions" });
    }
  });

  app.post("/api/system-instructions", async (req, res) => {
    try {
      const { instructions } = req.body;
      if (typeof instructions !== "string") return res.status(400).json({ error: "Invalid instructions" });
      await storage.setPreference("system_instructions", instructions);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save system instructions" });
    }
  });

  app.get("/api/output-templates", async (req, res) => {
    try {
      const templates = await storage.getOutputTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  app.get("/api/output-templates/:id", async (req, res) => {
    try {
      const template = await storage.getOutputTemplate(Number(req.params.id));
      if (!template) return res.status(404).json({ error: "Template not found" });
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch template" });
    }
  });

  app.post("/api/output-templates", async (req, res) => {
    try {
      const { name, description, systemPrompt, css, headerHtml, footerHtml } = req.body;
      if (!name) return res.status(400).json({ error: "Name is required" });
      const template = await storage.createOutputTemplate({ name, description, systemPrompt, css, headerHtml, footerHtml, isBuiltin: false });
      res.status(201).json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to create template" });
    }
  });

  app.put("/api/output-templates/:id", async (req, res) => {
    try {
      const { name, description, systemPrompt, css, headerHtml, footerHtml } = req.body;
      const template = await storage.updateOutputTemplate(Number(req.params.id), { name, description, systemPrompt, css, headerHtml, footerHtml });
      if (!template) return res.status(404).json({ error: "Template not found" });
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to update template" });
    }
  });

  app.delete("/api/output-templates/:id", async (req, res) => {
    try {
      await storage.deleteOutputTemplate(Number(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete template" });
    }
  });

  // === SKILLS ===
  app.get("/api/skills", async (req, res) => {
    try {
      const allSkills = await storage.getSkills();
      res.json(allSkills);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch skills" });
    }
  });

  app.get("/api/skills/:id", async (req, res) => {
    try {
      const skill = await storage.getSkill(Number(req.params.id));
      if (!skill) return res.status(404).json({ error: "Skill not found" });
      res.json(skill);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch skill" });
    }
  });

  app.post("/api/skills", async (req, res) => {
    try {
      const { name, description, icon, systemPrompt, tools, color } = req.body;
      if (!name) return res.status(400).json({ error: "Name is required" });
      const skill = await storage.createSkill({ name, description, icon, systemPrompt, tools, color, isDefault: false, isActive: true });
      res.status(201).json(skill);
    } catch (error) {
      res.status(500).json({ error: "Failed to create skill" });
    }
  });

  app.put("/api/skills/:id", async (req, res) => {
    try {
      const { name, description, icon, systemPrompt, tools, color, isActive } = req.body;
      const skill = await storage.updateSkill(Number(req.params.id), { name, description, icon, systemPrompt, tools, color, isActive });
      if (!skill) return res.status(404).json({ error: "Skill not found" });
      res.json(skill);
    } catch (error) {
      res.status(500).json({ error: "Failed to update skill" });
    }
  });

  app.delete("/api/skills/:id", async (req, res) => {
    try {
      await storage.deleteSkill(Number(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete skill" });
    }
  });

  // === MCP SERVERS ===
  app.get("/api/mcp-servers", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const servers = await storage.getMcpServers(userId);
      res.json(servers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch MCP servers" });
    }
  });

  app.post("/api/mcp-servers", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { name, type, url, command, args, envVars } = req.body;
      if (!name || !type) return res.status(400).json({ error: "Name and type are required" });
      const server = await storage.createMcpServer({ name, type, url, command, args, envVars, userId, isActive: false, status: "disconnected" });
      res.status(201).json(server);
    } catch (error) {
      res.status(500).json({ error: "Failed to create MCP server" });
    }
  });

  app.put("/api/mcp-servers/:id", async (req, res) => {
    try {
      const { name, type, url, command, args, envVars, isActive } = req.body;
      const server = await storage.updateMcpServer(Number(req.params.id), { name, type, url, command, args, envVars, isActive });
      if (!server) return res.status(404).json({ error: "MCP server not found" });
      res.json(server);
    } catch (error) {
      res.status(500).json({ error: "Failed to update MCP server" });
    }
  });

  app.delete("/api/mcp-servers/:id", async (req, res) => {
    try {
      await storage.deleteMcpServer(Number(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete MCP server" });
    }
  });

  app.post("/api/mcp-servers/:id/connect", async (req, res) => {
    try {
      const server = await storage.getMcpServer(Number(req.params.id));
      if (!server) return res.status(404).json({ error: "MCP server not found" });

      // Simulate connection attempt - real MCP protocol would go here
      const updated = await storage.updateMcpServer(server.id, {
        isActive: true,
        status: "connected",
        lastConnected: new Date() as any,
        tools: server.tools || [
          { name: "search", description: "بحث في البيانات" },
          { name: "calculate", description: "حسابات رياضية" },
        ],
      });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to connect to MCP server" });
    }
  });

  app.post("/api/mcp-servers/:id/disconnect", async (req, res) => {
    try {
      const updated = await storage.updateMcpServer(Number(req.params.id), {
        isActive: false,
        status: "disconnected",
      });
      if (!updated) return res.status(404).json({ error: "MCP server not found" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to disconnect MCP server" });
    }
  });

  // === WEBHOOKS CRUD ===
  app.get("/api/webhooks", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const allWebhooks = await storage.getWebhooks(userId);
      res.json(allWebhooks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch webhooks" });
    }
  });

  app.post("/api/webhooks", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { name, url, secret, type } = req.body;
      if (!name || !url) return res.status(400).json({ error: "Name and URL are required" });
      const webhook = await storage.createWebhook({ name, url, secret, type: type || "n8n", userId, isActive: true });
      res.status(201).json(webhook);
    } catch (error) {
      res.status(500).json({ error: "Failed to create webhook" });
    }
  });

  app.put("/api/webhooks/:id", async (req: any, res) => {
    try {
      const { name, url, secret, type, isActive } = req.body;
      const webhook = await storage.updateWebhook(Number(req.params.id), { name, url, secret, type, isActive });
      if (!webhook) return res.status(404).json({ error: "Webhook not found" });
      res.json(webhook);
    } catch (error) {
      res.status(500).json({ error: "Failed to update webhook" });
    }
  });

  app.delete("/api/webhooks/:id", async (req: any, res) => {
    try {
      await storage.deleteWebhook(Number(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete webhook" });
    }
  });

  app.post("/api/webhooks/trigger", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { webhookName, payload } = req.body;
      if (!webhookName) return res.status(400).json({ error: "Webhook name is required" });

      const allWebhooks = await storage.getWebhooks(userId);
      const webhook = allWebhooks.find(
        (w) => w.isActive && (w.name.toLowerCase() === webhookName.toLowerCase())
      );

      if (!webhook) {
        const activeWebhooks = allWebhooks.filter((w) => w.isActive);
        return res.status(404).json({
          error: "Webhook not found",
          available: activeWebhooks.map((w) => w.name),
        });
      }

      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (webhook.secret) headers["X-Webhook-Secret"] = webhook.secret;

        const response = await fetch(webhook.url!, {
          method: "POST",
          headers,
          body: JSON.stringify({
            action: "trigger_workflow",
            triggeredBy: userId,
            webhookName: webhook.name,
            payload: payload || {},
            timestamp: new Date().toISOString(),
          }),
        });

        await storage.updateWebhook(webhook.id, { lastTriggered: new Date() as any });

        const responseText = await response.text();
        let responseData;
        try { responseData = JSON.parse(responseText); } catch { responseData = responseText; }

        res.json({
          success: true,
          webhookName: webhook.name,
          statusCode: response.status,
          response: responseData,
        });
      } catch (fetchError: any) {
        res.json({
          success: false,
          webhookName: webhook.name,
          error: fetchError.message || "Failed to reach webhook URL",
        });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to trigger webhook" });
    }
  });

  // === N8N WEBHOOK ===
  app.post("/api/webhooks/n8n", async (req, res) => {
    try {
      const { action, data, agentRole, conversationId } = req.body;

      if (action === "trigger_workflow") {
        res.json({
          success: true,
          message: "Workflow triggered",
          timestamp: new Date().toISOString(),
          data: { action, agentRole, conversationId },
        });
      } else if (action === "agent_response") {
        res.json({
          success: true,
          message: "Agent response received",
          timestamp: new Date().toISOString(),
        });
      } else {
        res.json({
          success: true,
          message: "Webhook received",
          timestamp: new Date().toISOString(),
          receivedData: { action, agentRole },
        });
      }
    } catch (error) {
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  app.get("/api/webhooks/n8n/status", async (req, res) => {
    res.json({
      active: true,
      endpoint: "/api/webhooks/n8n",
      supportedActions: ["trigger_workflow", "agent_response"],
      timestamp: new Date().toISOString(),
    });
  });

  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingAgents = await storage.getAgents();
  if (existingAgents.length === 0) {
    const formationAdvisor = await storage.createAgent({
      name: "مستشار التأسيس",
      role: "formation_advisor",
      description: "يرشدك خلال قرارات تأسيس الشركات الأمريكية (LLC)، واختيار الولاية المناسبة، والمتطلبات القانونية والضريبية. متخصص في استشارات ريادة الأعمال.",
      avatar: null,
      isActive: true,
      config: {
        nameEn: "Formation Advisor",
        tone: "professional",
        expertise: ["LLC formation", "US business law", "tax planning", "state selection"],
        systemPrompt: "أنت مستشار تأسيس شركات خبير. تساعد رواد الأعمال العرب في تأسيس شركاتهم في أمريكا. تقدم نصائح دقيقة حول اختيار الولاية، الهيكل القانوني، المتطلبات الضريبية، وخطوات التأسيس.",
        icon: "Building2",
        color: "#05B6FA"
      }
    });

    const contractAnalyzer = await storage.createAgent({
      name: "محلل العقود",
      role: "contract_analyzer",
      description: "يراجع العقود ويحلل البنود القانونية، ويحدد المخاطر المحتملة، ويقترح التعديلات اللازمة لحماية مصالحك التجارية.",
      avatar: null,
      isActive: true,
      config: {
        nameEn: "Contract Analyzer",
        tone: "analytical",
        expertise: ["contract review", "legal analysis", "risk assessment", "clause optimization"],
        systemPrompt: "أنت محلل عقود متخصص. تراجع العقود التجارية وتحدد المخاطر والبنود غير المواتية. تقدم تحليلاً مفصلاً لكل بند وتقترح تعديلات لحماية مصالح العميل.",
        icon: "FileSearch",
        color: "#8B5CF6"
      }
    });

    const contentWriter = await storage.createAgent({
      name: "كاتب المحتوى",
      role: "content_writer",
      description: "ينشئ محتوى عربي احترافي مع تدريب على صوت العلامة التجارية. متخصص في كتابة المقالات، النصوص التسويقية، ومحتوى وسائل التواصل.",
      avatar: null,
      isActive: true,
      config: {
        nameEn: "Content Writer",
        tone: "creative",
        expertise: ["Arabic content", "brand voice", "marketing copy", "social media"],
        systemPrompt: "أنت كاتب محتوى عربي محترف. تنشئ محتوى إبداعي وتسويقي باللغة العربية الفصحى والعامية حسب الحاجة. تلتزم بصوت العلامة التجارية وتنتج محتوى جذاب يحقق أهداف التسويق.",
        icon: "PenTool",
        color: "#F59E0B"
      }
    });

    const financeAssistant = await storage.createAgent({
      name: "مساعد المالية",
      role: "finance_assistant",
      description: "يساعد في إنشاء الفواتير، تصنيف المصروفات، إعداد التقارير المالية، وتحليل التدفقات النقدية للمشاريع الصغيرة والمتوسطة.",
      avatar: null,
      isActive: true,
      config: {
        nameEn: "Finance Assistant",
        tone: "precise",
        expertise: ["invoicing", "expense tracking", "financial reporting", "cash flow"],
        systemPrompt: "أنت مساعد مالي ذكي. تساعد أصحاب الأعمال في إدارة شؤونهم المالية: إنشاء الفواتير، تصنيف المصروفات، إعداد التقارير المالية، وتحليل التدفقات النقدية. تقدم نصائح مالية عملية.",
        icon: "Calculator",
        color: "#10B981"
      }
    });

    const teamCoach = await storage.createAgent({
      name: "مدرب الفريق",
      role: "team_coach",
      description: "يعد مواد التدريب، وثائق التوظيف، إجراءات العمل القياسية (SOPs)، وبرامج تأهيل الموظفين الجدد بما يناسب بيئة العمل العربية.",
      avatar: null,
      isActive: true,
      config: {
        nameEn: "Team Coach",
        tone: "supportive",
        expertise: ["training materials", "onboarding", "SOPs", "HR documentation"],
        systemPrompt: "أنت مدرب فريق متخصص في تطوير الموارد البشرية. تعد مواد التدريب، أدلة التوظيف، إجراءات العمل القياسية، وبرامج تأهيل الموظفين الجدد. تراعي الثقافة العربية في بيئة العمل.",
        icon: "Users",
        color: "#EC4899"
      }
    });

    const dataAnalyst = await storage.createAgent({
      name: "محلل البيانات",
      role: "data_analyst",
      description: "يحلل البيانات والجداول ويستخرج رؤى عملية باللغة العربية. يحول الأرقام الجافة إلى تقارير مفهومة تساعد في اتخاذ القرارات.",
      avatar: null,
      isActive: true,
      config: {
        nameEn: "Data Analyst",
        tone: "analytical",
        expertise: ["data analysis", "visualization", "insights", "reporting"],
        systemPrompt: "أنت محلل بيانات خبير. تحلل الجداول والبيانات وتستخرج رؤى عملية. تقدم تقاريرك باللغة العربية بأسلوب واضح ومفهوم مع توصيات قابلة للتنفيذ لصناع القرار.",
        icon: "BarChart3",
        color: "#6366F1"
      }
    });

    await storage.createTask({
      title: "مراجعة عقد تأسيس شركة ذات مسؤولية محدودة",
      description: "مراجعة وتحليل عقد تأسيس LLC في ولاية ديلاوير وتقديم توصيات حول البنود القانونية والضريبية.",
      status: "pending",
      agentId: contractAnalyzer.id,
      priority: "high"
    });

    await storage.createTask({
      title: "إعداد محتوى تسويقي لإطلاق المنتج",
      description: "كتابة 5 منشورات لوسائل التواصل الاجتماعي + مقال مدونة لإطلاق منصة FCAI.",
      status: "in_progress",
      agentId: contentWriter.id,
      priority: "high"
    });

    await storage.createTask({
      title: "تحليل بيانات المبيعات Q4",
      description: "تحليل بيانات المبيعات للربع الأخير واستخراج اتجاهات النمو والتوصيات.",
      status: "pending",
      agentId: dataAnalyst.id,
      priority: "medium"
    });

    await storage.createTask({
      title: "إعداد تقرير مالي شهري",
      description: "تجميع وتصنيف المصروفات وإعداد التقرير المالي الشهري مع تحليل التدفقات النقدية.",
      status: "completed",
      agentId: financeAssistant.id,
      priority: "medium"
    });

    await storage.createTask({
      title: "بناء دليل تأهيل الموظفين الجدد",
      description: "إعداد دليل شامل لتأهيل الموظفين الجدد يتضمن السياسات والإجراءات وبرنامج التدريب الأسبوعي.",
      status: "in_progress",
      agentId: teamCoach.id,
      priority: "low"
    });

    await storage.createKnowledgeDoc({
      title: "دليل تأسيس الشركات في أمريكا",
      content: "دليل شامل لرواد الأعمال العرب حول خطوات تأسيس شركة LLC في الولايات المتحدة. يغطي اختيار الولاية المناسبة (ديلاوير، وايومنغ، نيفادا)، المتطلبات القانونية، الرسوم، الضرائب، وفتح الحسابات البنكية. يتضمن مقارنة تفصيلية بين الولايات الأكثر شعبية للتأسيس.",
      category: "legal",
      tags: ["تأسيس", "LLC", "أمريكا", "قانون"]
    });

    await storage.createKnowledgeDoc({
      title: "استراتيجية Falcon Core AI",
      content: "فالكون كور AI — مساحة العمل الذكية للشركات العربية. كل النماذج في مكان واحد، ذاكرة مستمرة، وكلاء مخصصين، وسيادة كاملة على بياناتك. المنصة تقدم وصول متعدد النماذج (Claude, GPT, Gemini, DeepSeek, Llama)، ذاكرة دائمة، وكلاء ذكاء اصطناعي مخصصين للمهام، وسيادة على البيانات.",
      category: "strategy",
      tags: ["FCAI", "استراتيجية", "منصة", "AI"]
    });

    await storage.createKnowledgeDoc({
      title: "سياسة خصوصية البيانات",
      content: "سياسة حماية البيانات الخاصة بمنصة Falcon Core AI. نلتزم بأعلى معايير الأمان والخصوصية. جميع البيانات مشفرة أثناء النقل والتخزين. نستخدم بنية Zero Trust Architecture ومعالجة محلية للبيانات الحساسة. لا نشارك بيانات العملاء مع أطراف ثالثة.",
      category: "policy",
      tags: ["خصوصية", "أمان", "سياسات"]
    });
  }

  const existingSkills = await storage.getSkills();
  if (existingSkills.length === 0) {
    await storage.createSkill({
      name: "كاتب المحتوى",
      description: "إنشاء محتوى عربي احترافي: مقالات، نصوص تسويقية، محتوى وسائل التواصل",
      icon: "PenTool",
      systemPrompt: "أنت كاتب محتوى عربي محترف. تنشئ محتوى إبداعي وتسويقي باللغة العربية الفصحى والعامية حسب الحاجة. تلتزم بصوت العلامة التجارية وتنتج محتوى جذاب يحقق أهداف التسويق.",
      tools: ["writing", "seo", "social_media"],
      color: "#F59E0B",
      isDefault: true,
      isActive: true,
    });
    await storage.createSkill({
      name: "محلل البيانات",
      description: "تحليل البيانات والجداول واستخراج رؤى عملية وتقارير مفهومة",
      icon: "BarChart3",
      systemPrompt: "أنت محلل بيانات خبير. تحلل الجداول والبيانات وتستخرج رؤى عملية. تقدم تقاريرك باللغة العربية بأسلوب واضح ومفهوم مع توصيات قابلة للتنفيذ لصناع القرار.",
      tools: ["data_analysis", "visualization", "reporting"],
      color: "#6366F1",
      isDefault: true,
      isActive: true,
    });
    await storage.createSkill({
      name: "محلل العقود",
      description: "مراجعة العقود وتحليل البنود القانونية وتحديد المخاطر المحتملة",
      icon: "FileSearch",
      systemPrompt: "أنت محلل عقود متخصص. تراجع العقود التجارية وتحدد المخاطر والبنود غير المواتية. تقدم تحليلاً مفصلاً لكل بند وتقترح تعديلات لحماية مصالح العميل.",
      tools: ["legal_analysis", "risk_assessment", "contract_review"],
      color: "#8B5CF6",
      isDefault: true,
      isActive: true,
    });
    await storage.createSkill({
      name: "مستشار التأسيس",
      description: "استشارات تأسيس الشركات الأمريكية والمتطلبات القانونية والضريبية",
      icon: "Building2",
      systemPrompt: "أنت مستشار تأسيس شركات خبير. تساعد رواد الأعمال العرب في تأسيس شركاتهم في أمريكا. تقدم نصائح دقيقة حول اختيار الولاية، الهيكل القانوني، المتطلبات الضريبية، وخطوات التأسيس.",
      tools: ["business_law", "tax_planning", "state_comparison"],
      color: "#05B6FA",
      isDefault: true,
      isActive: true,
    });
    await storage.createSkill({
      name: "مساعد المالية",
      description: "إنشاء الفواتير، تصنيف المصروفات، التقارير المالية، وتحليل التدفقات النقدية",
      icon: "Calculator",
      systemPrompt: "أنت مساعد مالي ذكي. تساعد أصحاب الأعمال في إدارة شؤونهم المالية: إنشاء الفواتير، تصنيف المصروفات، إعداد التقارير المالية، وتحليل التدفقات النقدية. تقدم نصائح مالية عملية.",
      tools: ["invoicing", "expense_tracking", "financial_reporting"],
      color: "#10B981",
      isDefault: true,
      isActive: true,
    });
    await storage.createSkill({
      name: "مدرب الفريق",
      description: "إعداد مواد التدريب والتوظيف وإجراءات العمل وبرامج تأهيل الموظفين",
      icon: "Users",
      systemPrompt: "أنت مدرب فريق متخصص في تطوير الموارد البشرية. تعد مواد التدريب، أدلة التوظيف، إجراءات العمل القياسية، وبرامج تأهيل الموظفين الجدد. تراعي الثقافة العربية في بيئة العمل.",
      tools: ["training", "onboarding", "hr_documentation"],
      color: "#EC4899",
      isDefault: true,
      isActive: true,
    });
  }

  const existingTemplates = await storage.getOutputTemplates();
  if (existingTemplates.length === 0) {
    await storage.createOutputTemplate({
      name: "تقرير رسمي",
      description: "تقرير رسمي مع ترويسة وتذييل بعلامة Falcon Core",
      systemPrompt: "أنت تكتب تقريراً رسمياً احترافياً. استخدم عناوين واضحة، فقرات منظمة، ونقاط مرقمة. التزم بالأسلوب الرسمي المهني.",
      css: `.template-report { font-family: 'Noto Sans Arabic', sans-serif; direction: rtl; padding: 2rem; } .template-report h1, .template-report h2, .template-report h3 { color: #05B6FA; border-bottom: 1px solid rgba(5,182,250,0.2); padding-bottom: 0.5rem; margin-top: 1.5rem; } .template-report p { line-height: 1.8; margin: 0.75rem 0; } .template-report ul, .template-report ol { padding-right: 1.5rem; }`,
      headerHtml: `<div style="display:flex;align-items:center;justify-content:space-between;padding:1rem 1.5rem;border-bottom:2px solid #05B6FA;margin-bottom:1.5rem;"><div style="font-size:18px;font-weight:700;color:#05B6FA;font-family:Rubik,sans-serif;">FALCON CORE AI</div><div style="font-size:12px;color:rgba(255,255,255,0.4);">تقرير رسمي</div></div>`,
      footerHtml: `<div style="margin-top:2rem;padding-top:1rem;border-top:1px solid rgba(255,255,255,0.1);display:flex;justify-content:space-between;font-size:11px;color:rgba(255,255,255,0.3);"><span>Falcon Core AI - fc.sa</span><span>تم الإنشاء بواسطة الذكاء الاصطناعي</span></div>`,
      isBuiltin: true,
    });

    await storage.createOutputTemplate({
      name: "عرض تقديمي",
      description: "بطاقات بأسلوب العروض التقديمية",
      systemPrompt: "قدّم المحتوى على شكل شرائح عرض تقديمي. كل قسم رئيسي يمثل شريحة. استخدم عناوين قصيرة وواضحة ونقاط موجزة. لا تكتب فقرات طويلة.",
      css: `.template-presentation { font-family: 'Noto Sans Arabic', sans-serif; direction: rtl; } .template-presentation h2 { background: linear-gradient(135deg, rgba(5,182,250,0.15), rgba(0,21,57,0.3)); padding: 1rem 1.5rem; border-radius: 0.75rem; color: #05B6FA; margin: 1.5rem 0 1rem; border-right: 4px solid #05B6FA; } .template-presentation h3 { color: #E5E7EB; margin-top: 1rem; } .template-presentation ul { list-style: none; padding: 0; } .template-presentation li { padding: 0.5rem 1rem; margin: 0.25rem 0; background: rgba(255,255,255,0.03); border-radius: 0.5rem; border-right: 2px solid rgba(5,182,250,0.3); }`,
      headerHtml: `<div style="text-align:center;padding:1.5rem;background:linear-gradient(135deg,rgba(5,182,250,0.1),rgba(0,21,57,0.4));border-radius:1rem;margin-bottom:1.5rem;"><div style="font-size:11px;letter-spacing:3px;color:#05B6FA;font-family:Rubik,sans-serif;margin-bottom:0.5rem;">FALCON CORE AI</div><div style="font-size:14px;color:rgba(255,255,255,0.5);">عرض تقديمي</div></div>`,
      footerHtml: `<div style="text-align:center;margin-top:2rem;padding:1rem;font-size:11px;color:rgba(255,255,255,0.25);">Falcon Core AI</div>`,
      isBuiltin: true,
    });

    await storage.createOutputTemplate({
      name: "مقال",
      description: "تنسيق مقال أو تدوينة مع مقدمة وخاتمة",
      systemPrompt: "اكتب بأسلوب المقالات والتدوينات. ابدأ بمقدمة جذابة، ثم اعرض الأفكار الرئيسية في فقرات منظمة، واختم بخاتمة ملخصة. استخدم أسلوباً سلساً وممتعاً للقراءة.",
      css: `.template-article { font-family: 'Noto Sans Arabic', sans-serif; direction: rtl; max-width: 700px; margin: 0 auto; } .template-article h1 { font-size: 1.5rem; color: #E5E7EB; margin-bottom: 0.5rem; } .template-article h2 { color: #05B6FA; font-size: 1.2rem; margin-top: 2rem; } .template-article p { line-height: 2; color: rgba(229,231,235,0.85); margin: 1rem 0; text-align: justify; } .template-article blockquote { border-right: 3px solid #05B6FA; padding-right: 1rem; margin: 1.5rem 0; color: rgba(255,255,255,0.6); font-style: italic; }`,
      headerHtml: `<div style="padding-bottom:1rem;margin-bottom:1.5rem;border-bottom:1px solid rgba(255,255,255,0.08);"><div style="font-size:10px;letter-spacing:2px;color:#05B6FA;text-transform:uppercase;font-family:Rubik,sans-serif;">FALCON CORE AI - مقال</div></div>`,
      footerHtml: `<div style="margin-top:2rem;padding-top:1rem;border-top:1px solid rgba(255,255,255,0.08);font-size:11px;color:rgba(255,255,255,0.25);text-align:center;">نُشر بواسطة Falcon Core AI</div>`,
      isBuiltin: true,
    });
  }

  const existingCategories = await storage.getMarketplaceCategories();
  if (existingCategories.length === 0) {
    const cats = [
      { name: "المحتوى والكتابة", nameEn: "Content Writing", icon: "PenTool", sortOrder: 1 },
      { name: "تحليل البيانات", nameEn: "Data Analysis", icon: "BarChart3", sortOrder: 2 },
      { name: "المالية والمحاسبة", nameEn: "Finance", icon: "Calculator", sortOrder: 3 },
      { name: "القانون والعقود", nameEn: "Legal", icon: "Scale", sortOrder: 4 },
      { name: "التسويق والمبيعات", nameEn: "Marketing", icon: "TrendingUp", sortOrder: 5 },
      { name: "التأسيس والأعمال", nameEn: "Business", icon: "Building2", sortOrder: 6 },
      { name: "الإدارة والفريق", nameEn: "Team", icon: "Users", sortOrder: 7 },
      { name: "التقنية والبرمجة", nameEn: "Tech", icon: "Code", sortOrder: 8 },
      { name: "مخصص", nameEn: "Custom", icon: "Settings", sortOrder: 9 },
    ];
    for (const cat of cats) {
      await storage.createMarketplaceCategory(cat);
    }
  }

  const existingMarketplaceAgents = await storage.getMarketplaceAgents({ featured: true });
  if (existingMarketplaceAgents.length === 0) {
    const featuredAgents = [
      {
        name: "كاتب المحتوى",
        nameEn: "Content Writer",
        description: "إنشاء محتوى عربي احترافي: مقالات، نصوص تسويقية، محتوى وسائل التواصل",
        descriptionEn: "Create professional Arabic content: articles, marketing copy, social media content",
        icon: "PenTool",
        category: "المحتوى والكتابة",
        systemPrompt: "أنت كاتب محتوى عربي محترف. تنشئ محتوى إبداعي وتسويقي باللغة العربية الفصحى والعامية حسب الحاجة. تلتزم بصوت العلامة التجارية وتنتج محتوى جذاب يحقق أهداف التسويق.",
        tools: ["writing", "seo", "social_media"],
        tags: ["كتابة", "محتوى", "تسويق", "عربي"],
        priceType: "free",
        isPublished: true,
        isFeatured: true,
        version: "1.0",
      },
      {
        name: "محلل البيانات",
        nameEn: "Data Analyst",
        description: "تحليل البيانات والجداول واستخراج رؤى عملية وتقارير مفهومة",
        descriptionEn: "Analyze data and spreadsheets, extract actionable insights and clear reports",
        icon: "BarChart3",
        category: "تحليل البيانات",
        systemPrompt: "أنت محلل بيانات خبير. تحلل الجداول والبيانات وتستخرج رؤى عملية. تقدم تقاريرك باللغة العربية بأسلوب واضح ومفهوم مع توصيات قابلة للتنفيذ لصناع القرار.",
        tools: ["data_analysis", "visualization", "reporting"],
        tags: ["بيانات", "تحليل", "تقارير", "إحصاء"],
        priceType: "free",
        isPublished: true,
        isFeatured: true,
        version: "1.0",
      },
      {
        name: "محلل العقود",
        nameEn: "Contract Analyzer",
        description: "مراجعة العقود وتحليل البنود القانونية وتحديد المخاطر المحتملة",
        descriptionEn: "Review contracts, analyze legal terms, and identify potential risks",
        icon: "FileSearch",
        category: "القانون والعقود",
        systemPrompt: "أنت محلل عقود متخصص. تراجع العقود التجارية وتحدد المخاطر والبنود غير المواتية. تقدم تحليلاً مفصلاً لكل بند وتقترح تعديلات لحماية مصالح العميل.",
        tools: ["legal_analysis", "risk_assessment", "contract_review"],
        tags: ["عقود", "قانون", "مراجعة", "مخاطر"],
        priceType: "free",
        isPublished: true,
        isFeatured: true,
        version: "1.0",
      },
      {
        name: "مستشار التأسيس",
        nameEn: "Formation Advisor",
        description: "استشارات تأسيس الشركات الأمريكية والمتطلبات القانونية والضريبية",
        descriptionEn: "LLC formation consulting, US business law and tax requirements",
        icon: "Building2",
        category: "التأسيس والأعمال",
        systemPrompt: "أنت مستشار تأسيس شركات خبير. تساعد رواد الأعمال العرب في تأسيس شركاتهم في أمريكا. تقدم نصائح دقيقة حول اختيار الولاية، الهيكل القانوني، المتطلبات الضريبية، وخطوات التأسيس.",
        tools: ["business_law", "tax_planning", "state_comparison"],
        tags: ["تأسيس", "شركات", "أمريكا", "LLC"],
        priceType: "free",
        isPublished: true,
        isFeatured: true,
        version: "1.0",
      },
      {
        name: "مساعد المالية",
        nameEn: "Finance Assistant",
        description: "إنشاء الفواتير، تصنيف المصروفات، التقارير المالية، وتحليل التدفقات النقدية",
        descriptionEn: "Create invoices, categorize expenses, financial reports, and cash flow analysis",
        icon: "Calculator",
        category: "المالية والمحاسبة",
        systemPrompt: "أنت مساعد مالي ذكي. تساعد أصحاب الأعمال في إدارة شؤونهم المالية: إنشاء الفواتير، تصنيف المصروفات، إعداد التقارير المالية، وتحليل التدفقات النقدية. تقدم نصائح مالية عملية.",
        tools: ["invoicing", "expense_tracking", "financial_reporting"],
        tags: ["مالية", "فواتير", "محاسبة", "تقارير"],
        priceType: "free",
        isPublished: true,
        isFeatured: true,
        version: "1.0",
      },
      {
        name: "مدرب الفريق",
        nameEn: "Team Coach",
        description: "إعداد مواد التدريب والتوظيف وإجراءات العمل وبرامج تأهيل الموظفين",
        descriptionEn: "Create training materials, HR documentation, SOPs, and onboarding programs",
        icon: "Users",
        category: "الإدارة والفريق",
        systemPrompt: "أنت مدرب فريق متخصص في تطوير الموارد البشرية. تعد مواد التدريب، أدلة التوظيف، إجراءات العمل القياسية، وبرامج تأهيل الموظفين الجدد. تراعي الثقافة العربية في بيئة العمل.",
        tools: ["training", "onboarding", "hr_documentation"],
        tags: ["تدريب", "فريق", "موظفين", "إدارة"],
        priceType: "free",
        isPublished: true,
        isFeatured: true,
        version: "1.0",
      },
    ];
    for (const agent of featuredAgents) {
      await storage.createMarketplaceAgent(agent as any);
    }
  }
}
