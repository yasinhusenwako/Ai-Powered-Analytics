import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { orderStatusData } from '@/lib/mockData';

const colorStyles = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  secondary: 'bg-secondary',
};

export function OrderStatusCards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {orderStatusData.map((item) => (
        <div
          key={item.title}
          className={cn(
            'p-4 rounded-xl transition-all duration-300',
            colorStyles[item.color as keyof typeof colorStyles]
          )}
        >
          <p className="text-sm font-medium text-foreground/80">{item.title}</p>
          <div className="flex items-end justify-between mt-2">
            <span className="text-2xl font-bold text-foreground">{item.count}</span>
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full bg-background/20',
                item.change >= 0 ? 'text-success-foreground' : 'text-destructive-foreground'
              )}
            >
              {item.change >= 0 ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {Math.abs(item.change)}%
            </span>
          </div>
          <p className="text-xs text-foreground/60 mt-1">Than last week</p>
        </div>
      ))}
    </div>
  );
}
