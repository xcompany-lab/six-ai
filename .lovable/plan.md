

## Plano: Suporte a serviços de longa duração (cursos, workshops)

### Problema

Hoje o campo `duration_minutes` só oferece opções até 120 min. Clientes que vendem cursos precisam configurar serviços que duram horas e podem se estender por múltiplos dias.

### Solução

Adicionar dois modos de duração por serviço, escolhidos via toggle:

**Modo 1 — Múltiplas sessões:** Duração por sessão + número de sessões/dias
- Ex: "Curso de Extensão" → 4h por sessão, 3 sessões
- A IA agenda cada sessão separadamente em dias consecutivos úteis

**Modo 2 — Bloco de evento:** Data/hora início e data/hora fim
- Ex: "Workshop Intensivo" → 09:00 de 15/03 até 18:00 de 16/03
- A IA agenda como um bloco contínuo

### Alterações na interface `ServicePriceItem`

```typescript
export interface ServicePriceItem {
  name: string;
  price: string;
  duration_minutes?: number;        // mantido para serviços simples
  duration_type?: 'simple' | 'multi_session' | 'block';  // novo
  session_duration_minutes?: number; // duração de cada sessão (modo multi)
  session_count?: number;            // nº de sessões/dias (modo multi)
  // ... campos existentes (notes, payment_methods, installments, etc.)
}
```

### Alterações técnicas

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/use-business-profile.ts` | Expandir `ServicePriceItem` com `duration_type`, `session_duration_minutes`, `session_count` |
| `src/pages/OnboardingPage.tsx` | No pricing step, adicionar seletor de tipo de duração. Para "simples": select atual expandido (15min até 8h). Para "múltiplas sessões": campos de duração por sessão + nº de sessões. Bloco de evento: não se aplica no onboarding (é configurado no momento do agendamento) |
| `src/pages/AIAgentPage.tsx` | Mesma lógica no edit/view mode dos serviços |
| `supabase/functions/ai-chat/index.ts` | Instruir a IA no prompt sobre serviços multi-sessão: "agendar X sessões de Yh em dias consecutivos úteis" |

### UX no onboarding e Atendente IA

Cada serviço terá um seletor de tipo:
- **Sessão única** (padrão): select com opções expandidas (15min, 30min, 45min, 1h, 1h30, 2h, 3h, 4h, 6h, 8h)
- **Múltiplas sessões**: dois campos — "Duração por sessão" (mesmo select) + "Nº de sessões" (input numérico)

O modo "Bloco de evento" ficará disponível apenas no momento do agendamento real (na Agenda), não na configuração do serviço, pois depende de datas específicas.

### Impacto no agendamento pela IA

O prompt do agendador receberá a informação: "Serviço X requer 3 sessões de 4h". A IA então:
1. Pergunta a data da primeira sessão
2. Propõe as datas seguintes em dias úteis consecutivos
3. Confirma todas as sessões de uma vez
4. Cria múltiplos registros na tabela `appointments`

