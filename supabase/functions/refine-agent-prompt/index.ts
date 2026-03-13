import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const agentLabels: Record<string, string> = {
  attendant: "Atendente",
  scheduler: "Agendador",
  followup: "Follow-up",
  crm: "CRM",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { current_prompt, user_instruction, agent_type } = await req.json();

    if (!current_prompt || !user_instruction || !agent_type) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const label = agentLabels[agent_type] || agent_type;

    const metaPrompt = `Você é um especialista em engenharia de system prompts para agentes de IA de atendimento ao cliente via WhatsApp.

Você recebeu o system prompt atual do agente "${label}". O usuário solicitou a seguinte alteração ou incremento:

"""${user_instruction}"""

Sua tarefa: reescrever o prompt COMPLETO incorporando a alteração solicitada. Mantenha TODA a estrutura, regras e instruções existentes. Apenas adicione, modifique ou remova o que foi pedido.

Retorne APENAS o novo prompt completo, sem explicações, comentários ou formatação extra. Não adicione marcadores como \`\`\` ou "System Prompt:".

Prompt atual:
"""
${current_prompt}
"""`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: metaPrompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 8192 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini error:", geminiRes.status, errText);
      throw new Error("Gemini API error");
    }

    const geminiData = await geminiRes.json();
    const newPrompt = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!newPrompt) throw new Error("Empty response from Gemini");

    return new Response(JSON.stringify({ refined_prompt: newPrompt }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("refine-agent-prompt error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
