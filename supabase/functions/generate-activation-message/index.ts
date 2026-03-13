import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { campaign_id, filter_type, filter_days_since, user_prompt } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user's business profile for context (prefer business_profiles, fallback to profiles)
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!
    ).auth.getUser(token);

    let businessContext = "";
    if (user) {
      // Try business_profiles first (richer data from onboarding)
      const { data: bp } = await supabaseAdmin.from("business_profiles").select("business_name, segment, tone, services, faq, objections, qualified_lead_criteria").eq("user_id", user.id).single();
      if (bp) {
        const services = Array.isArray(bp.services) ? (bp.services as string[]).join(", ") : "";
        const faqItems = Array.isArray(bp.faq) ? (bp.faq as { q: string; a: string }[]).map(f => `P: ${f.q} R: ${f.a}`).join(" | ") : "";
        businessContext = `Negócio: ${bp.business_name}. Segmento: ${bp.segment}. Tom: ${bp.tone}. Serviços: ${services}. Critério de lead qualificado: ${bp.qualified_lead_criteria}.${faqItems ? ` FAQ: ${faqItems}.` : ""}`;
      } else {
        // Fallback to profiles table
        const { data: profile } = await supabaseAdmin.from("profiles").select("brand_name, niche, services, voice_tone").eq("id", user.id).single();
        if (profile) {
          businessContext = `Negócio: ${profile.brand_name || ""}. Nicho: ${profile.niche || ""}. Serviços: ${(profile.services || []).join(", ")}. Tom: ${profile.voice_tone || "Profissional e empático"}.`;
        }
      }
    }

    const filterDescriptions: Record<string, string> = {
      old_leads: "leads que não entram em contato há mais de " + filter_days_since + " dias",
      no_response: "leads que não responderam a última mensagem",
      evaluated: "clientes que fizeram avaliação mas não retornaram",
      no_show: "clientes que agendaram mas não compareceram",
      old_clients: "clientes antigos inativos há mais de " + filter_days_since + " dias",
    };

    const systemPrompt = `Você é um copywriter especialista em reativação de clientes via WhatsApp. Gere UMA mensagem curta (máx 300 caracteres), humanizada, persuasiva e personalizada para o contexto abaixo. Use emojis com moderação. A mensagem deve ter um CTA claro. Use {nome} como placeholder para o nome do contato.

${businessContext}

Público-alvo: ${filterDescriptions[filter_type] || filter_type}.
${user_prompt ? `Orientação adicional do usuário: ${user_prompt}` : ""}

Responda APENAS com o texto da mensagem, sem aspas ou explicação.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Gere a mensagem de reativação." },
        ],
      }),
    });

    if (!aiRes.ok) {
      const status = aiRes.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Limite de requisições IA excedido. Tente novamente em instantes." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Créditos de IA insuficientes." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI gateway error: " + status);
    }

    const aiData = await aiRes.json();
    const suggestion = aiData.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ suggestion }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-activation-message error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
