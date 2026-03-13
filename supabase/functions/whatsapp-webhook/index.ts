import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SPLIT_INSTRUCTION = `
FORMATO DE RESPOSTA OBRIGATÓRIO:
Sempre retorne um JSON com a chave "messages" contendo um array de strings.
Cada string é uma mensagem separada enviada individualmente no WhatsApp.
Escreva como um humano digitando: frases curtas, uma ideia por mensagem, máximo 2 linhas por item.
Nunca envie um parágrafo longo em uma única mensagem.
Use pontos, vírgulas e quebras naturais de fala para decidir onde cortar.

Exemplo correto:
{"messages": ["Oi, tudo bem?", "Aqui é a Ana, assistente da Clínica Saúde 😊", "Posso te ajudar com o agendamento?"], "intent": null}

Se a mensagem do usuário vier de uma transcrição de áudio, pode conter erros de fala ou palavras fundidas.
Interprete com contexto e responda ao significado, não à forma escrita.
`;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// === Evolution API helpers ===

function getEvolutionConfig() {
  const url = Deno.env.get("EVOLUTION_API_URL");
  const key = Deno.env.get("EVOLUTION_API_KEY");
  if (!url || !key) return null;
  return { url, key };
}

async function sendWhatsAppMessage(phone: string, text: string, instanceName: string): Promise<boolean> {
  const config = getEvolutionConfig();
  if (!config) { console.warn("Evolution API not configured"); return false; }

  const resp = await fetch(`${config.url}/message/sendText/${instanceName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: config.key },
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

async function setTypingIndicator(phone: string, instanceName: string, composing: boolean): Promise<void> {
  const config = getEvolutionConfig();
  if (!config) return;

  try {
    await fetch(`${config.url}/chat/presence/${instanceName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: config.key },
      body: JSON.stringify({
        number: phone,
        presence: composing ? "composing" : "paused",
      }),
    }).then((r) => r.text());
  } catch (e) {
    console.warn("Typing indicator error (non-fatal):", e);
  }
}

async function sendSplitMessages(phone: string, messages: string[], instanceName: string) {
  for (let i = 0; i < messages.length; i++) {
    // Show typing indicator before each message
    await setTypingIndicator(phone, instanceName, true);

    // Simulate typing time based on message length (30-60ms per char, min 600ms, max 3000ms)
    const typingTime = Math.min(3000, Math.max(600, messages[i].length * 45));
    await sleep(typingTime);

    await sendWhatsAppMessage(phone, messages[i], instanceName);

    // Pause between messages (400-900ms)
    if (i < messages.length - 1) {
      const delay = Math.floor(Math.random() * 500) + 400;
      await sleep(delay);
    }
  }

  // Stop typing indicator
  await setTypingIndicator(phone, instanceName, false);
}

// === Audio transcription ===

async function transcribeAudio(audioBase64: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY || !audioBase64) return "";

  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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

    if (resp.ok) {
      const data = await resp.json();
      const text = data.choices?.[0]?.message?.content || "";
      console.log(`Audio transcribed (${text.length} chars): ${text.slice(0, 100)}`);
      return text;
    }
    await resp.text();
  } catch (e) {
    console.error("Audio transcription error:", e);
  }
  return "";
}

// === Extract audio base64 from various Evolution API payload formats ===

function extractAudioBase64(messageData: Record<string, unknown>): string | null {
  const msg = messageData.message as Record<string, unknown> | undefined;
  if (!msg) return null;

  // Format 1: audioMessage.base64
  const audioMsg = msg.audioMessage as Record<string, unknown> | undefined;
  if (audioMsg?.base64) return audioMsg.base64 as string;

  // Format 2: base64 at message root
  if (msg.base64) return msg.base64 as string;

  return null;
}

// === Detect message type ===

function detectMessageType(messageData: Record<string, unknown>): { type: string; text: string } {
  const msg = messageData.message as Record<string, unknown> | undefined;
  if (!msg) return { type: "unknown", text: "" };

  // Check by messageType field (Evolution API v2)
  const explicitType = messageData.messageType as string | undefined;
  if (explicitType === "audioMessage") return { type: "audio", text: "" };

  // Check by message keys
  const keys = Object.keys(msg);
  if (keys.includes("audioMessage")) return { type: "audio", text: "" };

  // Extract text
  const text =
    (msg.conversation as string) ||
    ((msg.extendedTextMessage as Record<string, unknown>)?.text as string) ||
    "";

  return { type: text ? "text" : "unknown", text };
}

