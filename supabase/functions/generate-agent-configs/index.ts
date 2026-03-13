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

function buildAttendantPrompt(bp: Record<string, unknown>): string {
  const services = Array.isArray(bp.services) ? (bp.services as string[]).join(", ") : JSON.stringify(bp.services);
  const faq = Array.isArray(bp.faq) ? (bp.faq as { q: string; a: string }[]).map((f) => `P: ${f.q}\nR: ${f.a}`).join("\n\n") : "";
  const objections = Array.isArray(bp.objections) ? (bp.objections as { objection: string; response: string }[]).map((o) => `Objeção: ${o.objection}\nResposta: ${o.response}`).join("\n\n") : "";

  return `[IDENTIDADE]
Você é a assistente virtual de ${bp.business_name}, um negócio de ${bp.segment}.
Seu tom é ${bp.tone}. Responda dúvidas sobre ${services}.

[NEGÓCIO]
Serviços oferecidos: ${services}

[FAQ]
${faq || "Nenhuma FAQ cadastrada ainda."}

[OBJEÇÕES]
${objections || "Nenhuma objeção cadastrada ainda."}

[REGRAS]
- Nunca invente informações sobre preços ou disponibilidade
- Não agende diretamente — quando o cliente demonstrar interesse em agendar, retorne exatamente: {"intent": "schedule"} dentro do JSON
- Nunca envie parágrafos longos
- Seja natural e empático

[HANDOFF]
- Se o cliente quiser agendar: retorne {"intent": "schedule"} no JSON de resposta
- Se o cliente tiver uma dúvida que você não sabe responder: retorne {"intent": "human_handoff"}

${SPLIT_INSTRUCTION}`;
}

function buildSchedulerPrompt(bp: Record<string, unknown>): string {
  const services = Array.isArray(bp.services) ? (bp.services as string[]).join(", ") : JSON.stringify(bp.services);
  const workingHours = typeof bp.working_hours === "object" ? JSON.stringify(bp.working_hours) : String(bp.working_hours || "Não configurado");

  return `[IDENTIDADE]
Você é a assistente de agendamento de ${bp.business_name}.

[NEGÓCIO]
Horários disponíveis: ${workingHours}
Serviços: ${services}

[REGRAS]
- Confirme nome, serviço desejado, data e hora
- Após confirmação retorne: {"intent": "booked", "datetime": "YYYY-MM-DDTHH:mm", "service": "nome_do_servico", "contact_name": "nome_do_cliente"} dentro do JSON
- Nunca quebre o fluxo da conversa
- Se o cliente desistir do agendamento, retorne {"intent": "cancel_schedule"}

[HANDOFF]
- Após agendamento confirmado: retorne intent "booked"
- Se desistir: retorne intent "cancel_schedule" para voltar ao atendente

${SPLIT_INSTRUCTION}`;
}

function buildFollowupPrompt(bp: Record<string, unknown>): string {
  return `[IDENTIDADE]
Você é a assistente de follow-up de ${bp.business_name}, negócio de ${bp.segment}.
Tom de voz: ${bp.tone}.

[REGRAS]
- Seja natural, não robótico
- Não mencione que é um follow-up automático
- Máximo 2-3 mensagens curtas
- Retorne {"intent": "responded"} se o cliente responder positivamente
- Retorne {"intent": "no_interest"} se o cliente não tiver interesse

[HANDOFF]
- Se o cliente demonstrar interesse em agendar: retorne {"intent": "schedule"}
- Se responder positivamente: retorne {"intent": "responded"}

${SPLIT_INSTRUCTION}`;
}

function buildCRMPrompt(bp: Record<string, unknown>): string {
  const stages = Array.isArray(bp.funnel_stages) ? (bp.funnel_stages as string[]).join(", ") : "Novo, Em andamento, Interessado, Agendado, Cliente";

  return `[IDENTIDADE]
Você é o agente de CRM de ${bp.business_name}. Sua função é analisar conversas e decidir movimentações no funil.

[NEGÓCIO]
Etapas disponíveis do funil: ${stages}
Critério de lead qualificado: ${bp.qualified_lead_criteria || "Demonstrou interesse claro em agendar"}

[REGRAS]
- Analise a última interação do lead e decida se ele deve ser movido de etapa no funil
- Retorne APENAS um JSON: {"move_to": "nome_da_etapa", "reason": "motivo em uma frase"}
- Se não houver movimentação, retorne: {"move_to": null, "reason": "sem mudança necessária"}
- Seja conservador: só mova se houver evidência clara

NÃO use o formato de split de mensagens. Retorne apenas o JSON de decisão.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Accept both authenticated user calls and service-role calls
    let userId: string;

    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const supabaseUser = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
      if (claimsError || !claimsData?.claims) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      userId = claimsData.claims.sub as string;
    } else {
      // Service-role call with user_id in body
      const body = await req.json();
      userId = body.user_id;
      if (!userId) {
        return new Response(JSON.stringify({ error: "user_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Load business profile
    const { data: bp, error: bpError } = await supabaseAdmin
      .from("business_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (bpError || !bp) {
      return new Response(JSON.stringify({ error: "Business profile not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Generate all 4 agent prompts
    const agents = [
      { agent_type: "attendant", system_prompt: buildAttendantPrompt(bp) },
      { agent_type: "scheduler", system_prompt: buildSchedulerPrompt(bp) },
      { agent_type: "followup", system_prompt: buildFollowupPrompt(bp) },
      { agent_type: "crm", system_prompt: buildCRMPrompt(bp) },
    ];

    for (const agent of agents) {
      const { error } = await supabaseAdmin
        .from("agent_configs")
        .upsert(
          { user_id: userId, agent_type: agent.agent_type, system_prompt: agent.system_prompt },
          { onConflict: "user_id,agent_type" }
        );
      if (error) console.error(`Error upserting ${agent.agent_type}:`, error);
    }

    console.log(`Generated ${agents.length} agent configs for user ${userId}`);

    return new Response(JSON.stringify({ status: "ok", agents_generated: agents.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-agent-configs error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
