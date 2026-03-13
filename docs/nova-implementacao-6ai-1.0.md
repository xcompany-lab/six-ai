# Nova Implementação SIX AI 1.0

> Documento de referência para Vibe Coding — cobre todas as alterações arquiteturais, novas funcionalidades e implementações técnicas definidas no planejamento da versão 1.0 da plataforma SIX AI.

---

## Contexto da Plataforma

O SIX AI é uma plataforma SaaS de atendimento e vendas com IA para pequenos e médios negócios, com foco em automação via WhatsApp. Stack atual: React 18 + TypeScript + Vite + Tailwind + shadcn/ui no frontend, Supabase (Auth, Database, Storage, Edge Functions) no backend, Google Gemini API para IA, Evolution API para WhatsApp, e Ticto para pagamentos.

---

## 1. Arquitetura Multi-Agente com Orquestrador

### Visão Geral

Substituir a lógica atual de agente único por uma arquitetura de **4 agentes especializados** coordenados por um **Orquestrador central**. O Orquestrador não conversa com o cliente — ele é uma Edge Function que lê o perfil do negócio e gera/atualiza os system prompts de todos os agentes automaticamente.

### Os 4 Agentes

| Agente | Responsabilidade | Planos |
|---|---|---|
| Atendente IA | FAQ, tom de voz, objeções, pré-qualificação | Todos |
| Agendamento | Confirmar data/hora, Google Calendar, lembretes | Plus e Pro |
| Follow-up | Touchpoints por etapa do funil, reengajamento | Pro |
| CRM / Funil | Mover leads entre etapas automaticamente | Pro |

### Onboarding Inteligente

Criar uma **página de setup guiado** (conversa dentro da plataforma) que coleta o perfil do negócio de forma conversacional. Ao final, grava um objeto `business_profile` no Supabase. Esse objeto é a fonte-única de verdade para o Orquestrador.

**Campos coletados no onboarding:**
- Nome do negócio, segmento e serviços oferecidos
- Tom de voz (formal, descontraído, empático, urgente)
- FAQ das dúvidas mais frequentes
- Objeções comuns e como responder a cada uma
- Etapas do funil de vendas (nomes e critérios de movimentação)
- Critério de lead qualificado (o que define pronto para agendar)
- Dias e horários de atendimento, duração média por serviço
- Número de touchpoints de follow-up, intervalos e objetivo de cada um

### Tabelas Novas no Supabase

```sql
-- Perfil do negócio por usuário
create table business_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users unique,
  business_name text,
  segment text,
  services jsonb,
  tone text,
  faq jsonb,
  objections jsonb,
  funnel_stages jsonb,
  qualified_lead_criteria text,
  working_hours jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Configurações geradas pelo Orquestrador para cada agente
create table agent_configs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  agent_type text, -- 'attendant' | 'scheduler' | 'followup' | 'crm'
  system_prompt text,
  updated_at timestamptz default now(),
  unique(user_id, agent_type)
);
```

### Edge Function: `generate-agent-configs`

Criada e chamada sempre que o usuário salva/atualiza o `business_profile`. Recebe o perfil e interpola os templates de prompt de cada agente, salvando em `agent_configs`.

**Estrutura de cada system prompt gerado (4 blocos fixos + 1 dinâmico):**

```
[IDENTIDADE]   → quem é esse agente e qual seu papel exato
[NEGÓCIO]      → dados do business_profile interpolados
[REGRAS]       → o que pode e não pode fazer, até onde vai
[HANDOFF]      → quando e como sinalizar passagem de bastão (intent)
[CONTEXTO]     → histórico da conversa injetado dinamicamente em runtime
```

**Prompts base por agente:**

**Atendente IA:**
```
Você é a assistente virtual de {business_name}, um negócio de {segment}.
Seu tom é {tone}. Responda dúvidas sobre {services}.

FAQ: {faq}
Objeções e respostas: {objections}

Regras:
- Nunca invente informações sobre preços ou disponibilidade
- Não agende diretamente — quando o cliente demonstrar interesse em agendar, retorne exatamente: {"intent": "schedule"}
- Nunca envie parágrafos longos

Histórico da conversa: {conversation_history}
```

