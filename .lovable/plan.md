

## Plano: Comandos /parar e /ativar para Stop/Ativar IA por Conversa

### Contexto

Diferente da intervenção humana (temporária), este recurso permite parar a IA indefinidamente em uma conversa específica via comando, e reativá-la com outro comando. Os comandos são configuráveis no painel.

### Alterações

#### 1. Migração SQL

```sql
ALTER TABLE leads ADD COLUMN ai_stopped boolean NOT NULL DEFAULT false;
ALTER TABLE ai_agent_config ADD COLUMN stop_command text NOT NULL DEFAULT '/parar';
ALTER TABLE ai_agent_config ADD COLUMN activate_command text NOT NULL DEFAULT '/ativar';
```

#### 2. Webhook WhatsApp (`whatsapp-webhook/index.ts`)

No bloco `isFromMe`, antes do tratamento de human takeover:
- Carregar `stop_command` e `activate_command` do `ai_agent_config`
- Se `messageText.trim() === stop_command` → setar `leads.ai_stopped = true`, retornar sem salvar no histórico
- Se `messageText.trim() === activate_command` → setar `leads.ai_stopped = false` e limpar `human_takeover_until = null`, retornar
- Se não é comando → seguir fluxo normal de human takeover

#### 3. Process Message Queue (`process-message-queue/index.ts`)

Após o check de `human_takeover_until`, adicionar:
```
if (lead.ai_stopped) {
  // Memorizar mas não responder
  return;
}
```

#### 4. UI — AIAgentPage

No status card, adicionar dois campos de input:
- "Comando para parar IA": input text (default `/parar`)
- "Comando para ativar IA": input text (default `/ativar`)
- Salvos no `ai_agent_config`

#### 5. Hook e Types

- Adicionar `stop_command` e `activate_command` na interface `AIAgentConfig`
- Adicionar `ai_stopped` no types do Supabase (será auto-gerado pela migração)

### Fluxo

```text
Usuário digita /parar no WhatsApp
  → webhook detecta isFromMe + comando = stop_command
  → seta lead.ai_stopped = true
  → IA para de responder naquela conversa (indefinidamente)
  → continua memorizando mensagens do lead

Usuário digita /ativar no WhatsApp
  → webhook detecta isFromMe + comando = activate_command
  → seta lead.ai_stopped = false
  → IA volta a responder com todo o contexto memorizado
```

