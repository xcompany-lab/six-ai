import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body).slice(0, 500));

    // Evolution API sends different event types
    const event = body.event;
    
    // Only process incoming text messages
    if (event !== "messages.upsert") {
      return new Response(JSON.stringify({ status: "ignored", event }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const messageData = body.data;
    if (!messageData || messageData.key?.fromMe) {
      return new Response(JSON.stringify({ status: "ignored", reason: "own message" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contactPhone = messageData.key?.remoteJid?.replace("@s.whatsapp.net", "") || "";
    const messageText = messageData.message?.conversation 
      || messageData.message?.extendedTextMessage?.text 
      || "";
    const contactName = messageData.pushName || contactPhone;
    const instanceName = body.instance || "";

    if (!messageText) {
      return new Response(JSON.stringify({ status: "ignored", reason: "no text" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Message from ${contactName} (${contactPhone}): ${messageText}`);

    // Use service role to find the user who owns this instance
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find user by matching the instance - stored in profiles.whatsapp or we look up all active agents
    // For now, we'll look for users with active AI agents
    const { data: agents, error: agentError } = await supabaseAdmin
      .from("ai_agent_config")
      .select("user_id, prompt, voice_tone, energy, faq, knowledge_base, pitch, objections, out_of_scope, prohibited_words, opening_message, fallback_message, active")
      .eq("active", true);

    if (agentError || !agents?.length) {
      console.error("No active agents found:", agentError);
      return new Response(JSON.stringify({ status: "no_agent" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For MVP, use first active agent. In production, match by instance/phone
    const agent = agents[0];
    const userId = agent.user_id;

    // Load profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("brand_name, niche, services, business_description, business_hours, voice_tone")
      .eq("id", userId)
      .maybeSingle();

    // Load or create contact memory
    let { data: memory } = await supabaseAdmin
      .from("contact_memory")
      .select("*")
      .eq("user_id", userId)
      .eq("contact_phone", contactPhone)
      .maybeSingle();

    if (!memory) {
      const { data: newMem } = await supabaseAdmin
        .from("contact_memory")
        .insert({
          user_id: userId,
          contact_phone: contactPhone,
          contact_name: contactName,
          interaction_count: 1,
          last_topics: messageText.slice(0, 200),
          last_interaction_at: new Date().toISOString(),
        })
        .select()
        .single();
      memory = newMem;
    } else {
      await supabaseAdmin
        .from("contact_memory")
        .update({
          contact_name: contactName,
          interaction_count: (memory.interaction_count || 0) + 1,
          last_topics: messageText.slice(0, 200),
          last_interaction_at: new Date().toISOString(),
        })
        .eq("id", memory.id);
    }

    // Build system prompt
    const businessContext = profile
      ? `\nEmpresa: ${profile.brand_name || "N/A"}\nNicho: ${profile.niche || "N/A"}\nServiços: ${(profile.services || []).join(", ")}\nDescrição: ${profile.business_description || "N/A"}\nHorário: ${profile.business_hours || "N/A"}`
      : "";

    const memoryContext = memory
      ? `\n\nMemória do contato ${memory.contact_name || contactPhone}:\nResumo: ${memory.summary}\nPreferências: ${memory.preferences}\nÚltimos tópicos: ${memory.last_topics}\nSentimento: ${memory.sentiment}\nInterações: ${memory.interaction_count}`
      : "";

    const systemPrompt = `${agent.prompt || "Você é um assistente inteligente de atendimento."}\n\nTom de voz: ${agent.voice_tone || "Profissional e empático"}\nEnergia: ${agent.energy || "Moderada"}${agent.prohibited_words ? `\nPalavras proibidas: ${agent.prohibited_words}` : ""}${businessContext}${memoryContext}${agent.faq ? `\n\nFAQ:\n${agent.faq}` : ""}${agent.knowledge_base ? `\n\nBase de Conhecimento:\n${agent.knowledge_base}` : ""}${agent.pitch ? `\n\nPitch:\n${agent.pitch}` : ""}${agent.objections ? `\n\nObjeções:\n${agent.objections}` : ""}${agent.out_of_scope ? `\n\nFora de escopo: ${agent.out_of_scope}` : ""}\n\nIMPORTANTE: Responda de forma concisa e natural, como em uma conversa de WhatsApp. Máximo 3 parágrafos curtos.`;

    // Call AI gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: messageText },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ status: "ai_error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const replyText = aiData.choices?.[0]?.message?.content || agent.fallback_message || "Desculpe, não consegui processar sua mensagem.";

    console.log(`Reply to ${contactPhone}: ${replyText.slice(0, 100)}...`);

    // Send reply via Evolution API
    const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
    const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
    const EVOLUTION_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE_NAME");

    if (EVOLUTION_API_URL && EVOLUTION_API_KEY && EVOLUTION_INSTANCE) {
      const sendUrl = `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`;
      const sendResp = await fetch(sendUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_API_KEY,
        },
        body: JSON.stringify({
          number: contactPhone,
          text: replyText,
        }),
      });

      if (!sendResp.ok) {
        const sendErr = await sendResp.text();
        console.error("Evolution API send error:", sendResp.status, sendErr);
      } else {
        console.log("Reply sent successfully via Evolution API");
        await sendResp.text(); // consume body
      }
    } else {
      console.warn("Evolution API not configured, reply not sent");
    }

    // Update contact memory with AI summary
    if (memory?.id) {
      await supabaseAdmin
        .from("contact_memory")
        .update({
          summary: `Última conversa: ${messageText.slice(0, 100)} → ${replyText.slice(0, 100)}`,
          last_topics: messageText.slice(0, 200),
        })
        .eq("id", memory.id);
    }

    return new Response(JSON.stringify({ status: "ok", reply: replyText.slice(0, 50) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
