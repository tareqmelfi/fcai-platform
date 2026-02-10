import { Loader2, X } from "lucide-react";
import type { AttachedFile } from "../types";
import { formatFileSize, getFileIcon } from "../utils/file-utils";

export function FileChip({ file, onRemove }: { file: AttachedFile; onRemove: () => void }) {
  const Icon = getFileIcon(file.type);
  const isImage = file.type === "image";

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] group"
      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
      data-testid={`file-chip-${file.name}`}
    >
      {isImage && file.previewUrl ? (
        <img src={file.previewUrl} alt={file.name} className="w-8 h-8 rounded object-cover flex-shrink-0" />
      ) : (
        <Icon className="h-4 w-4 flex-shrink-0" style={{ color: "#05B6FA" }} />
      )}
      <div className="flex-1 min-w-0">
        <div className="truncate text-white/80" dir="ltr">{file.name}</div>
        <div className="text-[10px] text-white/30" dir="ltr">{formatFileSize(file.size)}</div>
      </div>
      {file.uploading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-white/40 flex-shrink-0" />
      ) : (
        <button
          onClick={onRemove}
          className="p-0.5 rounded text-white/30 transition-colors flex-shrink-0"
          style={{ visibility: "visible" }}
          data-testid={`remove-file-${file.name}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
