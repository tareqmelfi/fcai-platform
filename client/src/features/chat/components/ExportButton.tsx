import { useState, useRef, useEffect } from "react";
import { Download } from "lucide-react";
import { markdownToHtml } from "../utils/markdown-utils";
import type { OutputTemplate } from "../types";

interface ExportButtonProps {
  content: string;
  template: OutputTemplate | null;
}

export function ExportButton({ content, template }: ExportButtonProps) {
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