**Agente Agendamento:**
```
Você é a assistente de agendamento de {business_name}.
Horários disponíveis: {working_hours}. Serviços: {services}.

Regras:
- Confirme nome, serviço desejado, data e hora
- Após confirmação retorne: {"intent": "booked", "datetime": "...", "service": "...", "contact_name": "..."}
- Nunca quebre o fluxo da conversa

Histórico: {conversation_history}
```

**Agente Follow-up:**
```
Você está fazendo um follow-up com {contact_name}, que está na etapa {funnel_stage} do funil.
Este é o touchpoint {touchpoint_number} de {total_touchpoints}.
Objetivo deste touchpoint: {touchpoint_goal}
Último assunto abordado: {last_message}

Regras:
- Seja natural, não robótico
- Não mencione que é um follow-up automático
- Retorne {"intent": "responded"} se o cliente responder positivamente
```

**Agente CRM:**
```
Analise a última interação do lead {contact_name} e decida se ele deve ser movido de etapa no funil.
Etapas disponíveis: {funnel_stages}
Etapa atual: {current_stage}
Resumo da conversa: {conversation_summary}

Retorne APENAS um JSON: {"move_to": "nome_da_etapa", "reason": "motivo em uma frase"}
Se não houver movimentação, retorne: {"move_to": null}
```

### Handoff entre Agentes (sem troca de canal)

Refatorar a Edge Function `ai-chat` para suportar roteamento dinâmico por agente:

```typescript
// Fluxo dentro da Edge Function ai-chat
const lead = await getLead(contactPhone, userId)
const currentAgent = lead.current_agent ?? 'attendant'
const agentConfig = await getAgentConfig(userId, currentAgent)

// Injeta histórico e chama Gemini
const response = await callGemini(agentConfig.system_prompt, conversationHistory, userMessage)

// Detecta handoff
if (response.intent === 'schedule') {
  await updateLead(lead.id, { current_agent: 'scheduler' })
}
if (response.intent === 'booked') {
  await createAppointment(response)
  await createCalendarEvent(response)
  await updateLead(lead.id, { current_agent: 'attendant' })
}

// Após cada interação, chama o Agente CRM para atualizar o funil
await callCRMAgent(lead, conversationSummary)
```

Adicionar coluna `current_agent` na tabela `leads`:
```sql
alter table leads add column current_agent text default 'attendant';
```

---

## 2. Mensagens Humanizadas com Split

### Instrução obrigatória em todos os system prompts

Adicionar ao final de cada prompt gerado pelo Orquestrador:

```
FORMATO DE RESPOSTA OBRIGATÓRIO:
Sempre retorne um JSON com a chave "messages" contendo um array de strings.
Cada string é uma mensagem separada enviada individualmente no WhatsApp.
Escreva como um humano digitando: frases curtas, uma ideia por mensagem, máximo 2 linhas por item.
Nunca envie um parágrafo longo em uma única mensagem.
Use pontos, vírgulas e quebras naturais de fala para decidir onde cortar.

Exemplo correto:
{"messages": ["Oi, tudo bem?", "Aqui é a Ana, assistente da Clínica Saúde 😊", "Posso te ajudar com o agendamento?"], "intent": null}

Exemplo errado:
{"messages": ["Olá! Aqui é a Ana, assistente virtual da Clínica Saúde. Estou aqui para te ajudar com o agendamento da sua consulta. Qual seria o melhor horário para você?"], "intent": null}
```

### Envio sequencial com delay na Edge Function

```typescript
async function sendSplitMessages(phone: string, messages: string[]) {
  for (const msg of messages) {
    await sendWhatsAppMessage(phone, msg)
    const delay = Math.floor(Math.random() * 500) + 400 // 400–900ms
    await sleep(delay)
  }
}
```

---

## 3. Transcrição de Áudio

### Detecção no webhook da Evolution API

```typescript
const messageType = payload.data?.messageType

if (messageType === 'audioMessage') {
  const audioBase64 = payload.data?.message?.audioMessage?.data
  userMessage = await transcribeAudio(audioBase64)
} else {
  userMessage = payload.data?.message?.conversation
}
```

