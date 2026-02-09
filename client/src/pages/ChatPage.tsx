import { useState, useRef, useEffect, useCallback } from "react";
import {
  useConversations,
  useConversation,
  useCreateConversation,
  useStreamingChat,
} from "@/hooks/use-chat";
import { useAuth } from "@/hooks/use-auth";
import { useAgents } from "@/hooks/use-agents";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { cn } from "@/lib/utils";
import { useLocation, useSearch } from "wouter";
import {
  Paperclip,
  Settings2,
  ArrowUp,
  Mic,
  ChevronDown,
  Bot,
  Search,
  Loader2,
  Plug,
  FileOutput,
  Upload,
  HardDrive,
  Sparkles,
  FolderOpen,
  X,
  FileText,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  File as FileIcon,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Download,
  Check,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface AttachedFile {
  name: string;
  size: number;
  type: string;
  mimeType: string;
  url?: string;
  path?: string;
  previewUrl?: string;
  uploading?: boolean;
}

interface ModelEntry {
  id: string;
  name: string;
  vision?: boolean;
  active?: boolean;
}

interface ProviderGroup {
  name: string;
  key: string;
  icon: string;
  color: string;
  configured: boolean;
  models: ModelEntry[];
}

const STATIC_MODELS: Record<string, ModelEntry[]> = {
  openai: [
    { id: "gpt-4o", name: "GPT-4o", vision: true },
    { id: "gpt-4o-mini", name: "GPT-4o Mini", vision: true },
    { id: "o1-preview", name: "o1-preview" },
    { id: "o3-mini", name: "o3-mini" },
  ],
  anthropic: [
    { id: "claude-4-opus", name: "Claude 4 Opus" },
    { id: "claude-4-sonnet", name: "Claude 4 Sonnet" },
    { id: "claude-3.5-sonnet", name: "Claude 3.5 Sonnet" },
  ],
  google: [
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", active: true },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro" },
  ],
};

const PROVIDER_META: Record<string, { name: string; icon: string; color: string }> = {
  openrouter: { name: "OpenRouter", icon: "OR", color: "#6366F1" },
  openai: { name: "OpenAI", icon: "O", color: "#10A37F" },
  anthropic: { name: "Anthropic", icon: "A", color: "#D97706" },
  google: { name: "Google AI", icon: "G", color: "#4285F4" },
  ollama: { name: "Ollama", icon: "OL", color: "#9CA3AF" },
};

function useProviderModels() {
  const providersQuery = useQuery<any[]>({
    queryKey: ["/api/providers"],
    queryFn: async () => {
      const res = await fetch("/api/providers", { credentials: "include" });
      return res.json();
    },
    staleTime: 30000,
  });

  const openRouterModels = useQuery<ModelEntry[]>({
    queryKey: ["/api/providers/openrouter/models"],
    queryFn: async () => {
      const res = await fetch("/api/providers/openrouter/models", { credentials: "include" });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.models || []).slice(0, 50).map((m: any) => ({
        id: `openrouter/${m.id}`,
        name: m.name,
      }));
    },
    enabled: providersQuery.data?.some((p: any) => p.provider === "openrouter" && p.configured) ?? false,
    staleTime: 60000,
  });

  const groups: ProviderGroup[] = [];
  const providerOrder = ["google", "openrouter", "openai", "anthropic", "ollama"];

  for (const key of providerOrder) {
    const meta = PROVIDER_META[key];
    if (!meta) continue;
    const providerStatus = providersQuery.data?.find((p: any) => p.provider === key);
    const configured = providerStatus?.configured || key === "google";

    let models: ModelEntry[] = [];
    if (key === "openrouter" && configured) {
      models = openRouterModels.data || [];
    } else if (key === "ollama") {
      models = [];
    } else {
      models = STATIC_MODELS[key] || [];
    }

    groups.push({ name: meta.name, key, icon: meta.icon, color: meta.color, configured, models });
  }

  return groups;
}

