import type { Express, Request, Response } from "express";
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, UPLOADS_DIR);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, uniqueSuffix + ext);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter,
});

const chatUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const chatDir = path.join(UPLOADS_DIR, "chat");
      if (!fs.existsSync(chatDir)) fs.mkdirSync(chatDir, { recursive: true });
      cb(null, chatDir);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, uniqueSuffix + ext);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter,
});

function getFileCategory(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.includes("spreadsheet") || mimeType.includes("csv") || mimeType.includes("excel")) return "spreadsheet";
  if (mimeType.includes("document") || mimeType.includes("word")) return "document";
  if (mimeType.includes("json") || mimeType.includes("javascript") || mimeType.includes("typescript") || mimeType.includes("text/")) return "code";
  return "other";
}

const ALLOWED_EXTENSIONS = new Set([
  ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv", ".txt",
  ".ppt", ".pptx", ".odt", ".ods", ".odp",
  ".json", ".xml", ".md", ".rtf",
  ".py", ".js", ".ts", ".jsx", ".tsx", ".html", ".css",
  ".zip", ".rar", ".7z", ".tar", ".gz",
  ".mp3", ".wav", ".mp4", ".mov", ".avi",
]);

const SAFE_MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml",
  ".bmp": "image/bmp", ".pdf": "application/pdf",
  ".txt": "text/plain", ".csv": "text/csv", ".md": "text/plain",
  ".json": "application/json", ".xml": "application/xml",
};

function fileFilter(_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTENSIONS.has(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${ext} is not allowed`));
  }
}

export function registerProjectRoutes(app: Express): void {
  app.use("/uploads", (req, res, next) => {
    const filePath = path.join(UPLOADS_DIR, req.path);
    if (!filePath.startsWith(UPLOADS_DIR)) return res.status(403).send("Forbidden");
    const ext = path.extname(req.path).toLowerCase();
    const safeType = SAFE_MIME_TYPES[ext];
    if (safeType) {
      res.setHeader("Content-Type", safeType);
    } else {
      res.setHeader("Content-Type", "application/octet-stream");
    }
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("X-Content-Type-Options", "nosniff");
    next();
  }, express.static(UPLOADS_DIR));

  app.get("/api/projects", async (_req: Request, res: Response) => {
    try {
      const allProjects = await storage.getProjects();
      res.json(allProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req: Request, res: Response) => {
    try {
      const project = await storage.getProject(Number(req.params.id));
      if (!project) return res.status(404).json({ error: "Project not found" });
      const files = await storage.getProjectFiles(project.id);
      res.json({ ...project, files });
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req: Request, res: Response) => {
    try {
      const { name, description, systemPrompt } = req.body;
      if (!name?.trim()) return res.status(400).json({ error: "Project name is required" });
      const project = await storage.createProject({
        name: name.trim(),
        description: description || null,
        systemPrompt: systemPrompt || null,
      });
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  app.put("/api/projects/:id", async (req: Request, res: Response) => {
    try {
      const { name, description, systemPrompt } = req.body;
      const updated = await storage.updateProject(Number(req.params.id), {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(systemPrompt !== undefined && { systemPrompt }),
      });
      if (!updated) return res.status(404).json({ error: "Project not found" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req: Request, res: Response) => {
    try {
      const projectId = Number(req.params.id);
      const files = await storage.getProjectFiles(projectId);
      for (const file of files) {
        const filePath = path.join(UPLOADS_DIR, file.path);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
      await storage.deleteProject(projectId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  app.get("/api/projects/:id/files", async (req: Request, res: Response) => {
    try {
      const files = await storage.getProjectFiles(Number(req.params.id));
      res.json(files);
    } catch (error) {
      console.error("Error fetching project files:", error);
      res.status(500).json({ error: "Failed to fetch project files" });
    }
  });

  app.post("/api/projects/:id/files", upload.array("files", 10), async (req: Request, res: Response) => {
    try {
      const projectId = Number(req.params.id);
      const project = await storage.getProject(projectId);
      if (!project) return res.status(404).json({ error: "Project not found" });

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) return res.status(400).json({ error: "No files uploaded" });

      const created = [];
      for (const file of files) {
        const projectFile = await storage.createProjectFile({
          projectId,
          name: file.originalname,
          path: file.filename,
          type: getFileCategory(file.mimetype),
          size: file.size,
        });
        created.push(projectFile);
      }
      res.status(201).json(created);
    } catch (error) {
      console.error("Error uploading project files:", error);
      res.status(500).json({ error: "Failed to upload files" });
    }
  });

  app.delete("/api/project-files/:id", async (req: Request, res: Response) => {
    try {
      const file = await storage.getProjectFile(Number(req.params.id));
      if (!file) return res.status(404).json({ error: "File not found" });
      const filePath = path.join(UPLOADS_DIR, file.path);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      await storage.deleteProjectFile(file.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ error: "Failed to delete file" });
    }
  });

  app.post("/api/upload/chat", chatUpload.array("files", 10), async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) return res.status(400).json({ error: "No files uploaded" });

      const result = files.map((file) => ({
        name: file.originalname,
        path: `chat/${file.filename}`,
        type: getFileCategory(file.mimetype),
        mimeType: file.mimetype,
        size: file.size,
        url: `/uploads/chat/${file.filename}`,
      }));
      res.status(201).json(result);
    } catch (error) {
      console.error("Error uploading chat files:", error);
      res.status(500).json({ error: "Failed to upload files" });
    }
  });
}
