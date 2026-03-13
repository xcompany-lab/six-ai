

## Plano: Adicionar configuracoes de agendamento na pagina de Agenda

Adicionar um painel de configuracoes (acessivel por botao de engrenagem no header) com 3 secoes: horario de atendimento, dias da semana e bloqueio de datas. Usa os hooks `useSchedulingConfig` e `useUpsertSchedulingConfig` ja existentes, e a tabela `scheduling_config` ja criada no banco.

### Mudancas em `src/pages/AgendaPage.tsx`

**1. Botao de configuracoes no header**
- Adicionar icone `Settings` (lucide) ao lado do botao "Sincronizar"
- Ao clicar, abre um painel/drawer lateral ou um modal com as configuracoes

**2. Componente `SchedulingSettings` (inline ou separado)**

Tres secoes dentro do painel:

**Horario de atendimento:**
- `work_start` e `work_end` — inputs de time (ex: 08:00 / 18:00)
- `lunch_start` e `lunch_end` — inputs de time (nullable, com toggle para ativar/desativar intervalo)
- `default_duration` — select (15, 30, 45, 60 min)
- `buffer_minutes` — select (0, 5, 10, 15, 30 min)

**Dias da semana:**
- 7 toggle buttons (Seg-Dom), mapeados para `work_days` (array de inteiros 0-6, onde 1=Seg)
- Visual: botoes circulares, ativo = primary, inativo = muted

**Bloqueio de datas:**
- Mini calendario (componente `Calendar` ja existente) para selecionar datas
- Lista das datas bloqueadas com botao de remover (X)
- `blocked_dates` — array de strings 'yyyy-MM-dd'

**3. Persistencia**
- Carregar dados com `useSchedulingConfig()`
- Salvar com `useUpsertSchedulingConfig()` ao clicar "Salvar"
- Toast de confirmacao

### Arquivos alterados
- `src/pages/AgendaPage.tsx` — botao settings + componente de configuracoes em Sheet/Dialog

### Nenhuma mudanca de banco necessaria
A tabela `scheduling_config` ja tem todos os campos: `work_start`, `work_end`, `lunch_start`, `lunch_end`, `work_days`, `blocked_dates`, `default_duration`, `buffer_minutes`.

