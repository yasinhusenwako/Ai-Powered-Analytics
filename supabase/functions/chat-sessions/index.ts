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
    const method = req.method;

    // GET - List sessions or get session messages
    if (method === "GET") {
      const sessionId = url.searchParams.get("session_id");
      
      if (sessionId) {
        // Get messages for a specific session
        const { data: messages, error } = await supabase
          .from("ai_messages")
          .select("*")
          .eq("session_id", sessionId)
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });
        
        if (error) throw error;
        
        return new Response(JSON.stringify({ messages }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      // List all sessions
      const { data: sessions, error } = await supabase
        .from("ai_sessions")
        .select(`
          *,
          dataset:datasets(id, original_name),
          message_count:ai_messages(count)
        `)
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      
      if (error) throw error;
      
      return new Response(JSON.stringify({ sessions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST - Create session or add message
    if (method === "POST") {
      const body = await req.json();
      const { action, session_id, title, dataset_id, message } = body;

      if (action === "create_session") {
        const { data: session, error } = await supabase
          .from("ai_sessions")
          .insert({
            user_id: user.id,
            title: title || "New Chat",
            dataset_id: dataset_id || null,
          })
          .select()
          .single();
        
        if (error) throw error;
        
        return new Response(JSON.stringify({ session }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "add_message" && session_id && message) {
        const { data: newMessage, error } = await supabase
          .from("ai_messages")
          .insert({
            session_id,
            user_id: user.id,
            role: message.role,
            content: message.content,
            metadata: message.metadata || {},
          })
          .select()
          .single();
        
        if (error) throw error;

        // Update session timestamp
        await supabase
          .from("ai_sessions")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", session_id);
        
        return new Response(JSON.stringify({ message: newMessage }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "update_title" && session_id && title) {
        const { error } = await supabase
          .from("ai_sessions")
          .update({ title })
          .eq("id", session_id)
          .eq("user_id", user.id);
        
        if (error) throw error;
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // DELETE - Delete session
    if (method === "DELETE") {
      const sessionId = url.searchParams.get("session_id");
      
      if (!sessionId) {
        return new Response(JSON.stringify({ error: "Session ID required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      const { error } = await supabase
        .from("ai_sessions")
        .delete()
        .eq("id", sessionId)
        .eq("user_id", user.id);
      
      if (error) throw error;
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
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
