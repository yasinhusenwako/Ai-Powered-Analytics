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
    const datasetId = url.searchParams.get("dataset_id");
    const metricType = url.searchParams.get("type") || "all";

    console.log(`KPI Metrics request - User: ${user.id}, Dataset: ${datasetId}, Type: ${metricType}`);

    // Get user's datasets
    const { data: datasets } = await supabase
      .from("datasets")
      .select("id, original_name, row_count, uploaded_at")
      .eq("user_id", user.id)
      .order("uploaded_at", { ascending: false });

    // Calculate metrics
    const totalDatasets = datasets?.length || 0;
    const totalRows = datasets?.reduce((sum, d) => sum + (d.row_count || 0), 0) || 0;

    // Get AI session count
    const { count: sessionCount } = await supabase
      .from("ai_sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    // Get message count
    const { count: messageCount } = await supabase
      .from("ai_messages")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    // Generate KPI data with mock trends
    const kpis = {
      datasets: {
        value: totalDatasets,
        label: "Total Datasets",
        change: "+2",
        changePercent: 15,
        trend: "up",
        period: "vs last month",
      },
      rows: {
        value: totalRows,
        label: "Data Rows",
        change: totalRows > 1000 ? `+${Math.floor(totalRows * 0.12)}` : "+120",
        changePercent: 12,
        trend: "up",
        period: "vs last month",
      },
      sessions: {
        value: sessionCount || 0,
        label: "AI Sessions",
        change: "+5",
        changePercent: 25,
        trend: "up",
        period: "vs last week",
      },
      insights: {
        value: messageCount || 0,
        label: "AI Insights",
        change: "+18",
        changePercent: 32,
        trend: "up",
        period: "vs last week",
      },
      // Mock business metrics
      revenue: {
        value: 124500,
        label: "Revenue",
        change: "+$12,450",
        changePercent: 11.2,
        trend: "up",
        period: "vs last month",
        formatted: "$124.5K",
      },
      customers: {
        value: 2847,
        label: "Customers",
        change: "+234",
        changePercent: 8.9,
        trend: "up",
        period: "vs last month",
      },
      orders: {
        value: 1893,
        label: "Orders",
        change: "+156",
        changePercent: 9.0,
        trend: "up",
        period: "vs last month",
      },
      avgOrderValue: {
        value: 85.4,
        label: "Avg Order Value",
        change: "+$7.20",
        changePercent: 9.2,
        trend: "up",
        period: "vs last month",
        formatted: "$85.40",
      },
    };

    // Return specific metric or all
    if (metricType !== "all" && kpis[metricType as keyof typeof kpis]) {
      return new Response(
        JSON.stringify({ [metricType]: kpis[metricType as keyof typeof kpis] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ kpis, datasets: datasets?.slice(0, 5) }), {
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
