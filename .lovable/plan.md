

## Plano: Intervenção Humana com Pausa Temporária da IA

### Problema

Atualmente, o webhook ignora mensagens `fromMe` (linha 102 do `whatsapp-webhook`). Quando o usuário envia uma mensagem manualmente pelo WhatsApp, a IA não sabe e continua respondendo, causando conflito.

### Solução

Três partes: configuração do tempo de pausa, detecção da intervenção, e pausa inteligente (IA observa mas não responde).

### Alterações

#### 1. Migração SQL — novo campo no lead

```sql
ALTER TABLE leads ADD COLUMN human_takeover_until timestamptz DEFAULT NULL;
```

Quando o humano entra na conversa, este campo é setado para `now() + X minutos`. Enquanto `human_takeover_until > now()`, a IA não responde mas continua memorizando.

#### 2. Configuração do tempo — `ai_agent_config`

```sql
ALTER TABLE ai_agent_config ADD COLUMN human_takeover_minutes integer NOT NULL DEFAULT 30;
```

#### 3. UI — Campo na página Atendente IA (`AIAgentPage.tsx`)

Adicionar na seção do status card um campo editável "Tempo de pausa ao intervir" com opções pré-definidas (15min, 30min, 1h, 2h, 4h). Salva no `ai_agent_config.human_takeover_minutes`.

#### 4. Webhook WhatsApp — captura mensagens outgoing

**`supabase/functions/whatsapp-webhook/index.ts`:**

Quando `messageData.key.fromMe === true`:
- Identificar o lead pelo `contactPhone`
- Carregar `human_takeover_minutes` do `ai_agent_config`
- Setar `leads.human_takeover_until = now() + X minutes`
- Salvar a mensagem no `conversation_messages` (role: "assistant_human") para a IA ter contexto
- Atualizar `contact_memory` normalmente
- **Não enfileirar** na message_queue (não precisa de resposta da IA)

#### 5. Processamento — respeitar a pausa

**`supabase/functions/process-message-queue/index.ts`:**

Antes de chamar a IA, verificar se `lead.human_takeover_until > now()`:
- **Se sim**: salvar mensagem no histórico, atualizar memória, mas **não chamar a IA** e **não responder**. Marcar queue como `done`.
- **Se não**: fluxo normal.

### Fluxo resumido

```text
Usuário manda msg no WhatsApp manualmente
  → webhook detecta fromMe=true
  → seta lead.human_takeover_until = now() + 30min
  → salva msg no histórico como "assistant_human"

Lead responde
  → webhook enfileira normalmente
  → process-message-queue verifica human_takeover_until
  → still active? salva msg + memória, mas NÃO responde
  → expired? IA retoma normalmente (com todo o contexto)
```

### Arquivos modificados

| Arquivo | Alteração |
|---------|-----------|
| Migração SQL | `human_takeover_until` em leads, `human_takeover_minutes` em ai_agent_config |
| `whatsapp-webhook/index.ts` | Capturar mensagens `fromMe`, setar pausa no lead, salvar no histórico |
| `process-message-queue/index.ts` | Checar `human_takeover_until` antes de processar |
| `src/pages/AIAgentPage.tsx` | Campo de configuração do tempo de pausa |
| `src/hooks/use-ai-agent.ts` | Incluir `human_takeover_minutes` na interface |

