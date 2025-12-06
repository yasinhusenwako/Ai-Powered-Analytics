import { cn } from '@/lib/utils';
import { LucideIcon, ExternalLink } from 'lucide-react';

interface StatsCardProps {
  icon?: LucideIcon;
  value: string | number;
  label: string;
  subtitle?: string;
  subtitleHighlight?: string;
  className?: string;
}

export function StatsCard({
  icon: Icon,
  value,
  label,
  subtitle,
  subtitleHighlight,
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        'p-5 rounded-xl bg-card border border-border transition-all duration-300',
        'hover:border-primary/30 hover:shadow-lg group',
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        )}
        <button className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-foreground">{value}</span>
          <span className="text-lg text-muted-foreground">{label}</span>
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground">
            {subtitleHighlight && (
              <span className="text-warning">{subtitleHighlight} </span>
            )}
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
