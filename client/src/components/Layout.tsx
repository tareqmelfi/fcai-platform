import { ReactNode, useState, useRef } from "react";
import { Link, useLocation, useSearch } from "wouter";
import {
  LayoutDashboard,
  Bot,
  CheckSquare,
  Book,
  MessageSquare,
  FolderOpen,
  ChevronDown,
  ChevronLeft,
  Settings,
  LogOut,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Trash2,
  FileText,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  File as FileIcon,
  Upload,
  X,
  Loader2,
  Store,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useConversations, useDeleteConversation } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface LayoutProps {
  children: ReactNode;
}

interface Project {
  id: number;
  name: string;
  description: string | null;
  systemPrompt: string | null;
  createdAt: string;
  files?: ProjectFile[];
}

interface ProjectFile {
  id: number;
  projectId: number;
  name: string;
  path: string;
  type: string;
  size: number;
  uploadedAt: string;
}

const navItems = [
  { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/agents", label: "الوكلاء", icon: Bot },
  { href: "/tasks", label: "المهام", icon: CheckSquare },
  { href: "/knowledge", label: "قاعدة المعرفة", icon: Book },
  { href: "/marketplace", label: "سوق الإيجنت", icon: Store },
];

function groupConversationsByDate(conversations: any[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: { label: string; items: any[] }[] = [
    { label: "اليوم", items: [] },
    { label: "أمس", items: [] },
    { label: "أقدم", items: [] },
  ];

  conversations?.forEach((conv: any) => {
    const d = new Date(conv.createdAt);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() >= today.getTime()) groups[0].items.push(conv);
    else if (d.getTime() >= yesterday.getTime()) groups[1].items.push(conv);
    else groups[2].items.push(conv);
  });

  return groups.filter((g) => g.items.length > 0);
}

function getFileIcon(type: string) {
  switch (type) {
    case "image": return ImageIcon;
    case "pdf": case "document": return FileText;
    case "spreadsheet": return FileSpreadsheet;
    case "code": return FileCode;
    default: return FileIcon;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function CreateProjectDialog({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, systemPrompt }),
        credentials: "include",
      });
      setName("");
      setDescription("");
      setSystemPrompt("");
      onCreated();
      onClose();
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div
        className="w-[420px] rounded-xl p-6"
        style={{ background: "#0a1628", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[16px] font-bold text-white">مشروع جديد</h3>
          <button onClick={onClose} className="text-white/30">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[12px] text-white/50 mb-1.5">اسم المشروع *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: مشروع التسويق"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-[14px] text-white/90 placeholder:text-white/25 outline-none focus:border-[#05B6FA]"
              data-testid="input-project-name"
            />
          </div>
          <div>
            <label className="block text-[12px] text-white/50 mb-1.5">الوصف</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف اختياري للمشروع"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-[14px] text-white/90 placeholder:text-white/25 outline-none focus:border-[#05B6FA]"
              data-testid="input-project-description"
            />
          </div>
          <div>
            <label className="block text-[12px] text-white/50 mb-1.5">تعليمات النظام</label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="تعليمات اختيارية للذكاء الاصطناعي في هذا المشروع"
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-[14px] text-white/90 placeholder:text-white/25 outline-none focus:border-[#05B6FA] resize-none"
              data-testid="input-project-system-prompt"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-5 justify-end">
          <Button variant="ghost" onClick={onClose} className="text-white/50" data-testid="button-cancel-project">
            إلغاء
          </Button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || loading}
            className="px-4 py-2 rounded-lg text-[14px] font-medium transition-colors"
            style={{
              background: name.trim() ? "#05B6FA" : "rgba(255,255,255,0.1)",
              color: name.trim() ? "#001539" : "#9CA3AF",
            }}
            data-testid="button-create-project"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "إنشاء"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProjectTreeItem({
  project,
  isExpanded,
  onToggle,
  onDelete,
}: {
  project: Project;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const queryClient = useQueryClient();
  const [hoveredFile, setHoveredFile] = useState<number | null>(null);
  const [hoveredProject, setHoveredProject] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filesQuery = useQuery<ProjectFile[]>({
    queryKey: [`/api/projects/${project.id}/files`],
    enabled: isExpanded,
  });

  const handleUploadFiles = async (fileList: FileList) => {
    setUploading(true);
    const formData = new FormData();
    Array.from(fileList).forEach((f) => formData.append("files", f));
    try {
      await fetch(`/api/projects/${project.id}/files`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${project.id}/files`] });
    } catch {
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    await fetch(`/api/project-files/${fileId}`, { method: "DELETE", credentials: "include" });
    queryClient.invalidateQueries({ queryKey: [`/api/projects/${project.id}/files`] });
  };

  const files = filesQuery.data || [];

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) handleUploadFiles(e.target.files);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}
      />
      <div
        className="relative flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer text-[13px] transition-colors"
        style={{ color: "#D1D5DB" }}
        onClick={onToggle}
        onMouseEnter={() => setHoveredProject(true)}
        onMouseLeave={() => setHoveredProject(false)}
        data-testid={`project-item-${project.id}`}
      >
        <ChevronLeft
          className={cn(
            "h-3 w-3 flex-shrink-0 transition-transform",
            isExpanded && "-rotate-90"
          )}
          style={{ color: "#9CA3AF" }}
        />
        <FolderOpen className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#05B6FA" }} />
        <span className="truncate flex-1">{project.name}</span>
        <div
          className="flex gap-0.5"
          style={{ visibility: hoveredProject ? "visible" : "hidden" }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="p-0.5 rounded text-white/30"
            data-testid={`upload-project-${project.id}`}
          >
            <Upload className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-0.5 rounded text-white/30"
            data-testid={`delete-project-${project.id}`}
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mr-6 space-y-0.5">
          {uploading && (
            <div className="flex items-center gap-2 px-4 py-1.5 text-[11px] text-white/40">
              <Loader2 className="h-3 w-3 animate-spin" />
              جاري الرفع...
            </div>
          )}
          {files.map((file) => {
            const Icon = getFileIcon(file.type);
            return (
              <div
                key={file.id}
                className="relative flex items-center gap-2 px-4 py-1.5 rounded-md text-[12px] transition-colors"
                style={{ color: "#9CA3AF" }}
                onMouseEnter={() => setHoveredFile(file.id)}
                onMouseLeave={() => setHoveredFile(null)}
              >
                <Icon className="h-3 w-3 flex-shrink-0" style={{ color: "#05B6FA" }} />
                <span className="truncate flex-1" dir="ltr">{file.name}</span>
                <span className="text-[10px] text-white/20" dir="ltr">{formatFileSize(file.size)}</span>
                <button
                  className="p-0.5 rounded text-white/30"
                  style={{ visibility: hoveredFile === file.id ? "visible" : "hidden" }}
                  onClick={() => handleDeleteFile(file.id)}
                  data-testid={`delete-file-${file.id}`}
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
              </div>
            );
          })}
          {files.length === 0 && !uploading && (
            <div className="px-4 py-2 text-[11px] text-white/20">
              لا توجد ملفات
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function Layout({ children }: LayoutProps) {
  const [location, setLocation] = useLocation();
  const searchString = useSearch();
  const { user, logout } = useAuth();
  const { data: conversations } = useConversations();
  const deleteConversation = useDeleteConversation();
  const queryClient = useQueryClient();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ chat: true });
  const [hoveredChat, setHoveredChat] = useState<number | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Record<number, boolean>>({});
  const [showCreateProject, setShowCreateProject] = useState(false);

  const { data: projectsList } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDeleteProject = async (id: number) => {
    await fetch(`/api/projects/${id}`, { method: "DELETE", credentials: "include" });
    queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
  };

  const isChat = location.startsWith("/chat");
  const grouped = groupConversationsByDate(conversations || []);

  return (
    <div className="h-screen flex overflow-hidden">
      <aside
        className={cn(
          "h-screen flex flex-col border-l transition-all duration-300 flex-shrink-0 z-50",
          collapsed ? "w-[48px]" : "w-[280px]"
        )}
        style={{ background: "#001539", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <div
          className="flex items-center justify-between px-4 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          {!collapsed && (
            <div className="flex flex-col">
              <span style={{ fontFamily: "Rubik, 'Noto Sans Arabic', sans-serif", fontWeight: 800, fontSize: "18px", letterSpacing: "1px" }}>
                <span className="text-white">FALCON</span>{" "}
                <span style={{ color: "#05B6FA" }}>CORE</span>
              </span>
              <span
                style={{
                  fontFamily: "Rubik, 'Noto Sans Arabic', sans-serif",
                  fontSize: "9px",
                  color: "#9CA3AF",
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                }}
              >
                AI PLATFORM
              </span>
            </div>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setCollapsed(!collapsed)}
            className="text-white/50"
            data-testid="button-toggle-sidebar"
          >
            {collapsed ? <PanelRightOpen className="h-4 w-4" /> : <PanelRightClose className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto py-2" style={{ scrollbarWidth: "thin" }}>
          <nav className="px-2 space-y-0.5">
            {navItems.map((item) => {
              const isActive = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href + "/"));
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    data-testid={`nav-${item.href.slice(1)}`}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm",
                      collapsed && "justify-center px-0"
                    )}
                    style={{
                      background: isActive ? "rgba(5,182,250,0.1)" : "transparent",
                      borderLeft: isActive ? "3px solid #05B6FA" : "3px solid transparent",
                      color: isActive ? "#05B6FA" : "#9CA3AF",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <Icon className="h-[18px] w-[18px] flex-shrink-0" />
                    {!collapsed && <span className="font-medium">{item.label}</span>}
                  </div>
                </Link>
              );
            })}

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", margin: "8px 0" }} />

            {/* Chat Section */}
            <div>
              <div
                data-testid="nav-chat"
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm",
                  collapsed && "justify-center px-0"
                )}
                style={{
                  background: isChat ? "rgba(5,182,250,0.1)" : "transparent",
                  borderLeft: isChat ? "3px solid #05B6FA" : "3px solid transparent",
                  color: isChat ? "#05B6FA" : "#9CA3AF",
                }}
                onClick={() => {
                  setLocation("/chat");
                  if (!collapsed) toggleSection("chat");
                }}
                onMouseEnter={(e) => {
                  if (!isChat) e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                }}
                onMouseLeave={(e) => {
                  if (!isChat) e.currentTarget.style.background = "transparent";
                }}
              >
                <MessageSquare className="h-[18px] w-[18px] flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="font-medium flex-1">المحادثة</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-white/40"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation("/chat?new=1");
                      }}
                      data-testid="button-new-chat-sidebar"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 transition-transform",
                        expandedSections.chat && "rotate-180"
                      )}
                    />
                  </>
                )}
              </div>

              {!collapsed && expandedSections.chat && (
                <div className="mt-1 mr-2 space-y-0.5 max-h-[35vh] overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
                  {grouped.map((group) => (
                    <div key={group.label}>
                      <div
                        className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: "#05B6FA" }}
                      >
                        {group.label}
                      </div>
                      {group.items.map((conv: any) => (
                        <div
                          key={conv.id}
                          className="relative group"
                          onMouseEnter={() => setHoveredChat(conv.id)}
                          onMouseLeave={() => setHoveredChat(null)}
                        >
                          <Link href={`/chat?id=${conv.id}`}>
                            <div
                              className="flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer text-[13px] truncate transition-colors"
                              style={{
                                color: "#D1D5DB",
                                background: (location === "/chat" && searchString === `id=${conv.id}`) ? "rgba(5,182,250,0.1)" : "transparent",
                              }}
                              data-testid={`chat-item-${conv.id}`}
                            >
                              <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 opacity-50" />
                              <span className="truncate">{conv.title}</span>
                            </div>
                          </Link>
                          <button
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded text-white/30 transition-colors"
                            style={{ visibility: hoveredChat === conv.id ? "visible" : "hidden" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteConversation.mutate(conv.id);
                            }}
                            data-testid={`delete-chat-${conv.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
                  {(!conversations || conversations.length === 0) && (
                    <div className="px-4 py-3 text-[12px] text-white/30">
                      لا توجد محادثات
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Projects Section */}
            <div>
              <div
                data-testid="nav-projects"
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm",
                  collapsed && "justify-center px-0"
                )}
                style={{
                  background: "transparent",
                  borderLeft: "3px solid transparent",
                  color: "#9CA3AF",
                }}
                onClick={() => {
                  if (!collapsed) toggleSection("projects");
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <FolderOpen className="h-[18px] w-[18px] flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="font-medium flex-1">المشاريع</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-white/40"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCreateProject(true);
                      }}
                      data-testid="button-new-project"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 transition-transform",
                        expandedSections.projects && "rotate-180"
                      )}
                    />
                  </>
                )}
              </div>

              {!collapsed && expandedSections.projects && (
                <div className="mt-1 mr-2 space-y-0.5 max-h-[35vh] overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
                  {(projectsList || []).map((project) => (
                    <ProjectTreeItem
                      key={project.id}
                      project={project}
                      isExpanded={!!expandedProjects[project.id]}
                      onToggle={() =>
                        setExpandedProjects((prev) => ({
                          ...prev,
                          [project.id]: !prev[project.id],
                        }))
                      }
                      onDelete={() => handleDeleteProject(project.id)}
                    />
                  ))}
                  {(!projectsList || projectsList.length === 0) && (
                    <div className="px-4 py-3 text-[12px] text-white/30">
                      لا توجد مشاريع
                    </div>
                  )}
                </div>
              )}
            </div>
          </nav>
        </div>

        <div
          className="px-3 py-3 flex items-center gap-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback
              className="text-[12px] font-bold"
              style={{ background: "rgba(5,182,250,0.2)", color: "#05B6FA" }}
            >
              {user?.firstName?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="flex-1 overflow-hidden">
                <p className="text-[13px] font-medium text-white truncate">
                  {user?.firstName || "مستخدم"} {user?.lastName || ""}
                </p>
                <p className="text-[11px] text-white/40 truncate" dir="ltr">
                  {user?.email || ""}
                </p>
              </div>
              <div className="flex gap-0.5">
                <Link href="/settings">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white/40"
                    data-testid="button-settings"
                  >
                    <Settings className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white/40"
                  onClick={() => logout()}
                  data-testid="button-logout"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </div>
            </>
          )}
        </div>
      </aside>

      <main className={cn("flex-1 overflow-hidden", isChat ? "" : "overflow-y-auto")}>
        {isChat ? (
          children
        ) : (
          <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12 animate-in fade-in duration-500">
            {children}
          </div>
        )}
      </main>

      <CreateProjectDialog
        isOpen={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        onCreated={() => queryClient.invalidateQueries({ queryKey: ["/api/projects"] })}
      />
    </div>
  );
}
