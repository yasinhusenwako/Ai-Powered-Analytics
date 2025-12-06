import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { dataset_id, query, session_id, type = "general" } = await req.json();

    console.log(`AI Insights request - User: ${user.id}, Type: ${type}, Query: ${query}`);

    // Get dataset info if provided
    let datasetInfo = null;
    if (dataset_id) {
      const { data: dataset } = await supabase
        .from("datasets")
        .select("*")
        .eq("id", dataset_id)
        .eq("user_id", user.id)
        .single();
      
      if (dataset) {
        const { data: sampleRows } = await supabase
          .from("dataset_rows")
          .select("row_data")
          .eq("dataset_id", dataset_id)
          .limit(10);
        
        datasetInfo = {
          name: dataset.original_name,
          columns: dataset.column_names,
          row_count: dataset.row_count,
          sample: sampleRows?.map(r => r.row_data) || [],
        };
      }
    }

    // Generate mock AI response based on type
    const response = generateMockInsight(type, query, datasetInfo);

    // Save message to chat history if session provided
    if (session_id) {
      await supabase.from("ai_messages").insert([
        { session_id, user_id: user.id, role: "user", content: query },
        { session_id, user_id: user.id, role: "assistant", content: response.content },
      ]);
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

interface DatasetInfo {
  name: string;
  columns: string[];
  row_count: number;
  sample: Record<string, unknown>[];
}

function generateMockInsight(
  type: string,
  query: string,
  datasetInfo: DatasetInfo | null
): { content: string; insights: unknown[]; type: string } {
  const insights: unknown[] = [];
  let content = "";

  const columns = datasetInfo?.columns || ["revenue", "customers", "orders"];
  const rowCount = datasetInfo?.row_count || 1000;

  switch (type) {
    case "summary":
      content = `## Dataset Summary\n\nYour dataset "${datasetInfo?.name || "uploaded data"}" contains **${rowCount.toLocaleString()} rows** across **${columns.length} columns**.\n\n### Key Statistics:\n- **Total Records**: ${rowCount.toLocaleString()}\n- **Columns**: ${columns.slice(0, 5).join(", ")}${columns.length > 5 ? "..." : ""}\n- **Data Quality**: 98.5% complete (1.5% missing values)\n\n### Notable Findings:\n1. The data shows consistent patterns across most columns\n2. No significant outliers detected in numerical fields\n3. Date range spans the last 12 months`;
      insights.push({
        type: "summary",
        title: "Data Overview",
        value: rowCount,
        change: "+12%",
      });
      break;

    case "anomalies":
      content = `## Anomaly Detection Results\n\nI've analyzed your data for unusual patterns and outliers.\n\n### Detected Anomalies:\n\n1. **Spike on March 15**: Unusually high activity (3.2x average)\n2. **Missing Data Cluster**: 47 records missing values in week 23\n3. **Outlier Values**: 12 records with values >2 standard deviations\n\n### Recommendations:\n- Review March 15 data for potential data entry errors\n- Investigate the cause of missing data in week 23\n- Consider removing or correcting the 12 outlier records`;
      insights.push(
        { type: "anomaly", title: "High Activity Spike", severity: "medium", date: "March 15" },
        { type: "anomaly", title: "Missing Data", severity: "low", count: 47 }
      );
      break;

    case "forecast":
      const forecastValues = [120, 125, 128, 132, 138, 145];
      content = `## Revenue Forecast\n\nBased on historical trends, here's your 6-month forecast:\n\n| Month | Projected Revenue | Confidence |\n|-------|------------------|------------|\n| Jan | $${forecastValues[0]}K | 95% |\n| Feb | $${forecastValues[1]}K | 92% |\n| Mar | $${forecastValues[2]}K | 88% |\n| Apr | $${forecastValues[3]}K | 85% |\n| May | $${forecastValues[4]}K | 80% |\n| Jun | $${forecastValues[5]}K | 75% |\n\n### Key Drivers:\n- Seasonal trends suggest Q2 growth\n- Customer acquisition rate increasing\n- Average order value stable`;
      insights.push({
        type: "forecast",
        title: "6-Month Projection",
        values: forecastValues,
        trend: "up",
      });
      break;

    case "trends":
      content = `## Trend Analysis\n\n### Overall Trends:\n\n📈 **Revenue**: Up 15% month-over-month\n👥 **Customer Growth**: 8% increase in new customers\n📦 **Order Volume**: Steady at ~500 orders/week\n💰 **AOV**: $85 average (up from $78)\n\n### Seasonal Patterns:\n- Peak activity: Tuesdays and Wednesdays\n- Low periods: Weekend afternoons\n- Monthly cycle: First week typically slowest\n\n### Growth Opportunities:\n1. Weekend promotions could boost slow periods\n2. Email campaigns on Mondays drive Tuesday traffic\n3. Bundle offers increase AOV by 12%`;
      insights.push(
        { type: "trend", metric: "Revenue", change: "+15%", direction: "up" },
        { type: "trend", metric: "Customers", change: "+8%", direction: "up" }
      );
      break;

    default:
      // General query response
      const queryLower = query.toLowerCase();
      if (queryLower.includes("revenue") || queryLower.includes("sales")) {
        content = `Based on your data analysis:\n\n**Revenue Insights:**\n- Total Revenue: $1.24M (YTD)\n- Average Monthly: $103K\n- Best Month: March ($142K)\n- Growth Rate: 12.5% YoY\n\nWould you like me to break this down by category or time period?`;
      } else if (queryLower.includes("customer")) {
        content = `**Customer Analysis:**\n\n- Total Customers: 2,847\n- New This Month: 234\n- Retention Rate: 78%\n- Average LTV: $456\n\nYour customer base is growing steadily. The retention rate is above industry average.`;
      } else {
        content = `I've analyzed your query: "${query}"\n\nHere's what I found:\n\n- Your data contains ${rowCount.toLocaleString()} records\n- Key metrics are trending positively\n- No immediate concerns detected\n\nWould you like me to:\n1. Generate a detailed summary?\n2. Look for anomalies?\n3. Create a forecast?\n4. Analyze specific trends?`;
      }
      insights.push({ type: "general", query, processed: true });
  }

  return { content, insights, type };
}
