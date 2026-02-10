import { useState, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import type { McpServerType } from "../types";

interface McpServersDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  servers: McpServerType[];
  enabledTools: Set<string>;
  onToggleTool: (toolKey: string) => void;
}

export function McpServersDropdown({
  isOpen,
  onClose,
  servers,
  enabledTools,
  onToggleTool,
}: McpServersDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [connectingId, setConnectingId] = useState<number | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConnect = async (serverId: number) => {
    setConnectingId(serverId);
    try {
      await fetch(`/api/mcp-servers/${serverId}/connect`, {
        method: "POST",
        credentials: "include",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/mcp-servers"] });
    } catch (e) {}
    setConnectingId(null);
  };

  const handleDisconnect = async (serverId: number) => {
    setConnectingId(serverId);
    try {
      await fetch(`/api/mcp-servers/${serverId}/disconnect`, {
        method: "POST",
        credentials: "include",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/mcp-servers"] });
    } catch (e) {}
    setConnectingId(null);
  };

  return (
    <div
      ref={ref}
      className="absolute bottom-full mb-2 right-0 w-[300px] max-h-[400px] overflow-y-auto rounded-xl z-50 shadow-xl"
      style={{ background: "#0a1628", border: "1px solid rgba(255,255,255,0.1)" }}
      data-testid="mcp-servers-dropdown"
    >
      <div className="px-3 py-2 text-[11px] text-white/40 font-medium" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        خوادم MCP
      </div>
      {servers.length === 0 ? (
        <div className="px-3 py-4 text-center text-[12px] text-white/30">
          لا توجد خوادم MCP. أضف خوادم من الإعدادات.
        </div>
      ) : (
        servers.map(server => {
          const isConnected = server.isActive && server.status === "connected";
          const tools = (server.tools || []) as Array<{ name: string; description?: string }>;
          const isLoading = connectingId === server.id;
          return (
            <div
              key={server.id}
              className="px-3 py-2"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: isConnected ? "#22c55e" : "#6b7280" }}
                  />
                  <span className="text-[12px] text-white/80 truncate font-medium">{server.name}</span>
                  <span className="text-[10px] text-white/30">{server.type}</span>
                </div>
                <button
                  onClick={() => isConnected ? handleDisconnect(server.id) : handleConnect(server.id)}
                  disabled={isLoading}
                  className="text-[10px] px-2 py-0.5 rounded-md flex-shrink-0 transition-colors"
                  style={{
                    background: isConnected ? "rgba(239,68,68,0.1)" : "rgba(5,182,250,0.1)",
                    color: isConnected ? "#ef4444" : "#05B6FA",
                    border: `1px solid ${isConnected ? "rgba(239,68,68,0.2)" : "rgba(5,182,250,0.2)"}`,
                  }}
                  data-testid={`mcp-server-toggle-${server.id}`}
                >
                  {isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : isConnected ? "قطع" : "اتصال"}
                </button>
              </div>
              {isConnected && tools.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5 mr-4">
                  {tools.map(tool => {
                    const toolKey = `${server.id}:${tool.name}`;
                    const isEnabled = enabledTools.has(toolKey);
                    return (
                      <button
                        key={toolKey}
                        onClick={() => onToggleTool(toolKey)}
                        className="px-1.5 py-0.5 rounded-full text-[10px] transition-colors"
                        style={{
                          background: isEnabled ? "rgba(5,182,250,0.15)" : "rgba(255,255,255,0.04)",
                          color: isEnabled ? "#05B6FA" : "rgba(255,255,255,0.35)",
                          border: `1px solid ${isEnabled ? "rgba(5,182,250,0.3)" : "rgba(255,255,255,0.06)"}`,
                        }}
                        title={tool.description || tool.name}
                        data-testid={`mcp-dropdown-tool-${tool.name}`}
                      >
                        {tool.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
