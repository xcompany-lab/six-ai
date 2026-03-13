

## Plano: Corrigir indicadores de progresso + estado de loading + redirect com feedback

### Problemas identificados

1. **Dots de progresso**: O terceiro dot nunca "acende" como completo porque `completedSteps` só marca os passos respondidos, e ao responder o step 2 (último), o código pula direto para `isDone=true`. Os dots usam `isDone ? 'bg-accent'` como fallback, o que funciona visualmente mas de forma inconsistente — o último step é marcado como "done" genérico, não como "completed".

2. **Estado de loading ("Gerando seus agentes...")**: Já existe (linhas 391-406) mas precisa ser mais robusto — falta feedback de etapas intermediárias e o input desaparece abruptamente.

3. **Redirect + feedback pós-geração**: O redirect atual vai para `/app` (Dashboard) após 2s (linha 269), mas deveria ir para `/app/atendente-ia` com um toast de confirmação claro.

### Mudanças em `OnboardingPage.tsx`

**1. Progresso dos dots — marcar step 2 como completo antes de gerar**
- Na `sendMessage`, quando `nextStep >= QUESTIONS.length`, adicionar o último step ao `completedSteps` (já faz isso na linha 241, ok). O problema é que `isDone` fica true e os dots mostram todos como accent — isso está correto. Confirmar que a lógica está ok e apenas garantir a transição visual suave.

**2. Tela de loading aprimorada**
- Substituir o loading genérico por um componente com animação de progresso em etapas:
  - "Analisando suas respostas..." (0-3s)
  - "Construindo perfil do negócio..." (3-6s)  
  - "Gerando seus 4 agentes de IA..." (6s+)
- Manter o spinner com gradient e adicionar uma barra de progresso indeterminada sutil

**3. Redirect para `/app/atendente-ia` + toast de sucesso**
- Trocar `navigate('/app')` por `navigate('/app/atendente-ia')`
- Antes do redirect, exibir `toast.success()` com mensagem clara: "4 agentes criados com sucesso! Seu atendente está pronto."
- Manter o delay de 2s para o estado "done" ser visível

### Arquivo alterado
- `src/pages/OnboardingPage.tsx`