function ModelSelector({
  selectedModel,
  onSelect,
  isOpen,
  onToggle,
}: {
  selectedModel: string;
  onSelect: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const [search, setSearch] = useState("");
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const providerGroups = useProviderModels();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onToggle();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onToggle]);

  const displayName = (() => {
    for (const p of providerGroups) {
      const m = p.models.find((m) => m.id === selectedModel);
      if (m) return m.name;
    }
    return selectedModel;
  })();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors"
        style={{ background: "rgba(255,255,255,0.06)", color: "#D1D5DB", border: "1px solid rgba(255,255,255,0.08)" }}
        data-testid="button-model-selector"
      >
        <span dir="ltr">{displayName}</span>
        <ChevronDown className="h-3 w-3" />
      </button>

      {isOpen && (
        <div
          className="absolute bottom-full mb-2 right-0 w-[300px] rounded-xl overflow-hidden z-50 shadow-xl"
          style={{ background: "#0a1628", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <div className="p-2">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن موديل..."
                dir="ltr"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 pr-9 text-[13px] text-white/80 placeholder:text-white/30 outline-none focus:border-[#05B6FA]"
                data-testid="input-model-search"
              />
            </div>
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {providerGroups.filter(
              (p) =>
                !search ||
                p.name.toLowerCase().includes(search.toLowerCase()) ||
                p.models.some((m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.id.toLowerCase().includes(search.toLowerCase()))
            ).map((provider) => {
              const filteredModels = search
                ? provider.models.filter(
                    (m) =>
                      m.name.toLowerCase().includes(search.toLowerCase()) ||
                      m.id.toLowerCase().includes(search.toLowerCase())
                  )
                : provider.models;

              return (
                <div key={provider.key}>
                  <button
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium transition-colors"
                    style={{ color: "#D1D5DB" }}
                    onClick={() =>
                      setExpandedProvider(expandedProvider === provider.key ? null : provider.key)
                    }
                  >
                    <span
                      className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold"
                      style={{ background: provider.color + "20", color: provider.color }}
                    >
                      {provider.icon}
                    </span>
                    <span className="flex-1 text-right">{provider.name}</span>
                    {!provider.configured && provider.key !== "google" && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.05)", color: "#9CA3AF" }}>
                        غير مُعدّ
                      </span>
                    )}
                    {provider.configured && provider.key !== "google" && (
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#22C55E" }} />
                    )}
                    <ChevronDown
                      className={cn(
                        "h-3 w-3 transition-transform",
                        expandedProvider === provider.key && "rotate-180"
                      )}
                    />
                  </button>
                  {expandedProvider === provider.key &&
                    filteredModels.map((model) => (
                      <button
                        key={model.id}
                        className={cn(
                          "w-full flex items-center gap-2 px-8 py-2 text-[12px] transition-colors",
                          selectedModel === model.id ? "text-[#05B6FA]" : "text-white/60"
                        )}
                        style={{
                          background: selectedModel === model.id ? "rgba(5,182,250,0.1)" : "transparent",
                        }}
                        onClick={() => {
                          onSelect(model.id);
                          localStorage.setItem("fcai_lastModel", model.id);
                          onToggle();
                        }}
                        data-testid={`model-${model.id}`}
                      >
                        <span dir="ltr" className="truncate">{model.name}</span>
                        {model.vision && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: "rgba(5,182,250,0.15)", color: "#05B6FA" }}>
                            vision
                          </span>
                        )}
                        {model.active && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }}>
                            active
                          </span>
                        )}
                      </button>
                    ))}
                  {expandedProvider === provider.key && filteredModels.length === 0 && !provider.configured && (
                    <div className="px-8 py-2 text-[11px] text-white/30">
                      <a href="/settings" className="underline" style={{ color: "#05B6FA" }}>أضف مفتاح API</a>
                    </div>
                  )}
                  {expandedProvider === provider.key && filteredModels.length === 0 && provider.configured && (
                    <div className="px-8 py-2 text-[11px] text-white/30">لا توجد نتائج</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full"
          style={{
            background: "#05B6FA",
            animation: `bounce 1.4s infinite ease-in-out both`,
            animationDelay: `${i * 0.16}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getFileIcon(type: string) {
  switch (type) {
    case "image": return ImageIcon;
    case "pdf": case "document": return FileText;
    case "spreadsheet": return FileSpreadsheet;
    case "code": return FileCode;
    default: return FileIcon;
  }
}

function getFileCategory(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.includes("spreadsheet") || mimeType.includes("csv") || mimeType.includes("excel")) return "spreadsheet";
  if (mimeType.includes("document") || mimeType.includes("word")) return "document";
  if (mimeType.includes("json") || mimeType.includes("javascript") || mimeType.includes("typescript") || mimeType.includes("text/")) return "code";
  return "other";
}

function FileChip({ file, onRemove }: { file: AttachedFile; onRemove: () => void }) {
  const Icon = getFileIcon(file.type);
  const isImage = file.type === "image";

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] group"
      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
      data-testid={`file-chip-${file.name}`}
    >
      {isImage && file.previewUrl ? (
        <img src={file.previewUrl} alt={file.name} className="w-8 h-8 rounded object-cover flex-shrink-0" />
      ) : (
        <Icon className="h-4 w-4 flex-shrink-0" style={{ color: "#05B6FA" }} />
      )}
      <div className="flex-1 min-w-0">
        <div className="truncate text-white/80" dir="ltr">{file.name}</div>
        <div className="text-[10px] text-white/30" dir="ltr">{formatFileSize(file.size)}</div>
      </div>
      {file.uploading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-white/40 flex-shrink-0" />
      ) : (
        <button
          onClick={onRemove}
          className="p-0.5 rounded text-white/30 transition-colors flex-shrink-0"
          style={{ visibility: "visible" }}
          data-testid={`remove-file-${file.name}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function AttachmentMenu({
  isOpen,
  onClose,
  onUploadFromDevice,
  onGoogleDrive,
  onSkills,
  onProjects,
}: {
  isOpen: boolean;
  onClose: () => void;
  onUploadFromDevice: () => void;
  onGoogleDrive: () => void;
  onSkills: () => void;
  onProjects: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const items = [
    { label: "رفع من الجهاز", icon: Upload, onClick: onUploadFromDevice, testId: "attach-upload-device" },
    { label: "من Google Drive", icon: HardDrive, onClick: onGoogleDrive, testId: "attach-google-drive" },
    { label: "استخدام المهارات", icon: Sparkles, onClick: onSkills, testId: "attach-skills" },
    { label: "من المشاريع", icon: FolderOpen, onClick: onProjects, testId: "attach-projects" },
  ];

  return (
    <div
      ref={ref}
      className="absolute bottom-full mb-2 right-0 w-[220px] rounded-xl overflow-hidden z-50 shadow-xl"
      style={{ background: "#0a1628", border: "1px solid rgba(255,255,255,0.1)" }}
    >
      {items.map((item) => (
        <button
          key={item.testId}
          className="w-full flex items-center gap-3 px-4 py-3 text-[13px] transition-colors text-right"
          style={{ color: "#D1D5DB" }}
          onClick={() => {
            item.onClick();
            onClose();
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          data-testid={item.testId}
        >
          <item.icon className="h-4 w-4 flex-shrink-0" style={{ color: "#05B6FA" }} />
          <span className="flex-1">{item.label}</span>
        </button>
      ))}
    </div>
  );
}

function MessageAttachments({ attachments }: { attachments: any[] }) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {attachments.map((att: any, i: number) => {
        const Icon = getFileIcon(att.type);
        const isImage = att.type === "image";
        return (
          <div
            key={i}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px]"
            style={{ background: "rgba(5,182,250,0.08)", border: "1px solid rgba(5,182,250,0.15)" }}
          >
            {isImage && att.url ? (
              <img src={att.url} alt={att.name} className="w-6 h-6 rounded object-cover" />
            ) : (
              <Icon className="h-3.5 w-3.5" style={{ color: "#05B6FA" }} />
            )}
            <span className="text-white/70 truncate max-w-[120px]" dir="ltr">{att.name}</span>
            <span className="text-white/30 text-[10px]" dir="ltr">{formatFileSize(att.size)}</span>
          </div>
        );
      })}
    </div>
  );
}

interface SkillType {
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

interface McpServerType {
  id: number;
  name: string;
  type: string;
  url: string | null;
  command: string | null;
  status: string | null;
  isActive: boolean | null;
  tools: any[] | null;
}

function SkillsPickerDropdown({
  isOpen,
  onClose,
  activeSkill,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  activeSkill: SkillType | null;
  onSelect: (s: SkillType | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { data: allSkills } = useQuery<SkillType[]>({
    queryKey: ["/api/skills"],
    queryFn: async () => {
      const res = await fetch("/api/skills", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const iconMap: Record<string, any> = {
    PenTool: FileText,
    BarChart3: FileText,
    FileSearch: FileText,
    Building2: FileText,
    Calculator: FileText,
    Users: FileText,
  };

  return (
    <div
      ref={ref}
      className="absolute bottom-full mb-2 right-0 w-[280px] max-h-[350px] overflow-y-auto rounded-xl z-50 shadow-xl"
      style={{ background: "#0a1628", border: "1px solid rgba(255,255,255,0.1)" }}
      data-testid="skills-picker-dropdown"
    >
      <div className="px-3 py-2 text-[11px] text-white/40 font-medium" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        المهارات المتاحة
      </div>

      <button
        className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors text-right"
        style={{ color: !activeSkill ? "#05B6FA" : "#D1D5DB", background: !activeSkill ? "rgba(5,182,250,0.08)" : "transparent" }}
        onClick={() => { onSelect(null); onClose(); }}
        onMouseEnter={(e) => { if (activeSkill) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
        onMouseLeave={(e) => { if (activeSkill) e.currentTarget.style.background = "transparent"; }}
        data-testid="skill-none"
      >
        <X className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="flex-1">بدون مهارة</span>
        {!activeSkill && <Check className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#05B6FA" }} />}
      </button>

      {(allSkills || []).filter(s => s.isActive).map((skill) => (
        <button
          key={skill.id}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors text-right"
          style={{
            color: activeSkill?.id === skill.id ? "#05B6FA" : "#D1D5DB",
            background: activeSkill?.id === skill.id ? "rgba(5,182,250,0.08)" : "transparent",
          }}
          onClick={() => { onSelect(skill); onClose(); }}
          onMouseEnter={(e) => { if (activeSkill?.id !== skill.id) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
          onMouseLeave={(e) => { if (activeSkill?.id !== skill.id) e.currentTarget.style.background = "transparent"; }}
          data-testid={`skill-item-${skill.id}`}
        >
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ background: `${skill.color || "#05B6FA"}20` }}
          >
            <Sparkles className="h-3 w-3" style={{ color: skill.color || "#05B6FA" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="truncate">{skill.name}</div>
            {skill.description && <div className="text-[10px] text-white/30 truncate">{skill.description}</div>}
          </div>
          {activeSkill?.id === skill.id && <Check className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#05B6FA" }} />}
        </button>
      ))}
    </div>
  );
}

function McpToolsBar({
  servers,
  enabledTools,
  onToggleTool,
}: {
  servers: McpServerType[];
  enabledTools: Set<string>;
  onToggleTool: (toolKey: string) => void;
}) {
  const connectedServers = servers.filter(s => s.isActive && s.status === "connected");
  if (connectedServers.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap px-3 py-1.5" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
      <span className="text-[10px] text-white/30 ml-1">MCP:</span>
      {connectedServers.map(server => {
        const tools = (server.tools || []) as Array<{ name: string; description?: string }>;
        return tools.map(tool => {
          const toolKey = `${server.id}:${tool.name}`;
          const isEnabled = enabledTools.has(toolKey);
          return (
            <button
              key={toolKey}
              onClick={() => onToggleTool(toolKey)}
              className="px-2 py-0.5 rounded-full text-[10px] transition-colors"
              style={{
                background: isEnabled ? "rgba(5,182,250,0.15)" : "rgba(255,255,255,0.04)",
                color: isEnabled ? "#05B6FA" : "rgba(255,255,255,0.35)",
                border: `1px solid ${isEnabled ? "rgba(5,182,250,0.3)" : "rgba(255,255,255,0.06)"}`,
              }}
              data-testid={`mcp-tool-${tool.name}`}
            >
              {tool.name}
            </button>
          );
        });
      })}
    </div>
  );
}

function McpServersDropdown({
  isOpen,
  onClose,
  servers,
  enabledTools,
  onToggleTool,
}: {
  isOpen: boolean;
  onClose: () => void;
  servers: McpServerType[];
  enabledTools: Set<string>;
  onToggleTool: (toolKey: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [connectingId, setConnectingId] = useState<number | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConnect = async (serverId: number) => {
    setConnectingId(serverId);
    try {
      await fetch(`/api/mcp-servers/${serverId}/connect`, {
        method: "POST",
        credentials: "include",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/mcp-servers"] });
    } catch (e) {}
    setConnectingId(null);
  };

  const handleDisconnect = async (serverId: number) => {
    setConnectingId(serverId);
    try {
      await fetch(`/api/mcp-servers/${serverId}/disconnect`, {
        method: "POST",
        credentials: "include",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/mcp-servers"] });
    } catch (e) {}
    setConnectingId(null);
  };

  return (
    <div
      ref={ref}
      className="absolute bottom-full mb-2 right-0 w-[300px] max-h-[400px] overflow-y-auto rounded-xl z-50 shadow-xl"
      style={{ background: "#0a1628", border: "1px solid rgba(255,255,255,0.1)" }}
      data-testid="mcp-servers-dropdown"
    >
      <div className="px-3 py-2 text-[11px] text-white/40 font-medium" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        خوادم MCP
      </div>
      {servers.length === 0 ? (
        <div className="px-3 py-4 text-center text-[12px] text-white/30">
          لا توجد خوادم MCP. أضف خوادم من الإعدادات.
        </div>
      ) : (
        servers.map(server => {
          const isConnected = server.isActive && server.status === "connected";
          const tools = (server.tools || []) as Array<{ name: string; description?: string }>;
          const isLoading = connectingId === server.id;
          return (
            <div
              key={server.id}
              className="px-3 py-2"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: isConnected ? "#22c55e" : "#6b7280" }}
                  />
                  <span className="text-[12px] text-white/80 truncate font-medium">{server.name}</span>
                  <span className="text-[10px] text-white/30">{server.type}</span>
                </div>
                <button
                  onClick={() => isConnected ? handleDisconnect(server.id) : handleConnect(server.id)}
                  disabled={isLoading}
                  className="text-[10px] px-2 py-0.5 rounded-md flex-shrink-0 transition-colors"
                  style={{
                    background: isConnected ? "rgba(239,68,68,0.1)" : "rgba(5,182,250,0.1)",
                    color: isConnected ? "#ef4444" : "#05B6FA",
                    border: `1px solid ${isConnected ? "rgba(239,68,68,0.2)" : "rgba(5,182,250,0.2)"}`,
                  }}
                  data-testid={`mcp-server-toggle-${server.id}`}
                >
                  {isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : isConnected ? "قطع" : "اتصال"}
                </button>
              </div>
              {isConnected && tools.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5 mr-4">
                  {tools.map(tool => {
                    const toolKey = `${server.id}:${tool.name}`;
                    const isEnabled = enabledTools.has(toolKey);
                    return (
                      <button
                        key={toolKey}
                        onClick={() => onToggleTool(toolKey)}
                        className="px-1.5 py-0.5 rounded-full text-[10px] transition-colors"
                        style={{
                          background: isEnabled ? "rgba(5,182,250,0.15)" : "rgba(255,255,255,0.04)",
                          color: isEnabled ? "#05B6FA" : "rgba(255,255,255,0.35)",
                          border: `1px solid ${isEnabled ? "rgba(5,182,250,0.3)" : "rgba(255,255,255,0.06)"}`,
                        }}
                        title={tool.description || tool.name}
                        data-testid={`mcp-dropdown-tool-${tool.name}`}
                      >
                        {tool.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

interface OutputTemplate {
  id: number;
  name: string;
  description: string | null;
  systemPrompt: string | null;
  css: string | null;
  headerHtml: string | null;
  footerHtml: string | null;
  isBuiltin: boolean | null;
}

function TemplateSelector({
  isOpen,
  onClose,
  selectedTemplate,
  onSelect,
  onEdit,
  onCreateNew,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedTemplate: OutputTemplate | null;
  onSelect: (t: OutputTemplate | null) => void;
  onEdit: (t: OutputTemplate) => void;
  onCreateNew: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { data: templates } = useQuery<OutputTemplate[]>({
    queryKey: ["/api/output-templates"],
    queryFn: async () => {
      const res = await fetch("/api/output-templates", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className="absolute bottom-full mb-2 right-0 w-[260px] rounded-xl overflow-hidden z-50 shadow-xl"
      style={{ background: "#0a1628", border: "1px solid rgba(255,255,255,0.1)" }}
      data-testid="template-selector-dropdown"
    >
      <div className="px-3 py-2 text-[11px] text-white/40 font-medium" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        قوالب المخرجات
      </div>
      <button
        className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors text-right"
        style={{ color: !selectedTemplate ? "#05B6FA" : "#D1D5DB", background: !selectedTemplate ? "rgba(5,182,250,0.08)" : "transparent" }}
        onClick={() => { onSelect(null); onClose(); }}
        onMouseEnter={(e) => { if (selectedTemplate) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
        onMouseLeave={(e) => { if (selectedTemplate) e.currentTarget.style.background = "transparent"; }}
        data-testid="template-none"
      >
        <X className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="flex-1">بدون قالب</span>
        {!selectedTemplate && <Check className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#05B6FA" }} />}
      </button>
      {(templates || []).map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-2 group"
          data-testid={`template-item-${t.id}`}
        >
          <button
            className="flex-1 flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors text-right"
            style={{
              color: selectedTemplate?.id === t.id ? "#05B6FA" : "#D1D5DB",
              background: selectedTemplate?.id === t.id ? "rgba(5,182,250,0.08)" : "transparent",
            }}
            onClick={() => { onSelect(t); onClose(); }}
            onMouseEnter={(e) => { if (selectedTemplate?.id !== t.id) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
            onMouseLeave={(e) => { if (selectedTemplate?.id !== t.id) e.currentTarget.style.background = "transparent"; }}
          >
            <FileOutput className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#05B6FA" }} />
            <div className="flex-1 min-w-0">
              <div className="truncate">{t.name}</div>
              {t.description && <div className="text-[10px] text-white/30 truncate">{t.description}</div>}
            </div>
            {selectedTemplate?.id === t.id && <Check className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#05B6FA" }} />}
          </button>
          <button
            className="p-1.5 text-white/20 transition-colors flex-shrink-0 ml-1"
            style={{ visibility: "visible" }}
            onClick={(e) => { e.stopPropagation(); onEdit(t); onClose(); }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#05B6FA"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.2)"; }}
            data-testid={`template-edit-${t.id}`}
          >
            <Edit3 className="h-3 w-3" />
          </button>
        </div>
      ))}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <button
          className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors text-right"
          style={{ color: "#05B6FA" }}
          onClick={() => { onCreateNew(); onClose(); }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          data-testid="template-create-new"
        >
          <Plus className="h-3.5 w-3.5 flex-shrink-0" />
          <span>إنشاء قالب مخصص</span>
        </button>
      </div>
    </div>
  );
}

function TemplateEditorDialog({
  isOpen,
  onClose,
  template,
}: {
  isOpen: boolean;
  onClose: () => void;
  template: OutputTemplate | null;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [css, setCss] = useState("");
  const [headerHtml, setHeaderHtml] = useState("");
  const [footerHtml, setFooterHtml] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const isEditing = !!template;

  useEffect(() => {
    if (template) {
      setName(template.name || "");
      setDescription(template.description || "");
      setSystemPrompt(template.systemPrompt || "");
      setCss(template.css || "");
      setHeaderHtml(template.headerHtml || "");
      setFooterHtml(template.footerHtml || "");
    } else {
      setName("");
      setDescription("");
      setSystemPrompt("");
      setCss("");
      setHeaderHtml("");
      setFooterHtml("");
    }
    setShowPreview(false);
  }, [template, isOpen]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = { name, description, systemPrompt, css, headerHtml, footerHtml };
      const url = isEditing ? `/api/output-templates/${template!.id}` : "/api/output-templates";
      const method = isEditing ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/output-templates"] });
      toast({ title: "تم الحفظ", description: isEditing ? "تم تحديث القالب" : "تم إنشاء القالب" });
      onClose();
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل حفظ القالب", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/output-templates/${template!.id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/output-templates"] });
      toast({ title: "تم الحذف", description: "تم حذف القالب" });
      onClose();
    },
  });

  if (!isOpen) return null;

  const previewSample = `## عنوان المحتوى\n\nهذا نص تجريبي لمعاينة القالب. يتم عرض المحتوى هنا بالتنسيق المحدد.\n\n### النقاط الرئيسية\n\n- النقطة الأولى\n- النقطة الثانية\n- النقطة الثالثة\n\n> هذا اقتباس تجريبي لمعاينة شكل الاقتباسات في القالب.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl p-6"
        style={{ background: "#0a1628", border: "1px solid rgba(255,255,255,0.1)" }}
        data-testid="template-editor-dialog"
      >
        <div className="flex items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-bold text-white">
            {isEditing ? "تعديل القالب" : "إنشاء قالب جديد"}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-white/40"
              onClick={() => setShowPreview(!showPreview)}
              data-testid="button-toggle-preview"
            >
              <Eye className="h-3.5 w-3.5 ml-1" />
              {showPreview ? "تعديل" : "معاينة"}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="text-white/40"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {showPreview ? (
          <div className="space-y-4">
            <div className="text-[12px] text-white/40 mb-2">معاينة القالب:</div>
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {css && <style>{css}</style>}
              <div className={css ? `template-${name.replace(/\s+/g, "-").toLowerCase()}` : ""}>
                {headerHtml && <div dangerouslySetInnerHTML={{ __html: headerHtml }} />}
                <div className="p-4">
                  <MarkdownRenderer content={previewSample} />
                </div>
                {footerHtml && <div dangerouslySetInnerHTML={{ __html: footerHtml }} />}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4" dir="rtl">
            <div>
              <label className="text-[12px] text-white/50 mb-1 block">اسم القالب</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: تقرير رسمي"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#E5E7EB" }}
                data-testid="input-template-name"
              />
            </div>
            <div>
              <label className="text-[12px] text-white/50 mb-1 block">الوصف</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف قصير للقالب"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#E5E7EB" }}
                data-testid="input-template-description"
              />
            </div>
            <div>
              <label className="text-[12px] text-white/50 mb-1 block">تعليمات النظام الإضافية</label>
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="تعليمات لتوجيه نمط المخرجات..."
                rows={3}
                className="text-sm resize-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#E5E7EB" }}
                data-testid="input-template-system-prompt"
              />
            </div>
            <div>
              <label className="text-[12px] text-white/50 mb-1 block">CSS تنسيق</label>
              <Textarea
                value={css}
                onChange={(e) => setCss(e.target.value)}
                placeholder=".template-name { ... }"
                rows={4}
                dir="ltr"
                className="text-sm resize-none font-mono"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#E5E7EB" }}
                data-testid="input-template-css"
              />
            </div>
            <div>
              <label className="text-[12px] text-white/50 mb-1 block">HTML الترويسة</label>
              <Textarea
                value={headerHtml}
                onChange={(e) => setHeaderHtml(e.target.value)}
                placeholder="<div>...</div>"
                rows={3}
                dir="ltr"
                className="text-sm resize-none font-mono"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#E5E7EB" }}
                data-testid="input-template-header"
              />
            </div>
            <div>
              <label className="text-[12px] text-white/50 mb-1 block">HTML التذييل</label>
              <Textarea
                value={footerHtml}
                onChange={(e) => setFooterHtml(e.target.value)}
                placeholder="<div>...</div>"
                rows={3}
                dir="ltr"
                className="text-sm resize-none font-mono"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#E5E7EB" }}
                data-testid="input-template-footer"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between flex-wrap gap-2 mt-6 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div>
            {isEditing && !template?.isBuiltin && (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-400/60"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                data-testid="button-delete-template"
              >
                <Trash2 className="h-3.5 w-3.5 ml-1" />
                حذف
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white/50">
              إلغاء
            </Button>
            <Button
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={!name.trim() || saveMutation.isPending}
              style={{ background: "#05B6FA" }}
              data-testid="button-save-template"
            >
              {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin ml-1" /> : null}
              {isEditing ? "تحديث" : "إنشاء"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplatedMessage({ content, template }: { content: string; template: OutputTemplate | null }) {
  if (!template) return <MarkdownRenderer content={content} />;

  return (
    <div>
      {template.css && <style>{template.css}</style>}
      <div className={template.css ? `template-${template.name.replace(/\s+/g, "-").toLowerCase()}` : ""}>
        {template.headerHtml && <div dangerouslySetInnerHTML={{ __html: template.headerHtml }} />}
        <div>
          <MarkdownRenderer content={content} />
        </div>
        {template.footerHtml && <div dangerouslySetInnerHTML={{ __html: template.footerHtml }} />}
      </div>
    </div>
  );
}

function markdownToHtml(md: string): string {
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  html = html.replace(/^&gt; (.+)$/gm, "<blockquote>$1</blockquote>");

  html = html.replace(/^---$/gm, "<hr>");

  const lines = html.split("\n");
  let result = "";
  let inList = false;
  let inOl = false;
  let inCodeBlock = false;
  let codeContent = "";

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        result += `<pre><code>${codeContent}</code></pre>\n`;
        codeContent = "";
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }
    if (inCodeBlock) {
      codeContent += line + "\n";
      continue;
    }

    const ulMatch = line.match(/^[-*] (.+)$/);
    const olMatch = line.match(/^\d+\. (.+)$/);

    if (ulMatch) {
      if (!inList) { result += "<ul>\n"; inList = true; }
      result += `<li>${ulMatch[1]}</li>\n`;
    } else if (olMatch) {
      if (!inOl) { result += "<ol>\n"; inOl = true; }
      result += `<li>${olMatch[1]}</li>\n`;
    } else {
      if (inList) { result += "</ul>\n"; inList = false; }
      if (inOl) { result += "</ol>\n"; inOl = false; }
      if (line.trim() === "") {
        result += "\n";
      } else if (!line.startsWith("<h") && !line.startsWith("<blockquote") && !line.startsWith("<hr")) {
        result += `<p>${line}</p>\n`;
      } else {
        result += line + "\n";
      }
    }
  }
  if (inList) result += "</ul>\n";
  if (inOl) result += "</ol>\n";
  if (inCodeBlock) result += `<pre><code>${codeContent}</code></pre>\n`;

  return result;
}

function ExportButton({ content, template }: { content: string; template: OutputTemplate | null }) {
  const renderedContent = markdownToHtml(content);

  const handleExportHtml = () => {
    const header = template?.headerHtml || "";
    const footer = template?.footerHtml || "";
    const cssText = template?.css || "";

    const htmlContent = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${template?.name || "Falcon Core AI"}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
body { font-family: 'Noto Sans Arabic', sans-serif; direction: rtl; background: #001539; color: #E5E7EB; padding: 2rem; max-width: 800px; margin: 0 auto; }
h1,h2,h3 { color: #05B6FA; } a { color: #05B6FA; } blockquote { border-right: 3px solid #05B6FA; padding-right: 1rem; color: rgba(255,255,255,0.6); }
code { background: rgba(255,255,255,0.05); padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.9em; }
pre { background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
ul, ol { padding-right: 1.5rem; } li { margin: 0.25rem 0; } p { line-height: 1.8; margin: 0.75rem 0; }
${cssText}
</style>
</head>
<body>
${header}
<div class="${template?.css ? `template-${template.name.replace(/\s+/g, "-").toLowerCase()}` : ""}">
${renderedContent}
</div>
${footer}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${template?.name || "falcon-output"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    const header = template?.headerHtml || "";
    const footer = template?.footerHtml || "";
    const cssText = template?.css || "";

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const htmlContent = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>${template?.name || "Falcon Core AI"}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
body { font-family: 'Noto Sans Arabic', sans-serif; direction: rtl; color: #222; padding: 2rem; max-width: 800px; margin: 0 auto; }
h1,h2,h3 { color: #001539; } a { color: #05B6FA; } blockquote { border-right: 3px solid #05B6FA; padding-right: 1rem; color: #555; }
code { background: #f5f5f5; padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.9em; }
pre { background: #f5f5f5; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
ul, ol { padding-right: 1.5rem; } li { margin: 0.25rem 0; } p { line-height: 1.8; margin: 0.75rem 0; }
${cssText.replace(/#05B6FA/g, "#001539").replace(/rgba\(255,255,255,[^)]+\)/g, "#f5f5f5")}
@media print { body { padding: 0; } }
</style>
</head>
<body>
${header.replace(/color:[^;]*#05B6FA/g, "color:#001539").replace(/rgba\(255,255,255,[^)]+\)/g, "#ddd")}
<div class="${template?.css ? `template-${template.name.replace(/\s+/g, "-").toLowerCase()}` : ""}">
${renderedContent}
</div>
${footer.replace(/rgba\(255,255,255,[^)]+\)/g, "#ddd")}
</body>
</html>`;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  const [showMenu, setShowMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowMenu(false);
    };
    if (showMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-1 rounded text-white/20 transition-colors"
        style={{ visibility: "visible" }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "#05B6FA"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.2)"; }}
        data-testid="button-export"
      >
        <Download className="h-3.5 w-3.5" />
      </button>
      {showMenu && (
        <div
          className="absolute top-full mt-1 left-0 w-[140px] rounded-lg overflow-hidden z-50 shadow-xl"
          style={{ background: "#0a1628", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <button
            className="w-full px-3 py-2 text-[12px] text-right text-white/70 transition-colors"
            onClick={() => { handleExportHtml(); setShowMenu(false); }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            data-testid="button-export-html"
          >
            تصدير HTML
          </button>
          <button
            className="w-full px-3 py-2 text-[12px] text-right text-white/70 transition-colors"
            onClick={() => { handleExportPdf(); setShowMenu(false); }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            data-testid="button-export-pdf"
          >
            تصدير PDF
          </button>
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  const { data: conversations } = useConversations();
  const { data: agents } = useAgents();
  const { user } = useAuth();
  const createConversation = useCreateConversation();
  const { sendMessage, streamingContent, isStreaming, lastUsage } = useStreamingChat();
  const [location, setLocation] = useLocation();
  const searchString = useSearch();

  const params = new URLSearchParams(searchString);
  const activeId = params.get("id") ? Number(params.get("id")) : null;
  const isNew = params.get("new") === "1";

  const { data: conversation } = useConversation(activeId);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [inputText, setInputText] = useState("");
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem("fcai_lastModel") || "gemini-2.5-flash";
  });
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<OutputTemplate | null>(null);
  const [templateEditorOpen, setTemplateEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<OutputTemplate | null>(null);
  const [skillsPickerOpen, setSkillsPickerOpen] = useState(false);
  const [activeSkill, setActiveSkill] = useState<SkillType | null>(null);
  const [mcpEnabledTools, setMcpEnabledTools] = useState<Set<string>>(new Set());
  const [mcpDropdownOpen, setMcpDropdownOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: systemInstructionsData } = useQuery<{ instructions: string }>({
    queryKey: ["/api/system-instructions"],
    queryFn: async () => {
      const res = await fetch("/api/system-instructions", { credentials: "include" });
      if (!res.ok) return { instructions: "" };
      return res.json();
    },
    staleTime: 60000,
  });

  const { data: mcpServers } = useQuery<McpServerType[]>({
    queryKey: ["/api/mcp-servers"],
    queryFn: async () => {
      const res = await fetch("/api/mcp-servers", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 30000,
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages, streamingContent]);

  useEffect(() => {
    if (isNew && !activeId) {
      handleNewConversation();
    }
  }, [isNew]);

  const handleNewConversation = useCallback(() => {
    createConversation.mutate("محادثة جديدة", {
      onSuccess: (newChat) => {
        setLocation(`/chat?id=${newChat.id}`);
      },
    });
  }, [createConversation, setLocation]);

  const uploadFiles = useCallback(async (files: File[]) => {
    const newAttachments: AttachedFile[] = files.map((f) => ({
      name: f.name,
      size: f.size,
      type: getFileCategory(f.type),
      mimeType: f.type,
      previewUrl: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
      uploading: true,
    }));

    setAttachedFiles((prev) => [...prev, ...newAttachments]);

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));

    try {
      const res = await fetch("/api/upload/chat", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) throw new Error("Upload failed");
      const uploaded = await res.json();

      setAttachedFiles((prev) => {
        const updated = [...prev];
        let uploadIdx = 0;
        for (let i = 0; i < updated.length; i++) {
          if (updated[i].uploading && uploadIdx < uploaded.length) {
            const u = uploaded[uploadIdx];
            updated[i] = {
              ...updated[i],
              url: u.url,
              path: u.path,
              uploading: false,
            };
            uploadIdx++;
          }
        }
        return updated;
      });
    } catch {
      setAttachedFiles((prev) => prev.filter((f) => !f.uploading));
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) uploadFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [uploadFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) uploadFiles(files);
  }, [uploadFiles]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === "file") {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      uploadFiles(files);
    }
  }, [uploadFiles]);

  const removeFile = useCallback((index: number) => {
    setAttachedFiles((prev) => {
      const file = prev[index];
      if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleTriggerCommand = async (text: string, convId: number) => {
    const triggerMatch = text.match(/^\/trigger\s+(.+)/i);
    if (!triggerMatch) return false;

    const args = triggerMatch[1].trim();
    let webhookName = args;
    let payload: any = {};

    const jsonMatch = args.match(/^(\S+)\s+(.+)/);
    if (jsonMatch) {
      webhookName = jsonMatch[1];
      try { payload = JSON.parse(jsonMatch[2]); } catch { payload = { message: jsonMatch[2] }; }
    }

    try {
      const res = await fetch("/api/webhooks/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ webhookName, payload }),
      });
      const data = await res.json();

      let resultMessage: string;
      if (res.ok && data.success) {
        resultMessage = `تم تشغيل سير العمل "${data.webhookName}" بنجاح.\n\nالحالة: ${data.statusCode}\n\nالاستجابة:\n\`\`\`json\n${JSON.stringify(data.response, null, 2)}\n\`\`\``;
      } else if (data.available) {
        resultMessage = `لم يتم العثور على webhook باسم "${webhookName}".\n\nالمتاح:\n${data.available.map((n: string) => `- ${n}`).join("\n")}\n\nالاستخدام: \`/trigger اسم_الwebhook\` أو \`/trigger اسم_الwebhook {"key":"value"}\``;
      } else {
        resultMessage = `فشل تشغيل "${webhookName}": ${data.error || "خطأ غير معروف"}`;
      }

      await sendMessage({
        conversationId: convId,
        content: `/trigger ${args}`,
        model: selectedModel,
        temperature: 0.7,
        maxTokens: 4096,
        topP: 1,
        systemInstructions: `أنت مساعد ذكي. المستخدم قام بتشغيل أمر trigger. النتيجة هي:\n\n${resultMessage}\n\nقم بعرض هذه النتيجة للمستخدم بشكل واضح ومنسق.`,
      });
    } catch (error) {
      await sendMessage({
        conversationId: convId,
        content: `/trigger ${args}`,
        model: selectedModel,
        temperature: 0.7,
        maxTokens: 4096,
        topP: 1,
        systemInstructions: `أنت مساعد ذكي. المستخدم حاول تشغيل webhook لكن حدث خطأ في الاتصال. أبلغه بذلك.`,
      });
    }
    return true;
  };

  const handleSend = async () => {
    if ((!inputText.trim() && attachedFiles.length === 0) || isStreaming) return;
    if (attachedFiles.some((f) => f.uploading)) return;

    let convId = activeId;
    if (!convId) {
      const newConv = await new Promise<any>((resolve) => {
        createConversation.mutate("محادثة جديدة", {
          onSuccess: (c) => {
            setLocation(`/chat?id=${c.id}`);
            resolve(c);
          },
        });
      });
      convId = newConv.id;
    }

    const text = inputText;
    const files = [...attachedFiles];
    setInputText("");
    setAttachedFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    if (text.startsWith("/trigger ")) {
      const handled = await handleTriggerCommand(text, convId!);
      if (handled) return;
    }

    const temp = parseFloat(localStorage.getItem("fcai_temperature") || "0.7");
    const maxTok = parseInt(localStorage.getItem("fcai_maxTokens") || "4096");
    const tp = parseFloat(localStorage.getItem("fcai_topP") || "1");

    const attachmentsMeta = files.length > 0
      ? files.map((f) => ({ name: f.name, size: f.size, type: f.type, url: f.url, mimeType: f.mimeType }))
      : undefined;

    let messageContent = text;
    if (files.length > 0 && text) {
      messageContent = text + "\n\n[ملفات مرفقة: " + files.map((f) => f.name).join(", ") + "]";
    } else if (files.length > 0 && !text) {
      messageContent = "[ملفات مرفقة: " + files.map((f) => f.name).join(", ") + "]";
    }

    await sendMessage({
      conversationId: convId!,
      content: messageContent,
      model: selectedModel,
      temperature: temp,
      maxTokens: maxTok,
      topP: tp,
      attachments: attachmentsMeta,
      systemInstructions: systemInstructionsData?.instructions || undefined,
      templateSystemPrompt: selectedTemplate?.systemPrompt || undefined,
      skillSystemPrompt: activeSkill?.systemPrompt || undefined,
      enabledMcpTools: mcpEnabledTools.size > 0 ? Array.from(mcpEnabledTools) : undefined,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const messages = conversation?.messages || [];
  const showWelcome = !activeId || (messages.length === 0 && !isStreaming);
  const hasContent = inputText.trim() || attachedFiles.length > 0;

  return (
    <div
      className="h-full flex flex-col relative"
      style={{
        background: "radial-gradient(ellipse at 50% 0%, rgba(5,182,250,0.03) 0%, #001030 70%)",
        minHeight: "100vh",
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragOver && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,21,57,0.9)", border: "3px dashed #05B6FA" }}
        >
          <div className="text-center">
            <Upload className="h-12 w-12 mx-auto mb-3" style={{ color: "#05B6FA" }} />
            <p className="text-lg font-medium" style={{ color: "#05B6FA" }}>
              اسحب الملفات هنا للإرفاق
            </p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        data-testid="input-file-upload"
      />

      {showWelcome && !activeId ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: "rgba(5,182,250,0.1)", border: "1px solid rgba(5,182,250,0.2)" }}
          >
            <Bot className="h-8 w-8" style={{ color: "#05B6FA" }} />
          </div>
          <h1
            className="text-2xl font-bold mb-2"
            style={{ color: "#D1D5DB" }}
            data-testid="text-welcome"
          >
            مرحباً {user?.firstName || ""} — Falcon Core AI
          </h1>
          <p className="text-[15px] mb-8" style={{ color: "#6B7280" }}>
            كيف يمكنني مساعدتك اليوم؟
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-6" ref={scrollRef}>
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg, i) => (
              <div
                key={msg.id}
                className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}
              >
                {msg.role === "user" ? (
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
                      <AvatarFallback
                        className="text-[11px] font-bold"
                        style={{ background: "rgba(255,255,255,0.1)", color: "#D1D5DB" }}
                      >
                        {user?.firstName?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className="flex-1 p-4 rounded-xl text-[15px] leading-relaxed"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#E5E7EB",
                      }}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      {msg.attachments && <MessageAttachments attachments={msg.attachments as any[]} />}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                      style={{ background: "rgba(5,182,250,0.15)" }}
                    >
                      <Bot className="h-4 w-4" style={{ color: "#05B6FA" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-[11px] font-bold mb-2 tracking-wider"
                        dir="ltr"
                        style={{ color: "#05B6FA", fontFamily: "Rubik, sans-serif" }}
                      >
                        Falcon AI
                      </div>
                      <TemplatedMessage content={msg.content} template={selectedTemplate} />
                      <div className="mt-2 flex items-center gap-1">
                        <ExportButton content={msg.content} template={selectedTemplate} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isStreaming && (
              <div className="flex items-start gap-3 animate-in fade-in duration-300">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                  style={{ background: "rgba(5,182,250,0.15)" }}
                >
                  <Bot className="h-4 w-4" style={{ color: "#05B6FA" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="text-[11px] font-bold mb-2 tracking-wider"
                    dir="ltr"
                    style={{ color: "#05B6FA", fontFamily: "Rubik, sans-serif" }}
                  >
                    Falcon AI
                  </div>
                  {streamingContent ? (
                    <div>
                      <TemplatedMessage content={streamingContent} template={selectedTemplate} />
                      <span
                        className="inline-block animate-pulse"
                        style={{ color: "#05B6FA", fontSize: "18px" }}
                      >
                        ▊
                      </span>
                    </div>
                  ) : (
                    <TypingIndicator />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="px-4 pb-4 pt-2">
        <div className="max-w-3xl mx-auto">
          <div
            className="rounded-[2rem] overflow-hidden transition-all animate-pulse-border"
            style={{
              background: "rgba(5, 182, 250, 0.05)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: isDragOver ? "2px solid #05B6FA" : "1px solid rgba(5, 182, 250, 0.15)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#05B6FA";
              e.currentTarget.classList.remove("animate-pulse-border");
            }}
            onBlur={(e) => {
              if (!isDragOver) {
                e.currentTarget.style.borderColor = "rgba(5, 182, 250, 0.15)";
                e.currentTarget.classList.add("animate-pulse-border");
              }
            }}
          >
            {attachedFiles.length > 0 && (
              <div className="px-4 pt-3 flex flex-wrap gap-2" data-testid="attached-files-area">
                {attachedFiles.map((file, i) => (
                  <FileChip key={i} file={file} onRemove={() => removeFile(i)} />
                ))}
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="رسالة..."
              rows={1}
              className="w-full bg-transparent border-none outline-none text-[15px] leading-relaxed resize-none px-5 pt-4 pb-2 focus:ring-0"
              style={{
                color: "#E5E7EB",
                minHeight: "44px",
                maxHeight: "288px",
                fontFamily: "'Noto Sans Arabic', sans-serif",
              }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 288) + "px";
              }}
              data-testid="input-chat-message"
            />

            {activeSkill && (
              <div className="flex items-center gap-2 px-4 py-1" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <div
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px]"
                  style={{
                    background: `${activeSkill.color || "#05B6FA"}15`,
                    color: activeSkill.color || "#05B6FA",
                    border: `1px solid ${activeSkill.color || "#05B6FA"}30`,
                  }}
                  data-testid="active-skill-chip"
                >
                  <Sparkles className="h-2.5 w-2.5" />
                  {activeSkill.name}
                  <button
                    onClick={() => setActiveSkill(null)}
                    className="mr-0.5 opacity-60 hover:opacity-100 transition-opacity"
                    data-testid="remove-active-skill"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              </div>
            )}

            <McpToolsBar
              servers={mcpServers || []}
              enabledTools={mcpEnabledTools}
              onToggleTool={(toolKey) => {
                setMcpEnabledTools(prev => {
                  const next = new Set(prev);
                  if (next.has(toolKey)) next.delete(toolKey);
                  else next.add(toolKey);
                  return next;
                });
              }}
            />

            <div
              className="flex items-center justify-between flex-wrap gap-2 px-3 py-2"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center gap-1">
                <div className="relative">
                  <Button
                    variant="ghost"
                    className="text-white/40 text-[12px] gap-1.5 px-2"
                    onClick={() => setAttachMenuOpen(!attachMenuOpen)}
                    data-testid="button-attach"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    إرفاق
                  </Button>
                  <AttachmentMenu
                    isOpen={attachMenuOpen}
                    onClose={() => setAttachMenuOpen(false)}
                    onUploadFromDevice={() => fileInputRef.current?.click()}
                    onGoogleDrive={() => {}}
                    onSkills={() => setSkillsPickerOpen(true)}
                    onProjects={() => {}}
                  />
                </div>
                <Button
                  variant="ghost"
                  className="text-white/40 text-[12px] gap-1.5 px-2"
                  data-testid="button-parameters"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  المعلمات
                </Button>
                <div className="relative">
                  <Button
                    variant="ghost"
                    className="text-white/40 text-[12px] gap-1.5 px-2"
                    onClick={() => setTemplateSelectorOpen(!templateSelectorOpen)}
                    data-testid="button-outputs"
                  >
                    <FileOutput className="h-3.5 w-3.5" />
                    {selectedTemplate ? selectedTemplate.name : "المخرجات"}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                  <TemplateSelector
                    isOpen={templateSelectorOpen}
                    onClose={() => setTemplateSelectorOpen(false)}
                    selectedTemplate={selectedTemplate}
                    onSelect={setSelectedTemplate}
                    onEdit={(t) => { setEditingTemplate(t); setTemplateEditorOpen(true); }}
                    onCreateNew={() => { setEditingTemplate(null); setTemplateEditorOpen(true); }}
                  />
                </div>
                <div className="relative">
                  <Button
                    variant="ghost"
                    className="text-[12px] gap-1.5 px-2"
                    style={{ color: activeSkill ? "#05B6FA" : "rgba(255,255,255,0.4)" }}
                    onClick={() => setSkillsPickerOpen(!skillsPickerOpen)}
                    data-testid="button-skills"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {activeSkill ? activeSkill.name : "المهارات"}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                  <SkillsPickerDropdown
                    isOpen={skillsPickerOpen}
                    onClose={() => setSkillsPickerOpen(false)}
                    activeSkill={activeSkill}
                    onSelect={setActiveSkill}
                  />
                </div>
                <div className="relative">
                  <Button
                    variant="ghost"
                    className="text-[12px] gap-1.5 px-2"
                    style={{
                      color: (mcpServers || []).some(s => s.isActive && s.status === "connected")
                        ? "#05B6FA"
                        : "rgba(255,255,255,0.4)",
                    }}
                    onClick={() => setMcpDropdownOpen(!mcpDropdownOpen)}
                    data-testid="button-mcp-servers"
                  >
                    <Plug className="h-3.5 w-3.5" />
                    MCP
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                  <McpServersDropdown
                    isOpen={mcpDropdownOpen}
                    onClose={() => setMcpDropdownOpen(false)}
                    servers={mcpServers || []}
                    enabledTools={mcpEnabledTools}
                    onToggleTool={(toolKey) => {
                      setMcpEnabledTools(prev => {
                        const next = new Set(prev);
                        if (next.has(toolKey)) next.delete(toolKey);
                        else next.add(toolKey);
                        return next;
                      });
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <ModelSelector
                  selectedModel={selectedModel}
                  onSelect={setSelectedModel}
                  isOpen={modelSelectorOpen}
                  onToggle={() => setModelSelectorOpen(!modelSelectorOpen)}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white/40"
                  data-testid="button-mic"
                >
                  <Mic className="h-4 w-4" />
                </Button>
                <button
                  onClick={handleSend}
                  disabled={!hasContent || isStreaming || attachedFiles.some((f) => f.uploading)}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                    hasContent && !isStreaming
                      ? "shadow-lg"
                      : "opacity-40 cursor-not-allowed"
                  )}
                  style={{
                    background: hasContent && !isStreaming ? "#05B6FA" : "rgba(255,255,255,0.1)",
                    color: hasContent && !isStreaming ? "#001539" : "#9CA3AF",
                  }}
                  data-testid="button-send-message"
                >
                  {isStreaming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowUp className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div
            className="flex items-center justify-center gap-4 mt-3 text-[11px]"
            style={{ color: "rgba(255,255,255,0.25)", fontFamily: "Rubik, sans-serif" }}
          >
            <span dir="ltr">FCAI v2.4 Enterprise</span>
            <span>بياناتك محمية ومستضافة محلياً</span>
          </div>
        </div>
      </div>

      <TemplateEditorDialog
        isOpen={templateEditorOpen}
        onClose={() => { setTemplateEditorOpen(false); setEditingTemplate(null); }}
        template={editingTemplate}
      />
    </div>
  );
}
