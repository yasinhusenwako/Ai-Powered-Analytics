import { kpiData, revenueChartData, salesByCategoryData, ordersData, aiChatMessages } from './mockData';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchDashboardKPIs() {
  await delay(500);
  return kpiData;
}

export async function fetchRevenueChart() {
  await delay(300);
  return revenueChartData;
}

export async function fetchSalesByCategory() {
  await delay(400);
  return salesByCategoryData;
}

export async function fetchOrders() {
  await delay(600);
  return ordersData;
}

export async function sendAIMessage(message: string): Promise<string> {
  await delay(1500);
  
  const responses: Record<string, string> = {
    'summaries': "📊 **Quick Summary**\n\nYour store is performing well this month:\n- Revenue: $99,560 (+2.6%)\n- Orders: 35 (+2.0%)\n- Visitors: 45,600 (-2.6%)\n\nKey insight: While visitor traffic is slightly down, your conversion rate has improved, leading to better revenue.",
    'anomalies': "🔍 **Anomaly Detection**\n\nI found 2 potential anomalies:\n\n1. **Aug 5th spike**: Revenue was 3x higher than average. This correlates with your flash sale campaign.\n\n2. **Visitor drop**: 2.6% decrease in visitors despite increased marketing spend. Consider reviewing ad targeting.",
    'forecasts': "📈 **Revenue Forecast**\n\nBased on current trends, I predict:\n\n- **Next week**: $28,000 - $32,000\n- **Month-end**: $115,000 - $125,000\n\nConfidence: 85%\n\nRecommendation: Stock up on MacBook Air M2 - it's your best seller with 35% of revenue.",
    'default': "I've analyzed your question. Based on the current data:\n\n- Your overall performance is trending positively\n- Revenue growth is outpacing industry average\n- Customer acquisition cost has decreased by 12%\n\nWould you like me to dive deeper into any specific metric?",
  };

  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes('summar')) return responses.summaries;
  if (lowerMessage.includes('anomal')) return responses.anomalies;
  if (lowerMessage.includes('forecast') || lowerMessage.includes('predict')) return responses.forecasts;
  
  return responses.default;
}

export async function analyzeUploadedData(filename: string): Promise<string> {
  await delay(2000);
  
  return `📁 **Analysis of ${filename}**\n\n**Dataset Overview:**\n- Rows: 1,247\n- Columns: 12\n- Date range: Jan 2024 - Jul 2024\n\n**Key Findings:**\n1. Strong positive correlation between marketing spend and conversions\n2. Weekend sales are 40% higher than weekdays\n3. Top performing product category: Electronics\n\n**Recommendations:**\n- Increase weekend inventory by 25%\n- Focus marketing budget on Thursday-Friday\n- Consider bundling accessories with electronics`;
}
