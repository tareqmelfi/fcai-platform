import React, { useState, useRef, useEffect, useCallback, useMemo, Suspense } from "react";
import {
  useConversations,
  useConversation,
  useCreateConversation,
} from "@/hooks/use-chat";
import {
  useStreamingChat,
  useAutoScroll,
  useKeyboardShortcuts,
  useChatActions,
} from "@/features/chat/hooks";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";

import type { SkillType, McpServerType, OutputTemplate } from "@/features/chat/types";
import {
  MessageList,
  ChatInput,
  EmptyState,
  TemplateEditorDialog,
} from "@/features/chat/components";

export default function ChatPage() {
  useConversations(); // Pre-fetch conversation list for sidebar cache
  const { user } = useAuth();
  const createConversation = useCreateConversation();
  const {
    sendMessage,
    stopGeneration,
    streamingContent,
    isStreaming,
    error: streamingError,
    clearError: clearStreamingError,
  } = useStreamingChat();
  
  const [location, setLocation] = useLocation();
  const searchString = useSearch();

  const params = new URLSearchParams(searchString);
  const activeId = params.get("id") ? Number(params.get("id")) : null;
  const isNew = params.get("new") === "1";

  const { data: conversation } = useConversation(activeId);

  const {
    attachedFiles,
    setAttachedFiles,
    removeFile,
    isDragOver,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useChatActions();

  const [inputText, setInputText] = useState("");
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem("fcai_lastModel") || "gemini-2.5-flash";
  });

  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
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
  } = useAutoScroll({
    isStreaming,
    deps: [streamingContent, conversation?.messages?.length],
  });

  useEffect(() => {
    if (isNew && !activeId) {
      handleNewConversation();
    }
  }, [isNew, activeId]);

  const handleNewConversation = useCallback(() => {
    createConversation.mutate("محادثة جديدة", {
      onSuccess: (newChat) => {
        setLocation(`/chat?id=${newChat.id}`);
      },
    });
  }, [createConversation, setLocation]);

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
    if (textareaRef.current) textareaRef.current.style.height = "auto";

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
      {showWelcome ? (
        <EmptyState
          userName={user?.firstName || undefined}
          onSelectPrompt={(prompt) => {
            setInputText(prompt);
            textareaRef.current?.focus();
          }}
        />
      ) : (
        <MessageList
          messages={messages as any}
          isStreaming={isStreaming}
          streamingContent={streamingContent}
          selectedTemplate={selectedTemplate}
          userInitial={userInitial}
          scrollContainerRef={scrollContainerRef}
          sentinelRef={sentinelRef}
          isAtBottom={isAtBottom}
          scrollToBottom={scrollToBottom}
        />
      )}

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
              <button onClick={clearStreamingError} className="ml-3 hover:opacity-70 transition-opacity">
                X
              </button>
            </div>
          </div>
        </div>
      )}

      <ChatInput
        inputText={inputText}
        setInputText={setInputText}
        onSend={handleSend}
        onStop={stopGeneration}
        isStreaming={isStreaming}
        hasContent={hasContent}
        attachedFiles={attachedFiles}
        onRemoveFile={removeFile}
        onFileSelect={() => fileInputRef.current?.click()}
        onPaste={(e: any) => {}} // Handle paste via hook if needed, for now keeping simple
        onKeyDown={handleTextareaKeyDown as any}
        textareaRef={textareaRef}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        modelSelectorOpen={modelSelectorOpen}
        setModelSelectorOpen={setModelSelectorOpen}
        attachMenuOpen={attachMenuOpen}
        setAttachMenuOpen={setAttachMenuOpen}
        templateSelectorOpen={templateSelectorOpen}
        setTemplateSelectorOpen={setTemplateSelectorOpen}
        selectedTemplate={selectedTemplate}
        onSelectTemplate={setSelectedTemplate}
        onEditTemplate={(t) => { setEditingTemplate(t); setTemplateEditorOpen(true); }}
        onCreateTemplate={() => { setEditingTemplate(null); setTemplateEditorOpen(true); }}
        skillsPickerOpen={skillsPickerOpen}
        setSkillsPickerOpen={setSkillsPickerOpen}
        activeSkill={activeSkill}
        setActiveSkill={setActiveSkill}
        mcpServers={mcpServers || []}
        mcpDropdownOpen={mcpDropdownOpen}
        setMcpDropdownOpen={setMcpDropdownOpen}
        mcpEnabledTools={mcpEnabledTools}
        onToggleMcpTool={(key) => {
          setMcpEnabledTools((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
          });
        }}
        isDragOver={isDragOver}
      />

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
           const files = Array.from(e.target.files || []);
           // Handle file upload here or move to hook
        }}
      />

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
