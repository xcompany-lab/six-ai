

## Correção: Persistir dados do onboarding ao trocar de aba

### Problema
Todo o estado do onboarding (respostas digitadas, step atual, anexos, etc.) está em `useState` puro. Quando o usuário troca de aba e a página recarrega, tudo é perdido.

### Solução
Persistir o estado crítico do onboarding em `sessionStorage` e restaurar ao montar o componente.

### Dados a persistir
- `currentStep` — etapa atual
- `userResponses.current` — respostas já enviadas
- `allAttachments.current` — anexos já enviados
- `completedSteps` — steps concluídos
- `pricingStep` — se está na etapa de preços
- `extractedServices` — serviços extraídos
- `selectedPayments` — pagamentos selecionados
- `plansText` — texto de planos
- `inputText` — texto sendo digitado no momento

### Alterações técnicas

**`src/pages/OnboardingPage.tsx`**:

1. Criar uma chave `six-onboarding-state` no sessionStorage
2. No mount (`useEffect`), ler sessionStorage e restaurar os estados
3. Usar `useEffect` para salvar no sessionStorage sempre que os dados mudarem
4. Limpar sessionStorage ao completar o onboarding (antes de navegar para `/app`)
5. Também persistir `inputText` com debounce para não perder o que está sendo digitado

### Implementação

- Agrupar os estados serializáveis em um objeto e salvar como JSON
- Os refs (`userResponses`, `allAttachments`) serão inicializados a partir do sessionStorage
- Anexos com URLs já enviadas ao storage do Supabase continuam válidos após reload

