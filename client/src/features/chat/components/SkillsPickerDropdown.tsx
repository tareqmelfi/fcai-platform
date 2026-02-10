import { useRef, useEffect } from "react";
import { FileText, Sparkles, X, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { SkillType } from "../types";

interface SkillsPickerDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  activeSkill: SkillType | null;
  onSelect: (s: SkillType | null) => void;
}

export function SkillsPickerDropdown({
  isOpen,
  onClose,
  activeSkill,
  onSelect,
}: SkillsPickerDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { data: allSkills } = useQuery<SkillType[]>({
    queryKey: ["/api/skills"],
    queryFn: async () => {
      const res = await fetch("/api/skills", { credentials: "include" });
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
      className="absolute bottom-full mb-2 right-0 w-[280px] max-h-[350px] overflow-y-auto rounded-xl z-50 shadow-xl"
      style={{ background: "#0a1628", border: "1px solid rgba(255,255,255,0.1)" }}
      data-testid="skills-picker-dropdown"
    >
      <div className="px-3 py-2 text-[11px] text-white/40 font-medium" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        المهارات المتاحة
      </div>

      <button
        className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors text-right"
        style={{ color: !activeSkill ? "#05B6FA" : "#D1D5DB", background: !activeSkill ? "rgba(5,182,250,0.08)" : "transparent" }}
        onClick={() => { onSelect(null); onClose(); }}
        onMouseEnter={(e) => { if (activeSkill) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
        onMouseLeave={(e) => { if (activeSkill) e.currentTarget.style.background = "transparent"; }}
        data-testid="skill-none"
      >
        <X className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="flex-1">بدون مهارة</span>
        {!activeSkill && <Check className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#05B6FA" }} />}
      </button>

      {(allSkills || []).filter(s => s.isActive).map((skill) => (
        <button
          key={skill.id}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors text-right"
          style={{
            color: activeSkill?.id === skill.id ? "#05B6FA" : "#D1D5DB",
            background: activeSkill?.id === skill.id ? "rgba(5,182,250,0.08)" : "transparent",
          }}
          onClick={() => { onSelect(skill); onClose(); }}
          onMouseEnter={(e) => { if (activeSkill?.id !== skill.id) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
          onMouseLeave={(e) => { if (activeSkill?.id !== skill.id) e.currentTarget.style.background = "transparent"; }}
          data-testid={`skill-item-${skill.id}`}
        >
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ background: `${skill.color || "#05B6FA"}20` }}
          >
            <Sparkles className="h-3 w-3" style={{ color: skill.color || "#05B6FA" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="truncate">{skill.name}</div>
            {skill.description && <div className="text-[10px] text-white/30 truncate">{skill.description}</div>}
          </div>
          {activeSkill?.id === skill.id && <Check className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#05B6FA" }} />}
        </button>
      ))}
    </div>
  );
}
