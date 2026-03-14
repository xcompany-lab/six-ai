

## Plano: Formatação automática de moeda e condições de pagamento por serviço

### O que muda

**1. Formatação automática R$ nos campos de preço**

Criar uma função `formatCurrency(value)` que, ao digitar, formata automaticamente o valor no padrão `R$ 1.234,56` (moeda brasileira). Aplicar em:
- Campo de preço no onboarding (tela de pricing step)
- Campo de preço no modo edição da seção "Serviços e Preços" do AIAgentPage

A lógica: ao digitar, extrai apenas dígitos, converte para centavos, divide por 100 e formata com `toLocaleString('pt-BR')` prefixado com "R$ ". Valores vazios permanecem vazios.

**2. Exibição formatada na tela pós-onboarding (AIAgentPage view mode)**

Os valores salvos que são apenas números (ex: "977", "72") serão exibidos formatados como "R$ 977" ou "R$ 72,00" na listagem de serviços.

**3. Novos campos por serviço: condições de pagamento, parcelas e valor das parcelas**

No onboarding (pricing step) e no AIAgentPage (edit mode), adicionar ao lado de "Obs." para cada serviço:
- **Condições de pagamento** (select/chips por serviço: Pix, Cartão, etc.)
- **Parcelas** (input numérico: quantidade de parcelas)
- **Valor da parcela** (calculado automaticamente ou editável)

Isso requer expandir a interface `ServicePrice` / `ServicePriceItem` com campos:
- `payment_methods?: string[]` (por serviço)
- `installments?: string` (ex: "3x")
- `installment_value?: string` (ex: "R$ 325,67")

### Alterações técnicas

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/OnboardingPage.tsx` | Criar `formatCurrency()`, aplicar no input de preço, adicionar campos de condições/parcelas por serviço, expandir `ServicePrice` |
| `src/pages/AIAgentPage.tsx` | Aplicar `formatCurrency()` no input de preço (edit), formatar exibição (view), adicionar campos de condições/parcelas por serviço no edit e view |
| `src/hooks/use-business-profile.ts` | Expandir `ServicePriceItem` com `installments?`, `installment_value?` |

A seção global de "Formas de pagamento aceitas" no onboarding permanece como fallback, mas agora cada serviço pode ter suas próprias condições.

