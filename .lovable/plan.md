

## Plano: Webhook Ticto para recargas Pix de IA

### Contexto

O webhook atual (`ticto-webhook`) só trata planos (start/plus/pro/trial). Precisamos adicionar tratamento para os 4 códigos de recarga Pix que resetam o `ai_usage_percent` do usuário.

### Alterações

**`supabase/functions/ticto-webhook/index.ts`:**

Adicionar um mapa separado `RECHARGE_MAP` com os códigos de recarga:

| Código | Valor | Efeito |
|--------|-------|--------|
| `O7FB21253` | R$10 | Reseta `ai_usage_percent` para 0 |
| `O82700531` | R$15 | Reseta `ai_usage_percent` para 0 |
| `OF75DAE2F` | R$25 | Reseta `ai_usage_percent` para 0 |
| `O31D85879` | R$35 | Reseta `ai_usage_percent` para 0 |

No fluxo de `ACTIVATION_STATUSES` ("authorized"):
1. Verificar primeiro se o `offerCode` é uma recarga (existe no `RECHARGE_MAP`)
2. Se sim: fazer `update` no `profiles` setando `ai_usage_percent = 0` onde `email = email`
3. Se não: seguir o fluxo existente de ativação de plano (com `OFFER_PLAN_MAP`)

Isso evita o erro atual de "Unknown offer" quando uma recarga é processada, pois os códigos de recarga não existem no `OFFER_PLAN_MAP`.

### Lógica simplificada

Todas as recargas resetam para 0% independente do valor. A diferença de preço é comercial (quanto tempo o usuário leva para atingir 100% novamente depende do uso).

### Nenhuma migração necessária

O campo `ai_usage_percent` já existe na tabela `profiles`.