### Transcrição via Gemini (sem nova dependência)

```typescript
async function transcribeAudio(audioBase64: string): Promise<string> {
  const response = await callGemini(`
    Transcreva o áudio abaixo para texto em português brasileiro.
    Corrija erros de fala naturais mas preserve o significado.
    Retorne apenas o texto transcrito, sem comentários.
  `, audioBase64, { type: 'audio/ogg' })
  return response.text
}
```

### Instrução adicional em todos os prompts

```
Se a mensagem do usuário vier de uma transcrição de áudio, pode conter erros de fala
ou palavras fundidas. Interprete com contexto e responda ao significado, não à forma escrita.
```

---

## 4. Integração Google Calendar via OAuth

### Configuração no Google Cloud Console (feita uma vez)

1. Criar projeto **SIX AI** em console.cloud.google.com
2. Ativar **Google Calendar API** em APIs & Services → Library
3. Criar credencial **OAuth 2.0 Client ID** (tipo: Web Application)
4. Adicionar redirect URI autorizado:
   `https://<projeto>.supabase.co/functions/v1/google-calendar-callback`
5. Salvar `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` nos Secrets do Supabase

### Secrets do Supabase

```
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI=https://<projeto>.supabase.co/functions/v1/google-calendar-callback
```

### Alterações no banco

```sql
alter table user_settings add column google_calendar_connected boolean default false;
alter table user_settings add column google_refresh_token text; -- armazenar via Supabase Vault
alter table user_settings add column google_access_token text;
```

### Botão na UI (página de configurações)

O botão "Conectar Google Agenda" redireciona para:

```
https://accounts.google.com/o/oauth2/v2/auth
  ?client_id={GOOGLE_CLIENT_ID}
  &redirect_uri={GOOGLE_REDIRECT_URI}
  &response_type=code
  &scope=openid email profile https://www.googleapis.com/auth/calendar.events
  &access_type=offline
  &prompt=consent
  &state={user_id}
```

Após retorno, exibir badge verde "Google Agenda conectada" se `google_calendar_connected = true`.

### Edge Function: `google-calendar-callback`

```typescript
Deno.serve(async (req) => {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const userId = url.searchParams.get('state')

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: Deno.env.get('GOOGLE_CLIENT_ID'),
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET'),
      redirect_uri: Deno.env.get('GOOGLE_REDIRECT_URI'),
      grant_type: 'authorization_code',
    })
  })

  const { access_token, refresh_token } = await tokenRes.json()

  await supabase.from('user_settings').update({
    google_calendar_connected: true,
    google_refresh_token: refresh_token,
    google_access_token: access_token,
  }).eq('user_id', userId)

  return Response.redirect('https://six-ai.lovable.app/settings?google=connected')
})
```

### Edge Function: `create-calendar-event`

Chamada pelo Agente Agendamento após `intent: 'booked'`:

```typescript
async function createCalendarEvent(userId: string, appointment: Appointment) {
  const { google_refresh_token } = await getUserSettings(userId)
  const access_token = await refreshAccessToken(google_refresh_token)

  const event = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${access_token}` },
      body: JSON.stringify({
        summary: `${appointment.contact_name} — ${appointment.service}`,
        start: { dateTime: appointment.datetime, timeZone: 'America/Sao_Paulo' },
        end:   { dateTime: appointment.end_datetime, timeZone: 'America/Sao_Paulo' },
        description: `Agendado via SIX AI\nContato: ${appointment.phone}`,
        reminders: {
          useDefault: false,
          overrides: [{ method: 'popup', minutes: 30 }]
        }
      })
    }
  )

  const { id: google_event_id } = await event.json()

  // Salvar google_event_id no appointment para edições/cancelamentos futuros
  await supabase.from('appointments')
    .update({ google_event_id })
    .eq('id', appointment.id)
}
```

Adicionar coluna:
```sql
alter table appointments add column google_event_id text;
```

---

## 5. Sistema de Lembretes de Agendamento

### Configuração pelo usuário (até 3 lembretes)

Adicionar na página de configurações uma seção "Lembretes automáticos" com até 3 linhas configuráveis. Cada lembrete tem um campo de valor numérico e uma unidade (dias / horas / minutos).

**Exemplos de configuração:**
- Lembrete 1: 3 dias antes
- Lembrete 2: 1 dia antes
- Lembrete 3: 2 horas antes

### Alterações no banco

```sql
-- Configuração global de lembretes por usuário
alter table user_settings
  add column reminder_1_offset interval,
  add column reminder_2_offset interval,
  add column reminder_3_offset interval,
  add column reminder_1_message text,
  add column reminder_2_message text,
  add column reminder_3_message text;

