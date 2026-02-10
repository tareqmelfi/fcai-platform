import { useState, useEffect } from "react";
import { Loader2, Trash2, Eye, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { OutputTemplate } from "../types";

interface TemplateEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  template: OutputTemplate | null;
}

export function TemplateEditorDialog({
  isOpen,
  onClose,
  template,
}: TemplateEditorDialogProps) {
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
