import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SPLIT_INSTRUCTION = `
FORMATO DE RESPOSTA OBRIGATÓRIO:
Sempre retorne um JSON com a chave "messages" contendo um array de strings.
Cada string é uma mensagem separada enviada individualmente no WhatsApp.
Escreva como um humano digitando: frases curtas, uma ideia por mensagem, máximo 2 linhas por item.
Nunca envie um parágrafo longo em uma única mensagem.

Exemplo correto:
{"messages": ["Oi, tudo bem?", "Posso te ajudar com o agendamento?"], "intent": null}

Se a mensagem do usuário vier de uma transcrição de áudio, pode conter erros de fala.
Interprete com contexto e responda ao significado, não à forma escrita.
`;

const DEBOUNCE_SECONDS = 10;

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
      body: JSON.stringify({ number: phone, presence: composing ? "composing" : "paused" }),
    }).then((r) => r.text());
  } catch (e) {
    console.warn("Typing indicator error:", e);
  }
}

async function sendSplitMessages(phone: string, messages: string[], instanceName: string) {
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];

    // Simulate reading the previous message before replying (first message: reading user's msg)
    if (i === 0) {
      await sleep(Math.floor(Math.random() * 800) + 500); // 500-1300ms to "read"
    }

    // Start typing indicator
    await setTypingIndicator(phone, instanceName, true);

    // Realistic typing speed: ~4 chars/sec for a human on mobile
    // Add variance: ±30% randomness
    const baseCharsPerSec = 4;
    const baseTime = (msg.length / baseCharsPerSec) * 1000;
    const variance = baseTime * (0.7 + Math.random() * 0.6); // 70%-130% of base
    const typingTime = Math.min(12000, Math.max(1200, variance)); // 1.2s min, 12s max

    await sleep(typingTime);

    // Send the message
    await sendWhatsAppMessage(phone, msg, instanceName);

    // Pause between messages: simulate thinking/reading before next message
    if (i < messages.length - 1) {
      await setTypingIndicator(phone, instanceName, false);
      const thinkingPause = Math.floor(Math.random() * 1200) + 800; // 800-2000ms
      await sleep(thinkingPause);
    }
  }
  await setTypingIndicator(phone, instanceName, false);
}

// === Parse AI response ===

function parseAIResponse(rawReply: string): { messages: string[]; intent: string | null; parsedJson: Record<string, unknown> | null } {
  // Handle empty/whitespace-only replies
  if (!rawReply || !rawReply.trim()) {
    return {
      messages: ["Deixa eu verificar isso e já te respondo! 😊"],
      intent: null,
      parsedJson: null,
    };
  }

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
    console.log("Could not parse JSON, using as plain text");
  }

  if (messages.length === 0) {
    // Clean markdown artifacts
    const cleaned = rawReply.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    messages = cleaned
      .split(/\n\n|\n/)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0 && !s.startsWith("{") && !s.startsWith("```"));
    if (messages.length === 0) {
      messages = ["Deixa eu verificar isso e já te respondo! 😊"];
    }
  }

  return { messages, intent, parsedJson };
}

// === Get current Brazilian date ===

