import { useRef, useEffect } from "react";
import { FileOutput, X, Check, Plus, Edit3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { OutputTemplate } from "../types";

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTemplate: OutputTemplate | null;
  onSelect: (t: OutputTemplate | null) => void;
  onEdit: (t: OutputTemplate) => void;
  onCreateNew: () => void;
}

export function TemplateSelector({
  isOpen,
  onClose,
  selectedTemplate,
  onSelect,
  onEdit,
  onCreateNew,
}: TemplateSelectorProps) {
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
