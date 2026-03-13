import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
  const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !refreshToken) return null;

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await resp.json();
  if (!resp.ok || !data.access_token) {
    console.error("Token refresh failed:", data);
    return null;
  }

  return data.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { user_id, appointment_id, summary, description, start_datetime, end_datetime, timezone } = await req.json();

    if (!user_id || !start_datetime || !end_datetime) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user's Google tokens
    const { data: settings } = await supabaseAdmin
      .from("user_settings")
      .select("google_calendar_connected, google_access_token, google_refresh_token")
      .eq("user_id", user_id)
      .maybeSingle();

    if (!settings?.google_calendar_connected || !settings.google_refresh_token) {
      return new Response(JSON.stringify({ error: "Google Calendar not connected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Refresh access token
    const accessToken = await refreshAccessToken(settings.google_refresh_token);
    if (!accessToken) {
      // Mark as disconnected
      await supabaseAdmin
        .from("user_settings")
        .update({ google_calendar_connected: false })
        .eq("user_id", user_id);

      return new Response(JSON.stringify({ error: "Failed to refresh token. Please reconnect Google Calendar." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update stored access token
    await supabaseAdmin
      .from("user_settings")
      .update({ google_access_token: accessToken })
      .eq("user_id", user_id);

    // Create Google Calendar event
    const tz = timezone || "America/Sao_Paulo";
    const eventRes = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: summary || "Agendamento SIX AI",
          description: description || "Agendado via SIX AI",
          start: { dateTime: start_datetime, timeZone: tz },
          end: { dateTime: end_datetime, timeZone: tz },
          reminders: {
            useDefault: false,
            overrides: [{ method: "popup", minutes: 30 }],
          },
        }),
      }
    );

    const eventData = await eventRes.json();

    if (!eventRes.ok) {
      console.error("Google Calendar create event error:", eventData);
      return new Response(JSON.stringify({ error: "Failed to create calendar event", details: eventData }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save google_event_id to appointment if provided
    if (appointment_id && eventData.id) {
      await supabaseAdmin
        .from("appointments")
        .update({ google_event_id: eventData.id })
        .eq("id", appointment_id);
    }

    console.log(`Calendar event created: ${eventData.id} for user ${user_id}`);

    return new Response(JSON.stringify({ status: "ok", google_event_id: eventData.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-calendar-event error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
