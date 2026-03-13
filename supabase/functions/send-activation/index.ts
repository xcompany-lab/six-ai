import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { campaign_id } = await req.json();
    if (!campaign_id) throw new Error("campaign_id required");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const evolutionApiUrl = Deno.env.get("EVOLUTION_API_URL")!;
    const evolutionApiKey = Deno.env.get("EVOLUTION_API_KEY")!;

    // Get campaign
    const { data: campaign, error: campErr } = await supabaseAdmin
      .from("activation_campaigns")
      .select("*")
      .eq("id", campaign_id)
      .single();
    if (campErr || !campaign) throw new Error("Campaign not found");

    // Get user's WhatsApp instance
    const { data: instance } = await supabaseAdmin
      .from("whatsapp_instances")
      .select("instance_name")
      .eq("user_id", campaign.user_id)
      .eq("status", "connected")
      .limit(1)
      .single();
    if (!instance) throw new Error("No connected WhatsApp instance");

    // Get filtered leads based on campaign filter
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - campaign.filter_days_since * 24 * 60 * 60 * 1000).toISOString();

    let query = supabaseAdmin.from("leads").select("*").eq("user_id", campaign.user_id);

    switch (campaign.filter_type) {
      case "old_leads":
        query = query.lt("last_contact", cutoffDate);
        break;
      case "no_response":
        query = query.eq("status", "new").lt("last_contact", new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString());
        break;
      case "evaluated":
        query = query.ilike("interest", "%avaliação%");
        break;
      case "no_show":
        query = query.eq("status", "no_show");
        break;
      case "old_clients":
        query = query.eq("status", "client").lt("last_contact", cutoffDate);
        break;
    }

    const { data: leads, error: leadsErr } = await query.limit(500);
    if (leadsErr) throw leadsErr;
    if (!leads || leads.length === 0) {
      await supabaseAdmin.from("activation_campaigns").update({ status: "completed", contacts_count: 0 }).eq("id", campaign_id);
      return new Response(JSON.stringify({ sent: 0, total: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Update campaign status
    await supabaseAdmin.from("activation_campaigns").update({
      status: "active",
      contacts_count: leads.length,
    }).eq("id", campaign_id);

    // Create campaign_messages entries
    const messageTemplate = campaign.message_prompt || "Olá {nome}, tudo bem? Gostaríamos de saber como você está! 😊";
    const messages = leads.filter(l => l.phone).map((lead) => ({
      campaign_id: campaign_id,
      user_id: campaign.user_id,
      contact_name: lead.name,
      contact_phone: lead.phone,
      message_text: messageTemplate.replace(/\{nome\}/gi, lead.name || ""),
      send_at: new Date().toISOString(),
      status: "pending",
    }));

    if (messages.length > 0) {
      const { error: insertErr } = await supabaseAdmin.from("campaign_messages").insert(messages);
      if (insertErr) console.error("Insert messages error:", insertErr);
    }

    // Process messages with humanized delays
    let sentCount = 0;
    let failedCount = 0;

    const pendingMessages = await supabaseAdmin
      .from("campaign_messages")
      .select("*")
      .eq("campaign_id", campaign_id)
      .eq("status", "pending")
      .order("created_at")
      .limit(500);

    for (const msg of (pendingMessages.data || [])) {
      try {
        // Typing indicator
        try {
          await fetch(`${evolutionApiUrl}/chat/presence/${instance.instance_name}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: evolutionApiKey },
            body: JSON.stringify({ number: msg.contact_phone, presence: "composing" }),
          });
          await new Promise(r => setTimeout(r, Math.min(2500, Math.max(800, msg.message_text.length * 35))));
        } catch (_) {}

        // Send message
        const sendRes = await fetch(`${evolutionApiUrl}/message/sendText/${instance.instance_name}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: evolutionApiKey },
          body: JSON.stringify({ number: msg.contact_phone, text: msg.message_text }),
        });

        if (sendRes.ok) {
          await supabaseAdmin.from("campaign_messages").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", msg.id);
          sentCount++;
        } else {
          const errText = await sendRes.text();
          await supabaseAdmin.from("campaign_messages").update({ status: "failed", error_message: errText.slice(0, 500) }).eq("id", msg.id);
          failedCount++;
        }

        // Stop typing
        try {
          await fetch(`${evolutionApiUrl}/chat/presence/${instance.instance_name}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: evolutionApiKey },
            body: JSON.stringify({ number: msg.contact_phone, presence: "paused" }),
          });
        } catch (_) {}

        // Update campaign counters
        if (sentCount % 5 === 0 || failedCount % 5 === 0) {
          await supabaseAdmin.rpc("increment_campaign_counter", { p_campaign_id: campaign_id, p_field: "sent_count" });
        }

        // Humanized delay between messages (3-8 seconds)
        await new Promise(r => setTimeout(r, 3000 + Math.floor(Math.random() * 5000)));
      } catch (err) {
        console.error(`Error sending to ${msg.contact_phone}:`, err);
        await supabaseAdmin.from("campaign_messages").update({ status: "failed", error_message: String(err).slice(0, 500) }).eq("id", msg.id);
        failedCount++;
      }
    }

    // Final update
    await supabaseAdmin.from("activation_campaigns").update({
      status: "completed",
      contacts_count: leads.length,
    }).eq("id", campaign_id);

    // Update final sent/failed counts accurately
    const { count: finalSent } = await supabaseAdmin.from("campaign_messages").select("*", { count: "exact", head: true }).eq("campaign_id", campaign_id).eq("status", "sent");
    const { count: finalFailed } = await supabaseAdmin.from("campaign_messages").select("*", { count: "exact", head: true }).eq("campaign_id", campaign_id).eq("status", "failed");

    await supabaseAdmin.from("campaigns").upsert({
      id: campaign_id,
      user_id: campaign.user_id,
      name: campaign.name,
      segment: campaign.filter_type,
      message_text: messageTemplate,
      status: "completed",
      total_contacts: leads.length,
      sent_count: finalSent || sentCount,
      failed_count: finalFailed || failedCount,
    }, { onConflict: "id" });

    console.log(`send-activation: campaign ${campaign_id} done. Sent: ${sentCount}, Failed: ${failedCount}`);

    return new Response(JSON.stringify({ sent: sentCount, failed: failedCount, total: leads.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-activation error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