-- Lembretes agendados por appointment
create table scheduled_reminders (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references appointments on delete cascade,
  contact_phone text not null,
  contact_name text,
  service_name text,
  appointment_at timestamptz,
  message_text text,
  send_at timestamptz not null,
  status text default 'pending', -- pending | sent | cancelled
  sent_at timestamptz,
  created_at timestamptz default now()
);

create index on scheduled_reminders (send_at, status);
```

### Trigger — calcula e insere lembretes ao criar agendamento

```sql
create or replace function create_appointment_reminders()
returns trigger as $$
declare
  cfg record;
  msg text;
begin
  select * into cfg from user_settings where user_id = NEW.professional_id;

  if cfg.reminder_1_offset is not null then
    msg := coalesce(cfg.reminder_1_message,
      'Olá ' || NEW.contact_name || '! Lembrete: você tem ' || NEW.service_name ||
      ' agendado em ' || to_char(NEW.appointment_at, 'DD/MM/YYYY às HH24:MI') || '. Te esperamos!');
    insert into scheduled_reminders
      (appointment_id, contact_phone, contact_name, service_name, appointment_at, message_text, send_at)
    values
      (NEW.id, NEW.contact_phone, NEW.contact_name, NEW.service_name, NEW.appointment_at,
       msg, NEW.appointment_at - cfg.reminder_1_offset);
  end if;

  -- Repetir para reminder_2_offset e reminder_3_offset
  if cfg.reminder_2_offset is not null then
    insert into scheduled_reminders (...) values (..., NEW.appointment_at - cfg.reminder_2_offset);
  end if;

  if cfg.reminder_3_offset is not null then
    insert into scheduled_reminders (...) values (..., NEW.appointment_at - cfg.reminder_3_offset);
  end if;

  return NEW;
end;
$$ language plpgsql;

create trigger after_appointment_insert
  after insert on appointments
  for each row execute function create_appointment_reminders();
```

### Trigger — cancela lembretes ao cancelar/remarcar agendamento

```sql
create or replace function handle_appointment_change()
returns trigger as $$
begin
  -- Cancela todos os pendentes
  update scheduled_reminders
    set status = 'cancelled'
  where appointment_id = NEW.id and status = 'pending';

  -- Se remarcou (nova data), recria os lembretes
  if NEW.appointment_at <> OLD.appointment_at and NEW.status <> 'cancelled' then
    perform create_appointment_reminders_for(NEW.id);
  end if;

  return NEW;
end;
$$ language plpgsql;

create trigger after_appointment_update
  after update on appointments
  for each row execute function handle_appointment_change();
```

### pg_cron — disparo a cada minuto

```sql
select cron.schedule('send-reminders', '* * * * *', $$
  update scheduled_reminders
    set status = 'processing'
  where id in (
    select id from scheduled_reminders
    where send_at <= now() and status = 'pending'
    limit 10
    for update skip locked
  )
  returning *;
$$);
```

A Edge Function `send-reminder` é chamada para cada linha com `status = 'processing'`, envia via Evolution API e atualiza para `sent`.

---

## 6. Ativação de Base (Campanhas)

### Tabelas no Supabase

```sql
create table campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  name text not null,
  segment text not null, -- 'no_reply' | 'pre_schedule' | 'scheduled' | 'recurrent' | 'custom'
  status text default 'draft', -- draft | scheduled | running | paused | done
  message_text text,
  scheduled_at timestamptz,
  total_contacts int default 0,
  sent_count int default 0,
  failed_count int default 0,
  created_at timestamptz default now()
);

