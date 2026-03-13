import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const evolutionApiUrl = Deno.env.get("EVOLUTION_API_URL")!;
    const evolutionApiKey = Deno.env.get("EVOLUTION_API_KEY")!;

    // Fetch pending reminders where send_at <= now
    const { data: reminders, error } = await supabaseAdmin
      .from("scheduled_reminders")
      .select("*")
      .eq("status", "pending")
      .lte("send_at", new Date().toISOString())
      .limit(50);

    if (error) throw error;
    if (!reminders || reminders.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let sentCount = 0;

    for (const reminder of reminders) {
      try {
        // Get user's WhatsApp instance
        const { data: instance } = await supabaseAdmin
          .from("whatsapp_instances")
          .select("instance_name")
          .eq("user_id", reminder.user_id)
          .eq("status", "connected")
          .limit(1)
          .single();

        if (!instance) {
          await supabaseAdmin
            .from("scheduled_reminders")
            .update({ status: "failed" })
            .eq("id", reminder.id);
          continue;
        }

        // Personalize message template with variables
        let messageText = reminder.message_text || "";
        messageText = messageText
          .replace(/\{nome\}/gi, reminder.contact_name)
          .replace(/\{servico\}/gi, reminder.service_name)
          .replace(/\{data\}/gi, reminder.appointment_at ? new Date(reminder.appointment_at).toLocaleDateString("pt-BR") : "")
          .replace(/\{hora\}/gi, reminder.appointment_at ? new Date(reminder.appointment_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "");

        // Send typing indicator
        try {
          await fetch(`${evolutionApiUrl}/chat/presence/${instance.instance_name}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: evolutionApiKey },
            body: JSON.stringify({ number: reminder.contact_phone, presence: "composing" }),
          });
          await new Promise((r) => setTimeout(r, Math.min(2500, Math.max(600, messageText.length * 40))));
        } catch (_) { /* ignore typing errors */ }

        // Send message via Evolution API
        const sendRes = await fetch(`${evolutionApiUrl}/message/sendText/${instance.instance_name}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: evolutionApiKey },
          body: JSON.stringify({
            number: reminder.contact_phone,
            text: messageText,
          }),
        });

        if (sendRes.ok) {
          await supabaseAdmin
            .from("scheduled_reminders")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", reminder.id);
          sentCount++;
        } else {
          const errBody = await sendRes.text();
          console.error(`Failed to send reminder ${reminder.id}:`, errBody);
          await supabaseAdmin
            .from("scheduled_reminders")
            .update({ status: "failed" })
            .eq("id", reminder.id);
        }

        // Stop typing
        try {
          await fetch(`${evolutionApiUrl}/chat/presence/${instance.instance_name}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: evolutionApiKey },
            body: JSON.stringify({ number: reminder.contact_phone, presence: "paused" }),
          });
        } catch (_) { /* ignore */ }

        // Small delay between sends
        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        console.error(`Error processing reminder ${reminder.id}:`, err);
        await supabaseAdmin
          .from("scheduled_reminders")
          .update({ status: "failed" })
          .eq("id", reminder.id);
      }
    }

    console.log(`send-reminders: processed ${reminders.length}, sent ${sentCount}`);
    return new Response(JSON.stringify({ processed: reminders.length, sent: sentCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-reminders error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
