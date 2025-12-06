import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export function ChartCard({ title, subtitle, children, className, action }: ChartCardProps) {
  return (
    <div
      className={cn(
        'p-5 rounded-xl bg-card border border-border transition-all duration-300',
        'hover:border-primary/30 hover:shadow-lg group',
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {action || (
          <button className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
            <ExternalLink className="w-4 h-4" />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
