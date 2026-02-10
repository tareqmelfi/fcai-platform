import type { Express, Request, Response } from "express";
import { generateImage } from "./client";

export function registerImageRoutes(app: Express): void {
  app.post("/api/generate-image", async (req: Request, res: Response) => {
    try {
      const { prompt } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const dataUrl = await generateImage(prompt);
      // Parse data URL: "data:image/png;base64,..."
      const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
      if (!match) {
        return res.status(500).json({ error: "Invalid image data format" });
      }

      res.json({
        b64_json: match[2],
        mimeType: match[1],
      });
    } catch (error) {
      console.error("Error generating image:", error);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });
}

