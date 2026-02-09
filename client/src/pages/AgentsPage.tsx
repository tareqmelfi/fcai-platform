import { useState } from "react";
import { useAgents, useCreateAgent } from "@/hooks/use-agents";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Power, Activity, Bot, MessageSquare } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAgentSchema } from "@shared/schema";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

const formSchema = insertAgentSchema.extend({
  role: z.string().min(1, "الدور مطلوب"),
});

type FormValues = z.infer<typeof formSchema>;

const roleLabels: Record<string, string> = {
  formation_advisor: "مستشار تأسيس",
  contract_analyzer: "محلل عقود",
  content_writer: "كاتب محتوى",
  finance_assistant: "مساعد مالي",
  team_coach: "مدرب فريق",
  data_analyst: "محلل بيانات",
  custom: "مخصص",
};

export default function AgentsPage() {
  const { data: agents, isLoading } = useAgents();
  const createAgent = useCreateAgent();
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      role: "",
      description: "",
      isActive: true,
    },
  });

  const onSubmit = (data: FormValues) => {
    createAgent.mutate(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      },
    });
  };

  if (isLoading) return <div className="text-center py-20 text-muted-foreground animate-pulse">جاري تحميل الوكلاء...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-agents-title">الوكلاء الأذكياء</h1>
          <p className="text-muted-foreground">إدارة فريق العمل الرقمي المتخصص.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/25" data-testid="button-deploy-agent">
              <Plus className="ml-2 h-4 w-4" /> نشر وكيل جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] glass-panel border-white/10">
            <DialogHeader>
              <DialogTitle>نشر وكيل جديد</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">اسم الوكيل</Label>
                <Input id="name" {...form.register("name")} placeholder="مثال: مستشار قانوني" className="bg-background/50 border-white/10" data-testid="input-agent-name" />
                {form.formState.errors.name && <p className="text-red-400 text-xs">{form.formState.errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">التخصص</Label>
                <Select onValueChange={(val) => form.setValue("role", val)} defaultValue={form.getValues("role")}>
                  <SelectTrigger className="bg-background/50 border-white/10" data-testid="select-agent-role">
                    <SelectValue placeholder="اختر التخصص" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formation_advisor">مستشار تأسيس</SelectItem>
                    <SelectItem value="contract_analyzer">محلل عقود</SelectItem>
                    <SelectItem value="content_writer">كاتب محتوى</SelectItem>
                    <SelectItem value="finance_assistant">مساعد مالي</SelectItem>
                    <SelectItem value="team_coach">مدرب فريق</SelectItem>
                    <SelectItem value="data_analyst">محلل بيانات</SelectItem>
                    <SelectItem value="custom">مخصص</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.role && <p className="text-red-400 text-xs">{form.formState.errors.role.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">الوصف</Label>
                <Textarea id="description" {...form.register("description")} placeholder="صف مسؤوليات ومهام الوكيل..." className="bg-background/50 border-white/10" data-testid="input-agent-description" />
                {form.formState.errors.description && <p className="text-red-400 text-xs">{form.formState.errors.description.message}</p>}
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full" disabled={createAgent.isPending} data-testid="button-submit-agent">
                  {createAgent.isPending ? "جاري النشر..." : "نشر الوكيل"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents?.map((agent) => {
          const config = agent.config as any;
          const agentColor = config?.color || '#05B6FA';
          return (
            <div key={agent.id} className="glass-panel rounded-2xl p-6 group hover:border-primary/30 transition-all duration-300 relative overflow-hidden" data-testid={`card-agent-${agent.id}`}>
              <div className="absolute top-0 left-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Activity className="h-24 w-24" />
              </div>

              <div className="relative z-10 flex items-start justify-between mb-4">
                <div className="h-14 w-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${agentColor}15`, color: agentColor }}>
                  <Bot className="h-7 w-7" />
                </div>
                <div className={cn("px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5",
                  agent.isActive
                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                )}>
                  <div className={`w-1.5 h-1.5 rounded-full ${agent.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                  {agent.isActive ? "نشط" : "متوقف"}
                </div>
              </div>

              <div className="relative z-10">
                <h3 className="text-xl font-bold">{agent.name}</h3>
                <p className="text-xs font-mono text-primary/70 mb-2 tracking-wider ltr" dir="ltr">{config?.nameEn || roleLabels[agent.role] || agent.role}</p>
                <p className="text-sm text-muted-foreground mb-6 line-clamp-2">{agent.description}</p>

                <div className="flex items-center justify-between pt-4 border-t border-white/5 gap-2">
                  <span className="text-xs text-muted-foreground ltr" dir="ltr">AG-{agent.id.toString().padStart(3, '0')}</span>
                  <Link href={`/chat?agent=${agent.id}`}>
                    <Button size="sm" variant="ghost" className="h-8" data-testid={`button-chat-agent-${agent.id}`}>
                      <MessageSquare className="h-4 w-4 ml-1" /> محادثة
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
