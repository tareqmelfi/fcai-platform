import { GoogleGenAI, Modality } from "@google/genai";

// Lazy-initialize the Gemini client to avoid crashing at startup
// when the API key environment variable is not set.
let _ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!_ai) {
    const apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key not configured (set GOOGLE_API_KEY or AI_INTEGRATIONS_GEMINI_API_KEY)");
    }
    _ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        apiVersion: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL ? "" : undefined,
        baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL || undefined,
      },
    });
  }
  return _ai;
}

/**
 * Generate an image and return as base64 data URL.
 * Uses gemini-2.5-flash-image model via Google Gemini API.
 */
export async function generateImage(prompt: string): Promise<string> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  const candidate = response.candidates?.[0];
  const imagePart = candidate?.content?.parts?.find(
    (part: { inlineData?: { data?: string; mimeType?: string } }) => part.inlineData
  );

  if (!imagePart?.inlineData?.data) {
    throw new Error("No image data in response");
  }

  const mimeType = imagePart.inlineData.mimeType || "image/png";
  return `data:${mimeType};base64,${imagePart.inlineData.data}`;
}
