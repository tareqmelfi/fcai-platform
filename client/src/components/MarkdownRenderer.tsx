import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState, useCallback } from "react";
import { Copy, Check, Download, X, ZoomIn } from "lucide-react";

function CodeBlock({ children, className }: { children: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const language = className?.replace("language-", "") || "";

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(children);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = children;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [children]);

  return (
    <div
      className="relative group my-4 rounded-lg overflow-hidden"
      style={{ background: "#0a0e1a", border: "1px solid rgba(255,255,255,0.1)" }}
    >
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <span
          className="text-[11px] font-medium"
          style={{ color: "#9CA3AF", fontFamily: "'Fira Code', Rubik, monospace" }}
        >
          {language || "code"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] transition-all"
          style={{
            color: copied ? "#10B981" : "#9CA3AF",
            background: copied ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.05)",
          }}
          data-testid="button-copy-code"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "تم النسخ" : "نسخ"}
        </button>
      </div>
      <pre
        className="p-4 overflow-x-auto"
        dir="ltr"
        style={{
          fontFamily: "'Fira Code', Rubik, monospace",
          fontSize: "13px",
          lineHeight: "1.7",
          color: "#D1D5DB",
          margin: 0,
        }}
      >
        <code>{children}</code>
      </pre>
    </div>
  );
}

