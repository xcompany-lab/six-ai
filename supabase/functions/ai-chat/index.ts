import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claimsData.claims.sub;

    const { messages, contactPhone, agentType } = await req.json();

    // === Try new multi-agent system first ===
    let systemPrompt: string | null = null;

    if (agentType) {
      const { data: agentConfig } = await supabase
        .from("agent_configs")
        .select("system_prompt")
        .eq("user_id", userId)
        .eq("agent_type", agentType)
        .maybeSingle();
      if (agentConfig) systemPrompt = agentConfig.system_prompt;
    }

    // Try default attendant agent
    if (!systemPrompt) {
      const { data: agentConfig } = await supabase
        .from("agent_configs")
        .select("system_prompt")
        .eq("user_id", userId)
        .eq("agent_type", "attendant")
        .maybeSingle();
      if (agentConfig) systemPrompt = agentConfig.system_prompt;
    }

    // === Fallback to legacy ai_agent_config ===
    if (!systemPrompt) {
      const { data: agentConfig } = await supabase
        .from("ai_agent_config")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      const { data: profile } = await supabase
        .from("profiles")
        .select("brand_name, niche, services, business_description, business_hours, voice_tone")
        .eq("id", userId)
        .maybeSingle();

      const basePrompt = agentConfig?.prompt || "Você é um assistente inteligente de atendimento.";
      const voiceTone = agentConfig?.voice_tone || profile?.voice_tone || "Profissional e empático";
      const prohibited = agentConfig?.prohibited_words ? `\nPalavras proibidas (NUNCA use): ${agentConfig.prohibited_words}` : "";
      const faq = agentConfig?.faq ? `\n\nFAQ:\n${agentConfig.faq}` : "";
      const knowledge = agentConfig?.knowledge_base ? `\n\nBase de Conhecimento:\n${agentConfig.knowledge_base}` : "";
      const pitch = agentConfig?.pitch ? `\n\nPitch:\n${agentConfig.pitch}` : "";
      const objections = agentConfig?.objections ? `\n\nTratamento de Objeções:\n${agentConfig.objections}` : "";
      const outOfScope = agentConfig?.out_of_scope ? `\n\nQuando não souber responder: ${agentConfig.out_of_scope}` : "";
      const businessContext = profile ? `\nEmpresa: ${profile.brand_name || "N/A"}\nNicho: ${profile.niche || "N/A"}\nServiços: ${(profile.services || []).join(", ")}\nDescrição: ${profile.business_description || "N/A"}\nHorário: ${profile.business_hours || "N/A"}` : "";

      systemPrompt = `${basePrompt}\n\nTom de voz: ${voiceTone}\nEnergia: ${agentConfig?.energy || "Moderada"}${prohibited}${businessContext}${faq}${knowledge}${pitch}${objections}${outOfScope}`;
    }

    // Load contact memory if available
    if (contactPhone) {
      const { data: contactMemory } = await supabase
        .from("contact_memory")
        .select("*")
        .eq("user_id", userId)
        .eq("contact_phone", contactPhone)
        .maybeSingle();

      if (contactMemory) {
        systemPrompt += `\n\nMemória do contato ${contactMemory.contact_name || contactPhone}:\nResumo: ${contactMemory.summary}\nPreferências: ${contactMemory.preferences}\nÚltimos tópicos: ${contactMemory.last_topics}\nSentimento: ${contactMemory.sentiment}\nInterações: ${contactMemory.interaction_count}`;
      }
    }

    // Inject current date
    const hoje = new Date().toLocaleDateString("pt-BR", {
      weekday: "long", day: "2-digit", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });
    systemPrompt += `\n\n[CONTEXTO TEMPORAL]\nData e hora atual: ${hoje}\nCalcule datas relativas a partir desta data. NUNCA invente datas.`;
    systemPrompt += `\n\nIMPORTANTE: Na interface web, responda de forma concisa e natural.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no gateway de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
