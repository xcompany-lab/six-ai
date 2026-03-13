import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SPLIT_INSTRUCTION = `
FORMATO DE RESPOSTA OBRIGATÓRIO PARA ATENDENTE, AGENDADOR E FOLLOW-UP:
Sempre que o agente responder ao cliente, retorne um JSON com a chave "messages" contendo um array de strings.
Cada string é uma mensagem separada enviada individualmente no WhatsApp.
Escreva como um humano digitando: frases curtas, uma ideia por mensagem, máximo 2 linhas por item.
Nunca envie um parágrafo longo em uma única mensagem.

Exemplo correto:
{"messages": ["Oi, tudo bem?", "Aqui é a Ana, assistente da Clínica Saúde 😊", "Posso te ajudar com o agendamento?"], "intent": null}

Se a mensagem do usuário vier de uma transcrição de áudio, pode conter erros de fala ou palavras fundidas.
Interprete com contexto e responda ao significado, não à forma escrita.
`;

const META_PROMPT = `Você é um especialista de classe mundial em construção de agentes de IA para atendimento via WhatsApp.

Com base nas informações abaixo sobre o negócio do usuário, crie 4 system prompts COMPLETOS, SOFISTICADOS e prontos para uso em produção. Também extraia um perfil estruturado do negócio.

INFORMAÇÕES DO NEGÓCIO (fornecidas pelo usuário em linguagem natural):
{USER_INPUT}

{SCRAPED_CONTENT}

INSTRUÇÕES CRÍTICAS PARA CADA PROMPT:

1. ATENDENTE (attendant):
- Personalidade MARCANTE e única, não genérica — baseie-se no tom que o usuário descreveu
- Use TODOS os detalhes: nome do negócio, serviços reais, preços (se informados), diferenciais
- Inclua técnicas sutis de persuasão adequadas ao segmento
- Trate objeções com empatia usando as respostas que o usuário forneceu
- Inclua FAQ real do negócio
- REGRA: nunca inventar preços/disponibilidade. Quando o cliente quiser agendar, retorne {"intent": "schedule"}
- REGRA: se não souber responder, retorne {"intent": "human_handoff"}

[TOM - INCLUIR OBRIGATORIAMENTE NO PROMPT DO ATENDENTE]
- Fale como uma atendente real de WhatsApp, NÃO como um anúncio publicitário
- PROIBIDO usar: "experiência premium", "queridinhas", "que escolha maravilhosa", "investimento na sua autoestima", "cuidar de você é sempre a melhor decisão", "realçar sua beleza", "transformar sua carreira"
- Reaja de forma simples e direta: "Boa escolha!" em vez de "Que escolha MARAVILHOSA! ✨"
- Use no MÁXIMO 1 emoji por bloco de mensagens (não em toda frase)
- Seja direta e útil. Menos elogios, mais informação prática.
- Varie as respostas — nunca use a mesma frase de abertura duas vezes seguidas

[MEMÓRIA - INCLUIR OBRIGATORIAMENTE]
- Se o histórico de conversa mostra que você JÁ se apresentou, NUNCA repita a apresentação
- Nunca cumprimente duas vezes na mesma conversa
- Se já sabe o nome do cliente, use-o naturalmente mas sem exagero (não repita a cada mensagem)
- Se o cliente já mencionou um serviço de interesse, não pergunte novamente qual serviço quer

[CONTEXTO TEMPORAL]
- A data atual será injetada automaticamente no formato: "Data e hora atual: ..."
- Use essa data para calcular "próxima segunda-feira", "amanhã", etc.
- NUNCA invente ou chute datas

${SPLIT_INSTRUCTION}

2. AGENDADOR (scheduler):
- Soe como uma RECEPCIONISTA EXPERIENTE, não um formulário
- Confirme nome, serviço, data e hora de forma natural e conversacional
- Após confirmação retorne: {"intent": "booked", "datetime": "YYYY-MM-DDTHH:mm", "service": "nome", "contact_name": "nome"}
- Se desistir: {"intent": "cancel_schedule"}
${SPLIT_INSTRUCTION}

3. FOLLOW-UP (followup):
- VARIE o ângulo a cada tentativa — nunca repita a mesma abordagem
- Seja natural, NUNCA mencione que é automático
- Use gatilhos emocionais e de escassez sutis, adequados ao segmento
- Máximo 2-3 mensagens curtas por touchpoint
- Retorne {"intent": "schedule"} se demonstrar interesse em agendar
- Retorne {"intent": "responded"} se responder positivamente
- Retorne {"intent": "no_interest"} se não tiver interesse
${SPLIT_INSTRUCTION}

4. CRM (crm):
- Analise conversas e decida movimentações no funil
- Use os critérios reais de qualificação do negócio
- Retorne APENAS: {"move_to": "etapa", "reason": "motivo"} ou {"move_to": null, "reason": "sem mudança"}
- Seja conservador: só mova com evidência clara
- NÃO use formato de split de mensagens

RETORNE EXATAMENTE este JSON (sem markdown, sem backticks):
{
  "business_profile": {
    "business_name": "nome extraído",
    "segment": "segmento/nicho",
    "tone": "tom de voz identificado",
    "services": ["serviço1", "serviço2"],
    "faq": [{"q": "pergunta", "a": "resposta"}],
    "objections": [{"objection": "objeção", "response": "resposta"}],
    "qualified_lead_criteria": "critério extraído",
    "funnel_stages": ["Novo", "Em andamento", "Interessado", "Agendado", "Cliente"],
    "working_hours": {}
  },
  "agent_configs": {
    "attendant": "system prompt COMPLETO do atendente...",
    "scheduler": "system prompt COMPLETO do agendador...",
    "followup": "system prompt COMPLETO do follow-up...",
    "crm": "system prompt COMPLETO do CRM..."
  }
}`;

