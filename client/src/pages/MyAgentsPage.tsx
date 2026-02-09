import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2, ArrowRight, Plus, Star, Download, Trash2, Edit, Store, Eye, EyeOff,
  PenTool, BarChart3, Calculator, Scale, TrendingUp, Building2, Users, Code, Settings, FileSearch, Sparkles } from "lucide-react";

const iconMap: Record<string, any> = {
  PenTool, BarChart3, Calculator, Scale, TrendingUp, Building2, Users, Code, Settings, FileSearch, Sparkles, Store,
};

function getIcon(name: string | null | undefined) {
  if (!name) return Store;
  return iconMap[name] || Store;
}

export default function MyAgentsPage() {
  const { toast } = useToast();
  const { data: agents, isLoading } = useQuery<any[]>({ queryKey: ["/api/marketplace/my-agents"] });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/marketplace/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/my-agents"] });
      toast({ title: "تم الحذف", description: "تم حذف الوكيل من السوق" });
    },
    onError: () => toast({ title: "خطأ", description: "فشل الحذف", variant: "destructive" }),
  });

  const togglePublishMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: number; isPublished: boolean }) =>
      apiRequest("PUT", `/api/marketplace/${id}`, { isPublished }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/my-agents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace"] });
    },
  });

  const totalDownloads = agents?.reduce((sum, a) => sum + (a.downloadsCount || 0), 0) || 0;
  const avgRating = agents?.length ? (agents.reduce((sum, a) => sum + (a.ratingAvg || 0), 0) / agents.length) : 0;

  return (
    <div className="space-y-6 pb-8 max-w-4xl mx-auto" data-testid="my-agents-page">
      <Link href="/marketplace">
        <Button variant="ghost" size="sm" data-testid="button-back-marketplace">
          <ArrowRight className="h-4 w-4 ml-2" />
          العودة للسوق
        </Button>
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-my-agents-title">وكلائي</h1>
          <p className="text-muted-foreground mt-1">إدارة الوكلاء التي نشرتها في السوق</p>
        </div>
        <Link href="/marketplace/publish">
          <Button data-testid="button-new-agent">
            <Plus className="h-4 w-4 ml-2" />
            نشر وكيل جديد
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4" data-testid="stat-total-agents">
          <p className="text-sm text-muted-foreground">إجمالي الوكلاء</p>
          <p className="text-2xl font-bold mt-1" data-testid="text-total-agents">{agents?.length || 0}</p>
        </Card>
        <Card className="p-4" data-testid="stat-total-downloads">
          <p className="text-sm text-muted-foreground">إجمالي التحميلات</p>
          <p className="text-2xl font-bold mt-1" data-testid="text-total-downloads">{totalDownloads}</p>
        </Card>
        <Card className="p-4" data-testid="stat-avg-rating">
          <p className="text-sm text-muted-foreground">متوسط التقييم</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-2xl font-bold" data-testid="text-avg-rating">{avgRating.toFixed(1)}</p>
            <Star className="h-5 w-5 fill-[#F59E0B] text-[#F59E0B]" />
          </div>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#05B6FA]" />
        </div>
      ) : agents && agents.length > 0 ? (
        <div className="space-y-3">
          {agents.map((agent: any) => {
            const Icon = getIcon(agent.icon);
            return (
              <Card key={agent.id} className="p-4" data-testid={`card-my-agent-${agent.id}`}>
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(5,182,250,0.15)", color: "#05B6FA" }}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold truncate" data-testid={`text-agent-name-${agent.id}`}>{agent.name}</h3>
                      {agent.isPublished ? (
                        <Badge variant="secondary" className="text-[10px]" style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }} data-testid={`badge-published-${agent.id}`}>منشور</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]" style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B" }} data-testid={`badge-draft-${agent.id}`}>مسودة</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1" data-testid={`text-downloads-${agent.id}`}>
                        <Download className="h-3 w-3" /> {agent.downloadsCount || 0}
                      </span>
                      <span className="flex items-center gap-1" data-testid={`text-rating-${agent.id}`}>
                        <Star className="h-3 w-3 fill-[#F59E0B] text-[#F59E0B]" /> {agent.ratingAvg?.toFixed(1) || "0.0"} ({agent.ratingsCount || 0})
                      </span>
                      <span data-testid={`text-category-${agent.id}`}>{agent.category}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => togglePublishMutation.mutate({ id: agent.id, isPublished: !agent.isPublished })}
                      title={agent.isPublished ? "إلغاء النشر" : "نشر"}
                      data-testid={`button-toggle-publish-${agent.id}`}
                    >
                      {agent.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Link href={`/marketplace/${agent.id}`}>
                      <Button size="icon" variant="ghost" data-testid={`button-view-${agent.id}`}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(agent.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-${agent.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <Store className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground mb-4">لم تنشر أي وكيل بعد</p>
          <Link href="/marketplace/publish">
            <Button data-testid="button-first-agent">
              <Plus className="h-4 w-4 ml-2" />
              انشر وكيلك الأول
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
