

## Diagnostico: IA prolixa e pulando etapas no agendamento

### Problemas identificados

**1. Resposta dupla (attendant + scheduler)**
No `process-message-queue/index.ts`, quando o attendant detecta `intent: "schedule"`:
- Linha 415: envia as mensagens do attendant ("Certo, Madara.")
- Linhas 437-518: **imediatamente** chama o scheduler agent e envia MAIS mensagens

Resultado: o cliente recebe resposta do attendant + resposta do scheduler na sequência, sem esperar interação.

**2. Scheduler perguntando tudo de uma vez**
O scheduler está perguntando serviço E dia/hora ao mesmo tempo, sem esperar a resposta do serviço. Isso é um problema no prompt do scheduler gerado pelo onboarding (instrução vaga: "Confirme nome, serviço, data e hora de forma natural").

### Solução

**1. Não enviar mensagens do attendant quando intent é "schedule"**
Quando o attendant retorna `intent: "schedule"`, pular o envio das mensagens do attendant e deixar SÓ o scheduler responder. Assim evita a resposta dupla.

**2. Adicionar instrução de "uma pergunta por vez" no meta-prompt do scheduler**
No `generate-agent-configs/index.ts`, reforçar que o scheduler deve perguntar UMA informação de cada vez:
- Primeiro: qual serviço
- Depois de responder: qual dia e hora
- Depois: confirmar

### Alterações

| Arquivo | O que muda |
|---------|-----------|
| `supabase/functions/process-message-queue/index.ts` | Quando `intent === "schedule"`, pular `sendSplitMessages` do attendant. Só enviar as mensagens do scheduler. |
| `supabase/functions/generate-agent-configs/index.ts` | No bloco do AGENDADOR, adicionar regra: "Pergunte UMA informação por vez. Primeiro o serviço, depois a data/hora, depois confirme. NUNCA pergunte tudo de uma vez." |

### Fluxo corrigido

```text
Cliente: "Quero agendar um novo horário"
  → attendant retorna intent: "schedule" + mensagens
  → mensagens do attendant NÃO são enviadas
  → scheduler é chamado imediatamente
  → scheduler pergunta APENAS: "Qual serviço você gostaria de agendar?"
  → espera resposta
  → "Qual dia e hora ficam bons pra você?"
  → espera resposta
  → confirma e retorna intent: "booked"
```

