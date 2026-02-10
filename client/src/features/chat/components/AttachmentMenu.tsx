import { useRef, useEffect } from "react";
import { Upload, HardDrive, Sparkles, FolderOpen } from "lucide-react";

interface AttachmentMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadFromDevice: () => void;
  onGoogleDrive: () => void;
  onSkills: () => void;
  onProjects: () => void;
}

export function AttachmentMenu({
  isOpen,
  onClose,
  onUploadFromDevice,
  onGoogleDrive,
  onSkills,
  onProjects,
}: AttachmentMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const items = [
    { label: "رفع من الجهاز", icon: Upload, onClick: onUploadFromDevice, testId: "attach-upload-device" },
    { label: "من Google Drive", icon: HardDrive, onClick: onGoogleDrive, testId: "attach-google-drive" },
    { label: "استخدام المهارات", icon: Sparkles, onClick: onSkills, testId: "attach-skills" },
    { label: "من المشاريع", icon: FolderOpen, onClick: onProjects, testId: "attach-projects" },
  ];

  return (
    <div
      ref={ref}
      className="absolute bottom-full mb-2 right-0 w-[220px] rounded-xl overflow-hidden z-50 shadow-xl"
      style={{ background: "#0a1628", border: "1px solid rgba(255,255,255,0.1)" }}
    >
      {items.map((item) => (
        <button
          key={item.testId}
          className="w-full flex items-center gap-3 px-4 py-3 text-[13px] transition-colors text-right"
          style={{ color: "#D1D5DB" }}
          onClick={() => {
            item.onClick();
            onClose();
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          data-testid={item.testId}
        >
          <item.icon className="h-4 w-4 flex-shrink-0" style={{ color: "#05B6FA" }} />
          <span className="flex-1">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