function getBrazilianDateTime(): string {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

// === Main processor ===

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find pending queues that have been idle for at least DEBOUNCE_SECONDS
    const cutoff = new Date(Date.now() - DEBOUNCE_SECONDS * 1000).toISOString();

    const { data: pendingQueues, error: fetchError } = await supabaseAdmin
      .from("message_queue")
      .select("*")
      .eq("status", "pending")
      .lte("last_message_at", cutoff)
      .limit(10);

    if (fetchError) {
      console.error("Error fetching queue:", fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!pendingQueues || pendingQueues.length === 0) {
      return new Response(JSON.stringify({ status: "no_pending" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing ${pendingQueues.length} queued conversations`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let processed = 0;

    for (const queue of pendingQueues) {
      // Mark as processing to prevent double-processing
      const { error: lockError } = await supabaseAdmin
        .from("message_queue")
        .update({ status: "processing" })
        .eq("id", queue.id)
        .eq("status", "pending");

      if (lockError) {
        console.warn(`Could not lock queue ${queue.id}, skipping`);
        continue;
      }

      try {
        await processQueueItem(supabaseAdmin, queue, LOVABLE_API_KEY);
        processed++;
      } catch (e) {
        console.error(`Error processing queue ${queue.id}:`, e);
        // Mark as done even on error to prevent infinite retries
      }

      // Mark as done
      await supabaseAdmin
        .from("message_queue")
        .update({ status: "done" })
        .eq("id", queue.id);
    }

    return new Response(JSON.stringify({ status: "ok", processed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("process-message-queue error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function processQueueItem(
  supabaseAdmin: ReturnType<typeof createClient>,
  queue: Record<string, unknown>,
  LOVABLE_API_KEY: string
) {
  const userId = queue.user_id as string;
  const leadId = queue.lead_id as string;
  const contactPhone = queue.contact_phone as string;
  const contactName = queue.contact_name as string;
  const instanceName = queue.instance_name as string;
  const queuedMessages = queue.messages as Array<{ text: string; is_audio?: boolean }>;
  const hasAudio = queue.is_audio as boolean;

  // Concatenate all queued messages into one
  const combinedText = queuedMessages.map((m) => m.text).join("\n");
  console.log(`Processing queue for ${contactName} (${contactPhone}): ${combinedText.slice(0, 200)}`);

  // === Load lead ===
  const { data: lead } = await supabaseAdmin
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single();

  if (!lead) {
    console.error(`Lead ${leadId} not found`);
    return;
  }

  const currentAgent = lead.current_agent || "attendant";

  // === Load agent config ===
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

    systemPrompt = `${legacyAgent?.prompt || "Você é um assistente inteligente de atendimento."}\n\nTom de voz: ${legacyAgent?.voice_tone || "Profissional e empático"}${businessContext}\n\n${SPLIT_INSTRUCTION}`;
  }

  // === Inject current date ===
  const hoje = getBrazilianDateTime();
  systemPrompt += `\n\n[CONTEXTO TEMPORAL]\nData e hora atual: ${hoje}\nUse isso para calcular "próxima segunda-feira", "amanhã", etc.\nNUNCA invente datas — calcule sempre a partir da data atual acima.`;

  // === Load contact memory ===
  const { data: memory } = await supabaseAdmin
    .from("contact_memory")
    .select("*")
    .eq("user_id", userId)
    .eq("contact_phone", contactPhone)
    .maybeSingle();

  if (memory) {
    systemPrompt += `\n\n[CONTEXTO DO CONTATO]\nNome: ${memory.contact_name || contactPhone}\nResumo anterior: ${memory.summary || "Primeiro contato"}\nPreferências: ${memory.preferences || "Desconhecidas"}\nÚltimos tópicos: ${memory.last_topics || "N/A"}\nSentimento: ${memory.sentiment || "Neutro"}\nInterações: ${memory.interaction_count || 1}`;
  }

  // === Audio context ===
  if (hasAudio) {
    systemPrompt += "\n\n[NOTA] Uma ou mais mensagens foram transcritas de áudio. Pode conter erros de fala.";
  }

  // === Load conversation history (last 15 messages) ===
  const { data: history } = await supabaseAdmin
    .from("conversation_messages")
    .select("role, content")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: true })
    .limit(30);

  // Build messages array: history + current combined message
  const conversationMessages: Array<{ role: string; content: string }> = [];

  if (history && history.length > 0) {
    // Take last 15 exchanges (skip the very last user messages since they're in combinedText)
    // The latest user messages are already in the queue
    const historyWithoutCurrent = history.slice(0, -queuedMessages.length);
    for (const msg of historyWithoutCurrent.slice(-15)) {
      conversationMessages.push({ role: msg.role, content: msg.content });
    }
  }

  // Add the combined current message
  conversationMessages.push({ role: "user", content: combinedText });

  // === Call AI with retry ===
  let rawReply = "";
  for (let attempt = 0; attempt < 2; attempt++) {
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
          ...conversationMessages,
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error(`AI error (attempt ${attempt + 1}):`, aiResponse.status, errText);
      if (attempt === 1) {
        // Final fallback: send a friendly message
        await sendSplitMessages(contactPhone, ["Estou com uma instabilidade momentânea. Pode repetir sua mensagem em alguns instantes? 😊"], instanceName);
        return;
      }
      await sleep(2000);
      continue;
    }

    const aiData = await aiResponse.json();
    rawReply = aiData.choices?.[0]?.message?.content || "";
    console.log(`Raw AI reply (attempt ${attempt + 1}): ${rawReply.slice(0, 200)}`);

    if (rawReply.trim()) break;
    if (attempt === 0) {
      console.log("Empty reply, retrying...");
      await sleep(1000);
    }
  }

  // === Parse and send ===
  const { messages: replyMessages, intent, parsedJson } = parseAIResponse(rawReply);

  await sendSplitMessages(contactPhone, replyMessages, instanceName);
  console.log(`Sent ${replyMessages.length} messages to ${contactPhone}`);

  // === Save assistant messages to conversation history ===
  const fullReply = replyMessages.join("\n");
  await supabaseAdmin.from("conversation_messages").insert({
    user_id: userId,
    lead_id: leadId,
    role: "assistant",
    content: fullReply,
  });

  // === Handle intents ===
  if (intent && leadId) {
    console.log(`Intent detected: ${intent}`);

    if (intent === "schedule") {
      await supabaseAdmin
        .from("leads")
        .update({ current_agent: "scheduler", status: "awaiting_schedule" })
        .eq("id", leadId);
    }

    if (intent === "booked" && parsedJson) {
      try {
        if (parsedJson.datetime && parsedJson.service) {
          const dt = new Date(parsedJson.datetime as string);
          const endDt = new Date(dt.getTime() + 60 * 60000);

          const { data: newAppointment } = await supabaseAdmin.from("appointments").insert({
            user_id: userId,
            lead_id: leadId,
            lead_name: (parsedJson.contact_name as string) || contactName,
            service: parsedJson.service as string,
            date: dt.toISOString().split("T")[0],
            time: dt.toTimeString().slice(0, 5),
            status: "confirmed",
          }).select("id").single();
          console.log("Appointment created from intent");

          // Google Calendar
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
            }
          } catch (calErr) {
            console.warn("Google Calendar error (non-fatal):", calErr);
          }
        }
      } catch (e) {
        console.error("Error creating appointment:", e);
      }

      await supabaseAdmin
        .from("leads")
        .update({ current_agent: "attendant", status: "scheduled" })
        .eq("id", leadId);
    }

    if (intent === "cancel_schedule") {
      await supabaseAdmin
        .from("leads")
        .update({ current_agent: "attendant" })
        .eq("id", leadId);
    }

    if (intent === "human_handoff") {
      await supabaseAdmin
        .from("leads")
        .update({ ai_status: "handoff", next_step: "Encaminhar para atendimento humano" })
        .eq("id", leadId);
    }
  }

  // === CRM agent evaluation ===
  if (lead.current_agent !== "crm") {
    try {
      const { data: crmConfig } = await supabaseAdmin
        .from("agent_configs")
        .select("system_prompt")
        .eq("user_id", userId)
        .eq("agent_type", "crm")
        .maybeSingle();

      if (crmConfig?.system_prompt) {
        const summary = `Lead: ${contactName}\nEtapa atual: ${lead.status}\nMensagem: ${combinedText}\nResposta IA: ${replyMessages.join(" ")}`;

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
                "Novo": "new", "Em andamento": "in_progress",
                "Interessado": "interested", "Agendado": "scheduled", "Cliente": "client",
              };
              const newStatus = stageMap[decision.move_to] || decision.move_to;
              await supabaseAdmin.from("leads").update({ status: newStatus }).eq("id", leadId);
              console.log(`CRM moved lead to ${newStatus}: ${decision.reason}`);
            }
          }
        } else {
          await crmResponse.text();
        }
      }
    } catch (e) {
      console.error("CRM agent error:", e);
    }
  }

  // === Update contact memory ===
  if (memory?.id) {
    await supabaseAdmin
      .from("contact_memory")
      .update({
        summary: `Última conversa: ${combinedText.slice(0, 100)} → ${replyMessages[0]?.slice(0, 100) || ""}`,
        last_topics: combinedText.slice(0, 200),
      })
      .eq("id", memory.id);
  }
}
