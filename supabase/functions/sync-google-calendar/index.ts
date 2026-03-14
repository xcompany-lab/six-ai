import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    let timeMin: string;
    let timeMax: string;
    try {
      const body = await req.json();
      timeMin = body.time_min || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      timeMax = body.time_max || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    } catch {
      timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      timeMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    }

    // Get user's Google tokens
    const { data: settings } = await supabaseAdmin
      .from("user_settings")
      .select("google_calendar_connected, google_access_token, google_refresh_token")
      .eq("user_id", userId)
      .maybeSingle();

    if (!settings?.google_calendar_connected || !settings.google_refresh_token) {
      return new Response(JSON.stringify({ error: "Google Calendar not connected", synced: 0 }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Refresh access token
    const accessToken = await refreshAccessToken(settings.google_refresh_token);
    if (!accessToken) {
      await supabaseAdmin
        .from("user_settings")
        .update({ google_calendar_connected: false })
        .eq("user_id", userId);

      return new Response(JSON.stringify({ error: "Failed to refresh token. Please reconnect." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabaseAdmin
      .from("user_settings")
      .update({ google_access_token: accessToken })
      .eq("user_id", userId);

    // ===== PHASE 1: PULL from Google Calendar =====
    const params = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "250",
    });

    const eventsRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const eventsData = await eventsRes.json();

    if (!eventsRes.ok) {
      console.error("Google Calendar fetch error:", eventsData);
      return new Response(JSON.stringify({ error: "Failed to fetch calendar events", details: eventsData }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const events = eventsData.items || [];

    const { data: existingAppts } = await supabaseAdmin
      .from("appointments")
      .select("id, google_event_id")
      .eq("user_id", userId)
      .not("google_event_id", "is", null);

    const existingEventIds = new Set((existingAppts || []).map((a: any) => a.google_event_id));

    let synced = 0;
    let updated = 0;

    for (const event of events) {
      if (!event.start?.dateTime || !event.end?.dateTime) continue;
      if (event.status === "cancelled") continue;

      const startDt = new Date(event.start.dateTime);
      const endDt = new Date(event.end.dateTime);
      const date = startDt.toISOString().split("T")[0];
      const time = startDt.toTimeString().slice(0, 5);
      const durationMinutes = Math.round((endDt.getTime() - startDt.getTime()) / 60000);

      // Split summary by " - " to separate lead_name and service
      let leadName = event.summary || "Evento Google";
      let serviceName = "";
      const summaryParts = (event.summary || "").split(" - ");
      if (summaryParts.length >= 2) {
        leadName = summaryParts[0].trim();
        serviceName = summaryParts.slice(1).join(" - ").trim();
      }

      if (existingEventIds.has(event.id)) {
        await supabaseAdmin
          .from("appointments")
          .update({
            lead_name: leadName,
            date, time, duration_minutes: durationMinutes,
            notes: event.description || "",
            service: serviceName || "Google Calendar",
          })
          .eq("google_event_id", event.id)
          .eq("user_id", userId);
        updated++;
      } else {
        await supabaseAdmin
          .from("appointments")
          .insert({
            user_id: userId,
            google_event_id: event.id,
            lead_name: leadName,
            date, time, duration_minutes: durationMinutes,
            notes: event.description || "",
            service: serviceName || "Google Calendar",
            status: "confirmed",
          });
        synced++;
      }
    }

    // ===== PHASE 2: PUSH local appointments to Google Calendar =====
    const { data: localAppts } = await supabaseAdmin
      .from("appointments")
      .select("*")
      .eq("user_id", userId)
      .is("google_event_id", null);

    let pushed = 0;

    for (const appt of localAppts || []) {
      try {
        // Build start/end datetimes from date + time + duration
        const startIso = `${appt.date}T${appt.time}`;
        const startMs = new Date(startIso).getTime();
        const endMs = startMs + (appt.duration_minutes || 60) * 60000;
        const endDt = new Date(endMs);
        const endIso = `${appt.date}T${endDt.toTimeString().slice(0, 8)}`;

        const tz = "America/Sao_Paulo";
        const summary = [appt.lead_name, appt.service].filter(Boolean).join(" - ") || "Agendamento SIX AI";
        const description = appt.notes || "Agendado via SIX AI";

        const createRes = await fetch(
          "https://www.googleapis.com/calendar/v3/calendars/primary/events",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              summary,
              description,
              start: { dateTime: startIso, timeZone: tz },
              end: { dateTime: endIso, timeZone: tz },
              reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 30 }] },
            }),
          }
        );

        const createData = await createRes.json();

        if (createRes.ok && createData.id) {
          await supabaseAdmin
            .from("appointments")
            .update({ google_event_id: createData.id })
            .eq("id", appt.id);
          pushed++;
        } else {
          console.error(`Failed to push appointment ${appt.id}:`, createData);
        }
      } catch (err) {
        console.error(`Error pushing appointment ${appt.id}:`, err);
      }
    }

    console.log(`Google Calendar sync for user ${userId}: ${synced} pulled, ${updated} updated, ${pushed} pushed from ${events.length} events`);

    return new Response(
      JSON.stringify({ status: "ok", synced, updated, pushed, total_events: events.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("sync-google-calendar error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
