

## Problema Identificado

A funcao `sync-google-calendar` so faz sincronizacao **unidirecional**: puxa eventos do Google Calendar para o SIX. Ela **nao envia** agendamentos criados no SIX para o Google Calendar.

O agendamento da "Madara Juliano" (16/03, 16:30, Brow Lamination) existe no banco com `google_event_id = null`, confirmando que nunca foi enviado ao Google.

Os logs mostram: `0 new, 0 updated from 0 events` — a funcao rodou corretamente, mas so tentou buscar eventos do Google (que esta vazio).

## Solucao

Tornar o `sync-google-calendar` **bidirecional**: alem de puxar eventos do Google, tambem enviar agendamentos locais (sem `google_event_id`) para o Google Calendar.

### Alteracoes

**1. `supabase/functions/sync-google-calendar/index.ts`**

Adicionar um segundo bloco apos o pull de eventos do Google:

- Buscar appointments do usuario onde `google_event_id IS NULL`
- Para cada um, criar o evento no Google Calendar via API POST
- Salvar o `google_event_id` retornado no appointment
- Contabilizar no retorno como `pushed` (enviados ao Google)

```text
Fluxo atualizado:
1. Refresh token
2. PULL: buscar eventos do Google → inserir/atualizar no SIX (ja existe)
3. PUSH: buscar appointments sem google_event_id → criar no Google → salvar google_event_id
4. Retornar { synced, updated, pushed, total_events }
```

**2. `src/pages/AgendaPage.tsx`**

- Atualizar o toast de sucesso para incluir `pushed` no feedback: "X novos, Y atualizados, Z enviados ao Google"

**3. `src/hooks/use-appointments.ts`**

- Atualizar o tipo de retorno do `useSyncGoogleCalendar` para incluir `pushed`

### Detalhes do push

Para cada appointment sem `google_event_id`:
- Construir `start_datetime` e `end_datetime` a partir de `date`, `time` e `duration_minutes`
- Usar timezone `America/Sao_Paulo`
- Summary: `lead_name` + `service` (ex: "Madara Juliano - Brow Lamination")
- Description: `notes` ou "Agendado via SIX AI"
- Apos criacao, fazer UPDATE do `google_event_id` no appointment

