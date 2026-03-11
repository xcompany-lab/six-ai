

# Sprint 8 — Integração Kiwify (Checkout por Link + Webhook)

## Arquitetura

```text
Usuário clica "Fazer Upgrade"
        │
        ▼
  Abre link Kiwify (nova aba)
  com email do usuário na URL
        │
        ▼
  Kiwify processa pagamento
        │
        ▼
  Kiwify envia POST webhook
        │
        ▼
  Edge Function kiwify-webhook
  ├── Valida assinatura/token
  ├── Identifica plano pelo product_id
  ├── Busca usuário pelo email
  └── Atualiza profiles.plan + contacts_limit
```

## O que será feito

### 1. Edge Function `kiwify-webhook`
- Recebe POST da Kiwify com dados da compra (email, product_id, status)
- Valida o webhook usando um token secreto (`KIWIFY_WEBHOOK_TOKEN`)
- Mapeia `product_id` → plano (`start`, `plus`, `pro`)
- Atualiza `profiles.plan` e `contacts_limit` do usuário correspondente via email
- Loga eventos para auditoria
- Trata eventos: `order_approved` (ativa plano), `subscription_cancelled` (volta para trial), `refund` (volta para trial)

### 2. Configuração dos links de checkout
- Adicionar URLs de checkout Kiwify por plano no `PLAN_FEATURES` (campo `checkoutUrl`)
- URLs incluem `?email={user_email}` para vincular a compra ao usuário

### 3. Atualizar PlanPage
- Botão "Fazer Upgrade" abre o link Kiwify em nova aba (`window.open`)
- Botão "Recarregar Agora" abre link de recarga Kiwify
- Placeholder URLs que o usuário substitui pelos seus links reais da Kiwify

### 4. Atualizar SettingsPage
- Na seção "Integrações", adicionar campo para configurar o webhook URL da Kiwify (read-only, mostrando a URL do edge function para copiar)

### 5. Secret necessário
- `KIWIFY_WEBHOOK_TOKEN` — token para validar que o webhook veio da Kiwify

### 6. Config.toml
- Registrar `kiwify-webhook` com `verify_jwt = false` (endpoint público)

## Arquivos afetados
- **Criar:** `supabase/functions/kiwify-webhook/index.ts`
- **Editar:** `src/types/index.ts` (adicionar checkoutUrl ao PLAN_FEATURES)
- **Editar:** `src/pages/PlanPage.tsx` (links de checkout)
- **Editar:** `supabase/config.toml` (registrar function)

