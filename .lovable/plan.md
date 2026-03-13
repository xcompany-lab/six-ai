

## Plano: Exibir descrição/notas dos agendamentos na Agenda

### Problema
A Edge Function `sync-google-calendar` já salva `event.description` no campo `notes` da tabela `appointments`, mas o componente `DayView` não exibe esse campo.

### Correção

#### `src/pages/AgendaPage.tsx` — componente `DayView`
- Adicionar exibição do campo `a.notes` abaixo da linha de serviço/duração, quando existir
- Texto em `text-xs text-muted-foreground` com truncamento ou limite de linhas
- Aplicar a mesma lógica nos componentes `WeekView` (tooltip ou expansão) se couber

#### `src/pages/AgendaPage.tsx` — componente `WeekView`
- Adicionar `a.notes` truncado abaixo do serviço nos cards semanais (espaço limitado, 1 linha com truncate)

