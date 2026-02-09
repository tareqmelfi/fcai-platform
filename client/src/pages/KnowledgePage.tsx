import { useState } from "react";
import { useKnowledge, useCreateKnowledgeDoc } from "@/hooks/use-knowledge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UploadCloud, FileText, Search, Tag } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertKnowledgeDocSchema } from "@shared/schema";
import { z } from "zod";

const formSchema = insertKnowledgeDocSchema;
type FormValues = z.infer<typeof formSchema>;

export default function KnowledgePage() {
  const { data: docs, isLoading } = useKnowledge();
  const createDoc = useCreateKnowledgeDoc();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "general",
      tags: [],
    },
  });

  const onSubmit = (data: FormValues) => {
    createDoc.mutate(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      },
    });
  };

  const filteredDocs = docs?.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.content.toLowerCase().includes(search.toLowerCase())
  );

  const categoryLabels: Record<string, string> = {
    general: 'عام',
    legal: 'قانوني',
    strategy: 'استراتيجية',
    policy: 'سياسات',
    hr: 'موارد بشرية',
    finance: 'مالي',
    marketing: 'تسويق',
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-knowledge-title">قاعدة المعرفة</h1>
          <p className="text-muted-foreground">الذكاء المؤسسي والوثائق المرجعية.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/25" data-testid="button-add-doc">
              <UploadCloud className="ml-2 h-4 w-4" /> إضافة وثيقة
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] glass-panel border-white/10">
            <DialogHeader>
              <DialogTitle>إضافة إلى قاعدة المعرفة</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title">عنوان الوثيقة</Label>
                <Input id="title" {...form.register("title")} placeholder="مثال: دليل السياسات العامة" className="bg-background/50 border-white/10" data-testid="input-doc-title" />
                {form.formState.errors.title && <p className="text-red-400 text-xs">{form.formState.errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">التصنيف</Label>
                <Input id="category" {...form.register("category")} placeholder="مثال: قانوني، تسويق" className="bg-background/50 border-white/10" data-testid="input-doc-category" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">المحتوى</Label>
                <Textarea id="content" {...form.register("content")} placeholder="الصق محتوى الوثيقة هنا..." className="bg-background/50 border-white/10 h-64 text-sm" data-testid="input-doc-content" />
                {form.formState.errors.content && <p className="text-red-400 text-xs">{form.formState.errors.content.message}</p>}
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full" disabled={createDoc.isPending} data-testid="button-submit-doc">
                  {createDoc.isPending ? "جاري الحفظ..." : "حفظ الوثيقة"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="البحث في الوثائق..."
          className="pr-10 h-12 bg-card/50 border-border rounded-xl text-lg"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search-docs"
        />
      </div>

      {isLoading && (
        <div className="text-center py-20 text-muted-foreground animate-pulse">جاري تحميل الوثائق...</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDocs?.map((doc) => (
          <div key={doc.id} className="glass-panel p-6 rounded-xl hover:border-primary/30 transition-all cursor-pointer group" data-testid={`card-doc-${doc.id}`}>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-secondary rounded-lg text-primary group-hover:bg-primary/15 transition-colors flex-shrink-0">
                <FileText className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg mb-1">{doc.title}</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{categoryLabels[doc.category || 'general'] || doc.category}</span>
                  {doc.tags?.map((tag, i) => (
                    <span key={i} className="text-xs bg-white/5 px-2 py-0.5 rounded text-muted-foreground flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">{doc.content}</p>
              </div>
            </div>
          </div>
        ))}
        {filteredDocs?.length === 0 && !isLoading && (
          <div className="col-span-full text-center py-20 text-muted-foreground">
            لا توجد وثائق مطابقة للبحث.
          </div>
        )}
      </div>
    </div>
  );
}
