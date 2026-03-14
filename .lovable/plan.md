

## Diagnostico: Lembretes da clinicaksbeauty@gmail.com

### O que esta acontecendo

Os lembretes **existem** no banco de dados — ha 2 pendentes para o agendamento da Madara Juliano. Porem ha 3 problemas reais:

### Problema 1: Intervalo do 1o lembrete mal configurado

O campo `first_reminder` esta salvo como `"72"` (sem o sufixo "h"). O trigger do banco usa `regexp_replace('72', 'h$', ' hours')` que retorna `'72'` — e o PostgreSQL interpreta isso como **72 dias**, nao 72 horas. O `send_at` do primeiro lembrete ficou errado.

**Correcao**: Validar no frontend que o valor sempre tenha sufixo (`h` ou `m`) antes de salvar. Tambem corrigir o trigger para tratar valores numericos puros como horas por padrao.

### Problema 2: Dados do Google Calendar sync mal mapeados

Quando o appointment vem do Google Calendar:
- `lead_name` = "Madara Juliano - Brow Lamination" (nome + servico juntos)
- `service` = "Google Calendar" (generico)

O trigger copia esses valores para o lembrete, resultando em `contact_name` errado e `service_name` generico.

**Correcao**: No `sync-google-calendar`, separar o summary do evento em `lead_name` e `service` (split por " - ").

### Problema 3: Validacao do campo de intervalo

O input de texto livre permite valores sem unidade. Deveria ser um select ou input numerico com unidade fixa.

**Correcao**: Trocar o input do modal de configuracao por um campo numerico + select de unidade (horas/minutos).

### Alteracoes

**1. `supabase/functions/sync-google-calendar/index.ts`**
- Ao criar appointments do Google, fazer split do summary por " - " para separar nome do lead e servico
- Se nao houver separador, usar summary como lead_name e "Servico" como service

**2. `src/pages/RemindersPage.tsx`**
- Trocar inputs de texto do 1o e 2o lembrete por campos numericos com sufixo "h" fixo (ou select horas/minutos)
- Garantir que o valor salvo sempre tenha o sufixo correto

**3. Trigger `schedule_reminders_for_appointment` (migracao SQL)**
- Tornar o parse mais robusto: se o valor for puramente numerico, tratar como horas
- `reminder_1_interval := (regexp_replace(regexp_replace(config.first_reminder, '^(\d+)$', '\1 hours'), 'h$', ' hours'))::interval;`

**4. Correcao imediata do dado**
- Atualizar o `reminders_config` para `first_reminder = '72h'` via migracao ou fix manual

