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

    const url = new URL(req.url);
    const chartType = url.searchParams.get("type") || "all";
    const datasetId = url.searchParams.get("dataset_id");
    const period = url.searchParams.get("period") || "month";

    console.log(`Charts request - User: ${user.id}, Type: ${chartType}, Period: ${period}`);

    // Generate chart data based on type
    const charts: Record<string, unknown> = {};

    if (chartType === "all" || chartType === "line") {
      charts.lineChart = generateLineChartData(period);
    }

    if (chartType === "all" || chartType === "bar") {
      charts.barChart = generateBarChartData(period);
    }

    if (chartType === "all" || chartType === "pie") {
      charts.pieChart = generatePieChartData();
    }

    if (chartType === "all" || chartType === "heatmap") {
      charts.heatmap = generateHeatmapData();
    }

    if (chartType === "all" || chartType === "area") {
      charts.areaChart = generateAreaChartData(period);
    }

    // If dataset provided, generate data-specific charts
    if (datasetId) {
      const { data: rows } = await supabase
        .from("dataset_rows")
        .select("row_data")
        .eq("dataset_id", datasetId)
        .limit(100);

      if (rows && rows.length > 0) {
        charts.datasetDistribution = generateDistributionFromData(rows);
      }
    }

    return new Response(JSON.stringify({ charts, period }), {
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

function generateLineChartData(period: string) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const weeks = ["Week 1", "Week 2", "Week 3", "Week 4"];
  const labels = period === "month" ? months : weeks;
  
  return {
    labels,
    datasets: [
      {
        label: "Revenue",
        data: labels.map(() => Math.floor(Math.random() * 50000) + 80000),
        borderColor: "hsl(217, 91%, 60%)",
        tension: 0.4,
      },
      {
        label: "Expenses",
        data: labels.map(() => Math.floor(Math.random() * 30000) + 40000),
        borderColor: "hsl(0, 84%, 60%)",
        tension: 0.4,
      },
    ],
  };
}

function generateBarChartData(period: string) {
  const categories = ["Electronics", "Clothing", "Home", "Sports", "Books", "Other"];
  
  return {
    labels: categories,
    datasets: [
      {
        label: "This Period",
        data: categories.map(() => Math.floor(Math.random() * 30000) + 10000),
        backgroundColor: "hsl(217, 91%, 60%)",
      },
      {
        label: "Last Period",
        data: categories.map(() => Math.floor(Math.random() * 25000) + 8000),
        backgroundColor: "hsl(217, 91%, 80%)",
      },
    ],
  };
}

function generatePieChartData() {
  return {
    labels: ["Direct", "Organic Search", "Referral", "Social", "Email"],
    datasets: [
      {
        data: [35, 28, 18, 12, 7],
        backgroundColor: [
          "hsl(217, 91%, 60%)",
          "hsl(142, 71%, 45%)",
          "hsl(38, 92%, 50%)",
          "hsl(280, 87%, 65%)",
          "hsl(0, 84%, 60%)",
        ],
      },
    ],
  };
}

function generateHeatmapData() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  
  const data: { day: string; hour: string; value: number }[] = [];
  
  days.forEach((day) => {
    hours.forEach((hour) => {
      const hourNum = parseInt(hour);
      // Simulate higher activity during business hours
      let baseValue = 20;
      if (hourNum >= 9 && hourNum <= 17) baseValue = 60;
      if (hourNum >= 12 && hourNum <= 14) baseValue = 80;
      if (day === "Sat" || day === "Sun") baseValue *= 0.5;
      
      data.push({
        day,
        hour,
        value: Math.floor(baseValue + Math.random() * 40),
      });
    });
  });
  
  return { data, days, hours };
}

function generateAreaChartData(period: string) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  
  let cumulative = 0;
  const revenueData = months.map(() => {
    cumulative += Math.floor(Math.random() * 20000) + 15000;
    return cumulative;
  });
  
  cumulative = 0;
  const targetData = months.map(() => {
    cumulative += 18000;
    return cumulative;
  });
  
  return {
    labels: months,
    datasets: [
      {
        label: "Actual Revenue",
        data: revenueData,
        fill: true,
        backgroundColor: "hsla(217, 91%, 60%, 0.2)",
        borderColor: "hsl(217, 91%, 60%)",
      },
      {
        label: "Target",
        data: targetData,
        fill: false,
        borderColor: "hsl(142, 71%, 45%)",
        borderDash: [5, 5],
      },
    ],
  };
}

function generateDistributionFromData(rows: { row_data: Record<string, unknown> }[]) {
  // Analyze first column that looks like it could be categorical
  const firstRow = rows[0]?.row_data;
  if (!firstRow) return null;
  
  const keys = Object.keys(firstRow);
  const distribution: Record<string, number> = {};
  
  // Try to find a categorical column
  for (const key of keys) {
    const values = rows.map((r) => String(r.row_data[key] || ""));
    const uniqueValues = new Set(values);
    
    if (uniqueValues.size > 1 && uniqueValues.size <= 10) {
      values.forEach((v) => {
        distribution[v] = (distribution[v] || 0) + 1;
      });
      
      return {
        column: key,
        labels: Object.keys(distribution),
        data: Object.values(distribution),
      };
    }
  }
  
  return null;
}
