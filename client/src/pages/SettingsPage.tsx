import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Eye,
  EyeOff,
  Check,
  X,
  Loader2,
  Key,
  Plug,
  Trash2,
  ArrowRight,
  Sliders,
  FileText,
  Save,
  Plus,
  Server,
  Wifi,
  WifiOff,
  RefreshCw,
  Sparkles,
  PenTool,
  BarChart3,
  FileSearch,
  Building2,
  Calculator,
  Users,
  Brain,
  MessageSquare,
  Shield,
  Zap,
  Globe,
  BookOpen,
  Edit3,
} from "lucide-react";

interface ProviderStatus {
  provider: string;
  configured: boolean;
  isActive: boolean;
  status: string;
  maskedKey: string | null;
}

const PROVIDER_META: Record<string, { name: string; icon: string; color: string; description: string; placeholder: string }> = {
  openrouter: {
    name: "OpenRouter",
    icon: "OR",
    color: "#6366F1",
    description: "وصول لأكثر من 200 موديل عبر مزود واحد",
    placeholder: "sk-or-v1-...",
  },
  openai: {
    name: "OpenAI",
    icon: "O",
    color: "#10A37F",
    description: "GPT-4o, o1, DALL-E والمزيد",
    placeholder: "sk-...",
  },
  anthropic: {
    name: "Anthropic",
    icon: "A",
    color: "#D97706",
    description: "Claude 4 Opus, Sonnet, Haiku",
    placeholder: "sk-ant-...",
  },
  google: {
    name: "Google AI",
    icon: "G",
    color: "#4285F4",
    description: "Gemini 2.5 (مدمج مع المنصة)",
    placeholder: "مدمج تلقائياً",
  },
  ollama: {
    name: "Ollama",
    icon: "OL",
    color: "#9CA3AF",
    description: "تشغيل نماذج محلية",
    placeholder: "http://localhost:11434",
  },
};

