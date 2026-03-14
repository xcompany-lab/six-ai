import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.0";
import { calculateWhisperCostBRL, updateAiUsage, isAiUsageBlocked } from "../_shared/ai-cost.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// === Audio: get decoded media via Evolution API, then transcribe with Whisper ===

async function getDecodedAudioFromEvolution(
  instanceName: string,
  messageKey: Record<string, unknown>
): Promise<{ base64: string; mimetype: string } | null> {
  const evoUrl = Deno.env.get("EVOLUTION_API_URL");
  const evoKey = Deno.env.get("EVOLUTION_API_KEY");
  if (!evoUrl || !evoKey) {
    console.error("Missing EVOLUTION_API_URL or EVOLUTION_API_KEY");
    return null;
  }

  try {
    console.log(`Fetching decoded media from Evolution for instance ${instanceName}`);
    const resp = await fetch(`${evoUrl}/chat/getBase64FromMediaMessage/${instanceName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: evoKey },
      body: JSON.stringify({ message: { key: messageKey } }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error(`Evolution getBase64 error ${resp.status}: ${errText}`);
      return null;
    }

    const data = await resp.json();
    const base64 = data.base64 || data.mediaBase64 || null;
    const mimetype = data.mimetype || data.mediaType || "audio/ogg";

    if (!base64) {
      console.error("Evolution returned no base64 data:", JSON.stringify(data).slice(0, 300));
      return null;
    }

    console.log(`Got decoded audio: ${base64.length} chars base64, mimetype: ${mimetype}`);
    return { base64, mimetype };
  } catch (e) {
    console.error("Evolution getBase64 fetch error:", e);
    return null;
  }
}

function mimetypeToExtension(mimetype: string): string {
  const map: Record<string, string> = {
    "audio/ogg": "ogg",
    "audio/ogg; codecs=opus": "ogg",
    "audio/oga": "oga",
    "audio/mp4": "m4a",
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/wav": "wav",
    "audio/webm": "webm",
    "audio/flac": "flac",
  };
  return map[mimetype.toLowerCase()] || "ogg";
}

async function transcribeAudioWhisper(audioBlob: Blob, filename: string): Promise<string> {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  if (!OPENAI_API_KEY) {
    console.error("Missing OPENAI_API_KEY");
    return "";
  }

  try {
    console.log(`Sending ${audioBlob.size} bytes to Whisper as "${filename}"`);
    const formData = new FormData();
    formData.append("file", audioBlob, filename);
    formData.append("model", "whisper-1");
    formData.append("language", "pt");

    const resp = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: formData,
    });

    if (resp.ok) {
      const data = await resp.json();
      const text = data.text || "";
      console.log(`Whisper transcribed (${text.length} chars): ${text.slice(0, 100)}`);
      return text;
    }
    const errText = await resp.text();
    console.error(`Whisper API error ${resp.status}: ${errText}`);
  } catch (e) {
    console.error("Whisper transcription error:", e);
  }
  return "";
}

// === Clean phone from JID ===

function cleanPhone(jid: string): string {
  return jid.replace("@s.whatsapp.net", "").replace("@lid", "").replace(/@.*$/, "");
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

    const instanceName = body.instance || "";
    const isLidFormat = remoteJid.endsWith("@lid");

    // Extract real phone: prefer senderPn/previousRemoteJid for @lid messages
    let contactPhone = "";
    const senderPn = (messageData.key as Record<string, unknown>)?.senderPn as string | undefined;
    const previousRemoteJid = (messageData.key as Record<string, unknown>)?.previousRemoteJid as string | undefined;

    if (senderPn) {
      contactPhone = cleanPhone(senderPn);
    } else if (previousRemoteJid && !previousRemoteJid.endsWith("@lid")) {
      contactPhone = cleanPhone(previousRemoteJid);
    } else {
      contactPhone = cleanPhone(remoteJid);
    }

    const contactName = messageData.pushName || contactPhone;

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

      // Find lead — for @lid format, also try via message_queue
      let lead: { id: string } | null = null;
      
      const { data: directLead } = await supabaseAdmin
        .from("leads")
        .select("id")
        .eq("user_id", userId)
        .eq("phone", contactPhone)
        .maybeSingle();
      lead = directLead;

      // If @lid and no direct match, find via recent message_queue
      if (!lead && isLidFormat) {
        const lidNumber = cleanPhone(remoteJid);
        console.log(`@lid detected (${lidNumber}), searching message_queue for recent lead...`);
        const { data: recentQueue } = await supabaseAdmin
          .from("message_queue")
          .select("lead_id, contact_phone")
          .eq("instance_name", instanceName)
          .order("last_message_at", { ascending: false })
          .limit(5);
        
        if (recentQueue?.length) {
          // Use the most recent queue entry for this instance
          const match = recentQueue[0];
          if (match.lead_id) {
            const { data: queueLead } = await supabaseAdmin
              .from("leads")
              .select("id")
              .eq("id", match.lead_id)
              .maybeSingle();
            lead = queueLead;
            console.log(`Resolved @lid to lead ${lead?.id} (phone: ${match.contact_phone})`);
          }
        }
      }

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

    // Create supabase client early (needed for audio blocking check)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // === Resolve user by instance name (needed before audio processing) ===
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

    // === Detect message type and extract text ===
    const { type: msgType, text: directText } = detectMessageType(messageData);
    let messageText = directText;
    let isFromAudio = false;

    if (msgType === "audio") {
      const messageKey = messageData.key as Record<string, unknown> | undefined;
      if (messageKey && instanceName) {
        // Check AI usage limit before transcribing (Whisper costs money too)
        const blocked = await isAiUsageBlocked(supabaseAdmin, userId);
        if (blocked) {
          console.log(`AI usage limit reached for user ${userId} — skipping audio transcription`);
          return new Response(JSON.stringify({ status: "blocked", reason: "ai_usage_limit" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const decoded = await getDecodedAudioFromEvolution(instanceName, messageKey);
        if (decoded) {
          const ext = mimetypeToExtension(decoded.mimetype);
          const binaryStr = atob(decoded.base64);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
          const audioBlob = new Blob([bytes], { type: decoded.mimetype });
          messageText = await transcribeAudioWhisper(audioBlob, `audio.${ext}`);
          isFromAudio = true;

          // Track Whisper transcription cost
          if (messageText) {
            const whisperCostBRL = calculateWhisperCostBRL(audioBlob.size);
            await updateAiUsage(supabaseAdmin, userId, whisperCostBRL);
            console.log(`Whisper cost tracked: ${audioBlob.size} bytes → R$${whisperCostBRL.toFixed(4)}`);
          }
        } else {
          console.error("Failed to decode audio from Evolution API");
        }
      }
    }

    if (!messageText) {
      if (msgType === "audio") {
        console.error(`Audio transcription failed for ${contactPhone} — no text extracted`);
        return new Response(JSON.stringify({ status: "audio_transcription_failed", reason: "could not transcribe audio" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ status: "ignored", reason: "no text" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Message from ${contactName} (${contactPhone}) [${msgType}]: ${messageText.slice(0, 150)}`);

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
