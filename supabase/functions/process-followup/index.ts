import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function parseInterval(str: string): number {
  const match = str.match(/^(\d+)(h|m|d)$/);
  if (!match) return 24 * 60 * 60 * 1000; // default 24h
  const val = parseInt(match[1]);
  switch (match[2]) {
    case 'm': return val * 60 * 1000;
    case 'h': return val * 60 * 60 * 1000;
    case 'd': return val * 24 * 60 * 60 * 1000;
    default: return val * 60 * 60 * 1000;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const evolutionApiUrl = Deno.env.get("EVOLUTION_API_URL")!;
    const evolutionApiKey = Deno.env.get("EVOLUTION_API_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // Get all active follow-up flows
    const { data: flows, error: flowsErr } = await supabaseAdmin
      .from("follow_up_flows")
      .select("*")
      .eq("active", true);

    if (flowsErr) throw flowsErr;
    if (!flows || flows.length === 0) {
      return new Response(JSON.stringify({ processed: 0, reason: "no active flows" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalProcessed = 0;

    for (const flow of flows) {
      const noResponseMs = parseInterval(flow.no_response_time);
      const cutoff = new Date(Date.now() - noResponseMs).toISOString();

      // Find eligible leads: matching status, last_contact older than no_response_time
      let query = supabaseAdmin
        .from("leads")
        .select("*")
        .eq("user_id", flow.user_id)
        .lt("last_contact", cutoff);

      if (flow.lead_status) {
        query = query.eq("status", flow.lead_status);
      }

      const { data: leads, error: leadsErr } = await query.limit(20);
      if (leadsErr || !leads || leads.length === 0) continue;

      // Get WhatsApp instance
      const { data: instance } = await supabaseAdmin
        .from("whatsapp_instances")
        .select("instance_name")
        .eq("user_id", flow.user_id)
        .eq("status", "connected")
        .limit(1)
        .single();

      if (!instance) continue;

      // Get business profile for AI context
      const { data: profile } = await supabaseAdmin
        .from("business_profiles")
        .select("business_name, segment, tone, services")
        .eq("user_id", flow.user_id)
        .single();

      // Get follow-up agent prompt
      const { data: agentConfig } = await supabaseAdmin
        .from("agent_configs")
        .select("system_prompt")
        .eq("user_id", flow.user_id)
        .eq("agent_type", "followup")
        .single();

      for (const lead of leads) {
        if (!lead.phone) continue;

        try {
          let messageText = flow.message_prompt.replace(/\{nome\}/gi, lead.name || "");

          // If AI key available, generate personalized message
          if (LOVABLE_API_KEY && agentConfig?.system_prompt) {
            const businessCtx = profile
              ? `Negócio: ${profile.business_name}. Segmento: ${profile.segment}. Tom: ${profile.tone}. Serviços: ${(profile.services as string[]).join(", ")}.`
              : "";

            const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  {
                    role: "system",
                    content: `${agentConfig.system_prompt}\n\n${businessCtx}\n\nObjetivo do follow-up: ${flow.objective}\nNome do contato: ${lead.name}\nInteresse: ${lead.interest}\nÚltimo contato: ${lead.last_contact}\n\nGere UMA mensagem curta e personalizada de follow-up (máx 300 chars). Use emojis com moderação. Responda APENAS com o texto da mensagem.`,
                  },
                  { role: "user", content: "Gere a mensagem de follow-up." },
                ],
              }),
            });

            if (aiRes.ok) {
              const aiData = await aiRes.json();
              const suggestion = aiData.choices?.[0]?.message?.content?.trim();
              if (suggestion) messageText = suggestion;
            } else {
              await aiRes.text();
            }
          }

          // Send typing + message
          try {
            const presResp = await fetch(`${evolutionApiUrl}/chat/presence/${instance.instance_name}`, {
              method: "POST",
              headers: { "Content-Type": "application/json", apikey: evolutionApiKey },
              body: JSON.stringify({ number: lead.phone, presence: "composing" }),
            });
            await presResp.text();
            await new Promise(r => setTimeout(r, Math.min(2500, Math.max(800, messageText.length * 35))));
          } catch (_) {}

          const sendRes = await fetch(`${evolutionApiUrl}/message/sendText/${instance.instance_name}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", apikey: evolutionApiKey },
            body: JSON.stringify({ number: lead.phone, text: messageText }),
          });

          if (sendRes.ok) {
            await sendRes.text();
            // Update last_contact to prevent re-sending
            await supabaseAdmin.from("leads")
              .update({ last_contact: new Date().toISOString(), current_agent: "followup" })
              .eq("id", lead.id);
            totalProcessed++;
          } else {
            const errText = await sendRes.text();
            console.error(`Follow-up send failed for ${lead.phone}:`, errText);
          }

          // Stop typing
          try {
            const stopResp = await fetch(`${evolutionApiUrl}/chat/presence/${instance.instance_name}`, {
              method: "POST",
              headers: { "Content-Type": "application/json", apikey: evolutionApiKey },
              body: JSON.stringify({ number: lead.phone, presence: "paused" }),
            });
            await stopResp.text();
          } catch (_) {}

          // Delay between leads (3-6s)
          await new Promise(r => setTimeout(r, 3000 + Math.floor(Math.random() * 3000)));
        } catch (err) {
          console.error(`Follow-up error for lead ${lead.id}:`, err);
        }
      }
    }

    console.log(`process-followup: processed ${totalProcessed} leads`);
    return new Response(JSON.stringify({ processed: totalProcessed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("process-followup error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
