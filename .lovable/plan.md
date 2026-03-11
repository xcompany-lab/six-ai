

# Migração Kiwify → Ticto + URLs reais dos planos

## Resumo
Atualizar todo o sistema de pagamentos de Kiwify para Ticto, com os links reais de checkout e adaptar o webhook para o formato de postback da Ticto.

## Alterações

### 1. `src/types/index.ts`
- Trocar URLs de checkout para os links Ticto reais:
  - Trial: `https://checkout.ticto.app/O34DA3017`
  - Start: `https://checkout.ticto.app/OD0B8D469`
  - Plus: `https://checkout.ticto.app/ODA8597D7`
  - Pro: `https://checkout.ticto.app/O19D97FF2`
- Adicionar `checkoutUrl` ao plano Trial também
- Renomear `KIWIFY_RECHARGE_URL` → `TICTO_RECHARGE_URL` (manter placeholder por enquanto, ou remover se não houver link de recarga)

### 2. `supabase/functions/kiwify-webhook/index.ts` → Criar `supabase/functions/ticto-webhook/index.ts`
- Novo edge function adaptado ao formato de postback da Ticto v2.0 (JSON)
- Validação do token via header (Ticto envia o token no body ou header — adaptar para ambos)
- Mapear eventos Ticto: based on the screenshot, events include:
  - **Ativação:** `Venda Realizada` → ativar plano
  - **Cancelamento:** `Reembolso`, `Chargeback`, `[Assinatura] - Cancelada`, `Encerrado` → reverter para trial
- Mapear offer/product IDs dos 3 planos Ticto para `start`, `plus`, `pro`
- Extrair email do payload Ticto (formato diferente do Kiwify)
- Secret: `TICTO_WEBHOOK_TOKEN` com o valor fornecido

### 3. `supabase/config.toml`
- Remover `[functions.kiwify-webhook]`
- Adicionar `[functions.ticto-webhook]` com `verify_jwt = false`

### 4. `src/pages/SettingsPage.tsx`
- Renomear referências de "Kiwify" para "Ticto"
- Atualizar URL do webhook para `ticto-webhook`
- Atualizar descrição de integração

### 5. `src/pages/PlanPage.tsx`
- Atualizar import de `KIWIFY_RECHARGE_URL` para `TICTO_RECHARGE_URL`

### 6. Deletar `supabase/functions/kiwify-webhook/index.ts`

### 7. Secret
- Salvar `TICTO_WEBHOOK_TOKEN` = `FxQc5uw52NNXKbljIBGoPyhvfoBsVaLmZmO4iIKIlGifo2C6n5nrdT6J21aSc6Kot3PTzwVTv40lv1uCzghd3AAFDHr6yqWDoh3P`

## URL do webhook para colar na Ticto
```
https://tzcstwlnflhiqzkmouqd.supabase.co/functions/v1/ticto-webhook
```

