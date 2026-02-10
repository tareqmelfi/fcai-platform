import { formatFileSize, getFileIcon } from "../utils/file-utils";

export function MessageAttachments({ attachments }: { attachments: any[] }) {
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
