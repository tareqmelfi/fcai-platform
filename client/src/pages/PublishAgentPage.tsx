import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2, ArrowRight, Plus, X, Store,
  PenTool, BarChart3, Calculator, Scale, TrendingUp, Building2, Users, Code, Settings, FileSearch, Sparkles } from "lucide-react";

const iconOptions = [
  { name: "PenTool", icon: PenTool },
  { name: "BarChart3", icon: BarChart3 },
  { name: "Calculator", icon: Calculator },
  { name: "Scale", icon: Scale },
  { name: "TrendingUp", icon: TrendingUp },
  { name: "Building2", icon: Building2 },
  { name: "Users", icon: Users },
  { name: "Code", icon: Code },
  { name: "Settings", icon: Settings },
  { name: "FileSearch", icon: FileSearch },
  { name: "Sparkles", icon: Sparkles },
  { name: "Store", icon: Store },
];

export default function PublishAgentPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: categories } = useQuery<any[]>({ queryKey: ["/api/marketplace/categories"] });

  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [icon, setIcon] = useState("Store");
  const [category, setCategory] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [priceType, setPriceType] = useState("free");
  const [price, setPrice] = useState("0");

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput("");
    }
  };

  const publishMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/marketplace", {
      name,
      nameEn: nameEn || null,
      description,
      descriptionEn: descriptionEn || null,
      icon,
      category,
      systemPrompt,
      tags,
      priceType,
      price: priceType === "free" ? "0" : price,
      isPublished: true,
      tools: [],
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/my-agents"] });
      toast({ title: "تم النشر", description: "تم نشر وكيلك في السوق" });
      setLocation("/marketplace/my-agents");
    },
    onError: () => toast({ title: "خطأ", description: "فشل النشر", variant: "destructive" }),
  });

  const isValid = name.trim() && description.trim() && category && systemPrompt.trim();

  return (
    <div className="space-y-6 pb-8 max-w-3xl mx-auto" data-testid="publish-agent-page">
      <Link href="/marketplace">
        <Button variant="ghost" size="sm" data-testid="button-back-marketplace">
          <ArrowRight className="h-4 w-4 ml-2" />
          العودة للسوق
        </Button>
      </Link>

      <div>
        <h1 className="text-2xl font-bold" data-testid="text-publish-title">نشر وكيل جديد</h1>
        <p className="text-muted-foreground mt-1">أنشئ وكيل ذكاء اصطناعي وشاركه مع المجتمع</p>
      </div>

      <Card className="p-6 space-y-5" data-testid="form-publish-agent">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">اسم الوكيل (عربي) *</label>
            <Input
              data-testid="input-agent-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: محلل العقود"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">اسم الوكيل (إنجليزي)</label>
            <Input
              data-testid="input-agent-name-en"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="e.g. Contract Analyzer"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">الوصف (عربي) *</label>
          <Textarea
            data-testid="input-agent-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="وصف مختصر لما يفعله الوكيل..."
            className="min-h-[80px]"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">الوصف (إنجليزي)</label>
          <Textarea
            data-testid="input-agent-description-en"
            value={descriptionEn}
            onChange={(e) => setDescriptionEn(e.target.value)}
            placeholder="Optional English description..."
            className="min-h-[60px]"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">الأيقونة</label>
          <div className="flex flex-wrap gap-2">
            {iconOptions.map(opt => {
              const IconComp = opt.icon;
              const isActive = icon === opt.name;
              return (
                <button
                  key={opt.name}
                  onClick={() => setIcon(opt.name)}
                  className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                  style={{
                    background: isActive ? "rgba(5,182,250,0.2)" : "rgba(255,255,255,0.05)",
                    border: isActive ? "2px solid #05B6FA" : "2px solid transparent",
                    color: isActive ? "#05B6FA" : "rgba(255,255,255,0.5)",
                  }}
                  data-testid={`button-icon-${opt.name}`}
                >
                  <IconComp className="h-5 w-5" />
                </button>
              );
            })}
          </div>
        </div>

        <div data-testid="section-category">
          <label className="text-sm font-medium mb-1.5 block">التصنيف *</label>
          <div className="flex flex-wrap gap-2">
            {categories?.map((cat: any) => (
              <Button
                key={cat.id}
                variant={category === cat.name ? "default" : "outline"}
                size="sm"
                onClick={() => setCategory(cat.name)}
                data-testid={`button-cat-${cat.id}`}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">تعليمات النظام (System Prompt) *</label>
          <Textarea
            data-testid="input-system-prompt"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="اكتب التعليمات التي تحدد سلوك الوكيل وتخصصه..."
            className="min-h-[120px] font-mono text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">الوسوم</label>
          <div className="flex gap-2">
            <Input
              data-testid="input-tag"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              placeholder="أضف وسم..."
              className="flex-1"
            />
            <Button variant="outline" size="icon" onClick={addTag} data-testid="button-add-tag">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((t, i) => (
                <Badge key={i} variant="secondary" className="gap-1">
                  {t}
                  <button onClick={() => setTags(tags.filter((_, j) => j !== i))} data-testid={`button-remove-tag-${i}`}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">التسعير</label>
          <div className="flex gap-2">
            <Button
              variant={priceType === "free" ? "default" : "outline"}
              size="sm"
              onClick={() => setPriceType("free")}
              data-testid="button-price-free"
            >
              مجاني
            </Button>
            <Button
              variant={priceType === "premium" ? "default" : "outline"}
              size="sm"
              onClick={() => setPriceType("premium")}
              data-testid="button-price-premium"
            >
              مدفوع
            </Button>
          </div>
          {priceType === "premium" && (
            <Input
              data-testid="input-price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="السعر بالدولار"
              className="mt-2 max-w-[200px]"
            />
          )}
        </div>

        <div className="pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <Button
            className="w-full"
            disabled={!isValid || publishMutation.isPending}
            onClick={() => publishMutation.mutate()}
            data-testid="button-publish-submit"
          >
            {publishMutation.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
            نشر الوكيل
          </Button>
        </div>
      </Card>
    </div>
  );
}
