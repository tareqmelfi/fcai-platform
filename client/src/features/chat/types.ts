export interface AttachedFile {
  name: string;
  size: number;
  type: string;
  mimeType: string;
  url?: string;
  path?: string;
  previewUrl?: string;
  uploading?: boolean;
}

export interface ModelEntry {
  id: string;
  name: string;
  vision?: boolean;
  active?: boolean;
}

export interface ProviderGroup {
  name: string;
  key: string;
  icon: string;
  color: string;
  configured: boolean;
  models: ModelEntry[];
}

export interface SkillType {
  id: number;
  userId: string | null;
  name: string;
  description: string | null;
  icon: string | null;
  systemPrompt: string | null;
  tools: string[] | null;
  color: string | null;
  isDefault: boolean | null;
  isActive: boolean | null;
}

export interface McpServerType {
  id: number;
  name: string;
  type: string;
  url: string | null;
  command: string | null;
  status: string | null;
  isActive: boolean | null;
  tools: any[] | null;
}

export interface OutputTemplate {
  id: number;
  name: string;
  description: string | null;
  systemPrompt: string | null;
  css: string | null;
  headerHtml: string | null;
  footerHtml: string | null;
  isBuiltin: boolean | null;
}

export interface MessageType {
  id: number;
  role: "user" | "assistant" | "system" | "model";
  content: string;
  attachments?: any[];
  createdAt?: string;
}

export interface ConversationType {
  id: number;
  title: string;
  projectId?: number;
  messages?: MessageType[];
  createdAt?: string;
  updatedAt?: string;
}
