import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

// === Extract audio base64 ===

function extractAudioBase64(messageData: Record<string, unknown>): string | null {
  const msg = messageData.message as Record<string, unknown> | undefined;
  if (!msg) return null;
  const audioMsg = msg.audioMessage as Record<string, unknown> | undefined;
  if (audioMsg?.base64) return audioMsg.base64 as string;
  if (msg.base64) return msg.base64 as string;
  return null;
}

// === Detect message type ===

function detectMessageType(messageData: Record<string, unknown>): { type: string; text: string } {
  const msg = messageData.message as Record<string, unknown> | undefined;
  if (!msg) return { type: "unknown", text: "" };

  const explicitType = messageData.messageType as string | undefined;
  if (explicitType === "audioMessage") return { type: "audio", text: "" };

  const keys = Object.keys(msg);
  if (keys.includes("audioMessage")) return { type: "audio", text: "" };

  const text =
    (msg.conversation as string) ||
    ((msg.extendedTextMessage as Record<string, unknown>)?.text as string) ||
    "";

  return { type: text ? "text" : "unknown", text };
}

// === Main webhook handler — now just enqueues messages ===

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
    if (!messageData) {
      return new Response(JSON.stringify({ status: "ignored", reason: "no data" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isFromMe = !!messageData.key?.fromMe;

    // Ignore group messages
    const remoteJid = messageData.key?.remoteJid || "";
    if (remoteJid.endsWith("@g.us")) {
      return new Response(JSON.stringify({ status: "ignored", reason: "group message" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contactPhone = remoteJid.replace("@s.whatsapp.net", "");
    const contactName = messageData.pushName || contactPhone;
    const instanceName = body.instance || "";

    // === Handle outgoing messages (human takeover + commands) ===
    if (isFromMe) {
      const { type: msgType, text: directText } = detectMessageType(messageData);
      const messageText = directText;
      if (!messageText) {
        return new Response(JSON.stringify({ status: "ignored", reason: "fromMe no text" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      // Resolve user by instance
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
        return new Response(JSON.stringify({ status: "ignored", reason: "fromMe no user" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Find lead
      const { data: lead } = await supabaseAdmin
        .from("leads")
        .select("id")
        .eq("user_id", userId)
        .eq("phone", contactPhone)
        .maybeSingle();

      if (!lead) {
        return new Response(JSON.stringify({ status: "ignored", reason: "fromMe no lead" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Load AI config (takeover + commands)
      const { data: aiConfig } = await supabaseAdmin
        .from("ai_agent_config")
        .select("human_takeover_minutes, stop_command, activate_command")
        .eq("user_id", userId)
        .maybeSingle();

      const stopCommand = aiConfig?.stop_command || "/parar";
      const activateCommand = aiConfig?.activate_command || "/ativar";
      const trimmedText = messageText.trim();

      // === Check for stop/activate commands ===
      if (trimmedText === stopCommand) {
        await supabaseAdmin
          .from("leads")
          .update({ ai_stopped: true })
          .eq("id", lead.id);
        console.log(`AI STOPPED for lead ${lead.id} via command "${stopCommand}"`);
        return new Response(JSON.stringify({ status: "ai_stopped", lead_id: lead.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (trimmedText === activateCommand) {
        await supabaseAdmin
          .from("leads")
          .update({ ai_stopped: false, human_takeover_until: null })
          .eq("id", lead.id);
        console.log(`AI ACTIVATED for lead ${lead.id} via command "${activateCommand}"`);
        return new Response(JSON.stringify({ status: "ai_activated", lead_id: lead.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // === Normal human takeover flow ===
      const takeoverMinutes = aiConfig?.human_takeover_minutes || 30;
      const takeoverUntil = new Date(Date.now() + takeoverMinutes * 60 * 1000).toISOString();

      await supabaseAdmin
        .from("leads")
        .update({ human_takeover_until: takeoverUntil })
        .eq("id", lead.id);

      // Save message to conversation history
      await supabaseAdmin.from("conversation_messages").insert({
        user_id: userId,
        lead_id: lead.id,
        role: "assistant_human",
        content: messageText,
      });

      // Update contact memory
      const { data: memory } = await supabaseAdmin
        .from("contact_memory")
        .select("id, interaction_count")
        .eq("user_id", userId)
        .eq("contact_phone", contactPhone)
        .maybeSingle();

      if (memory) {
        await supabaseAdmin.from("contact_memory").update({
          interaction_count: (memory.interaction_count || 0) + 1,
          last_topics: messageText.slice(0, 200),
          last_interaction_at: new Date().toISOString(),
        }).eq("id", memory.id);
      }

      console.log(`Human takeover detected for lead ${lead.id} — paused for ${takeoverMinutes}min`);

      return new Response(JSON.stringify({ status: "human_takeover", lead_id: lead.id, until: takeoverUntil }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    // === Incoming message processing (from lead) ===

    // === Detect message type and extract text ===
    const { type: msgType, text: directText } = detectMessageType(messageData);
    let messageText = directText;
    let isFromAudio = false;

    if (msgType === "audio") {
      const audioBase64 = extractAudioBase64(messageData);
      if (audioBase64) {
        messageText = await transcribeAudio(audioBase64);
        isFromAudio = true;
      }
    }

    if (!messageText) {
      return new Response(JSON.stringify({ status: "ignored", reason: "no text" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Message from ${contactName} (${contactPhone}) [${msgType}]: ${messageText.slice(0, 150)}`);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // === Resolve user by instance name ===
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
      .select("id, phone, name, status, current_agent")
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
        .select("id, phone, name, status, current_agent")
        .single();
      lead = newLead;
    }

    if (!lead) {
      console.error("Failed to create/find lead");
      return new Response(JSON.stringify({ status: "error", reason: "no lead" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === Helper: send WhatsApp message ===
    async function sendAutoReply(phone: string, text: string, instance: string) {
      const evoUrl = Deno.env.get("EVOLUTION_API_URL");
      const evoKey = Deno.env.get("EVOLUTION_API_KEY");
      if (!evoUrl || !evoKey) return;
      try {
        await fetch(`${evoUrl}/message/sendText/${instance}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: evoKey },
          body: JSON.stringify({ number: phone, text }),
        });
      } catch (e) {
        console.error("Auto-reply send error:", e);
      }
    }

    // === Detect confirmation responses ===
    const confirmationRegex = /^(sim|confirmo|confirmado|confirmar|ok|yes)\b/i;
    if (confirmationRegex.test(messageText.trim())) {
      const { data: sentReminder } = await supabaseAdmin
        .from("scheduled_reminders")
        .select("id, appointment_id")
        .eq("user_id", userId)
        .eq("contact_phone", contactPhone)
        .eq("status", "sent")
        .order("send_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sentReminder) {
        await supabaseAdmin
          .from("scheduled_reminders")
          .update({ status: "confirmed" })
          .eq("id", sentReminder.id);

        let replyText = `✅ Obrigado pela confirmação, ${contactName}! Te esperamos no horário combinado. 😊`;

        if (sentReminder.appointment_id) {
          await supabaseAdmin
            .from("appointments")
            .update({ status: "confirmed" })
            .eq("id", sentReminder.appointment_id);

          const { data: appt } = await supabaseAdmin
            .from("appointments")
            .select("date, time, service")
            .eq("id", sentReminder.appointment_id)
            .maybeSingle();

          if (appt) {
            const dateFormatted = new Date(appt.date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
            const timeFormatted = String(appt.time).slice(0, 5);
            const servicePart = appt.service ? ` para *${appt.service}*` : "";
            replyText = `✅ Obrigado pela confirmação, ${contactName}! Te esperamos no dia *${dateFormatted}* às *${timeFormatted}*${servicePart}. 😊`;
          }
        }

        await sendAutoReply(contactPhone, replyText, instanceName);
        await supabaseAdmin.from("conversation_messages").insert({
          user_id: userId, lead_id: lead.id, role: "assistant", content: replyText,
        });

        console.log(`Confirmation detected from ${contactPhone} — reminder ${sentReminder.id} confirmed`);

        // Skip normal queue — already handled
        return new Response(JSON.stringify({ status: "confirmed", lead_id: lead.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // === Detect cancellation responses ===
    const cancellationRegex = /^(não|nao|cancelar|cancela|cancelado|não posso|nao posso|no)\b/i;
    if (cancellationRegex.test(messageText.trim())) {
      const { data: sentReminder } = await supabaseAdmin
        .from("scheduled_reminders")
        .select("id, appointment_id")
        .eq("user_id", userId)
        .eq("contact_phone", contactPhone)
        .eq("status", "sent")
        .order("send_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sentReminder) {
        await supabaseAdmin
          .from("scheduled_reminders")
          .update({ status: "cancelled" })
          .eq("id", sentReminder.id);

        let replyText = `Entendido, ${contactName}. Seu agendamento foi cancelado. Se quiser reagendar, é só me avisar! 😉`;

        if (sentReminder.appointment_id) {
          await supabaseAdmin
            .from("appointments")
            .update({ status: "cancelled" })
            .eq("id", sentReminder.appointment_id);
        }

        await sendAutoReply(contactPhone, replyText, instanceName);
        await supabaseAdmin.from("conversation_messages").insert({
          user_id: userId, lead_id: lead.id, role: "assistant", content: replyText,
        });

        console.log(`Cancellation detected from ${contactPhone} — reminder ${sentReminder.id} cancelled`);

        return new Response(JSON.stringify({ status: "cancelled", lead_id: lead.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // === Enqueue message instead of processing immediately ===
    // Check if there's already a pending queue for this lead
    const { data: existingQueue } = await supabaseAdmin
      .from("message_queue")
      .select("id, messages")
      .eq("lead_id", lead.id)
      .eq("status", "pending")
      .maybeSingle();

    const newMessage = {
      text: messageText,
      is_audio: isFromAudio,
      timestamp: new Date().toISOString(),
    };

    if (existingQueue) {
      // Append to existing queue
      const currentMessages = (existingQueue.messages as unknown[]) || [];
      await supabaseAdmin
        .from("message_queue")
        .update({
          messages: [...currentMessages, newMessage],
          last_message_at: new Date().toISOString(),
          contact_name: contactName,
          is_audio: isFromAudio,
        })
        .eq("id", existingQueue.id);
      console.log(`Appended to existing queue for lead ${lead.id} (${currentMessages.length + 1} messages)`);
    } else {
      // Create new queue entry
      await supabaseAdmin
        .from("message_queue")
        .insert({
          user_id: userId,
          lead_id: lead.id,
          contact_phone: contactPhone,
          contact_name: contactName,
          instance_name: instanceName,
          messages: [newMessage],
          last_message_at: new Date().toISOString(),
          status: "pending",
          is_audio: isFromAudio,
        });
      console.log(`Created new queue for lead ${lead.id}`);
    }

    // === Save user message to conversation history ===
    await supabaseAdmin.from("conversation_messages").insert({
      user_id: userId,
      lead_id: lead.id,
      role: "user",
      content: messageText,
    });

    // === Update contact memory ===
    const { data: memory } = await supabaseAdmin
      .from("contact_memory")
      .select("id, interaction_count")
      .eq("user_id", userId)
      .eq("contact_phone", contactPhone)
      .maybeSingle();

    if (!memory) {
      await supabaseAdmin.from("contact_memory").insert({
        user_id: userId,
        contact_phone: contactPhone,
        contact_name: contactName,
        interaction_count: 1,
        last_topics: messageText.slice(0, 200),
        last_interaction_at: new Date().toISOString(),
      });
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

    return new Response(JSON.stringify({
      status: "queued",
      lead_id: lead.id,
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
