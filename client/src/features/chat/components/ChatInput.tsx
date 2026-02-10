import React from "react";
import {
  Paperclip,
  Settings2,
  ArrowUp,
  Mic,
  ChevronDown,
  Sparkles,
  FileOutput,
  Plug,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModelSelector } from "./ModelSelector";
import { TemplateSelector } from "./TemplateSelector";
import { SkillsPickerDropdown } from "./SkillsPickerDropdown";
import { McpServersDropdown } from "./McpServersDropdown";
import { McpToolsBar } from "./McpToolsBar";
import { AttachmentMenu } from "./AttachmentMenu";
import { FileChip } from "./FileChip";
import type { AttachedFile, OutputTemplate, SkillType, McpServerType } from "../types";

interface ChatInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  onSend: () => void;
  onStop: () => void;
  isStreaming: boolean;
  hasContent: boolean;
  attachedFiles: AttachedFile[];
  onRemoveFile: (index: number) => void;
  onFileSelect: () => void;
  onPaste: (e: React.ClipboardEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  
  // States for dropdowns
  selectedModel: string;
  onSelectModel: (model: string) => void;
  modelSelectorOpen: boolean;
  setModelSelectorOpen: (open: boolean) => void;
  
  attachMenuOpen: boolean;
  setAttachMenuOpen: (open: boolean) => void;
  
  templateSelectorOpen: boolean;
  setTemplateSelectorOpen: (open: boolean) => void;
  selectedTemplate: OutputTemplate | null;
  onSelectTemplate: (t: OutputTemplate | null) => void;
  onEditTemplate: (t: OutputTemplate) => void;
  onCreateTemplate: () => void;

  skillsPickerOpen: boolean;
  setSkillsPickerOpen: (open: boolean) => void;
  activeSkill: SkillType | null;
  setActiveSkill: (s: SkillType | null) => void;

  mcpServers: McpServerType[];
  mcpDropdownOpen: boolean;
  setMcpDropdownOpen: (open: boolean) => void;
  mcpEnabledTools: Set<string>;
  onToggleMcpTool: (key: string) => void;

  isDragOver: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  inputText,
  setInputText,
  onSend,
  onStop,
  isStreaming,
  hasContent,
  attachedFiles,
  onRemoveFile,
  onFileSelect,
  onPaste,
  onKeyDown,
  textareaRef,
  selectedModel,
  onSelectModel,
  modelSelectorOpen,
  setModelSelectorOpen,
  attachMenuOpen,
  setAttachMenuOpen,
  templateSelectorOpen,
  setTemplateSelectorOpen,
  selectedTemplate,
  onSelectTemplate,
  onEditTemplate,
  onCreateTemplate,
  skillsPickerOpen,
  setSkillsPickerOpen,
  activeSkill,
  setActiveSkill,
  mcpServers,
  mcpDropdownOpen,
  setMcpDropdownOpen,
  mcpEnabledTools,
  onToggleMcpTool,
  isDragOver,
}) => {
  return (
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
                <FileChip key={i} file={file} onRemove={() => onRemoveFile(i)} />
              ))}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
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
            servers={mcpServers}
            enabledTools={mcpEnabledTools}
            onToggleTool={onToggleMcpTool}
          />

          <div
            className="flex items-center justify-between flex-wrap gap-2 px-3 py-2"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center gap-1">
              <div className="relative">
                <button
                  className="flex items-center gap-1.5 px-2 py-1.5 text-white/40 text-[12px] hover:text-white/60 transition-colors"
                  onClick={() => setAttachMenuOpen(!attachMenuOpen)}
                  data-testid="button-attach"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  إرفاق
                </button>
                <AttachmentMenu
                  isOpen={attachMenuOpen}
                  onClose={() => setAttachMenuOpen(false)}
                  onUploadFromDevice={onFileSelect}
                  onGoogleDrive={() => {}}
                  onSkills={() => setSkillsPickerOpen(true)}
                  onProjects={() => {}}
                />
              </div>
              <button
                className="flex items-center gap-1.5 px-2 py-1.5 text-white/40 text-[12px] hover:text-white/60 transition-colors"
                data-testid="button-parameters"
              >
                <Settings2 className="h-3.5 w-3.5" />
                المعلمات
              </button>
              <div className="relative">
                <button
                  className="flex items-center gap-1.5 px-2 py-1.5 text-white/40 text-[12px] hover:text-white/60 transition-colors"
                  onClick={() => setTemplateSelectorOpen(!templateSelectorOpen)}
                  data-testid="button-outputs"
                >
                  <FileOutput className="h-3.5 w-3.5" />
                  {selectedTemplate ? selectedTemplate.name : "المخرجات"}
                  <ChevronDown className="h-3 w-3" />
                </button>
                <TemplateSelector
                  isOpen={templateSelectorOpen}
                  onClose={() => setTemplateSelectorOpen(false)}
                  selectedTemplate={selectedTemplate}
                  onSelect={onSelectTemplate}
                  onEdit={onEditTemplate}
                  onCreateNew={onCreateTemplate}
                />
              </div>
              <div className="relative">
                <button
                  className="flex items-center gap-1.5 px-2 py-1.5 text-[12px] hover:opacity-80 transition-opacity"
                  style={{ color: activeSkill ? "#05B6FA" : "rgba(255,255,255,0.4)" }}
                  onClick={() => setSkillsPickerOpen(!skillsPickerOpen)}
                  data-testid="button-skills"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {activeSkill ? activeSkill.name : "المهارات"}
                  <ChevronDown className="h-3 w-3" />
                </button>
                <SkillsPickerDropdown
                  isOpen={skillsPickerOpen}
                  onClose={() => setSkillsPickerOpen(false)}
                  activeSkill={activeSkill}
                  onSelect={setActiveSkill}
                />
              </div>
              <div className="relative">
                <button
                  className="flex items-center gap-1.5 px-2 py-1.5 text-[12px] hover:opacity-80 transition-opacity"
                  style={{
                    color: mcpServers.some(s => s.isActive && s.status === "connected")
                      ? "#05B6FA"
                      : "rgba(255,255,255,0.4)",
                  }}
                  onClick={() => setMcpDropdownOpen(!mcpDropdownOpen)}
                  data-testid="button-mcp-servers"
                >
                  <Plug className="h-3.5 w-3.5" />
                  MCP
                  <ChevronDown className="h-3 w-3" />
                </button>
                <McpServersDropdown
                  isOpen={mcpDropdownOpen}
                  onClose={() => setMcpDropdownOpen(false)}
                  servers={mcpServers}
                  enabledTools={mcpEnabledTools}
                  onToggleTool={onToggleMcpTool}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ModelSelector
                selectedModel={selectedModel}
                onSelect={onSelectModel}
                isOpen={modelSelectorOpen}
                onToggle={() => setModelSelectorOpen(!modelSelectorOpen)}
              />
              <button
                className="p-1.5 text-white/40 hover:text-white/60 transition-colors"
                data-testid="button-mic"
                aria-label="تسجيل صوتي"
              >
                <Mic className="h-4 w-4" />
              </button>
              {isStreaming ? (
                <button
                  onClick={onStop}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95"
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
                  onClick={onSend}
                  disabled={!hasContent || attachedFiles.some((f) => f.uploading)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95 ${
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
  );
};
