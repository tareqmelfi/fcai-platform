import { useState } from "react";
import { useTasks, useCreateTask } from "@/hooks/use-tasks";
import { useAgents } from "@/hooks/use-agents";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, CircleDashed, Clock, CheckCircle2, Bot } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskSchema } from "@shared/schema";
import { z } from "zod";
import { cn } from "@/lib/utils";

const formSchema = insertTaskSchema.extend({
  agentId: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function TasksPage() {
  const { data: tasks, isLoading } = useTasks();
  const { data: agents } = useAgents();
  const createTask = useCreateTask();
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      status: "pending",
    },
  });

  const onSubmit = (data: FormValues) => {
    createTask.mutate(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      },
    });
  };

  const pendingTasks = tasks?.filter(t => t.status === 'pending') || [];
  const progressTasks = tasks?.filter(t => t.status === 'in_progress') || [];
  const completedTasks = tasks?.filter(t => t.status === 'completed') || [];

  if (isLoading) return <div className="text-center py-20 text-muted-foreground animate-pulse">جاري تحميل المهام...</div>;

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-tasks-title">لوحة المهام</h1>
          <p className="text-muted-foreground">متابعة سير العمل والمهام المسندة للوكلاء.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/25" data-testid="button-new-task">
              <Plus className="ml-2 h-4 w-4" /> مهمة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] glass-panel border-white/10">
            <DialogHeader>
              <DialogTitle>إنشاء مهمة جديدة</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title">عنوان المهمة</Label>
                <Input id="title" {...form.register("title")} placeholder="مثال: مراجعة عقد شراكة" className="bg-background/50 border-white/10" data-testid="input-task-title" />
                {form.formState.errors.title && <p className="text-red-400 text-xs">{form.formState.errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="agentId">تعيين وكيل (اختياري)</Label>
                <Select onValueChange={(val) => form.setValue("agentId", parseInt(val))} value={form.watch("agentId")?.toString()}>
                  <SelectTrigger className="bg-background/50 border-white/10" data-testid="select-task-agent">
                    <SelectValue placeholder="تعيين تلقائي حسب التخصص" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents?.map(agent => (
                      <SelectItem key={agent.id} value={agent.id.toString()}>{agent.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">الأولوية</Label>
                  <Select onValueChange={(val) => form.setValue("priority", val)} defaultValue="medium">
                    <SelectTrigger className="bg-background/50 border-white/10" data-testid="select-task-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">منخفضة</SelectItem>
                      <SelectItem value="medium">متوسطة</SelectItem>
                      <SelectItem value="high">عالية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">التفاصيل</Label>
                <Textarea id="description" {...form.register("description")} placeholder="تفاصيل المهمة..." className="bg-background/50 border-white/10 h-32" data-testid="input-task-description" />
                {form.formState.errors.description && <p className="text-red-400 text-xs">{form.formState.errors.description.message}</p>}
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full" disabled={createTask.isPending} data-testid="button-submit-task">
                  {createTask.isPending ? "جاري الإنشاء..." : "إنشاء المهمة"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-[500px]">
        <div className="bg-card/30 rounded-2xl p-4 border border-white/5 flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-2">
            <CircleDashed className="h-5 w-5 text-yellow-500" />
            <h3 className="font-bold text-yellow-500/80">معلق</h3>
            <span className="mr-auto bg-white/5 text-xs px-2 py-0.5 rounded-full">{pendingTasks.length}</span>
          </div>
          {pendingTasks.map(task => <TaskCard key={task.id} task={task} agents={agents} />)}
        </div>

        <div className="bg-card/30 rounded-2xl p-4 border border-primary/10 flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-primary/80">قيد التنفيذ</h3>
            <span className="mr-auto bg-white/5 text-xs px-2 py-0.5 rounded-full">{progressTasks.length}</span>
          </div>
          {progressTasks.map(task => <TaskCard key={task.id} task={task} agents={agents} />)}
        </div>

        <div className="bg-card/30 rounded-2xl p-4 border border-green-500/10 flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <h3 className="font-bold text-green-500/80">مكتمل</h3>
            <span className="mr-auto bg-white/5 text-xs px-2 py-0.5 rounded-full">{completedTasks.length}</span>
          </div>
          {completedTasks.map(task => <TaskCard key={task.id} task={task} agents={agents} />)}
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, agents }: { task: any; agents: any[] | undefined }) {
  const assignedAgent = agents?.find(a => a.id === task.agentId);
  const config = assignedAgent?.config as any;
  const agentColor = config?.color || '#05B6FA';

  const priorityLabels: Record<string, string> = { high: 'عالية', medium: 'متوسطة', low: 'منخفضة' };

  return (
    <div className="bg-card hover:bg-card/80 p-4 rounded-xl border border-border shadow-sm hover:shadow-md transition-all cursor-pointer group" data-testid={`card-task-${task.id}`}>
      <div className="flex justify-between items-start mb-2 gap-2">
        <span className={cn("text-[10px] uppercase font-bold px-2 py-0.5 rounded border",
          task.priority === 'high' ? "text-red-400 border-red-400/20 bg-red-400/10" :
          task.priority === 'medium' ? "text-yellow-400 border-yellow-400/20 bg-yellow-400/10" :
          "text-blue-400 border-blue-400/20 bg-blue-400/10"
        )}>
          {priorityLabels[task.priority] || task.priority}
        </span>
        {assignedAgent && (
          <span className="text-[10px] text-muted-foreground bg-white/5 px-2 py-0.5 rounded flex items-center gap-1">
            <Bot className="h-3 w-3" style={{ color: agentColor }} />
            {assignedAgent.name}
          </span>
        )}
      </div>
      <h4 className="font-bold text-sm mb-1 group-hover:text-primary transition-colors">{task.title}</h4>
      <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
    </div>
  );
}
