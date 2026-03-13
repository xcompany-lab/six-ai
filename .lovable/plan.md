## Plano: Otimizar o WhatsApp AI — Buffer, Historico, Data e Tom

Analise dos logs e codigo confirmou todos os 5 problemas. Segue o plano de correcao em ordem de impacto.

---

### Problema 1 — Buffer de mensagens (sem debounce)

Cada mensagem dispara o webhook independentemente. "Oi" + "Oi" + "Quero saber..." gera 3 chamadas separadas a IA.

**Solucao:**

1. Criar tabela `message_queue` com colunas: `id`, `user_id`, `lead_id`, `contact_phone`, `instance_name`, `messages` (jsonb array), `last_message_at`, `status` ('pending'/'processing'/'done')
2. No `whatsapp-webhook`: em vez de chamar a IA, fazer upsert na fila acumulando mensagens
3. Criar edge function `process-message-queue` que:
  - Busca filas onde `last_message_at < now() - 10 seconds` e `status = 'pending'`
  - Concatena todas as mensagens como uma so
  - Chama a IA com o contexto completo
  - Envia resposta
4. Agendar via pg_cron a cada 10 segundos

### Problema 2 — Sem historico de conversa

Atualmente o webhook envia apenas 1 mensagem do usuario para a IA (linha 421-424). Sem historico, a IA se reapresenta a cada mensagem.

**Solucao:**

- Adicionar coluna `conversation_history` (jsonb) na tabela `message_queue` ou usar a `contact_memory`
- Antes de chamar a IA, carregar as ultimas 15 mensagens trocadas (armazenadas na fila processada ou em nova tabela `conversation_messages`)
- Passar como array de `{role, content}` para a IA em vez de apenas a ultima mensagem
- Criar tabela `conversation_messages` para persistir historico: `id`, `user_id`, `lead_id`, `role` (user/assistant), `content`, `created_at`

### Problema 3 — Data atual nao injetada

O Gemini nao sabe a data. Sugeriu "22 de maio" quando estamos em marco de 2026.

**Solucao no `process-message-queue` (e no `ai-chat`):**

```
const hoje = new Date().toLocaleDateString('pt-BR', {
  weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  timeZone: 'America/Sao_Paulo'
});
```

Injetar no system prompt: `[CONTEXTO TEMPORAL]\nData atual: ${hoje}\nCalcule datas relativas a partir desta data. NUNCA invente datas.`

### Problema 4 — Parse JSON falhando (resposta vazia)

Log mostra `Raw AI reply: \n` — resposta vazia da IA, gerando "Desculpe, nao consegui processar".

**Solucao:** Melhorar fallback no `parseAIResponse`:

- Se rawReply esta vazio ou so whitespace, retornar mensagem generica amigavel
- Adicionar retry (1x) se resposta vier vazia
- Garantir que nunca silencie

### Problema 5 — Tom robotico e excessivamente promocional

Os system prompts gerados pelo orquestrador usam linguagem de marketing. Frases como "experiencia premium", "queridinhas", "investimento na sua autoestima" se repetem.

**Solucao:**

- Atualizar o meta-prompt do orquestrador (`generate-agent-configs`) para incluir instrucoes anti-roboticas
- Adicionar bloco `[TOM]` obrigatorio nos prompts gerados:
  - Maximo 1 emoji por bloco de mensagens
  - Falar como atendente real, nao como anuncio
- Adicionar bloco `[MEMORIA]` para evitar re-apresentacao
- Regenerar os agent_configs da conta clinicaksbeauty apos a mudanca

---

### Arquivos alterados

- `supabase/functions/whatsapp-webhook/index.ts` — simplificar para apenas enfileirar mensagens
- `supabase/functions/process-message-queue/index.ts` — novo, processa a fila com debounce
- `supabase/functions/ai-chat/index.ts` — injetar data atual
- `supabase/functions/generate-agent-configs/index.ts` — melhorar meta-prompt com instrucoes de tom e memoria

### Migracoes SQL

- Criar tabela `message_queue`
- Criar tabela `conversation_messages`
- Criar pg_cron job para `process-message-queue` a cada 10s

### Ordem de implementacao

1. Tabelas + buffer no webhook + process-message-queue (elimina respostas multiplas)
2. Historico de conversa (elimina re-apresentacao)
3. Injecao de data atual (resolve confusao temporal)
4. Fallback robusto (elimina "nao consegui processar")
5. Revisao do meta-prompt do orquestrador (humaniza o tom)