// === Parse AI response (JSON with messages + intent) ===

function parseAIResponse(rawReply: string): { messages: string[]; intent: string | null; parsedJson: Record<string, unknown> | null } {
  let messages: string[] = [];
  let intent: string | null = null;
  let parsedJson: Record<string, unknown> | null = null;

  try {
    const jsonMatch = rawReply.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      parsedJson = parsed;
      if (Array.isArray(parsed.messages)) {
        messages = parsed.messages.filter((m: unknown) => typeof m === "string" && (m as string).trim().length > 0);
      }
      intent = parsed.intent || null;
    }
  } catch {
    console.log("Could not parse JSON response, using as plain text");
  }

  // Fallback: split plain text into natural chunks
  if (messages.length === 0) {
    messages = rawReply
      .split(/\n\n|\n/)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0 && !s.startsWith("{") && !s.startsWith("```"));
    if (messages.length === 0) {
      messages = [rawReply || "Desculpe, não consegui processar sua mensagem."];
    }
  }

  return { messages, intent, parsedJson };
}

// === Load conversation history from contact_memory ===

function buildConversationContext(memory: Record<string, unknown> | null, contactPhone: string): string {
  if (!memory) return "";
  return `\n\n[CONTEXTO DO CONTATO]
Nome: ${memory.contact_name || contactPhone}
Resumo anterior: ${memory.summary || "Primeiro contato"}
Preferências: ${memory.preferences || "Desconhecidas"}
Últimos tópicos: ${memory.last_topics || "N/A"}
Sentimento detectado: ${memory.sentiment || "Neutro"}
Total de interações: ${memory.interaction_count || 1}`;
}

