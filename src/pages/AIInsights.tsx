import { AIChatBox } from '@/components/ai/AIChatBox';
import { Sparkles, TrendingUp, AlertTriangle, LineChart } from 'lucide-react';

export default function AIInsights() {
  const quickInsights = [
    {
      icon: TrendingUp,
      title: 'Revenue Growing',
      description: 'Your revenue has increased by 2.6% this month',
      color: 'success',
    },
    {
      icon: AlertTriangle,
      title: 'Traffic Alert',
      description: 'Website visitors dropped by 2.6% vs last month',
      color: 'warning',
    },
    {
      icon: LineChart,
      title: 'Forecast',
      description: 'Expected revenue next month: $115K - $125K',
      color: 'primary',
    },
  ];

  const colorStyles = {
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    primary: 'bg-primary/10 text-primary',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Insights</h1>
        <p className="text-muted-foreground mt-1">
          Have a conversation with your data using AI.
        </p>
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickInsights.map((insight, index) => (
          <div
            key={index}
            className="p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all duration-300 cursor-pointer group"
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  colorStyles[insight.color as keyof typeof colorStyles]
                }`}
              >
                <insight.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                  {insight.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {insight.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Chat Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat */}
        <div className="lg:col-span-2 h-[500px]">
          <AIChatBox />
        </div>

        {/* Tips */}
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">AI Tips</h3>
                <p className="text-xs text-muted-foreground">Get better results</p>
              </div>
            </div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Ask about specific metrics like "revenue trend" or "customer growth"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Request comparisons: "Compare this month to last month"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Ask for predictions: "Forecast next quarter sales"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Find anomalies: "Are there any unusual patterns?"</span>
              </li>
            </ul>
          </div>

          <div className="p-5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
            <h3 className="font-semibold text-foreground mb-2">Pro Tip</h3>
            <p className="text-sm text-muted-foreground">
              Upload your own data in the Data Explorer to get personalized insights about your business.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
