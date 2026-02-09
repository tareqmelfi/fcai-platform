import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}

export function MetricCard({ title, value, icon, trend, trendUp, className }: MetricCardProps) {
  return (
    <div className={cn(
      "glass-panel rounded-2xl p-6 relative overflow-hidden group hover:bg-card/80 transition-all duration-300",
      className
    )}>
      <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
        <div className="h-24 w-24">{icon}</div>
      </div>
      
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="p-2 bg-white/5 rounded-lg text-primary">
            {icon}
          </div>
        </div>
        
        <div>
          <h3 className="text-3xl font-display font-bold text-foreground">{value}</h3>
          {trend && (
            <p className={cn("text-xs font-medium mt-1 flex items-center gap-1", 
              trendUp ? "text-green-400" : "text-red-400"
            )}>
              {trendUp ? "↑" : "↓"} {trend}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
