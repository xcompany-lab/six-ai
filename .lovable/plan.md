

## Problema

Após conectar o Google Agenda, o callback redireciona para `https://six-ai.lovable.app/settings?google=connected`, que resulta em 404 porque:
- O domínio correto é `usesix.com.br`
- A rota correta é `/app/configuracoes`, não `/settings`

## Correção

### `supabase/functions/google-calendar-callback/index.ts`
Atualizar todas as URLs de redirect de:
- `https://six-ai.lovable.app/settings?google=connected` → `https://usesix.com.br/app/configuracoes?google=connected`
- `https://six-ai.lovable.app/settings?google=error` → `https://usesix.com.br/app/configuracoes?google=error`

São 4 ocorrências no arquivo (3 de erro + 1 de sucesso).