async function scrapeUrl(url: string): Promise<string> {
  try {
    // Try Firecrawl if available
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (firecrawlKey) {
      const resp = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${firecrawlKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
      });
      if (resp.ok) {
        const data = await resp.json();
        const markdown = data?.data?.markdown || data?.markdown || "";
        if (markdown) return markdown.slice(0, 5000);
      }
    }

    // Fallback: simple fetch
    const resp = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SIX-AI-Bot/1.0)" },
    });
    if (!resp.ok) return `[Não foi possível acessar: ${url}]`;
    const html = await resp.text();
    // Extract text content roughly
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return text.slice(0, 3000);
  } catch (e) {
    console.error(`Error scraping ${url}:`, e);
    return `[Erro ao acessar: ${url}]`;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    let userId: string;
    let body: any;

    if (authHeader?.startsWith("Bearer ")) {
      const supabaseUser = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
      if (claimsError || !claimsData?.claims) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = claimsData.claims.sub as string;
      body = await req.clone().json().catch(() => ({}));
      // If body wasn't parsed yet from clone
      if (!body || !body.free_text) {
        body = await req.json().catch(() => ({}));
      }
    } else {
      body = await req.json();
      userId = body.user_id;
      if (!userId) {
        return new Response(JSON.stringify({ error: "user_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { free_text = "", links = [], files = [], images = [], service_prices = [] } = body;

    console.log(`Processing onboarding for user ${userId}: ${free_text.length} chars, ${links.length} links, ${files.length} files, ${images.length} images`);

    // Scrape any provided links
    let scrapedContent = "";
    if (links.length > 0) {
      const scrapedParts: string[] = [];
      for (const link of links.slice(0, 5)) {
        const content = await scrapeUrl(link);
        scrapedParts.push(`[Conteúdo de ${link}]:\n${content}`);
      }
      scrapedContent = scrapedParts.join("\n\n");
    }

    // Build the prompt
    const userInput = [
      free_text,
      files.length > 0 ? `\n[Arquivos anexados: ${files.join(", ")}]` : "",
      images.length > 0 ? `\n[Imagens anexadas: ${images.join(", ")}]` : "",
    ].join("");

    const prompt = META_PROMPT
      .replace("{USER_INPUT}", userInput)
      .replace("{SCRAPED_CONTENT}", scrapedContent ? `\nCONTEÚDO EXTRAÍDO DE LINKS/INSTAGRAM:\n${scrapedContent}` : "");

    // Call Lovable AI Gateway with Gemini
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log("Calling Lovable AI Gateway...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: "You are an expert AI agent builder. Always respond with valid JSON only, no markdown formatting." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errText);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error(`AI Gateway returned ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || "";

    // Clean markdown formatting if present
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    console.log("AI response length:", content.length);

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse AI response:", content.slice(0, 500));
      throw new Error("AI returned invalid JSON");
    }

    const { business_profile: bp, agent_configs: configs } = parsed;

    if (!bp || !configs) {
      throw new Error("AI response missing required fields");
    }

    // Upsert business profile
    const { error: bpError } = await supabaseAdmin
      .from("business_profiles")
      .upsert({
        user_id: userId,
        business_name: bp.business_name || "",
        segment: bp.segment || "",
        tone: bp.tone || "Profissional e empático",
        services: bp.services || [],
        faq: bp.faq || [],
        objections: bp.objections || [],
        qualified_lead_criteria: bp.qualified_lead_criteria || "",
        funnel_stages: bp.funnel_stages || ["Novo", "Em andamento", "Interessado", "Agendado", "Cliente"],
        working_hours: bp.working_hours || {},
      }, { onConflict: "user_id" });

    if (bpError) console.error("Error upserting business_profile:", bpError);

    // Upsert agent configs
    const agentTypes = ["attendant", "scheduler", "followup", "crm"] as const;
    for (const agentType of agentTypes) {
      const systemPrompt = configs[agentType];
      if (!systemPrompt) {
        console.warn(`Missing prompt for ${agentType}`);
        continue;
      }
      const { error } = await supabaseAdmin
        .from("agent_configs")
        .upsert(
          { user_id: userId, agent_type: agentType, system_prompt: systemPrompt },
          { onConflict: "user_id,agent_type" }
        );
      if (error) console.error(`Error upserting ${agentType}:`, error);
    }

    // Update profile: mark as onboarded + save basic info
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        is_onboarded: true,
        brand_name: bp.business_name || "",
        niche: bp.segment || "",
        services: bp.services || [],
        voice_tone: bp.tone || "",
      })
      .eq("id", userId);

    if (profileError) console.error("Error updating profile:", profileError);

    console.log(`Successfully generated agents for user ${userId}`);

    return new Response(JSON.stringify({ status: "ok", agents_generated: 4 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-agent-configs error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