function useProviders() {
  return useQuery<ProviderStatus[]>({
    queryKey: ["/api/providers"],
    queryFn: async () => {
      const res = await fetch("/api/providers", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch providers");
      return res.json();
    },
  });
}

export default function SettingsPage() {
  const { data: providers, isLoading } = useProviders();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

  const instructionsQuery = useQuery<{ instructions: string }>({
    queryKey: ["/api/system-instructions"],
    queryFn: async () => {
      const res = await fetch("/api/system-instructions", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const [instructions, setInstructions] = useState("");
  const [instructionsLoaded, setInstructionsLoaded] = useState(false);

  useEffect(() => {
    if (instructionsQuery.data && !instructionsLoaded) {
      setInstructions(instructionsQuery.data.instructions || "");
      setInstructionsLoaded(true);
    }
  }, [instructionsQuery.data, instructionsLoaded]);

  const saveInstructions = useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch("/api/system-instructions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructions: text }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system-instructions"] });
      toast({ title: "تم الحفظ", description: "تم حفظ التعليمات العامة بنجاح" });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل حفظ التعليمات", variant: "destructive" });
    },
  });

  const [temperature, setTemperature] = useState(() => {
    const saved = localStorage.getItem("fcai_temperature");
    return saved ? parseFloat(saved) : 0.7;
  });
  const [maxTokens, setMaxTokens] = useState(() => {
    const saved = localStorage.getItem("fcai_maxTokens");
    return saved ? parseInt(saved) : 4096;
  });
  const [topP, setTopP] = useState(() => {
    const saved = localStorage.getItem("fcai_topP");
    return saved ? parseFloat(saved) : 1;
  });

  useEffect(() => {
    localStorage.setItem("fcai_temperature", temperature.toString());
    localStorage.setItem("fcai_maxTokens", maxTokens.toString());
    localStorage.setItem("fcai_topP", topP.toString());
  }, [temperature, maxTokens, topP]);

  const { data: mcpServers } = useQuery<any[]>({
    queryKey: ["/api/mcp-servers"],
    queryFn: async () => {
      const res = await fetch("/api/mcp-servers", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const [showAddMcp, setShowAddMcp] = useState(false);
  const [mcpName, setMcpName] = useState("");
  const [mcpType, setMcpType] = useState<"sse" | "http" | "stdio">("sse");
  const [mcpUrl, setMcpUrl] = useState("");
  const [mcpCommand, setMcpCommand] = useState("");
  const [mcpEnvVars, setMcpEnvVars] = useState<{ key: string; value: string }[]>([]);

  const createMcpServer = useMutation({
    mutationFn: async (data: { name: string; type: string; url?: string; command?: string; envVars?: Record<string, string> }) => {
      const res = await fetch("/api/mcp-servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mcp-servers"] });
      setShowAddMcp(false);
      setMcpName("");
      setMcpUrl("");
      setMcpCommand("");
      setMcpEnvVars([]);
      toast({ title: "تم الإضافة", description: "تم إضافة خادم MCP بنجاح" });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل إضافة الخادم", variant: "destructive" });
    },
  });

  const deleteMcpServer = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/mcp-servers/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mcp-servers"] });
      toast({ title: "تم الحذف", description: "تم حذف خادم MCP" });
    },
  });

  const toggleMcpServer = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await fetch(`/api/mcp-servers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mcp-servers"] });
    },
  });

  const saveKey = useMutation({
    mutationFn: async ({ provider, apiKey }: { provider: string; apiKey: string }) => {
      const res = await fetch(`/api/providers/${provider}/key`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: (_, { provider }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/providers"] });
      setApiKeys((prev) => ({ ...prev, [provider]: "" }));
      toast({ title: "تم الحفظ", description: `تم حفظ مفتاح ${PROVIDER_META[provider]?.name}` });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل حفظ المفتاح", variant: "destructive" });
    },
  });

  const deleteKey = useMutation({
    mutationFn: async (provider: string) => {
      const res = await fetch(`/api/providers/${provider}/key`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: (_, provider) => {
      queryClient.invalidateQueries({ queryKey: ["/api/providers"] });
      toast({ title: "تم الحذف", description: `تم حذف مفتاح ${PROVIDER_META[provider]?.name}` });
    },
  });

  const testConnection = async (provider: string) => {
    setTestingProvider(provider);
    setTestResults((prev) => ({ ...prev, [provider]: undefined as any }));
    try {
      const res = await fetch(`/api/providers/${provider}/test`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      setTestResults((prev) => ({
        ...prev,
        [provider]: {
          success: data.success,
          message: data.success ? "الاتصال ناجح" : data.error || "فشل الاتصال",
        },
      }));
    } catch {
      setTestResults((prev) => ({
        ...prev,
        [provider]: { success: false, message: "خطأ في الشبكة" },
      }));
    }
    setTestingProvider(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#05B6FA" }} />
      </div>
    );
  }

  return (
    <div dir="rtl" className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">الإعدادات</h1>
        <p className="text-sm text-white/50 mt-1">إدارة مزودي الذكاء الاصطناعي ومعايير التوليد</p>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Key className="h-5 w-5" style={{ color: "#05B6FA" }} />
          <h2 className="text-lg font-semibold text-white">مفاتيح API</h2>
        </div>

        <div className="grid gap-4">
          {(providers || []).map((p) => {
            const meta = PROVIDER_META[p.provider];
            if (!meta) return null;
            const isGoogle = p.provider === "google";
            const inputVal = apiKeys[p.provider] || "";
            const isVisible = visibleKeys[p.provider] || false;
            const testResult = testResults[p.provider];

            return (
              <Card
                key={p.provider}
                className="p-4"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: `${meta.color}20`, color: meta.color }}
                    data-testid={`provider-icon-${p.provider}`}
                  >
                    {meta.icon}
                  </div>

                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-white text-sm">{meta.name}</h3>
                      {p.configured && (
                        <span
                          className="text-[11px] px-2 py-0.5 rounded-full"
                          style={{
                            background: p.isActive ? "rgba(34,197,94,0.15)" : "rgba(234,179,8,0.15)",
                            color: p.isActive ? "#22C55E" : "#EAB308",
                          }}
                        >
                          {p.isActive ? "نشط" : "غير نشط"}
                        </span>
                      )}
                      {!p.configured && !isGoogle && (
                        <span
                          className="text-[11px] px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(255,255,255,0.05)", color: "#9CA3AF" }}
                        >
                          غير مُعدّ
                        </span>
                      )}
                      {isGoogle && (
                        <span
                          className="text-[11px] px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(66,133,244,0.15)", color: "#4285F4" }}
                        >
                          مدمج
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-white/40">{meta.description}</p>

                    {!isGoogle && (
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Input
                            type={isVisible ? "text" : "password"}
                            placeholder={p.configured ? (p.maskedKey || "••••••••") : meta.placeholder}
                            value={inputVal}
                            onChange={(e) => setApiKeys((prev) => ({ ...prev, [p.provider]: e.target.value }))}
                            className="text-sm pr-10"
                            style={{
                              background: "rgba(255,255,255,0.05)",
                              border: "1px solid rgba(255,255,255,0.1)",
                              color: "#fff",
                            }}
                            dir="ltr"
                            data-testid={`input-apikey-${p.provider}`}
                          />
                          <button
                            type="button"
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                            onClick={() => setVisibleKeys((prev) => ({ ...prev, [p.provider]: !prev[p.provider] }))}
                            data-testid={`toggle-visibility-${p.provider}`}
                          >
                            {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>

                        <Button
                          size="sm"
                          disabled={!inputVal.trim() || saveKey.isPending}
                          onClick={() => saveKey.mutate({ provider: p.provider, apiKey: inputVal })}
                          style={{ background: "#05B6FA" }}
                          data-testid={`button-save-${p.provider}`}
                        >
                          {saveKey.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "حفظ"}
                        </Button>

                        {p.configured && (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-white/40"
                              onClick={() => testConnection(p.provider)}
                              disabled={testingProvider === p.provider}
                              data-testid={`button-test-${p.provider}`}
                            >
                              {testingProvider === p.provider ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Plug className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-red-400/60"
                              onClick={() => deleteKey.mutate(p.provider)}
                              data-testid={`button-delete-${p.provider}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    )}

                    {testResult && (
                      <div
                        className="flex items-center gap-2 text-[12px] px-3 py-2 rounded-lg"
                        style={{
                          background: testResult.success ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                          color: testResult.success ? "#22C55E" : "#EF4444",
                        }}
                        data-testid={`test-result-${p.provider}`}
                      >
                        {testResult.success ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                        {testResult.message}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sliders className="h-5 w-5" style={{ color: "#05B6FA" }} />
          <h2 className="text-lg font-semibold text-white">معايير التوليد</h2>
        </div>

        <Card
          className="p-5 space-y-6"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-white/70">درجة الحرارة (Temperature)</label>
              <span className="text-sm font-mono" style={{ color: "#05B6FA" }}>{temperature.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.01"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-cyan-500"
              style={{ accentColor: "#05B6FA" }}
              data-testid="slider-temperature"
            />
            <div className="flex justify-between text-[11px] text-white/30">
              <span>دقيق (0)</span>
              <span>متوازن (0.7)</span>
              <span>إبداعي (2)</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-white/70">الحد الأقصى للرموز (Max Tokens)</label>
              <span className="text-sm font-mono" style={{ color: "#05B6FA" }}>{maxTokens}</span>
            </div>
            <input
              type="range"
              min="256"
              max="32768"
              step="256"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="w-full"
              style={{ accentColor: "#05B6FA" }}
              data-testid="slider-maxTokens"
            />
            <div className="flex justify-between text-[11px] text-white/30">
              <span>256</span>
              <span>4096</span>
              <span>32768</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-white/70">Top P</label>
              <span className="text-sm font-mono" style={{ color: "#05B6FA" }}>{topP.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={topP}
              onChange={(e) => setTopP(parseFloat(e.target.value))}
              className="w-full"
              style={{ accentColor: "#05B6FA" }}
              data-testid="slider-topP"
            />
            <div className="flex justify-between text-[11px] text-white/30">
              <span>مُقيَّد (0)</span>
              <span>افتراضي (1)</span>
            </div>
          </div>

          <div
            className="text-[12px] text-white/30 p-3 rounded-lg"
            style={{ background: "rgba(5,182,250,0.05)" }}
          >
            <strong className="text-white/50">ملاحظة:</strong> هذه المعايير تُطبق على جميع المحادثات الجديدة. يمكنك تعديلها في أي وقت.
          </div>
        </Card>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5" style={{ color: "#05B6FA" }} />
          <h2 className="text-lg font-semibold text-white">تعليمات عامة</h2>
        </div>

        <Card
          className="p-5 space-y-4"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <p className="text-[13px] text-white/50">
            هذه التعليمات تُضاف تلقائياً لكل محادثة جديدة كرسالة نظام. تعليمات المشروع تتجاوز التعليمات العامة.
          </p>

          <Textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="مثال: أنت مساعد ذكي لشركة فالكون كور. أجب دائماً بالعربية. استخدم التنسيق المحترف."
            rows={6}
            className="text-sm resize-none"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#E5E7EB",
              minHeight: "120px",
            }}
            data-testid="textarea-system-instructions"
          />

          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[12px] text-white/30" data-testid="text-char-count">
              {instructions.length} حرف
            </span>
            <Button
              size="sm"
              onClick={() => saveInstructions.mutate(instructions)}
              disabled={saveInstructions.isPending}
              style={{ background: "#05B6FA" }}
              data-testid="button-save-instructions"
            >
              {saveInstructions.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin ml-1" />
              ) : (
                <Save className="h-3.5 w-3.5 ml-1" />
              )}
              حفظ التعليمات
            </Button>
          </div>

          <div
            className="text-[12px] text-white/30 p-3 rounded-lg"
            style={{ background: "rgba(5,182,250,0.05)" }}
          >
            <strong className="text-white/50">ملاحظة:</strong> إذا كان للمشروع تعليمات خاصة، فستتجاوز التعليمات العامة. يمكنك تعيين تعليمات لكل مشروع من إعدادات المشروع.
          </div>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5" style={{ color: "#05B6FA" }} />
            <h2 className="text-lg font-semibold text-white">MCP Servers</h2>
          </div>
          <Button
            size="sm"
            onClick={() => setShowAddMcp(!showAddMcp)}
            style={{ background: showAddMcp ? "rgba(255,255,255,0.1)" : "#05B6FA" }}
            data-testid="button-add-mcp"
          >
            {showAddMcp ? <X className="h-3.5 w-3.5 ml-1" /> : <Plus className="h-3.5 w-3.5 ml-1" />}
            {showAddMcp ? "إلغاء" : "إضافة خادم"}
          </Button>
        </div>

        {showAddMcp && (
          <Card
            className="p-4 mb-4 space-y-3"
            style={{ background: "rgba(5,182,250,0.05)", border: "1px solid rgba(5,182,250,0.15)" }}
          >
            <Input
              value={mcpName}
              onChange={(e) => setMcpName(e.target.value)}
              placeholder="اسم الخادم"
              className="text-sm"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#E5E7EB" }}
              data-testid="input-mcp-name"
            />
            <div className="flex items-center gap-2">
              {(["sse", "http", "stdio"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setMcpType(t)}
                  className="px-3 py-1.5 rounded-md text-[12px] transition-colors"
                  style={{
                    background: mcpType === t ? "rgba(5,182,250,0.2)" : "rgba(255,255,255,0.04)",
                    color: mcpType === t ? "#05B6FA" : "rgba(255,255,255,0.5)",
                    border: `1px solid ${mcpType === t ? "rgba(5,182,250,0.3)" : "rgba(255,255,255,0.08)"}`,
                  }}
                  data-testid={`mcp-type-${t}`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
            {mcpType !== "stdio" ? (
              <Input
                value={mcpUrl}
                onChange={(e) => setMcpUrl(e.target.value)}
                placeholder="عنوان URL (مثال: http://localhost:3001/sse)"
                className="text-sm"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#E5E7EB" }}
                dir="ltr"
                data-testid="input-mcp-url"
              />
            ) : (
              <Input
                value={mcpCommand}
                onChange={(e) => setMcpCommand(e.target.value)}
                placeholder="أمر التشغيل (مثال: npx @mcp/server)"
                className="text-sm"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#E5E7EB" }}
                dir="ltr"
                data-testid="input-mcp-command"
              />
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-white/40">متغيرات البيئة (اختياري)</span>
                <button
                  type="button"
                  className="text-[11px] px-2 py-0.5 rounded"
                  style={{ background: "rgba(5,182,250,0.1)", color: "#05B6FA" }}
                  onClick={() => setMcpEnvVars([...mcpEnvVars, { key: "", value: "" }])}
                  data-testid="button-add-env-var"
                >
                  + إضافة متغير
                </button>
              </div>
              {mcpEnvVars.map((env, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={env.key}
                    onChange={(e) => {
                      const updated = [...mcpEnvVars];
                      updated[idx].key = e.target.value;
                      setMcpEnvVars(updated);
                    }}
                    placeholder="المفتاح (مثال: API_KEY)"
                    className="text-sm flex-1"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#E5E7EB" }}
                    dir="ltr"
                    data-testid={`input-env-key-${idx}`}
                  />
                  <Input
                    value={env.value}
                    onChange={(e) => {
                      const updated = [...mcpEnvVars];
                      updated[idx].value = e.target.value;
                      setMcpEnvVars(updated);
                    }}
                    placeholder="القيمة"
                    className="text-sm flex-1"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#E5E7EB" }}
                    dir="ltr"
                    data-testid={`input-env-value-${idx}`}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white/30 flex-shrink-0"
                    onClick={() => setMcpEnvVars(mcpEnvVars.filter((_, i) => i !== idx))}
                    data-testid={`button-remove-env-${idx}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              size="sm"
              onClick={() => {
                if (!mcpName.trim()) return;
                const envObj = mcpEnvVars.reduce((acc, { key, value }) => {
                  if (key.trim()) acc[key.trim()] = value;
                  return acc;
                }, {} as Record<string, string>);
                createMcpServer.mutate({
                  name: mcpName,
                  type: mcpType,
                  url: mcpType !== "stdio" ? mcpUrl : undefined,
                  command: mcpType === "stdio" ? mcpCommand : undefined,
                  envVars: Object.keys(envObj).length > 0 ? envObj : undefined,
                });
              }}
              disabled={createMcpServer.isPending || !mcpName.trim() || (mcpType !== "stdio" && !mcpUrl.trim()) || (mcpType === "stdio" && !mcpCommand.trim())}
              style={{ background: "#05B6FA" }}
              data-testid="button-save-mcp"
            >
              {createMcpServer.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin ml-1" /> : <Save className="h-3.5 w-3.5 ml-1" />}
              حفظ الخادم
            </Button>
          </Card>
        )}

        <div className="space-y-2">
          {(!mcpServers || mcpServers.length === 0) && !showAddMcp && (
            <Card
              className="p-6 text-center"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <Server className="h-8 w-8 mx-auto mb-2" style={{ color: "rgba(255,255,255,0.15)" }} />
              <p className="text-[13px] text-white/40">لا توجد خوادم MCP مضافة بعد</p>
              <p className="text-[11px] text-white/25 mt-1">أضف خادم MCP لتوسيع قدرات الوكلاء بأدوات خارجية</p>
            </Card>
          )}

          {(mcpServers || []).map((server: any) => (
            <Card
              key={server.id}
              className="p-4"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${server.status === "connected" ? "rgba(16,185,129,0.2)" : server.status === "error" ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)"}`,
              }}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center relative"
                    style={{
                      background: server.status === "connected" ? "rgba(16,185,129,0.12)" : server.status === "error" ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.05)",
                    }}
                  >
                    {server.status === "connected" ? (
                      <Wifi className="h-4 w-4" style={{ color: "#10B981" }} />
                    ) : server.status === "error" ? (
                      <WifiOff className="h-4 w-4" style={{ color: "#EF4444" }} />
                    ) : (
                      <WifiOff className="h-4 w-4" style={{ color: "rgba(255,255,255,0.25)" }} />
                    )}
                    <div
                      className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                      style={{
                        background: server.status === "connected" ? "#10B981" : server.status === "error" ? "#EF4444" : "#6B7280",
                        border: "2px solid #0A1628",
                      }}
                      data-testid={`status-dot-${server.id}`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] text-white/80 font-medium">{server.name}</span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{
                          background: server.status === "connected" ? "rgba(16,185,129,0.12)" : server.status === "error" ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.05)",
                          color: server.status === "connected" ? "#10B981" : server.status === "error" ? "#EF4444" : "rgba(255,255,255,0.3)",
                        }}
                        data-testid={`status-badge-${server.id}`}
                      >
                        {server.status === "connected" ? "متصل" : server.status === "error" ? "خطأ" : "غير متصل"}
                      </span>
                    </div>
                    <div className="text-[11px] text-white/30" dir="ltr">
                      {server.type.toUpperCase()} {server.url ? `• ${server.url}` : server.command ? `• ${server.command}` : ""}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {server.tools && (server.tools as any[]).length > 0 && (
                    <span className="text-[10px] text-white/30 px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.04)" }}>
                      {(server.tools as any[]).length} أدوات
                    </span>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white/30"
                    onClick={() => {
                      const endpoint = server.status === "connected"
                        ? `/api/mcp-servers/${server.id}/disconnect`
                        : `/api/mcp-servers/${server.id}/connect`;
                      fetch(endpoint, { method: "POST", credentials: "include" })
                        .then(() => queryClient.invalidateQueries({ queryKey: ["/api/mcp-servers"] }));
                    }}
                    data-testid={`connect-mcp-${server.id}`}
                  >
                    {server.status === "connected" ? (
                      <Wifi className="h-3.5 w-3.5" style={{ color: "#10B981" }} />
                    ) : (
                      <Plug className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Switch
                    checked={!!server.isActive}
                    onCheckedChange={(checked) => toggleMcpServer.mutate({ id: server.id, isActive: checked })}
                    data-testid={`toggle-mcp-${server.id}`}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white/30"
                    onClick={() => deleteMcpServer.mutate(server.id)}
                    data-testid={`delete-mcp-${server.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div
          className="text-[12px] text-white/30 p-3 rounded-lg mt-3"
          style={{ background: "rgba(5,182,250,0.05)" }}
        >
          <strong className="text-white/50">ملاحظة:</strong> خوادم MCP توسع قدرات الوكلاء بأدوات خارجية مثل قواعد البيانات، البحث، وتكاملات الطرف الثالث. يتم اكتشاف الأدوات تلقائياً عند الاتصال.
        </div>
      </div>

      <SkillsManagement />
    </div>
  );
}

const SKILL_ICONS: Record<string, any> = {
  PenTool, BarChart3, FileSearch, Building2, Calculator, Users,
  Brain, MessageSquare, Shield, Zap, Globe, BookOpen, Sparkles,
};

const SKILL_ICON_LIST = [
  { name: "PenTool", label: "قلم" },
  { name: "BarChart3", label: "رسم بياني" },
  { name: "FileSearch", label: "بحث ملفات" },
  { name: "Building2", label: "مبنى" },
  { name: "Calculator", label: "حاسبة" },
  { name: "Users", label: "فريق" },
  { name: "Brain", label: "دماغ" },
  { name: "MessageSquare", label: "محادثة" },
  { name: "Shield", label: "حماية" },
  { name: "Zap", label: "صاعقة" },
  { name: "Globe", label: "عالمي" },
  { name: "BookOpen", label: "كتاب" },
  { name: "Sparkles", label: "نجوم" },
];

interface SkillData {
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
  createdAt: string | null;
}

const SKILL_COLORS = [
  "#F59E0B", "#6366F1", "#8B5CF6", "#05B6FA", "#10B981", "#EC4899",
  "#EF4444", "#14B8A6", "#F97316", "#84CC16",
];

function SkillsManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: skills } = useQuery<SkillData[]>({
    queryKey: ["/api/skills"],
    queryFn: async () => {
      const res = await fetch("/api/skills", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const [showForm, setShowForm] = useState(false);
  const [editingSkill, setEditingSkill] = useState<SkillData | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIcon, setFormIcon] = useState("Sparkles");
  const [formColor, setFormColor] = useState("#05B6FA");
  const [formPrompt, setFormPrompt] = useState("");
  const [formTools, setFormTools] = useState("");
  const [showIconPicker, setShowIconPicker] = useState(false);

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormIcon("Sparkles");
    setFormColor("#05B6FA");
    setFormPrompt("");
    setFormTools("");
    setEditingSkill(null);
    setShowForm(false);
    setShowIconPicker(false);
  };

  const startEdit = (skill: SkillData) => {
    setEditingSkill(skill);
    setFormName(skill.name);
    setFormDescription(skill.description || "");
    setFormIcon(skill.icon || "Sparkles");
    setFormColor(skill.color || "#05B6FA");
    setFormPrompt(skill.systemPrompt || "");
    setFormTools(skill.tools ? skill.tools.join(", ") : "");
    setShowForm(true);
  };

  const createSkill = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      resetForm();
      toast({ title: "تم الإنشاء", description: "تم إنشاء المهارة بنجاح" });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل إنشاء المهارة", variant: "destructive" });
    },
  });

  const updateSkill = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await fetch(`/api/skills/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      resetForm();
      toast({ title: "تم التحديث", description: "تم تحديث المهارة بنجاح" });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل تحديث المهارة", variant: "destructive" });
    },
  });

  const deleteSkill = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/skills/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      toast({ title: "تم الحذف", description: "تم حذف المهارة" });
    },
  });

  const toggleSkill = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await fetch(`/api/skills/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
    },
  });

  const handleSubmit = () => {
    if (!formName.trim()) return;
    const toolsArray = formTools.trim()
      ? formTools.split(",").map((t) => t.trim()).filter(Boolean)
      : [];
    const payload = {
      name: formName,
      description: formDescription || null,
      icon: formIcon,
      systemPrompt: formPrompt || null,
      tools: toolsArray,
      color: formColor,
      isDefault: false,
      isActive: true,
    };
    if (editingSkill) {
      updateSkill.mutate({ id: editingSkill.id, data: payload });
    } else {
      createSkill.mutate(payload);
    }
  };

  const SkillIcon = ({ iconName, size = "h-4 w-4", color }: { iconName: string; size?: string; color?: string }) => {
    const IconComp = SKILL_ICONS[iconName] || Sparkles;
    return <IconComp className={size} style={color ? { color } : undefined} />;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" style={{ color: "#05B6FA" }} />
          <h2 className="text-lg font-semibold text-white">المهارات</h2>
          <span className="text-[11px] text-white/30 px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
            {skills?.length || 0}
          </span>
        </div>
        <Button
          size="sm"
          onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          style={{ background: showForm ? "rgba(255,255,255,0.1)" : "#05B6FA" }}
          data-testid="button-add-skill"
        >
          {showForm ? <X className="h-3.5 w-3.5 ml-1" /> : <Plus className="h-3.5 w-3.5 ml-1" />}
          {showForm ? "إلغاء" : "إضافة مهارة"}
        </Button>
      </div>

      {showForm && (
        <Card
          className="p-4 mb-4 space-y-3"
          style={{ background: "rgba(5,182,250,0.05)", border: "1px solid rgba(5,182,250,0.15)" }}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                style={{ background: `${formColor}20`, border: `1px solid ${formColor}30` }}
                onClick={() => setShowIconPicker(!showIconPicker)}
                data-testid="button-icon-picker"
              >
                <SkillIcon iconName={formIcon} color={formColor} />
              </button>
              {showIconPicker && (
                <div
                  className="absolute top-12 right-0 z-50 p-3 rounded-lg space-y-3"
                  style={{ background: "#0A1628", border: "1px solid rgba(255,255,255,0.1)", minWidth: "220px" }}
                >
                  <div className="text-[11px] text-white/40 mb-1">اختر الأيقونة</div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {SKILL_ICON_LIST.map((ic) => (
                      <button
                        key={ic.name}
                        type="button"
                        className="w-8 h-8 rounded-md flex items-center justify-center transition-colors"
                        style={{
                          background: formIcon === ic.name ? `${formColor}25` : "rgba(255,255,255,0.04)",
                          border: formIcon === ic.name ? `1px solid ${formColor}40` : "1px solid transparent",
                        }}
                        onClick={() => { setFormIcon(ic.name); }}
                        title={ic.label}
                        data-testid={`icon-option-${ic.name}`}
                      >
                        <SkillIcon iconName={ic.name} size="h-3.5 w-3.5" color={formIcon === ic.name ? formColor : "rgba(255,255,255,0.5)"} />
                      </button>
                    ))}
                  </div>
                  <div className="text-[11px] text-white/40 mt-2 mb-1">اختر اللون</div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {SKILL_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className="w-6 h-6 rounded-full transition-all"
                        style={{
                          background: c,
                          border: formColor === c ? "2px solid white" : "2px solid transparent",
                          transform: formColor === c ? "scale(1.15)" : "scale(1)",
                        }}
                        onClick={() => setFormColor(c)}
                        data-testid={`color-option-${c}`}
                      />
                    ))}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full mt-1 text-[12px] text-white/50"
                    onClick={() => setShowIconPicker(false)}
                  >
                    تم
                  </Button>
                </div>
              )}
            </div>
            <Input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="اسم المهارة (مثال: كاتب المحتوى)"
              className="text-sm flex-1"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#E5E7EB" }}
              data-testid="input-skill-name"
            />
          </div>

          <Input
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            placeholder="وصف المهارة (مثال: إنشاء محتوى عربي احترافي)"
            className="text-sm"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#E5E7EB" }}
            data-testid="input-skill-description"
          />

          <Textarea
            value={formPrompt}
            onChange={(e) => setFormPrompt(e.target.value)}
            placeholder="تعليمات النظام (System Prompt) — مثال: أنت كاتب محتوى محترف. ساعد المستخدم في كتابة محتوى إبداعي واحترافي باللغة العربية."
            rows={4}
            className="text-sm resize-none"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#E5E7EB",
              minHeight: "100px",
            }}
            data-testid="textarea-skill-prompt"
          />

          <Input
            value={formTools}
            onChange={(e) => setFormTools(e.target.value)}
            placeholder="الأدوات (مفصولة بفواصل) — مثال: writing, seo, social_media"
            className="text-sm"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#E5E7EB" }}
            dir="ltr"
            data-testid="input-skill-tools"
          />

          <div className="flex items-center justify-end gap-2 flex-wrap">
            <Button
              size="sm"
              variant="ghost"
              onClick={resetForm}
              className="text-white/50"
              data-testid="button-cancel-skill"
            >
              إلغاء
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!formName.trim() || createSkill.isPending || updateSkill.isPending}
              style={{ background: "#05B6FA" }}
              data-testid="button-save-skill"
            >
              {(createSkill.isPending || updateSkill.isPending) ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin ml-1" />
              ) : (
                <Save className="h-3.5 w-3.5 ml-1" />
              )}
              {editingSkill ? "تحديث المهارة" : "حفظ المهارة"}
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {(!skills || skills.length === 0) && !showForm && (
          <Card
            className="p-6 text-center"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <Sparkles className="h-8 w-8 mx-auto mb-2" style={{ color: "rgba(255,255,255,0.15)" }} />
            <p className="text-[13px] text-white/40">لا توجد مهارات بعد</p>
            <p className="text-[11px] text-white/25 mt-1">أضف مهارات مخصصة لتسريع سير العمل مع الذكاء الاصطناعي</p>
          </Card>
        )}

        {(skills || []).map((skill) => (
          <Card
            key={skill.id}
            className="p-4"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
            data-testid={`skill-card-${skill.id}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${skill.color || "#05B6FA"}20` }}
                >
                  <SkillIcon iconName={skill.icon || "Sparkles"} size="h-4 w-4" color={skill.color || "#05B6FA"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-[13px] font-medium text-white/80">{skill.name}</h3>
                    {skill.isDefault && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{ background: "rgba(5,182,250,0.12)", color: "#05B6FA" }}
                      >
                        افتراضية
                      </span>
                    )}
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full"
                      style={{
                        background: skill.isActive ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.05)",
                        color: skill.isActive ? "#22C55E" : "rgba(255,255,255,0.3)",
                      }}
                    >
                      {skill.isActive ? "نشطة" : "معطّلة"}
                    </span>
                  </div>
                  {skill.description && (
                    <p className="text-[11px] text-white/35 mt-0.5 truncate">{skill.description}</p>
                  )}
                  {skill.tools && (skill.tools as string[]).length > 0 && (
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      {(skill.tools as string[]).map((tool) => (
                        <span
                          key={tool}
                          className="text-[10px] px-1.5 py-0.5 rounded"
                          style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)" }}
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white/30"
                  onClick={() => startEdit(skill)}
                  data-testid={`edit-skill-${skill.id}`}
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white/30"
                  onClick={() => toggleSkill.mutate({ id: skill.id, isActive: !skill.isActive })}
                  data-testid={`toggle-skill-${skill.id}`}
                >
                  {skill.isActive ? (
                    <Check className="h-3.5 w-3.5" style={{ color: "#22C55E" }} />
                  ) : (
                    <X className="h-3.5 w-3.5" />
                  )}
                </Button>
                {!skill.isDefault && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white/30"
                    onClick={() => deleteSkill.mutate(skill.id)}
                    data-testid={`delete-skill-${skill.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div
        className="text-[12px] text-white/30 p-3 rounded-lg mt-3"
        style={{ background: "rgba(5,182,250,0.05)" }}
      >
        <strong className="text-white/50">ملاحظة:</strong> المهارات هي سير عمل ذكاء اصطناعي مُعدّة مسبقاً. عند تفعيل مهارة في الشات، يتم حقن تعليمات النظام الخاصة بها تلقائياً في المحادثة.
      </div>
    </div>
  );
}
