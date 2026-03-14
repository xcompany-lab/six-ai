

## Cálculo preciso de uso de IA — Plano completo (com Whisper)

### Lógica de negócio

**Margem 2.5x** — o budget de tokens é `preço_plano / 2.5`:

| Plano | Preço | Budget (BRL) |
|-------|-------|-------------|
| Trial | R$197 (=Pro) | R$78.80 |
| Start | R$49 | R$19.60 |
| Plus | R$97 | R$38.80 |
| Pro | R$197 | R$78.80 |

**Custos por API:**

1. **Gemini 3 Flash (chat IA):**
   - Input: $0.50 / 1M tokens
   - Output: $3.00 / 1M tokens

2. **OpenAI Whisper (transcrição de áudio):**
   - Custo: $0.006 / minuto de áudio
   - Estimativa de duração: `tamanho_blob_bytes / 16000` (bitrate médio OGG ~128kbps = 16KB/s)

**Câmbio:** USD_TO_BRL = 5.50 (configurável)

### Implementação

**1. Migration SQL**

Adicionar coluna `ai_cost_accumulated` (numeric, default 0) na tabela `profiles`.

**2. Função helper de custo (constantes reutilizáveis nas edge functions)**

```text
INPUT_COST_PER_TOKEN_USD  = 0.50 / 1_000_000
OUTPUT_COST_PER_TOKEN_USD = 3.00 / 1_000_000
WHISPER_COST_PER_SECOND_USD = 0.006 / 60
USD_TO_BRL = 5.50
PLAN_BUDGETS_BRL = { trial: 78.80, start: 19.60, plus: 38.80, pro: 78.80 }
```

Função `calculateAndUpdateUsage(supabase, userId, plan, costs)`:
- Soma custo em USD → converte para BRL
- Incrementa `ai_cost_accumulated`
- Recalcula `ai_usage_percent = min(100, (accumulated / budget) * 100)`

**3. Pontos de tracking**

| Função | O que conta | Como obtém |
|--------|------------|------------|
| `process-message-queue` | Tokens do Gemini (attendant + scheduler) | `aiData.usage.prompt_tokens` e `completion_tokens` da resposta JSON |
| `whatsapp-webhook` | Custo do Whisper por áudio recebido | Estima duração pelo tamanho do blob: `blob.size / 16000` segundos × $0.006/min |
| `ai-chat` | Tokens do chat web | Estimativa por contagem de caracteres (streaming não retorna usage) |
| `ticto-webhook` | Reset no ciclo | Zera `ai_cost_accumulated` e `ai_usage_percent` quando recarga é processada |

**4. Whisper — detalhes**

No `whatsapp-webhook/index.ts`, após chamar `transcribeAudioWhisper(audioBlob, filename)`:
- Calcular duração estimada: `audioBlob.size / 16000` (em segundos)
- Custo USD: `(duração_seg / 60) * 0.006`
- Converter para BRL e acumular no perfil do usuário
- Isso acontece **antes** do enfileiramento, então o custo do Whisper é contabilizado imediatamente

**5. Bloqueio ao atingir 100%**

- `process-message-queue`: verificar `ai_usage_percent` antes de chamar a IA. Se >= 100, enviar mensagem padrão ao lead informando que o limite foi atingido.
- `whatsapp-webhook`: verificar antes de transcrever áudio (Whisper também custa).
- `ai-chat`: verificar antes de processar.

**6. Reset no ciclo de faturamento**

No `ticto-webhook`: ao processar recarga/renovação `authorized`, resetar `ai_cost_accumulated = 0` e `ai_usage_percent = 0`.

### Arquivos modificados

1. **Migration SQL** — `ALTER TABLE profiles ADD COLUMN ai_cost_accumulated numeric NOT NULL DEFAULT 0`
2. **`supabase/functions/process-message-queue/index.ts`** — extrair `usage` da resposta Gemini, calcular custo, atualizar perfil
3. **`supabase/functions/whatsapp-webhook/index.ts`** — calcular custo Whisper após transcrição, acumular no perfil
4. **`supabase/functions/ai-chat/index.ts`** — tracking por estimativa de caracteres
5. **`supabase/functions/ticto-webhook/index.ts`** — resetar `ai_cost_accumulated` junto com `ai_usage_percent`
6. **`src/integrations/supabase/types.ts`** — atualizado automaticamente após migration