create table campaign_messages (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns on delete cascade,
  contact_phone text not null,
  contact_name text,
  message_text text not null,
  status text default 'pending', -- pending | sent | failed
  send_at timestamptz not null,
  sent_at timestamptz,
  error_message text
);

create index on campaign_messages (send_at, status);
```

### Segmentação de Leads

Queries prontas para cada segmento na camada de dados:

```sql
-- Segmento: primeira mensagem, sem resposta (frio)
select id, phone, name from leads
where user_id = $1
  and message_count = 1
  and last_message_at < now() - interval '24 hours';

-- Segmento: pré-agendamento (demonstrou interesse, não fechou)
select id, phone, name from leads
where user_id = $1
  and funnel_stage = 'Interessado'
  and id not in (select lead_id from appointments where status != 'cancelled');

-- Segmento: agendaram ao menos uma vez
select id, phone, name from leads
where user_id = $1
  and id in (select lead_id from appointments);

-- Segmento: recorrentes (2+ agendamentos)
select id, phone, name from leads
where user_id = $1
  and id in (
    select lead_id from appointments
    group by lead_id having count(*) >= 2
  );
```

### Edge Function: `suggest-campaign-messages`

Chamada quando o usuário clica em "Sugerir mensagens com IA". Recebe `user_id` e `segment`, busca o `business_profile` e retorna 3 opções:

```typescript
const prompt = `
Você é um especialista em marketing para ${profile.business_name}, negócio de ${profile.segment}.
Tom de voz: ${profile.tone}.

Crie 3 mensagens curtas e diferentes para reengajar leads do segmento: "${segmentLabel}".
Cada mensagem deve:
- Ter no máximo 3 frases
- Ser natural, como um humano enviaria no WhatsApp
- Ter um CTA claro mas não agressivo
- Ser no tom: ${profile.tone}

Retorne APENAS um JSON: {"suggestions": ["msg1", "msg2", "msg3"]}
`
```

### Worker de Disparo com Delay Seguro

Edge Function `process-campaign-queue` acionada pelo `pg_cron` a cada minuto:

```typescript
Deno.serve(async () => {
  // Pega o próximo pendente cuja send_at já passou
  const { data: next } = await supabase
    .from('campaign_messages')
    .select('*')
    .eq('status', 'pending')
    .lte('send_at', new Date().toISOString())
    .order('send_at', { ascending: true })
    .limit(1)
    .single()

  if (!next) return new Response('nothing to process')

  // Marca como processing (evita duplicidade)
  await supabase.from('campaign_messages')
    .update({ status: 'processing' })
    .eq('id', next.id)

  // Envia via Evolution API
  const ok = await sendWhatsAppMessage(next.contact_phone, next.message_text)

  // Atualiza status
  await supabase.from('campaign_messages').update({
    status: ok ? 'sent' : 'failed',
    sent_at: ok ? new Date().toISOString() : null,
  }).eq('id', next.id)

  // Atualiza contadores na campanha
  await supabase.rpc('increment_campaign_counter', {
    campaign_id: next.campaign_id,
    field: ok ? 'sent_count' : 'failed_count'
  })

  // Agenda o próximo item com delay aleatório 45–60s
  const nextDelay = Math.floor(Math.random() * 15 + 45) // 45–60 segundos
  await supabase.from('campaign_messages')
    .update({ send_at: new Date(Date.now() + nextDelay * 1000).toISOString() })
    .eq('campaign_id', next.campaign_id)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1)

  return new Response('ok')
})
```

### UI do Construtor de Campanha

Criar página `/campaigns` (ou `/ativacao-de-base`) com:

1. **Seleção de segmento** — 4 cards clicáveis com contagem de leads em tempo real
2. **Editor de mensagem** — textarea com botão "Sugerir com IA" que abre modal com 3 opções
3. **Agendamento** — date/time picker para definir início do disparo
4. **Revisão** — nome da campanha, total de contatos, prévia da mensagem
5. **Botão de lançar** — cria os registros em `campaign_messages` com `send_at` calculados e inicia o worker
6. **Painel de progresso** — barra de progresso (X de Y enviados) com status em tempo real via Supabase Realtime

---

## 7. Resumo de Todas as Alterações no Banco de Dados

```sql
-- Novas tabelas
create table business_profiles (...)
create table agent_configs (...)
create table scheduled_reminders (...)
create table campaigns (...)
create table campaign_messages (...)

