import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.0";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state"); // user_id
    const error = url.searchParams.get("error");

    if (error) {
      console.error("Google OAuth error:", error);
      return Response.redirect("https://usesix.com.br/app/configuracoes?google=error");
    }

    if (!code || !state) {
      return new Response("Missing code or state", { status: 400 });
    }

    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
    const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const GOOGLE_REDIRECT_URI = Deno.env.get("GOOGLE_REDIRECT_URI");

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
      console.error("Google OAuth secrets not configured");
      return Response.redirect("https://usesix.com.br/app/configuracoes?google=error");
    }

    // Exchange authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("Token exchange failed:", tokenData);
      return Response.redirect("https://usesix.com.br/app/configuracoes?google=error");
    }

    const { access_token, refresh_token } = tokenData;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Upsert user_settings with Google tokens
    const { data: existing } = await supabaseAdmin
      .from("user_settings")
      .select("id")
      .eq("user_id", state)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin
        .from("user_settings")
        .update({
          google_calendar_connected: true,
          google_access_token: access_token,
          google_refresh_token: refresh_token || undefined,
        })
        .eq("user_id", state);
    } else {
      await supabaseAdmin
        .from("user_settings")
        .insert({
          user_id: state,
          google_calendar_connected: true,
          google_access_token: access_token,
          google_refresh_token: refresh_token || null,
        });
    }

    console.log(`Google Calendar connected for user ${state}`);
    return Response.redirect("https://usesix.com.br/app/configuracoes?google=connected");
  } catch (e) {
    console.error("Google callback error:", e);
    return Response.redirect("https://usesix.com.br/app/configuracoes?google=error");
  }
});
