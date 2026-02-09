import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Loader2, Search, Star, Download, ArrowLeft, Plus, Store, ChevronLeft, ChevronRight,
  PenTool, BarChart3, Calculator, Scale, TrendingUp, Building2, Users, Code, Settings, FileSearch, Sparkles } from "lucide-react";

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

type SortType = "downloads" | "rating" | "newest";

export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortType>("downloads");
  const [featuredIdx, setFeaturedIdx] = useState(0);

  const { data: categories } = useQuery<any[]>({ queryKey: ["/api/marketplace/categories"] });
  const { data: featured, isLoading: featuredLoading } = useQuery<any[]>({ queryKey: ["/api/marketplace/featured"] });
  const { data: agents, isLoading } = useQuery<any[]>({
    queryKey: ["/api/marketplace", search, selectedCategory, sort],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedCategory) params.set("category", selectedCategory);
      params.set("sort", sort);
      const res = await fetch(`/api/marketplace?${params}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: installed } = useQuery<any[]>({ queryKey: ["/api/marketplace/installed"] });
  const installedIds = new Set(installed?.map((i: any) => i.marketplaceAgentId) || []);

  const sortOptions: { value: SortType; label: string }[] = [
    { value: "downloads", label: "الأكثر تحميلاً" },
    { value: "rating", label: "الأعلى تقييماً" },
    { value: "newest", label: "الأحدث" },
  ];

  const featuredVisible = featured?.slice(featuredIdx, featuredIdx + 3) || [];

  return (
    <div className="space-y-6 pb-8" data-testid="marketplace-page">
      <div
        className="relative rounded-xl overflow-hidden p-8 md:p-12"
        style={{
          background: "linear-gradient(135deg, rgba(5,182,250,0.15) 0%, rgba(0,21,57,0.6) 50%, rgba(5,182,250,0.08) 100%)",
          border: "1px solid rgba(5,182,250,0.2)",
        }}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <Store className="h-8 w-8 text-[#05B6FA]" />
            <h1 className="text-3xl md:text-4xl font-bold" data-testid="text-marketplace-title">سوق الإيجنت</h1>
          </div>
          <p className="text-muted-foreground text-lg mb-6 max-w-2xl">
            اكتشف وثبّت وكلاء ذكاء اصطناعي متخصصين لتعزيز إنتاجيتك. من كتابة المحتوى إلى تحليل البيانات والمزيد.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                data-testid="input-marketplace-search"
                placeholder="ابحث عن وكيل..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10 bg-background/50 border-white/10"
              />
            </div>
            <Link href="/marketplace/publish">
              <Button data-testid="button-publish-agent">
                <Plus className="h-4 w-4 ml-2" />
                نشر وكيل
              </Button>
            </Link>
            <Link href="/marketplace/my-agents">
              <Button variant="outline" data-testid="button-my-agents">
                وكلائي
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {featured && featured.length > 0 && (
        <div data-testid="featured-section">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2" data-testid="text-featured-title">
              <Sparkles className="h-5 w-5 text-[#F59E0B]" />
              المميزون
            </h2>
            <div className="flex gap-1" data-testid="featured-carousel-controls">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setFeaturedIdx(Math.max(0, featuredIdx - 1))}
                disabled={featuredIdx === 0}
                data-testid="button-featured-prev"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setFeaturedIdx(Math.min((featured?.length || 1) - 1, featuredIdx + 1))}
                disabled={featuredIdx >= (featured?.length || 1) - 3}
                data-testid="button-featured-next"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="featured-carousel">
            {featuredVisible.map((agent: any) => {
              const Icon = getIcon(agent.icon);
              const catColor = categoryColors[agent.category] || "#6B7280";
              return (
                <Link key={agent.id} href={`/marketplace/${agent.id}`}>
                  <Card
                    className="p-5 hover-elevate cursor-pointer h-full"
                    style={{ borderColor: `${catColor}30` }}
                    data-testid={`card-featured-agent-${agent.id}`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${catColor}20`, color: catColor }}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base truncate" data-testid={`text-featured-agent-name-${agent.id}`}>{agent.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2" data-testid={`text-featured-agent-description-${agent.id}`}>{agent.description}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <div className="flex items-center gap-1 text-xs text-[#F59E0B]" data-testid={`rating-featured-${agent.id}`}>
                            <Star className="h-3 w-3 fill-current" />
                            <span data-testid={`text-featured-rating-${agent.id}`}>{agent.ratingAvg?.toFixed(1) || "0.0"}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground" data-testid={`downloads-featured-${agent.id}`}>
                            <Download className="h-3 w-3" />
                            <span data-testid={`text-featured-downloads-${agent.id}`}>{agent.downloadsCount || 0}</span>
                          </div>
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-2"
                            style={{ background: `${catColor}15`, color: catColor, border: `1px solid ${catColor}30` }}
                            data-testid={`badge-featured-category-${agent.id}`}
                          >
                            {agent.category}
                          </Badge>
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

      <div className="flex flex-wrap gap-2" data-testid="category-filters">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory(null)}
          data-testid="button-category-all"
        >
          الكل
        </Button>
        {categories?.map((cat: any) => {
          const Icon = getIcon(cat.icon);
          const isActive = selectedCategory === cat.name;
          return (
            <Button
              key={cat.id}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(isActive ? null : cat.name)}
              data-testid={`button-category-${cat.id}`}
            >
              <Icon className="h-3.5 w-3.5 ml-1" />
              {cat.name}
            </Button>
          );
        })}
      </div>

      <div className="flex items-center justify-between" data-testid="sort-controls-section">
        <p className="text-sm text-muted-foreground" data-testid="text-agent-count">
          {agents?.length || 0} وكيل
        </p>
        <div className="flex gap-1" data-testid="sort-buttons-group">
          {sortOptions.map(opt => (
            <Button
              key={opt.value}
              variant={sort === opt.value ? "default" : "ghost"}
              size="sm"
              onClick={() => setSort(opt.value)}
              data-testid={`button-sort-${opt.value}`}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20" data-testid="loading-spinner">
          <Loader2 className="h-8 w-8 animate-spin text-[#05B6FA]" />
        </div>
      ) : agents && agents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="agents-grid">
          {agents.map((agent: any, idx: number) => {
            const Icon = getIcon(agent.icon);
            const catColor = categoryColors[agent.category] || "#6B7280";
            const isInstalled = installedIds.has(agent.id);
            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link href={`/marketplace/${agent.id}`} data-testid={`link-agent-detail-${agent.id}`}>
                  <Card
                    className="p-5 hover-elevate cursor-pointer h-full"
                    data-testid={`card-agent-${agent.id}`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${catColor}20`, color: catColor }}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold text-sm truncate" data-testid={`text-agent-name-${agent.id}`}>{agent.name}</h3>
                          {isInstalled && (
                            <Badge variant="secondary" className="text-[10px] px-2 flex-shrink-0" style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }} data-testid={`badge-installed-${agent.id}`}>
                              مثبّت
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2" data-testid={`text-agent-description-${agent.id}`}>{agent.description}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <div className="flex items-center gap-1 text-xs text-[#F59E0B]" data-testid={`rating-agent-${agent.id}`}>
                            <Star className="h-3 w-3 fill-current" />
                            <span data-testid={`text-agent-rating-${agent.id}`}>{agent.ratingAvg?.toFixed(1) || "0.0"}</span>
                            <span className="text-muted-foreground" data-testid={`text-agent-ratings-count-${agent.id}`}>({agent.ratingsCount || 0})</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground" data-testid={`downloads-agent-${agent.id}`}>
                            <Download className="h-3 w-3" />
                            <span data-testid={`text-agent-downloads-${agent.id}`}>{agent.downloadsCount || 0}</span>
                          </div>
                          {agent.priceType === "free" ? (
                            <Badge variant="secondary" className="text-[10px] px-2" style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }} data-testid={`badge-price-free-${agent.id}`}>
                              مجاني
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px] px-2" style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B" }} data-testid={`badge-price-paid-${agent.id}`}>
                              {agent.price} $
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20" data-testid="empty-state">
          <Store className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground" data-testid="text-empty-state-message">لا توجد نتائج</p>
        </div>
      )}
    </div>
  );
}
