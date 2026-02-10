import React, { useState, useRef, useEffect, useCallback, useMemo, Suspense } from "react";
import {
  useConversations,
  useConversation,
  useCreateConversation,
} from "@/hooks/use-chat";
import { useStreamingChat, useAutoScroll, useKeyboardShortcuts } from "@/features/chat/hooks";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, useSearch } from "wouter";
import {
  Paperclip,
  Settings2,
  ArrowUp,
  Mic,
  ChevronDown,
  Bot,
  Plug,
  FileOutput,
  Upload,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

import type { AttachedFile, SkillType, McpServerType, OutputTemplate } from "@/features/chat/types";
import { getFileCategory } from "@/features/chat/utils/file-utils";
import {
  ChatMessage,
  ModelSelector,
  TemplateSelector,
  SkillsPickerDropdown,
  McpServersDropdown,
  McpToolsBar,
  AttachmentMenu,
  FileChip,
  TypingIndicator,
  TemplatedMessage,
  EmptyState,
} from "@/features/chat/components";

// Lazy-load heavy dialog components not needed on initial render
const TemplateEditorDialog = React.lazy(
  () => import("@/features/chat/components/TemplateEditorDialog").then(m => ({ default: m.TemplateEditorDialog }))
);

export default function ChatPage() {
  useConversations(); // Pre-fetch conversation list for sidebar cache
  const { user } = useAuth();
  const createConversation = useCreateConversation();
  const {
    sendMessage,
    stopGeneration,
    streamingContent,
    isStreaming,
    status: streamingStatus,
    lastUsage,
    error: streamingError,
    clearError: clearStreamingError,
  } = useStreamingChat();
  const [location, setLocation] = useLocation();
  const searchString = useSearch();

  const params = new URLSearchParams(searchString);
  const activeId = params.get("id") ? Number(params.get("id")) : null;
  const isNew = params.get("new") === "1";

  const { data: conversation } = useConversation(activeId);

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

  const {
    scrollContainerRef,
    sentinelRef,
    isAtBottom,
    scrollToBottom,
    scrollOnNewMessage,
  } = useAutoScroll({
    isStreaming,
    deps: [streamingContent, conversation?.messages?.length],
  });

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

  const toggleMcpTool = useCallback((toolKey: string) => {
    setMcpEnabledTools((prev) => {
      const next = new Set(prev);
      if (next.has(toolKey)) next.delete(toolKey);
      else next.add(toolKey);
      return next;
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

    // Return focus to input after streaming completes
    textareaRef.current?.focus();
  };

  const { handleTextareaKeyDown } = useKeyboardShortcuts({
    inputRef: textareaRef,
    isStreaming,
    onSend: handleSend,
    onStopGeneration: stopGeneration,
    onNewConversation: handleNewConversation,
  });

  const messages = conversation?.messages || [];
  const showWelcome = !activeId || (messages.length === 0 && !isStreaming);
  const hasContent = inputText.trim() || attachedFiles.length > 0;

  // Memoize user initial to avoid recalculating on every render
  const userInitial = useMemo(() => user?.firstName?.[0] || "U", [user?.firstName]);

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
        <EmptyState
          userName={user?.firstName || undefined}
          onSelectPrompt={(prompt) => {
            setInputText(prompt);
            textareaRef.current?.focus();
          }}
        />
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-6" ref={scrollContainerRef} role="log" aria-label="سجل المحادثة">
          <div className="max-w-3xl mx-auto space-y-6" role="list">
            {messages.map((msg, i) => (
              <div
                key={msg.id}
                className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}
              >
                <ChatMessage
                  role={msg.role}
                  content={msg.content}
                  attachments={msg.attachments}
                  userInitial={userInitial}
                  template={selectedTemplate}
                />
              </div>
            ))}

            {isStreaming && (
              <div
                className="flex items-start gap-3 animate-in fade-in duration-300"
                aria-live="polite"
                aria-atomic="false"
                role="status"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                  style={{ background: "rgba(5,182,250,0.15)" }}
                  aria-hidden="true"
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
                        aria-hidden="true"
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

            {/* Auto-scroll sentinel — must be the last element in the scroll area */}
            <div ref={sentinelRef} className="h-1" aria-hidden="true" />
          </div>
        </div>
      )}

      {/* Scroll to bottom floating button */}
      {!isAtBottom && !showWelcome && (
        <div className="flex justify-center -mt-2 mb-1 relative z-10">
          <button
            onClick={scrollToBottom}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all hover:scale-105"
            style={{
              background: "rgba(5, 182, 250, 0.15)",
              border: "1px solid rgba(5, 182, 250, 0.3)",
              color: "#05B6FA",
              backdropFilter: "blur(8px)",
            }}
            aria-label="الانتقال لأحدث رسالة"
          >
            <ChevronDown className="h-3 w-3" />
            <span>الانتقال للأسفل</span>
          </button>
        </div>
      )}

      {/* Streaming error banner */}
      {streamingError && (
        <div className="px-4">
          <div className="max-w-3xl mx-auto">
            <div
              className="flex items-center justify-between rounded-xl px-4 py-2 mb-2 text-sm"
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#FCA5A5",
              }}
            >
              <span>{streamingError}</span>
              <button
                onClick={clearStreamingError}
                className="ml-3 hover:opacity-70 transition-opacity"
                style={{ color: "#FCA5A5" }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
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
              onKeyDown={handleTextareaKeyDown}
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
              onToggleTool={toggleMcpTool}
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
                    onToggleTool={toggleMcpTool}
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
                  aria-label="تسجيل صوتي"
                >
                  <Mic className="h-4 w-4" />
                </Button>
                {isStreaming ? (
                  <button
                    onClick={stopGeneration}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-lg"
                    style={{
                      background: "rgba(239, 68, 68, 0.8)",
                      color: "#fff",
                    }}
                    data-testid="button-stop-generation"
                    title="إيقاف التوليد"
                  >
                    <div className="w-3 h-3 rounded-[2px] bg-white" />
                  </button>
                ) : (
                  <button
                    onClick={handleSend}
                    disabled={!hasContent || attachedFiles.some((f) => f.uploading)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      hasContent
                        ? "shadow-lg"
                        : "opacity-40 cursor-not-allowed"
                    }`}
                    style={{
                      background: hasContent ? "#05B6FA" : "rgba(255,255,255,0.1)",
                      color: hasContent ? "#001539" : "#9CA3AF",
                    }}
                    data-testid="button-send-message"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                )}
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

      <Suspense fallback={null}>
        <TemplateEditorDialog
          isOpen={templateEditorOpen}
          onClose={() => { setTemplateEditorOpen(false); setEditingTemplate(null); }}
          template={editingTemplate}
        />
      </Suspense>
    </div>
  );
}