-- Alterações em tabelas existentes
alter table leads add column current_agent text default 'attendant';
alter table appointments add column google_event_id text;
alter table user_settings add column google_calendar_connected boolean default false;
alter table user_settings add column google_refresh_token text;
alter table user_settings add column google_access_token text;
alter table user_settings add column reminder_1_offset interval;
alter table user_settings add column reminder_2_offset interval;
alter table user_settings add column reminder_3_offset interval;
alter table user_settings add column reminder_1_message text;
alter table user_settings add column reminder_2_message text;
alter table user_settings add column reminder_3_message text;
```

---

## 8. Novas Edge Functions

| Função | Gatilho | Responsabilidade |
|---|---|---|
| `generate-agent-configs` | Salvar/atualizar business_profile | Gera e salva os 4 system prompts |
| `google-calendar-callback` | Redirect OAuth do Google | Troca code por tokens, salva no DB |
| `create-calendar-event` | intent: 'booked' no ai-chat | Cria evento no Google Calendar do usuário |
| `suggest-campaign-messages` | Clique do usuário na UI | Gera 3 sugestões de mensagem por segmento |
| `process-campaign-queue` | pg_cron a cada minuto | Worker de disparo com delay 45–60s |
| `send-reminders` | pg_cron a cada minuto | Dispara lembretes pendentes via WhatsApp |

---

## 9. Alterações na Edge Function Existente: `ai-chat`

- Ler `lead.current_agent` para determinar qual system prompt carregar
- Fazer parse do retorno do Gemini como JSON com `{ messages: string[], intent: string | null }`
- Enviar cada item de `messages` separadamente via Evolution API com delay de 400–900ms entre eles
- Detectar `messageType === 'audioMessage'` no payload e transcrever antes de processar
- Ao detectar `intent: 'schedule'`, atualizar `lead.current_agent = 'scheduler'`
- Ao detectar `intent: 'booked'`, criar appointment + chamar `create-calendar-event` + resetar agente para `attendant`
- Ao final de cada interação, chamar o Agente CRM com resumo da conversa para movimentar funil

---

## 10. Ordem de Implementação Recomendada

### Fase 1 — Fundação (rodar primeiro)
1. Criar todas as migrações de banco de dados
2. Criar tabela `business_profiles` e página de onboarding conversacional
3. Criar Edge Function `generate-agent-configs` com templates de prompt
4. Refatorar `ai-chat` para roteamento por `current_agent` + parse JSON + split de mensagens

### Fase 2 — Comunicação Humana
5. Implementar transcrição de áudio no webhook da `ai-chat`
6. Validar splits de mensagem com delay humanizado em produção

### Fase 3 — Google Calendar
7. Configurar projeto no Google Cloud Console
8. Criar Edge Function `google-calendar-callback`
9. Adicionar botão OAuth na UI de configurações
10. Criar Edge Function `create-calendar-event`

### Fase 4 — Lembretes
11. Adicionar colunas de reminder em `user_settings`
12. Criar tabela `scheduled_reminders`
13. Criar trigger `after_appointment_insert`
14. Criar trigger `after_appointment_update` (cancelamento/remarcação)
15. Configurar `pg_cron` para disparo de lembretes
16. Criar Edge Function `send-reminders`
17. Criar UI de configuração de lembretes nas configurações

### Fase 5 — Ativação de Base
18. Criar tabelas `campaigns` e `campaign_messages`
19. Criar queries de segmentação de leads
20. Criar Edge Function `suggest-campaign-messages`
21. Criar Edge Function `process-campaign-queue` com delay 45–60s
22. Configurar `pg_cron` para o worker de campanhas
23. Criar página `/campaigns` com construtor, sugestão IA e painel de progresso

---

*Documento gerado em 13/03/2026 — SIX AI v1.0*
