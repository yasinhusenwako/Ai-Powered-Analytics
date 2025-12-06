import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, ExternalLink } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  change: number;
  changeType: 'positive' | 'negative';
  period: string;
  icon?: LucideIcon;
  highlight?: boolean;
}

export function KPICard({
  title,
  value,
  change,
  changeType,
  period,
  icon: Icon,
  highlight = false,
}: KPICardProps) {
  const isPositive = changeType === 'positive';

  return (
    <div
      className={cn(
        'relative p-5 rounded-xl bg-card border border-border transition-all duration-300',
        'hover:border-primary/30 hover:shadow-lg group',
        highlight && 'border-primary/50 glow'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
                isPositive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
              )}
            >
              {isPositive ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {Math.abs(change)}%
            </span>
            <span className="text-xs text-muted-foreground">{period}</span>
          </div>
        </div>
        <button className="p-2 rounded-lg bg-primary text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
