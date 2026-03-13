import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const evolutionApiUrl = Deno.env.get("EVOLUTION_API_URL")!;
    const evolutionApiKey = Deno.env.get("EVOLUTION_API_KEY")!;

    // Get next batch of pending messages (oldest first, max 10 per run to stay within timeout)
    const { data: messages, error } = await supabaseAdmin
      .from("campaign_messages")
      .select("*, campaigns!campaign_messages_campaign_id_fkey(user_id)")
      .eq("status", "pending")
      .lte("send_at", new Date().toISOString())
      .order("send_at", { ascending: true })
      .limit(10);

    if (error) throw error;
    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cache instances per user
    const instanceCache: Record<string, string | null> = {};

    async function getInstanceName(userId: string): Promise<string | null> {
      if (userId in instanceCache) return instanceCache[userId];
      const { data } = await supabaseAdmin
        .from("whatsapp_instances")
        .select("instance_name")
        .eq("user_id", userId)
        .eq("status", "connected")
        .limit(1)
        .single();
      instanceCache[userId] = data?.instance_name || null;
      return instanceCache[userId];
    }

    let processed = 0;

    for (const msg of messages) {
      const userId = msg.user_id;
      const instanceName = await getInstanceName(userId);

      if (!instanceName) {
        await supabaseAdmin.from("campaign_messages")
          .update({ status: "failed", error_message: "No connected WhatsApp instance" })
          .eq("id", msg.id);
        await supabaseAdmin.rpc("increment_campaign_counter", { p_campaign_id: msg.campaign_id, p_field: "failed_count" });
        continue;
      }

      try {
        // Typing indicator
        try {
          const presResp = await fetch(`${evolutionApiUrl}/chat/presence/${instanceName}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: evolutionApiKey },
            body: JSON.stringify({ number: msg.contact_phone, presence: "composing" }),
          });
          await presResp.text();
          await new Promise(r => setTimeout(r, Math.min(2500, Math.max(800, msg.message_text.length * 35))));
        } catch (_) {}

        // Send
        const sendRes = await fetch(`${evolutionApiUrl}/message/sendText/${instanceName}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: evolutionApiKey },
          body: JSON.stringify({ number: msg.contact_phone, text: msg.message_text }),
        });

        if (sendRes.ok) {
          await sendRes.text();
          await supabaseAdmin.from("campaign_messages")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", msg.id);
          await supabaseAdmin.rpc("increment_campaign_counter", { p_campaign_id: msg.campaign_id, p_field: "sent_count" });
        } else {
          const errText = await sendRes.text();
          await supabaseAdmin.from("campaign_messages")
            .update({ status: "failed", error_message: errText.slice(0, 500) })
            .eq("id", msg.id);
          await supabaseAdmin.rpc("increment_campaign_counter", { p_campaign_id: msg.campaign_id, p_field: "failed_count" });
        }

        // Stop typing
        try {
          const stopResp = await fetch(`${evolutionApiUrl}/chat/presence/${instanceName}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: evolutionApiKey },
            body: JSON.stringify({ number: msg.contact_phone, presence: "paused" }),
          });
          await stopResp.text();
        } catch (_) {}

        processed++;

        // Delay between messages (3-6s)
        if (processed < messages.length) {
          await new Promise(r => setTimeout(r, 3000 + Math.floor(Math.random() * 3000)));
        }
      } catch (err) {
        console.error(`Error sending to ${msg.contact_phone}:`, err);
        await supabaseAdmin.from("campaign_messages")
          .update({ status: "failed", error_message: String(err).slice(0, 500) })
          .eq("id", msg.id);
        await supabaseAdmin.rpc("increment_campaign_counter", { p_campaign_id: msg.campaign_id, p_field: "failed_count" });
      }
    }

    // Check if any campaign is now fully processed
    const campaignIds = [...new Set(messages.map(m => m.campaign_id))];
    for (const cid of campaignIds) {
      const { count: pending } = await supabaseAdmin
        .from("campaign_messages")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", cid)
        .eq("status", "pending");

      if (pending === 0) {
        await supabaseAdmin.from("activation_campaigns")
          .update({ status: "completed" })
          .eq("id", cid);
      }
    }

    console.log(`process-campaign-queue: processed ${processed} messages`);
    return new Response(JSON.stringify({ processed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("process-campaign-queue error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
