import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProviderModels } from "../hooks/use-provider-models";

interface ModelSelectorProps {
  selectedModel: string;
  onSelect: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function ModelSelector({
  selectedModel,
  onSelect,
  isOpen,
  onToggle,
}: ModelSelectorProps) {
  const [search, setSearch] = useState("");
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const providerGroups = useProviderModels();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onToggle();
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onToggle]);

  const displayName = (() => {
    for (const p of providerGroups) {
      const m = p.models.find((m) => m.id === selectedModel);
      if (m) return m.name;
    }
    return selectedModel;
  })();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors"
        style={{ background: "rgba(255,255,255,0.06)", color: "#D1D5DB", border: "1px solid rgba(255,255,255,0.08)" }}
        data-testid="button-model-selector"
      >
        <span dir="ltr">{displayName}</span>
        <ChevronDown className="h-3 w-3" />
      </button>

      {isOpen && (
        <div
          className="absolute bottom-full mb-2 right-0 w-[300px] rounded-xl overflow-hidden z-50 shadow-xl"
          style={{ background: "#0a1628", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <div className="p-2">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن موديل..."
                dir="ltr"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 pr-9 text-[13px] text-white/80 placeholder:text-white/30 outline-none focus:border-[#05B6FA]"
                data-testid="input-model-search"
              />
            </div>
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {providerGroups.filter(
              (p) =>
                !search ||
                p.name.toLowerCase().includes(search.toLowerCase()) ||
                p.models.some((m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.id.toLowerCase().includes(search.toLowerCase()))
            ).map((provider) => {
              const filteredModels = search
                ? provider.models.filter(
                    (m) =>
                      m.name.toLowerCase().includes(search.toLowerCase()) ||
                      m.id.toLowerCase().includes(search.toLowerCase())
                  )
                : provider.models;

              return (
                <div key={provider.key}>
                  <button
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium transition-colors"
                    style={{ color: "#D1D5DB" }}
                    onClick={() =>
                      setExpandedProvider(expandedProvider === provider.key ? null : provider.key)
                    }
                  >
                    <span
                      className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold"
                      style={{ background: provider.color + "20", color: provider.color }}
                    >
                      {provider.icon}
                    </span>
                    <span className="flex-1 text-right">{provider.name}</span>
                    {!provider.configured && provider.key !== "google" && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.05)", color: "#9CA3AF" }}>
                        غير مُعدّ
                      </span>
                    )}
                    {provider.configured && provider.key !== "google" && (
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#22C55E" }} />
                    )}
                    <ChevronDown
                      className={cn(
                        "h-3 w-3 transition-transform",
                        expandedProvider === provider.key && "rotate-180"
                      )}
                    />
                  </button>
                  {expandedProvider === provider.key &&
                    filteredModels.map((model) => (
                      <button
                        key={model.id}
                        className={cn(
                          "w-full flex items-center gap-2 px-8 py-2 text-[12px] transition-colors",
                          selectedModel === model.id ? "text-[#05B6FA]" : "text-white/60"
                        )}
                        style={{
                          background: selectedModel === model.id ? "rgba(5,182,250,0.1)" : "transparent",
                        }}
                        onClick={() => {
                          onSelect(model.id);
                          localStorage.setItem("fcai_lastModel", model.id);
                          onToggle();
                        }}
                        data-testid={`model-${model.id}`}
                      >
                        <span dir="ltr" className="truncate">{model.name}</span>
                        {model.vision && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: "rgba(5,182,250,0.15)", color: "#05B6FA" }}>
                            vision
                          </span>
                        )}
                        {model.active && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }}>
                            active
                          </span>
                        )}
                      </button>
                    ))}
                  {expandedProvider === provider.key && filteredModels.length === 0 && !provider.configured && (
                    <div className="px-8 py-2 text-[11px] text-white/30">
                      <a href="/settings" className="underline" style={{ color: "#05B6FA" }}>أضف مفتاح API</a>
                    </div>
                  )}
                  {expandedProvider === provider.key && filteredModels.length === 0 && provider.configured && (
                    <div className="px-8 py-2 text-[11px] text-white/30">لا توجد نتائج</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
