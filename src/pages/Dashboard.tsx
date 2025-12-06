import { useApp } from '@/contexts/AppContext';
import { KPICard } from '@/components/dashboard/KPICard';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { SalesPieChart } from '@/components/dashboard/SalesPieChart';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { AIChatBox } from '@/components/ai/AIChatBox';
import { kpiData } from '@/lib/mockData';
import { CheckCircle, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Dashboard() {
  const { user } = useApp();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Hello, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            This is what's happening in your store this month.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="month">
            <SelectTrigger className="w-[140px] bg-muted border-none">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This week</SelectItem>
              <SelectItem value="month">This month</SelectItem>
              <SelectItem value="quarter">This quarter</SelectItem>
              <SelectItem value="year">This year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Calendar className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - KPIs and Charts */}
        <div className="xl:col-span-2 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiData.map((kpi, index) => (
              <KPICard key={kpi.id} {...kpi} highlight={index === 0} />
            ))}
          </div>

          {/* Revenue Chart */}
          <ChartCard title="Revenue" subtitle="This month vs last">
            <RevenueChart />
          </ChartCard>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCard
              icon={CheckCircle}
              value="98"
              label="orders"
              subtitle="are awaiting confirmation."
              subtitleHighlight="12 orders"
            />
            <StatsCard
              icon={Users}
              value="17"
              label="customers"
              subtitle="are waiting for response."
              subtitleHighlight="17 customers"
            />
            <ChartCard title="Sales by Category" subtitle="This month vs last" className="md:col-span-1">
              <SalesPieChart />
            </ChartCard>
          </div>
        </div>

        {/* Right Column - AI Chat */}
        <div className="xl:col-span-1 h-[600px]">
          <AIChatBox />
        </div>
      </div>
    </div>
  );
}