// === Main webhook handler ===

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body).slice(0, 500));

    if (body.event !== "messages.upsert") {
      return new Response(JSON.stringify({ status: "ignored", event: body.event }), {
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

    // === Detect message type and extract text ===
    const { type: msgType, text: directText } = detectMessageType(messageData);
    let messageText = directText;
    let isFromAudio = false;

    if (msgType === "audio") {
      const audioBase64 = extractAudioBase64(messageData);
      if (audioBase64) {
        messageText = await transcribeAudio(audioBase64);
        isFromAudio = true;
        console.log(`Audio message transcribed from ${contactName}`);
      }
    }

    if (!messageText) {
      return new Response(JSON.stringify({ status: "ignored", reason: "no text" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Message from ${contactName} (${contactPhone}) [${msgType}${isFromAudio ? "/transcribed" : ""}]: ${messageText.slice(0, 150)}`);

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

    // === Load agent config (multi-agent system) ===
    const { data: agentConfig } = await supabaseAdmin
      .from("agent_configs")
      .select("system_prompt")
      .eq("user_id", userId)
      .eq("agent_type", currentAgent)
      .maybeSingle();

    let systemPrompt: string;

    if (agentConfig?.system_prompt) {
      systemPrompt = agentConfig.system_prompt;
    } else {
      // Legacy fallback with split instruction
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

      systemPrompt = `${legacyAgent?.prompt || "Você é um assistente inteligente de atendimento."}\n\nTom de voz: ${legacyAgent?.voice_tone || "Profissional e empático"}${businessContext}\n\nResponda de forma concisa e natural, como em uma conversa de WhatsApp.\n\n${SPLIT_INSTRUCTION}`;
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

    // Inject memory + audio context into prompt
    const memoryContext = buildConversationContext(memory, contactPhone);
    const audioContext = isFromAudio ? "\n\n[NOTA] Esta mensagem foi transcrita de um áudio. Pode conter erros de fala." : "";
    const fullPrompt = systemPrompt + memoryContext + audioContext;

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

    // === Parse and send ===
    const { messages: replyMessages, intent, parsedJson } = parseAIResponse(rawReply);

    const replyInstance = instanceName || `six-${userId.slice(0, 8)}`;
    await sendSplitMessages(contactPhone, replyMessages, replyInstance);
    console.log(`Sent ${replyMessages.length} messages to ${contactPhone} (typing simulation enabled)`);

    // === Handle intents (handoff between agents) ===
    if (intent && lead?.id) {
      console.log(`Intent detected: ${intent} for lead ${lead.id}`);

      if (intent === "schedule") {
        await supabaseAdmin
          .from("leads")
          .update({ current_agent: "scheduler", status: "awaiting_schedule" })
          .eq("id", lead.id);
      }

      if (intent === "booked" && parsedJson) {
        try {
          if (parsedJson.datetime && parsedJson.service) {
            const dt = new Date(parsedJson.datetime as string);
            const durationMinutes = 60;
            const endDt = new Date(dt.getTime() + durationMinutes * 60000);

            const { data: newAppointment } = await supabaseAdmin.from("appointments").insert({
              user_id: userId,
              lead_id: lead.id,
              lead_name: (parsedJson.contact_name as string) || contactName,
              service: parsedJson.service as string,
              date: dt.toISOString().split("T")[0],
              time: dt.toTimeString().slice(0, 5),
              status: "confirmed",
            }).select("id").single();
            console.log("Appointment created from intent");

            // Try to create Google Calendar event
            try {
              const calendarRes = await fetch(
                `${Deno.env.get("SUPABASE_URL")}/functions/v1/create-calendar-event`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                  },
                  body: JSON.stringify({
                    user_id: userId,
                    appointment_id: newAppointment?.id,
                    summary: `${(parsedJson.contact_name as string) || contactName} — ${parsedJson.service}`,
                    description: `Agendado via SIX AI\nContato: ${contactPhone}`,
                    start_datetime: dt.toISOString(),
                    end_datetime: endDt.toISOString(),
                    timezone: "America/Sao_Paulo",
                  }),
                }
              );
              const calResult = await calendarRes.json();
              if (calendarRes.ok) {
                console.log("Google Calendar event created:", calResult.google_event_id);
              } else {
                console.log("Google Calendar not available:", calResult.error);
              }
            } catch (calErr) {
              console.warn("Google Calendar integration error (non-fatal):", calErr);
            }
          }
        } catch (e) {
          console.error("Error creating appointment:", e);
        }

        await supabaseAdmin
          .from("leads")
          .update({ current_agent: "attendant", status: "scheduled" })
          .eq("id", lead.id);
      }

      if (intent === "cancel_schedule") {
        await supabaseAdmin
          .from("leads")
          .update({ current_agent: "attendant" })
          .eq("id", lead.id);
      }
    }

    // === CRM agent evaluation (async, non-blocking feel) ===
    if (lead?.id && currentAgent !== "crm") {
      try {
        const { data: crmConfig } = await supabaseAdmin
          .from("agent_configs")
          .select("system_prompt")
          .eq("user_id", userId)
          .eq("agent_type", "crm")
          .maybeSingle();

        if (crmConfig?.system_prompt) {
          const summary = `Lead: ${contactName}\nEtapa atual: ${lead.status}\nMensagem: ${messageText}\nResposta IA: ${replyMessages.join(" ")}`;

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
                { role: "user", content: summary },
              ],
            }),
          });

          if (crmResponse.ok) {
            const crmData = await crmResponse.json();
            const crmReply = crmData.choices?.[0]?.message?.content || "";
            const crmJson = crmReply.match(/\{[\s\S]*\}/);
            if (crmJson) {
              const decision = JSON.parse(crmJson[0]);
              if (decision.move_to) {
                const stageMap: Record<string, string> = {
                  "Novo": "new",
                  "Em andamento": "in_progress",
                  "Interessado": "interested",
                  "Agendado": "scheduled",
                  "Cliente": "client",
                };
                const newStatus = stageMap[decision.move_to] || decision.move_to;
                await supabaseAdmin.from("leads").update({ status: newStatus }).eq("id", lead.id);
                console.log(`CRM moved lead to ${newStatus}: ${decision.reason}`);
              }
            }
          } else {
            await crmResponse.text();
          }
        }
      } catch (e) {
        console.error("CRM agent error (non-fatal):", e);
      }
    }

    // === Update contact memory with conversation summary ===
    if (memory?.id) {
      const sentimentHint = isFromAudio ? " (via áudio)" : "";
      await supabaseAdmin
        .from("contact_memory")
        .update({
          summary: `Última conversa${sentimentHint}: ${messageText.slice(0, 100)} → ${replyMessages[0]?.slice(0, 100) || ""}`,
          last_topics: messageText.slice(0, 200),
        })
        .eq("id", memory.id);
    }

    return new Response(JSON.stringify({
      status: "ok",
      messages_sent: replyMessages.length,
      intent,
      is_audio: isFromAudio,
    }), {
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
