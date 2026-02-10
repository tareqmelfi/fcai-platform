import {
  Image as ImageIcon,
  FileText,
  FileSpreadsheet,
  FileCode,
  File as FileIcon,
} from "lucide-react";

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function getFileIcon(type: string) {
  switch (type) {
    case "image": return ImageIcon;
    case "pdf": case "document": return FileText;
    case "spreadsheet": return FileSpreadsheet;
    case "code": return FileCode;
    default: return FileIcon;
  }
}

export function getFileCategory(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.includes("spreadsheet") || mimeType.includes("csv") || mimeType.includes("excel")) return "spreadsheet";
  if (mimeType.includes("document") || mimeType.includes("word")) return "document";
  if (mimeType.includes("json") || mimeType.includes("javascript") || mimeType.includes("typescript") || mimeType.includes("text/")) return "code";
  return "other";
}
