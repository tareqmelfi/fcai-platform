import { useState, useCallback } from "react";
import { getFileCategory } from "../utils/file-utils";
import type { AttachedFile } from "../types";

export function useChatActions() {
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

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

  const removeFile = useCallback((index: number) => {
    setAttachedFiles((prev) => {
      const file = prev[index];
      if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

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

  return {
    attachedFiles,
    setAttachedFiles,
    uploadFiles,
    removeFile,
    isDragOver,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