function ImageWithOverlay({ src, alt }: { src?: string; alt?: string }) {
  const [expanded, setExpanded] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  if (!src) return null;

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement("a");
    link.href = src;
    link.download = alt || "image";
    link.click();
  };

  return (
    <>
      <div
        className="relative inline-block my-3 cursor-pointer group"
        onMouseEnter={() => setShowOverlay(true)}
        onMouseLeave={() => setShowOverlay(false)}
        onClick={() => setExpanded(true)}
      >
        <img
          src={src}
          alt={alt || ""}
          className="rounded-xl max-w-full"
          style={{ maxHeight: "400px", border: "1px solid rgba(255,255,255,0.08)" }}
          loading="lazy"
        />
        <div
          className="absolute inset-0 rounded-xl flex items-center justify-center gap-3 transition-opacity duration-200"
          style={{
            background: "rgba(0,16,48,0.6)",
            opacity: showOverlay ? 1 : 0,
            pointerEvents: showOverlay ? "auto" : "none",
          }}
        >
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            style={{ background: "rgba(5,182,250,0.2)", color: "#05B6FA" }}
            onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
            data-testid="button-expand-image"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            style={{ background: "rgba(5,182,250,0.2)", color: "#05B6FA" }}
            onClick={handleDownload}
            data-testid="button-download-image"
          >
            <Download className="h-5 w-5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-8"
          style={{ background: "rgba(0,8,24,0.9)" }}
          onClick={() => setExpanded(false)}
        >
          <button
            className="absolute top-6 left-6 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.1)", color: "#D1D5DB" }}
            onClick={() => setExpanded(false)}
            data-testid="button-close-image"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={src}
            alt={alt || ""}
            className="max-w-full max-h-full rounded-xl object-contain"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium"
            style={{ background: "rgba(5,182,250,0.15)", color: "#05B6FA", border: "1px solid rgba(5,182,250,0.3)" }}
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
            تحميل
          </button>
        </div>
      )}
    </>
  );
}

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div
      className="markdown-content"
      dir="rtl"
      style={{ direction: "rtl", textAlign: "right" }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1
              className="font-bold mb-3 pb-2 mt-5"
              style={{
                color: "#05B6FA",
                fontSize: "20px",
                fontWeight: 700,
                borderBottom: "1px solid rgba(5,182,250,0.3)",
              }}
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              className="font-bold mt-5 mb-2"
              style={{ color: "#05B6FA", fontSize: "17px", fontWeight: 700 }}
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              className="font-bold mt-4 mb-2"
              style={{ color: "#05B6FA", fontSize: "15px", fontWeight: 700 }}
            >
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4
              className="font-semibold mt-3 mb-1.5"
              style={{
                color: "#05B6FA",
                fontSize: "14px",
                fontWeight: 600,
                borderRight: "3px solid #05B6FA",
                paddingRight: "10px",
              }}
            >
              {children}
            </h4>
          ),
          h5: ({ children }) => (
            <h5
              className="font-semibold mt-3 mb-1"
              style={{ color: "#05B6FA", fontSize: "13px", fontWeight: 600 }}
            >
              {children}
            </h5>
          ),
          h6: ({ children }) => (
            <h6
              className="font-medium mt-2 mb-1"
              style={{ color: "#05B6FA", fontSize: "12px", fontWeight: 600 }}
            >
              {children}
            </h6>
          ),
          p: ({ children }) => (
            <p
              className="mb-3 text-[15px]"
              style={{ color: "#D1D5DB", lineHeight: "1.9", textAlign: "justify" }}
            >
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong style={{ color: "#FFFFFF", fontWeight: 600 }}>{children}</strong>
          ),
          em: ({ children }) => (
            <em style={{ color: "#D1D5DB", fontStyle: "italic" }}>{children}</em>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors"
              style={{
                color: "#05B6FA",
                borderBottom: "1px dashed #05B6FA",
                textDecoration: "none",
              }}
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul
              className="mb-3 pr-6 space-y-1.5"
              style={{
                color: "#D1D5DB",
                listStyleType: "disc",
                listStylePosition: "inside",
                paddingRight: "24px",
              }}
            >
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol
              className="mb-3 pr-6 space-y-1.5"
              style={{
                color: "#D1D5DB",
                listStyleType: "decimal",
                listStylePosition: "inside",
                paddingRight: "24px",
              }}
            >
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li
              className="text-[15px]"
              style={{ color: "#D1D5DB", lineHeight: "1.8" }}
            >
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote
              className="my-4 pr-4 py-3 pl-3 rounded-sm italic"
              style={{
                borderRight: "3px solid #05B6FA",
                background: "rgba(5,182,250,0.05)",
                color: "#D1D5DB",
              }}
            >
              {children}
            </blockquote>
          ),
          code: ({ children, className }) => {
            return (
              <code
                dir="ltr"
                className="px-1.5 py-0.5 rounded text-[13px]"
                style={{
                  background: "rgba(5,182,250,0.1)",
                  color: "#05B6FA",
                  fontFamily: "'Fira Code', Rubik, monospace",
                  direction: "ltr",
                  unicodeBidi: "embed",
                }}
              >
                {children}
              </code>
            );
          },
          pre: ({ children, node }) => {
            const codeEl = node?.children?.[0];
            if (codeEl && codeEl.type === "element" && codeEl.tagName === "code") {
              const className = (codeEl.properties?.className as string[] | undefined)?.[0] || "";
              const rawText = codeEl.children
                ?.map((c: any) => (c.type === "text" ? c.value : ""))
                .join("") || "";
              return (
                <CodeBlock className={className}>
                  {rawText.replace(/\n$/, "")}
                </CodeBlock>
              );
            }
            return <>{children}</>;
          },
          table: ({ children }) => (
            <div
              className="my-4 overflow-x-auto rounded-lg"
              style={{ border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <table className="w-full text-sm border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead style={{ background: "rgba(5,182,250,0.15)" }}>
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th
              className="px-4 py-2.5 text-right font-bold text-[13px]"
              style={{
                color: "#05B6FA",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              {children}
            </th>
          ),
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => (
            <tr
              className="transition-colors"
              style={{ }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              {children}
            </tr>
          ),
          td: ({ children }) => (
            <td
              className="px-4 py-2.5 text-right text-[13px]"
              style={{
                color: "#D1D5DB",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              {children}
            </td>
          ),
          img: ({ src, alt }) => <ImageWithOverlay src={src} alt={alt} />,
          hr: () => (
            <hr
              className="my-5"
              style={{ borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
