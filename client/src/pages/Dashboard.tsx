import { useAgents } from "@/hooks/use-agents";
import { useTasks } from "@/hooks/use-tasks";
import { useConversations } from "@/hooks/use-chat";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { motion } from "framer-motion";
import { Link } from "wouter";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4 }
});

export default function Dashboard() {
  const { data: agents } = useAgents();
  const { data: tasks } = useTasks();
  const { data: conversations } = useConversations();

  const activeAgents = agents?.filter(a => a.isActive).length || 0;
  const totalAgents = agents?.length || 0;
  const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
  const pendingTasks = tasks?.filter(t => t.status === 'pending').length || 0;
  const inProgressTasks = tasks?.filter(t => t.status === 'in_progress').length || 0;
  const totalConversations = conversations?.length || 0;

  const agentTaskCounts = agents?.map(agent => ({
    name: agent.name.split(' ')[0],
    tasks: tasks?.filter(t => t.agentId === agent.id).length || 0,
  })) || [];

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <div>
        <h1 className="text-3xl font-bold mb-1" data-testid="text-dashboard-title">مركز التحكم</h1>
        <p className="text-muted-foreground text-sm">نظرة عامة شاملة على منصتك ونشاط وكلائك.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div {...fadeUp(0.1)}>
          <StatWidget icon="token" label="إجمالي المحادثات" value={totalConversations} color="#05B6FA" />
        </motion.div>
        <motion.div {...fadeUp(0.15)}>
          <StatWidget icon="smart_toy" label="الوكلاء النشطون" value={`${activeAgents}/${totalAgents}`} color="#22C55E" />
        </motion.div>
        <motion.div {...fadeUp(0.2)}>
          <StatWidget icon="task_alt" label="المهام المكتملة" value={completedTasks} color="#F59E0B" />
        </motion.div>
        <motion.div {...fadeUp(0.25)}>
          <StatWidget icon="dns" label="حالة النظام" value="متصل" color="#22C55E" />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <motion.div className="lg:col-span-2" {...fadeUp(0.3)}>
          <WidgetCard title="توزيع المهام على الوكلاء" icon="bar_chart">
            <div className="h-[260px] w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agentTaskCounts} layout="vertical">
                  <XAxis type="number" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} width={90} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#002350', borderColor: 'rgba(5,182,250,0.2)', borderRadius: '12px', direction: 'rtl' }}
                    itemStyle={{ color: 'white' }}
                  />
                  <Bar dataKey="tasks" radius={[0, 6, 6, 0]}>
                    {agentTaskCounts.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(199 97% ${55 - (index * 5)}%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </WidgetCard>
        </motion.div>

        <motion.div {...fadeUp(0.35)}>
          <WidgetCard title="الإجراءات السريعة" icon="bolt">
            <div className="grid grid-cols-2 gap-3">
              <QuickAction href="/chat" icon="chat" label="محادثة جديدة" />
              <QuickAction href="/agents" icon="smart_toy" label="الوكلاء" />
              <QuickAction href="/marketplace" icon="store" label="السوق" />
              <QuickAction href="/settings" icon="settings" label="الإعدادات" />
            </div>
          </WidgetCard>
        </motion.div>

        <motion.div className="lg:col-span-2" {...fadeUp(0.4)}>
          <WidgetCard title="آخر المهام" icon="assignment">
            <div className="space-y-2 max-h-[260px] overflow-y-auto pl-2">
              {tasks?.slice(0, 6).map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors" data-testid={`task-item-${task.id}`}>
                  <div className={`mt-1.5 h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                    task.status === 'completed' ? 'bg-green-500' :
                    task.status === 'in_progress' ? 'bg-[#05B6FA]' :
                    task.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{task.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {task.status === 'completed' ? 'مكتمل' :
                       task.status === 'in_progress' ? 'قيد التنفيذ' :
                       task.status === 'pending' ? 'معلق' : task.status}
                    </p>
                  </div>
                </div>
              ))}
              {(!tasks || tasks.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-8">لا توجد مهام حديثة</p>
              )}
            </div>
            <Link href="/tasks">
              <div className="mt-3 pt-3 border-t border-white/5 text-center text-sm text-[#05B6FA] hover:text-[#05B6FA]/80 transition-colors cursor-pointer font-medium" data-testid="link-all-tasks">
                عرض جميع المهام
              </div>
            </Link>
          </WidgetCard>
        </motion.div>

        <motion.div {...fadeUp(0.45)}>
          <WidgetCard title="حالة النظام" icon="health_and_safety">
            <div className="space-y-4">
              <SystemStatus label="واجهة API" status="متصل" ok />
              <SystemStatus label="قاعدة البيانات" status="متصل" ok />
              <SystemStatus label="نماذج AI" status="جاهز" ok />
              <SystemStatus label="التخزين" status="متاح" ok />
            </div>
          </WidgetCard>
        </motion.div>
      </div>

      {agents && agents.length > 0 && (
        <motion.div {...fadeUp(0.5)}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-lg font-bold">الوكلاء النشطون</h3>
            <Link href="/agents">
              <span className="text-sm text-[#05B6FA] hover:text-[#05B6FA]/80 transition-colors cursor-pointer" data-testid="link-all-agents">عرض الكل</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {agents.slice(0, 6).map((agent) => {
              const config = agent.config as any;
              const agentColor = config?.color || '#05B6FA';
              return (
                <div key={agent.id} className="glass-card rounded-2xl p-4 text-center hover:border-[#05B6FA]/20 transition-all" data-testid={`card-agent-${agent.id}`}>
                  <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: `${agentColor}15`, color: agentColor }}>
                    <span className="material-symbols-outlined">smart_toy</span>
                  </div>
                  <p className="text-sm font-bold line-clamp-1">{agent.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-1" dir="ltr" style={{ fontFamily: 'Rubik' }}>{config?.nameEn || agent.role}</p>
                  <div className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${agent.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${agent.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                    {agent.isActive ? 'نشط' : 'متوقف'}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function StatWidget({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
  return (
    <div className="glass-card rounded-2xl p-5 relative overflow-hidden" data-testid={`stat-${icon}`}>
      <div className="absolute top-0 left-0 w-full h-1" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15`, color }}>
          <span className="material-symbols-outlined text-xl">{icon}</span>
        </div>
      </div>
      <div className="text-2xl font-bold mb-0.5" style={{ fontFamily: 'Rubik', color }} dir="ltr">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function WidgetCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-2xl p-5 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-[#05B6FA] text-lg">{icon}</span>
        <h3 className="text-sm font-bold">{title}</h3>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function QuickAction({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link href={href}>
      <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-[#05B6FA]/10 border border-transparent hover:border-[#05B6FA]/20 transition-all cursor-pointer" data-testid={`action-${icon}`}>
        <span className="material-symbols-outlined text-[#05B6FA] text-2xl">{icon}</span>
        <span className="text-xs font-medium">{label}</span>
      </div>
    </Link>
  );
}

function SystemStatus({ label, status, ok }: { label: string; status: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium" style={{ color: ok ? '#22C55E' : '#EF4444', fontFamily: 'Rubik' }}>{status}</span>
        <div className={`w-2 h-2 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`} />
      </div>
    </div>
  );
}
