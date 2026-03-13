import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendWhatsAppMessage(phone: string, text: string, instanceName: string): Promise<boolean> {
  const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
  const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    console.warn("Evolution API not configured");
    return false;
  }

  const resp = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: EVOLUTION_API_KEY },
    body: JSON.stringify({ number: phone, text }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    console.error("Evolution API send error:", resp.status, err);
    return false;
  }
  await resp.text();
  return true;
}

async function sendSplitMessages(phone: string, messages: string[], instanceName: string) {
  for (const msg of messages) {
    await sendWhatsAppMessage(phone, msg, instanceName);
    const delay = Math.floor(Math.random() * 500) + 400; // 400–900ms
    await sleep(delay);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body).slice(0, 500));

    const event = body.event;
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
    const contactName = messageData.pushName || contactPhone;
    const instanceName = body.instance || "";

    // === Detect message type (text or audio) ===
    const messageType = messageData.message ? Object.keys(messageData.message)[0] : null;
    let messageText = messageData.message?.conversation
      || messageData.message?.extendedTextMessage?.text
      || "";

    // Audio transcription via Gemini
    if (messageType === "audioMessage" && !messageText) {
      const audioBase64 = messageData.message?.audioMessage?.base64
        || messageData.message?.base64
        || null;

      if (audioBase64) {
        try {
          const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
          if (LOVABLE_API_KEY) {
            const transcriptionResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-3-flash-preview",
                messages: [
                  {
                    role: "user",
                    content: [
                      {
                        type: "text",
                        text: "Transcreva o áudio abaixo para texto em português brasileiro. Corrija erros de fala naturais mas preserve o significado. Retorne apenas o texto transcrito, sem comentários.",
                      },
                      {
                        type: "image_url",
                        image_url: { url: `data:audio/ogg;base64,${audioBase64}` },
                      },
                    ],
                  },
                ],
              }),
            });

            if (transcriptionResp.ok) {
              const transcriptionData = await transcriptionResp.json();
              messageText = transcriptionData.choices?.[0]?.message?.content || "";
              console.log(`Audio transcribed: ${messageText.slice(0, 100)}`);
            }
          }
        } catch (e) {
          console.error("Audio transcription error:", e);
        }
      }
    }

    if (!messageText) {
      return new Response(JSON.stringify({ status: "ignored", reason: "no text" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Message from ${contactName} (${contactPhone}) on instance ${instanceName}: ${messageText}`);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // === Multi-tenant: resolve user by instance name ===
    let userId: string | null = null;

    if (instanceName) {
      const { data: instance } = await supabaseAdmin
        .from("whatsapp_instances")
        .select("user_id")
        .eq("instance_name", instanceName)
        .maybeSingle();
      if (instance) userId = instance.user_id;
    }

    if (!userId) {
      const { data: agents } = await supabaseAdmin
        .from("ai_agent_config")
        .select("user_id")
        .eq("active", true)
        .limit(1);
      if (agents?.length) userId = agents[0].user_id;
    }

    if (!userId) {
      console.error("No user found for instance:", instanceName);
      return new Response(JSON.stringify({ status: "no_user" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === Load or create lead ===
    let { data: lead } = await supabaseAdmin
      .from("leads")
      .select("*")
      .eq("user_id", userId)
      .eq("phone", contactPhone)
      .maybeSingle();

    if (!lead) {
      const { data: newLead } = await supabaseAdmin
        .from("leads")
        .insert({
          user_id: userId,
          phone: contactPhone,
          name: contactName,
          origin: "whatsapp",
          status: "new",
          current_agent: "attendant",
        })
        .select()
        .single();
      lead = newLead;
    }

    const currentAgent = lead?.current_agent || "attendant";

    // === Load agent config (new multi-agent system) ===
    const { data: agentConfig } = await supabaseAdmin
      .from("agent_configs")
      .select("system_prompt")
      .eq("user_id", userId)
      .eq("agent_type", currentAgent)
      .maybeSingle();

    // Fallback to legacy ai_agent_config if no multi-agent config exists
    let systemPrompt: string;

    if (agentConfig?.system_prompt) {
      systemPrompt = agentConfig.system_prompt;
    } else {
      // Legacy fallback
      const { data: legacyAgent } = await supabaseAdmin
        .from("ai_agent_config")
        .select("*")
        .eq("user_id", userId)
        .eq("active", true)
        .maybeSingle();

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("brand_name, niche, services, business_description, business_hours, voice_tone")
        .eq("id", userId)
        .maybeSingle();

      const businessContext = profile
        ? `\nEmpresa: ${profile.brand_name || "N/A"}\nNicho: ${profile.niche || "N/A"}\nServiços: ${(profile.services || []).join(", ")}\nDescrição: ${profile.business_description || "N/A"}\nHorário: ${profile.business_hours || "N/A"}`
        : "";

      systemPrompt = `${legacyAgent?.prompt || "Você é um assistente inteligente de atendimento."}\n\nTom de voz: ${legacyAgent?.voice_tone || "Profissional e empático"}${businessContext}\n\nResponda de forma concisa e natural, como em uma conversa de WhatsApp.`;
    }

    // === Load contact memory ===
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

    // Inject memory context into prompt
    const memoryContext = memory
      ? `\n\n[CONTEXTO]\nContato: ${memory.contact_name || contactPhone}\nResumo: ${memory.summary}\nPreferências: ${memory.preferences}\nÚltimos tópicos: ${memory.last_topics}\nSentimento: ${memory.sentiment}\nInterações: ${memory.interaction_count}`
      : "";

    const fullPrompt = systemPrompt + memoryContext;

    // === Call AI ===
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
          { role: "system", content: fullPrompt },
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
    const rawReply = aiData.choices?.[0]?.message?.content || "";

    console.log(`Raw AI reply: ${rawReply.slice(0, 200)}`);

    // === Parse JSON response (messages + intent) ===
    let replyMessages: string[] = [];
    let intent: string | null = null;

    try {
      // Try to extract JSON from response (may be wrapped in markdown code blocks)
      const jsonMatch = rawReply.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed.messages)) {
          replyMessages = parsed.messages;
        }
        intent = parsed.intent || null;
      }
    } catch {
      // If JSON parsing fails, treat as plain text
      console.log("Could not parse JSON response, using as plain text");
    }

    // Fallback: if no messages parsed, split plain text into chunks
    if (replyMessages.length === 0) {
      replyMessages = rawReply
        .split(/\n\n|\n/)
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);
      if (replyMessages.length === 0) {
        replyMessages = [rawReply || "Desculpe, não consegui processar sua mensagem."];
      }
    }

    // === Send split messages via Evolution API ===
    const replyInstance = instanceName || `six-${userId.slice(0, 8)}`;
    await sendSplitMessages(contactPhone, replyMessages, replyInstance);
    console.log(`Sent ${replyMessages.length} messages to ${contactPhone}`);

    // === Handle intents (handoff between agents) ===
    if (intent && lead?.id) {
      console.log(`Intent detected: ${intent} for lead ${lead.id}`);

      if (intent === "schedule") {
        await supabaseAdmin
          .from("leads")
          .update({ current_agent: "scheduler", status: "awaiting_schedule" })
          .eq("id", lead.id);
        console.log("Switched to scheduler agent");
      }

      if (intent === "booked") {
        // Create appointment
        const jsonMatch = rawReply.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.datetime && parsed.service) {
              const dt = new Date(parsed.datetime);
              await supabaseAdmin.from("appointments").insert({
                user_id: userId,
                lead_id: lead.id,
                lead_name: parsed.contact_name || contactName,
                service: parsed.service,
                date: dt.toISOString().split("T")[0],
                time: dt.toTimeString().slice(0, 5),
                status: "confirmed",
              });
              console.log("Appointment created");
            }
          } catch (e) {
            console.error("Error creating appointment from intent:", e);
          }
        }

        await supabaseAdmin
          .from("leads")
          .update({ current_agent: "attendant", status: "scheduled" })
          .eq("id", lead.id);
        console.log("Switched back to attendant agent");
      }

      if (intent === "cancel_schedule") {
        await supabaseAdmin
          .from("leads")
          .update({ current_agent: "attendant" })
          .eq("id", lead.id);
        console.log("Schedule cancelled, back to attendant");
      }
    }

    // === Call CRM agent to evaluate funnel movement ===
    if (lead?.id && currentAgent !== "crm") {
      try {
        const { data: crmConfig } = await supabaseAdmin
          .from("agent_configs")
          .select("system_prompt")
          .eq("user_id", userId)
          .eq("agent_type", "crm")
          .maybeSingle();

        if (crmConfig?.system_prompt) {
          const conversationSummary = `Lead: ${contactName}\nEtapa atual: ${lead.status}\nMensagem do cliente: ${messageText}\nResposta da IA: ${replyMessages.join(" ")}`;

          const crmResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                { role: "system", content: crmConfig.system_prompt },
                { role: "user", content: conversationSummary },
              ],
            }),
          });

          if (crmResponse.ok) {
            const crmData = await crmResponse.json();
            const crmReply = crmData.choices?.[0]?.message?.content || "";
            const crmJson = crmReply.match(/\{[\s\S]*\}/);
            if (crmJson) {
              const crmDecision = JSON.parse(crmJson[0]);
              if (crmDecision.move_to) {
                // Map stage names to status codes
                const stageMap: Record<string, string> = {
                  "Novo": "new",
                  "Em andamento": "in_progress",
                  "Interessado": "interested",
                  "Agendado": "scheduled",
                  "Cliente": "client",
                };
                const newStatus = stageMap[crmDecision.move_to] || crmDecision.move_to;
                await supabaseAdmin
                  .from("leads")
                  .update({ status: newStatus })
                  .eq("id", lead.id);
                console.log(`CRM moved lead to ${newStatus}: ${crmDecision.reason}`);
              }
            }
          }
        }
      } catch (e) {
        console.error("CRM agent error (non-fatal):", e);
      }
    }

    // === Update contact memory ===
    if (memory?.id) {
      await supabaseAdmin
        .from("contact_memory")
        .update({
          summary: `Última conversa: ${messageText.slice(0, 100)} → ${replyMessages[0]?.slice(0, 100) || ""}`,
          last_topics: messageText.slice(0, 200),
        })
        .eq("id", memory.id);
    }

    return new Response(JSON.stringify({ status: "ok", messages_sent: replyMessages.length, intent }), {
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
