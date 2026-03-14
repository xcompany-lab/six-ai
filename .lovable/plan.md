

## Plano: Deteccao automatica de confirmacao via WhatsApp

### O que sera feito

Quando um cliente responde "Sim", "Confirmo", "Confirmado" (ou variacoes) ao lembrete enviado, o webhook do WhatsApp detecta isso automaticamente e:
1. Atualiza o `scheduled_reminders` com status `confirmed`
2. Atualiza o `appointments` com status `confirmed`

### Alteracoes

**1. `supabase/functions/whatsapp-webhook/index.ts`**

Adicionar logica de deteccao de confirmacao **antes** do enfileiramento na message_queue:

- Apos extrair `messageText` e resolver `userId` + `lead`, verificar se o texto e uma confirmacao
- Regex: `/^(sim|confirmo|confirmado|confirmar|ok|yes)\b/i` (match no inicio, case-insensitive)
- Se for confirmacao:
  - Buscar `scheduled_reminders` com status `sent`, `contact_phone = contactPhone`, `user_id = userId`, ordenado por `send_at DESC`, limit 1
  - Se encontrar: atualizar status para `confirmed` e atualizar o `appointments` correspondente (via `appointment_id`) para status `confirmed`
  - Logar a confirmacao
- A mensagem continua sendo enfileirada normalmente (o agente AI pode responder agradecendo)

**2. Nenhuma alteracao de schema necessaria**

Os campos `status` em `scheduled_reminders` e `appointments` ja sao `text` e suportam o valor `confirmed`.

### Fluxo

```text
Cliente envia "Sim" →
  webhook detecta confirmacao →
  busca ultimo lembrete "sent" do contato →
  atualiza reminder.status = "confirmed" →
  atualiza appointment.status = "confirmed" →
  continua enfileirando mensagem normalmente
```

