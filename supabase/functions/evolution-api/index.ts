import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub as string;

    const { action } = await req.json();
    const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL")!;
    const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY")!;
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

    const supabaseAdmin = createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const instanceName = `six-${userId.slice(0, 8)}`;

    const evoFetch = (path: string, body?: unknown) =>
      fetch(`${EVOLUTION_API_URL}${path}`, {
        method: body ? "POST" : "GET",
        headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });

    // ── CREATE ──
    if (action === "create") {
      // Check if instance already exists in DB
      const { data: existing } = await supabaseAdmin
        .from("whatsapp_instances")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing && existing.status === "connected") {
        return new Response(JSON.stringify({ status: "already_connected", instance: existing }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create instance on Evolution API
      const createResp = await evoFetch("/instance/create", {
        instanceName,
        integration: "WHATSAPP-BAILEYS",
        qrcode: true,
        webhook: {
          url: `${SUPABASE_URL}/functions/v1/whatsapp-webhook`,
          byEvents: false,
          base64: false,
          events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE"],
        },
      });

      const createData = await createResp.json();
      console.log("Evolution create response:", JSON.stringify(createData).slice(0, 500));

      if (!createResp.ok) {
        // Instance might already exist on Evolution side, try to connect
        console.log("Create failed, trying to connect existing instance");
      }

      // Upsert instance in DB
      await supabaseAdmin
        .from("whatsapp_instances")
        .upsert({
          user_id: userId,
          instance_name: instanceName,
          instance_id: createData?.instance?.instanceId || createData?.instanceId || null,
          status: "connecting",
          qr_code: null,
        }, { onConflict: "user_id" });

      // Get QR code
      const qrResp = await evoFetch(`/instance/connect/${instanceName}`);
      const qrData = await qrResp.json();
      console.log("QR response status:", qrResp.status);

      const qrBase64 = qrData?.base64 || qrData?.qrcode?.base64 || null;
      const pairingCode = qrData?.pairingCode || null;

      if (qrBase64) {
        await supabaseAdmin
          .from("whatsapp_instances")
          .update({ qr_code: qrBase64, status: "scanning" })
          .eq("user_id", userId);
      }

      return new Response(JSON.stringify({ status: "scanning", qr_code: qrBase64, pairing_code: pairingCode, instance_name: instanceName }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── CONNECT (refresh QR) ──
    if (action === "connect") {
      const qrResp = await evoFetch(`/instance/connect/${instanceName}`);
      const qrData = await qrResp.json();
      const qrBase64 = qrData?.base64 || qrData?.qrcode?.base64 || null;

      if (qrBase64) {
        await supabaseAdmin
          .from("whatsapp_instances")
          .update({ qr_code: qrBase64, status: "scanning" })
          .eq("user_id", userId);
      }

      return new Response(JSON.stringify({ status: "scanning", qr_code: qrBase64 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── STATUS ──
    if (action === "status") {
      const statusResp = await evoFetch(`/instance/connectionState/${instanceName}`);
      const statusData = await statusResp.json();
      console.log("Connection state:", JSON.stringify(statusData));

      const state = statusData?.instance?.state || statusData?.state || "disconnected";
      const isConnected = state === "open" || state === "connected";
      const newStatus = isConnected ? "connected" : state === "close" ? "disconnected" : "scanning";

      await supabaseAdmin
        .from("whatsapp_instances")
        .update({ status: newStatus, ...(isConnected ? { qr_code: null } : {}) })
        .eq("user_id", userId);

      return new Response(JSON.stringify({ status: newStatus, state }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── DISCONNECT ──
    if (action === "disconnect") {
      // Logout instance
      try {
        await evoFetch(`/instance/logout/${instanceName}`, {});
      } catch (e) { console.log("Logout error (non-fatal):", e); }

      // Delete instance from Evolution
      try {
        const delResp = await fetch(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, {
          method: "DELETE",
          headers: { apikey: EVOLUTION_API_KEY },
        });
        console.log("Delete instance:", delResp.status);
      } catch (e) { console.log("Delete error (non-fatal):", e); }

      await supabaseAdmin
        .from("whatsapp_instances")
        .update({ status: "disconnected", qr_code: null, phone: null })
        .eq("user_id", userId);

      return new Response(JSON.stringify({ status: "disconnected" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Evolution API error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
