import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2, Star, Download, ArrowRight, Store, CheckCircle,
  PenTool, BarChart3, Calculator, Scale, TrendingUp, Building2, Users, Code, Settings, FileSearch, Sparkles, Trash2 } from "lucide-react";

const iconMap: Record<string, any> = {
  PenTool, BarChart3, Calculator, Scale, TrendingUp, Building2, Users, Code, Settings, FileSearch, Sparkles, Store,
};

function getIcon(name: string | null | undefined) {
  if (!name) return Store;
  return iconMap[name] || Store;
}

const categoryColors: Record<string, string> = {
  "المحتوى والكتابة": "#F59E0B",
  "تحليل البيانات": "#6366F1",
  "المالية والمحاسبة": "#10B981",
  "القانون والعقود": "#8B5CF6",
  "التسويق والمبيعات": "#EC4899",
  "التأسيس والأعمال": "#05B6FA",
  "الإدارة والفريق": "#F97316",
  "التقنية والبرمجة": "#14B8A6",
  "مخصص": "#6B7280",
};

export default function AgentDetailPage() {
  const [, params] = useRoute("/marketplace/:id");
  const agentId = params?.id ? Number(params.id) : 0;
  const { toast } = useToast();
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const { data: agent, isLoading } = useQuery<any>({
    queryKey: ["/api/marketplace", agentId],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace/${agentId}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: agentId > 0,
  });

  const { data: ratings } = useQuery<any[]>({
    queryKey: ["/api/marketplace", agentId, "ratings"],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace/${agentId}/ratings`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: agentId > 0,
  });

  const { data: installed } = useQuery<any[]>({ queryKey: ["/api/marketplace/installed"] });
  const isInstalled = installed?.some((i: any) => i.marketplaceAgentId === agentId);

  const { data: related } = useQuery<any[]>({
    queryKey: ["/api/marketplace", "related", agent?.category],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace?category=${encodeURIComponent(agent?.category || "")}`);
      if (!res.ok) throw new Error("Failed");
      const all = await res.json();
      return all.filter((a: any) => a.id !== agentId).slice(0, 3);
    },
    enabled: !!agent?.category,
  });

  const installMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/marketplace/${agentId}/install`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/installed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace", agentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      toast({ title: "تم التثبيت", description: "تمت إضافة الوكيل إلى مهاراتك" });
    },
    onError: () => toast({ title: "خطأ", description: "فشل التثبيت", variant: "destructive" }),
  });

  const uninstallMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/marketplace/${agentId}/install`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/installed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace", agentId] });
      toast({ title: "تم الإلغاء", description: "تم إلغاء تثبيت الوكيل" });
    },
    onError: () => toast({ title: "خطأ", description: "فشل الإلغاء", variant: "destructive" }),
  });

  const rateMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/marketplace/${agentId}/rate`, { rating: userRating, review: reviewText }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace", agentId, "ratings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace", agentId] });
      toast({ title: "شكراً", description: "تم إرسال تقييمك" });
      setReviewText("");
    },
    onError: () => toast({ title: "خطأ", description: "فشل إرسال التقييم", variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#05B6FA]" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="text-center py-20">
        <Store className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground">الوكيل غير موجود</p>
        <Link href="/marketplace">
          <Button variant="outline" className="mt-4">
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة للسوق
          </Button>
        </Link>
      </div>
    );
  }

  const Icon = getIcon(agent.icon);
  const catColor = categoryColors[agent.category] || "#6B7280";

  return (
    <div className="space-y-6 pb-8 max-w-4xl mx-auto" data-testid="agent-detail-page">
      <Link href="/marketplace">
        <Button variant="ghost" size="sm" data-testid="button-back-marketplace">
          <ArrowRight className="h-4 w-4 ml-2" />
          العودة للسوق
        </Button>
      </Link>

      <Card className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-6">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${catColor}20`, color: catColor }}
            data-testid="icon-agent"
          >
            <Icon className="h-10 w-10" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-agent-name">{agent.name}</h1>
                {agent.nameEn && <p className="text-sm text-muted-foreground mt-1">{agent.nameEn}</p>}
              </div>
              <div className="flex gap-2">
                {isInstalled ? (
                  <Button
                    variant="outline"
                    onClick={() => uninstallMutation.mutate()}
                    disabled={uninstallMutation.isPending}
                    data-testid="button-uninstall"
                  >
                    {uninstallMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Trash2 className="h-4 w-4 ml-2" />}
                    إلغاء التثبيت
                  </Button>
                ) : (
                  <Button
                    onClick={() => installMutation.mutate()}
                    disabled={installMutation.isPending}
                    data-testid="button-install"
                  >
                    {installMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Download className="h-4 w-4 ml-2" />}
                    تثبيت
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-4">
              <Badge
                variant="secondary"
                style={{ background: `${catColor}15`, color: catColor, border: `1px solid ${catColor}30` }}
                data-testid="badge-category"
              >
                {agent.category}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-[#F59E0B]" data-testid="text-rating">
                <Star className="h-4 w-4 fill-current" />
                <span className="font-medium">{agent.ratingAvg?.toFixed(1) || "0.0"}</span>
                <span className="text-muted-foreground">({agent.ratingsCount || 0} تقييم)</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground" data-testid="text-downloads">
                <Download className="h-4 w-4" />
                <span>{agent.downloadsCount || 0} تحميل</span>
              </div>
              {agent.priceType === "free" ? (
                <Badge variant="secondary" style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }} data-testid="badge-price">مجاني</Badge>
              ) : (
                <Badge variant="secondary" style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B" }} data-testid="badge-price">{agent.price} $</Badge>
              )}
              {agent.version && (
                <span className="text-xs text-muted-foreground">v{agent.version}</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 className="font-bold mb-3">الوصف</h2>
          <p className="text-muted-foreground leading-relaxed" data-testid="text-agent-description">
            {agent.description}
          </p>
          {agent.descriptionEn && (
            <p className="text-muted-foreground/60 text-sm mt-2 leading-relaxed">{agent.descriptionEn}</p>
          )}
        </div>

        {agent.tags && agent.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {agent.tags.map((tag: string, i: number) => (
              <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}

        {isInstalled && (
          <div className="mt-4 flex items-center gap-2 text-sm" style={{ color: "#10B981" }}>
            <CheckCircle className="h-4 w-4" />
            <span>مثبّت - يمكنك استخدامه من قائمة المهارات في المحادثة</span>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="font-bold mb-4">التقييمات ({ratings?.length || 0})</h2>

        <div className="mb-6 pb-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-sm text-muted-foreground mb-2">قيّم هذا الوكيل:</p>
          <div className="flex items-center gap-1 mb-3" data-testid="rating-stars">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setUserRating(n)}
                className="p-0.5"
                data-testid={`button-rate-${n}`}
              >
                <Star
                  className="h-6 w-6 transition-colors"
                  style={{
                    fill: n <= (hoverRating || userRating) ? "#F59E0B" : "transparent",
                    color: n <= (hoverRating || userRating) ? "#F59E0B" : "rgba(255,255,255,0.2)",
                  }}
                />
              </button>
            ))}
          </div>
          <Textarea
            placeholder="اكتب مراجعتك (اختياري)..."
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            className="mb-3 bg-background/50"
            data-testid="input-review"
          />
          <Button
            size="sm"
            disabled={userRating === 0 || rateMutation.isPending}
            onClick={() => rateMutation.mutate()}
            data-testid="button-submit-rating"
          >
            {rateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
            إرسال التقييم
          </Button>
        </div>

        {ratings && ratings.length > 0 ? (
          <div className="space-y-4">
            {ratings.map((r: any) => (
              <div key={r.id} className="pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star
                        key={n}
                        className="h-3.5 w-3.5"
                        style={{
                          fill: n <= r.rating ? "#F59E0B" : "transparent",
                          color: n <= r.rating ? "#F59E0B" : "rgba(255,255,255,0.15)",
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString("ar-SA") : ""}
                  </span>
                </div>
                {r.review && <p className="text-sm text-muted-foreground">{r.review}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">لا توجد تقييمات بعد</p>
        )}
      </Card>

      {related && related.length > 0 && (
        <div data-testid="section-related-agents">
          <h2 className="font-bold mb-4">وكلاء مشابهون</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {related.map((r: any) => {
              const RIcon = getIcon(r.icon);
              const rColor = categoryColors[r.category] || "#6B7280";
              return (
                <Link key={r.id} href={`/marketplace/${r.id}`}>
                  <Card className="p-4 hover-elevate cursor-pointer" data-testid={`card-related-${r.id}`}>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${rColor}20`, color: rColor }}
                      >
                        <RIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm truncate">{r.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Star className="h-3 w-3 fill-[#F59E0B] text-[#F59E0B]" />
                          <span className="text-xs text-muted-foreground">{r.ratingAvg?.toFixed(1) || "0.0"}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
