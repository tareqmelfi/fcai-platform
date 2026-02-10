import type { McpServerType } from "../types";

interface McpToolsBarProps {
  servers: McpServerType[];
  enabledTools: Set<string>;
  onToggleTool: (toolKey: string) => void;
}

export function McpToolsBar({
  servers,
  enabledTools,
  onToggleTool,
}: McpToolsBarProps) {
  const connectedServers = servers.filter(s => s.isActive && s.status === "connected");
  if (connectedServers.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap px-3 py-1.5" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
      <span className="text-[10px] text-white/30 ml-1">MCP:</span>
      {connectedServers.map(server => {
        const tools = (server.tools || []) as Array<{ name: string; description?: string }>;
        return tools.map(tool => {
          const toolKey = `${server.id}:${tool.name}`;
          const isEnabled = enabledTools.has(toolKey);
          return (
            <button
              key={toolKey}
              onClick={() => onToggleTool(toolKey)}
              className="px-2 py-0.5 rounded-full text-[10px] transition-colors"
              style={{
                background: isEnabled ? "rgba(5,182,250,0.15)" : "rgba(255,255,255,0.04)",
                color: isEnabled ? "#05B6FA" : "rgba(255,255,255,0.35)",
                border: `1px solid ${isEnabled ? "rgba(5,182,250,0.3)" : "rgba(255,255,255,0.06)"}`,
              }}
              data-testid={`mcp-tool-${tool.name}`}
            >
              {tool.name}
            </button>
          );
        });
      })}
    </div>
  );
}
