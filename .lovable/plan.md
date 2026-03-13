

## Diagnóstico Real vs. Documento de Correções

Após análise completa do código, a maioria dos itens listados como "não implementado" **já existe**. O documento foi escrito antes das implementações recentes. Segue o status real:

### Já implementado (não precisa mexer)
- Onboarding conversacional (`OnboardingPage.tsx` salva `business_profiles` e chama `generate-agent-configs`)
- Tabelas `business_profiles`, `agent_configs`, `campaigns`, `campaign_messages`, `scheduled_reminders`
- Edge Functions: `generate-agent-configs`, `create-calendar-event`, `google-calendar-callback`, `send-reminders`, `send-activation`
- Roteamento por `current_agent` no `whatsapp-webhook`
- Handoff entre agentes (schedule, booked, cancel_schedule)
- Split de mensagens com delay + typing simulation
- Transcrição de áudio via Gemini
- Google Calendar OAuth (confirmado funcionando)
- Agente CRM avaliando leads ao final de cada interação
- Trigger SQL `schedule_reminders_for_appointment` + pg_cron para disparo
- Coluna `current_agent` em leads

### O que realmente precisa ser corrigido

**1. Substituir a tela de Atendente IA (AIAgentPage.tsx)**
A página ainda mostra abas manuais (Prompt, Comportamento, Conhecimento, Mensagens). Deve ser substituída por:
- Card de status do agente (manter)
- Banner de onboarding se `business_profile` não existe, com botão "Iniciar configuração guiada" que leva para `/onboarding`
- Resumo do perfil configurado se `business_profile` já existe (nome, segmento, tom, serviços, agentes ativos)
- Botão "Reconfigurar" para refazer onboarding
- Aba "Memória" (manter como está)

**2. Criar Edge Function `process-campaign-queue`**
Não existe. As campanhas de ativação são criadas mas os disparos individuais com delay de 45-60s entre mensagens não são executados automaticamente. Criar:
- Edge Function que pega próximo `campaign_message` pendente, envia via Evolution API, atualiza status, e seta delay para o próximo
- pg_cron job para chamar essa function a cada minuto

**3. Automação de Follow-up**
Os fluxos de follow-up são configuráveis na UI mas não há execução automática. Criar:
- Edge Function `process-followup` que identifica leads elegíveis para follow-up (baseado em `follow_up_flows` + `last_contact` + `no_response_time`)
- Usa o agente follow-up para gerar mensagem personalizada
- Envia via Evolution API
- pg_cron job para executar a cada 15 minutos

**4. IA na geração de mensagens de ativação**
A function `generate-activation-message` existe mas precisa usar o contexto do `business_profile` para gerar mensagens mais inteligentes por segmento.

### Ordem de execução

1. Substituir `AIAgentPage.tsx` (UI only, sem backend)
2. Criar `process-campaign-queue` + pg_cron
3. Criar `process-followup` + pg_cron
4. Melhorar `generate-activation-message` com contexto do business_profile

### Escopo estimado
Dado o volume, sugiro executar em 2-3 rounds: primeiro a AIAgentPage (impacto visual imediato), depois as Edge Functions de background.

