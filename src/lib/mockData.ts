export const kpiData = [
  {
    id: 'revenue',
    title: 'Total Revenue',
    value: '$99,560',
    change: 2.6,
    changeType: 'positive' as const,
    period: 'vs last month',
  },
  {
    id: 'orders',
    title: 'Total Orders',
    value: '35',
    change: 2.0,
    changeType: 'positive' as const,
    period: 'vs last month',
  },
  {
    id: 'visitors',
    title: 'Total Visitors',
    value: '45,600',
    change: -2.6,
    changeType: 'negative' as const,
    period: 'vs last month',
  },
  {
    id: 'profit',
    title: 'Net Profit',
    value: '$60,450',
    change: 5.6,
    changeType: 'positive' as const,
    period: 'vs last month',
  },
];

export const revenueChartData = [
  { date: '1 Aug', revenue: 4500 },
  { date: '2 Aug', revenue: 5200 },
  { date: '3 Aug', revenue: 4800 },
  { date: '4 Aug', revenue: 7500 },
  { date: '5 Aug', revenue: 14867 },
  { date: '6 Aug', revenue: 9200 },
  { date: '7 Aug', revenue: 11500 },
  { date: '8 Aug', revenue: 8900 },
];

export const salesByCategoryData = [
  { name: 'MacBook Air M2', value: 35, color: 'hsl(217, 91%, 60%)' },
  { name: 'Apple Watch Series 9', value: 25, color: 'hsl(262, 83%, 58%)' },
  { name: 'JBL Charge 5', value: 20, color: 'hsl(142, 76%, 45%)' },
  { name: 'Divoom SongBird-HQ', value: 12, color: 'hsl(38, 92%, 50%)' },
  { name: 'AirPods Pro 2', value: 8, color: 'hsl(0, 84%, 60%)' },
];

export const ordersData = [
  {
    id: 'N°674839',
    customer: 'Kris Payer',
    phone: '099 758 9072',
    category: 'Laptops',
    price: '$1,302.38',
    date: '26.07.2024',
    payment: 'PayPal',
    status: 'on way' as const,
  },
  {
    id: 'N°674840',
    customer: 'Kris Payer',
    phone: '099 758 9072',
    category: 'Laptops',
    price: '$1,302.38',
    date: '26.07.2024',
    payment: 'PayPal',
    status: 'delivered' as const,
  },
  {
    id: 'N°674841',
    customer: 'Kris Payer',
    phone: '099 758 9072',
    category: 'Laptops',
    price: '$1,302.38',
    date: '26.07.2024',
    payment: 'PayPal',
    status: 'await' as const,
  },
  {
    id: 'N°674842',
    customer: 'John Smith',
    phone: '099 123 4567',
    category: 'Phones',
    price: '$899.99',
    date: '25.07.2024',
    payment: 'Credit Card',
    status: 'delivered' as const,
  },
  {
    id: 'N°674843',
    customer: 'Sarah Wilson',
    phone: '099 456 7890',
    category: 'Accessories',
    price: '$249.99',
    date: '25.07.2024',
    payment: 'PayPal',
    status: 'on way' as const,
  },
];

export const orderStatusData = [
  { title: 'New orders', count: 12, change: 2.6, color: 'primary' },
  { title: 'Await accepting', count: 20, change: 2.6, color: 'warning' },
  { title: 'On way orders', count: 57, change: -0.6, color: 'secondary' },
  { title: 'Delivered orders', count: 98, change: 2.8, color: 'success' },
];

export const aiChatMessages = [
  {
    id: '1',
    role: 'assistant' as const,
    content: "Hello! I'm your AI analytics assistant. I can help you understand your data, identify trends, and generate insights. What would you like to know?",
    timestamp: new Date(Date.now() - 3600000),
  },
  {
    id: '2',
    role: 'user' as const,
    content: 'What are the main revenue trends this month?',
    timestamp: new Date(Date.now() - 3500000),
  },
  {
    id: '3',
    role: 'assistant' as const,
    content: "Based on your data, I can see several interesting patterns:\n\n📈 **Revenue Growth**: Your total revenue has increased by 2.6% compared to last month, reaching $99,560.\n\n🎯 **Peak Performance**: The highest revenue day was August 5th with $14,867 in sales.\n\n💡 **Recommendation**: Consider running promotions on slower days (Aug 1st, 3rd) to balance revenue distribution.",
    timestamp: new Date(Date.now() - 3400000),
  },
];

export const suggestionChips = [
  'Revenue Summaries',
  'Detect Anomalies',
  'Sales Forecast',
  'Customer Insights',
  'Product Performance',
];
