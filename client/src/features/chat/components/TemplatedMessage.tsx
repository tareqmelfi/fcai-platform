import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import type { OutputTemplate } from "../types";

interface TemplatedMessageProps {
  content: string;
  template: OutputTemplate | null;
}

export function TemplatedMessage({ content, template }: TemplatedMessageProps) {
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
