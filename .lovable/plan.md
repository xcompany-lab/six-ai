

## Plano: Duração por serviço no onboarding e agente IA

### Contexto

Hoje a duração dos agendamentos é definida globalmente nas "Configurações da Agenda" (`scheduling_config.default_duration`). Mas cada serviço pode ter duração diferente (ex: corte 30min, coloração 2h). O melhor lugar para adicionar isso é no **onboarding (etapa de preços)** e na **tela do Atendente IA (seção Serviços e Preços)**, onde já existem os campos por serviço.

### O que muda

Adicionar um campo **"Duração (min)"** por serviço, ao lado dos campos de preço e parcelas já existentes.

Quando a IA agendar um serviço, usará a duração específica daquele serviço ao invés da duração padrão global.

### Alterações técnicas

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/use-business-profile.ts` | Adicionar `duration_minutes?: number` ao `ServicePriceItem` |
| `src/pages/OnboardingPage.tsx` | Adicionar input de duração (select: 15/30/45/60/90/120 min) por serviço na etapa de pricing |
| `src/pages/AIAgentPage.tsx` | Adicionar campo de duração no edit mode e exibir no view mode |
| `supabase/functions/ai-chat/index.ts` | Ao criar agendamento, buscar `duration_minutes` do serviço no `business_profiles.service_prices` ao invés de usar apenas o `default_duration` do `scheduling_config` |

### Interface por serviço (onboarding + agente)

Cada serviço terá:
- Nome | Preço (R$) | **Duração** | Parcelas | Valor parcela | Obs. | Pagamento

O campo duração será um `<select>` com opções: 15, 30, 45, 60, 90, 120 minutos. Default: 60min.

### Lógica de agendamento

Na edge function `ai-chat`, ao criar um appointment:
1. Buscar o serviço solicitado no `service_prices` do `business_profiles`
2. Se tiver `duration_minutes`, usar esse valor
3. Senão, usar o `default_duration` do `scheduling_config` como fallback

