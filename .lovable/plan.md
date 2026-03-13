

## Plano: Editar precos e servicos na pagina do Atendente IA

### Objetivo
Adicionar uma secao editavel na pagina AIAgentPage onde o usuario pode ver e editar seus servicos/precos, formas de pagamento e planos — sem precisar refazer o onboarding.

### Alteracoes

**1. `src/hooks/use-business-profile.ts`**
- Adicionar `service_prices` ao interface `BusinessProfile`
- O hook `useSaveBusinessProfile` ja existe e faz upsert + regenera agentes — sera reutilizado

**2. `src/pages/AIAgentPage.tsx`**
- Adicionar nova secao "Servicos e Precos" entre "Perfil do Negocio" e "Agentes Configurados"
- Modo visualizacao: tabela com nome do servico, valor e observacoes
- Botao "Editar" que abre modo edicao inline:
  - Cards editaveis para cada servico (nome, valor R$, notas)
  - Botao "+ Adicionar servico"
  - Botao remover por servico
  - Chips selecionaveis para formas de pagamento
  - Textarea para planos/pacotes
- Botao "Salvar" chama `useSaveBusinessProfile` com o `service_prices` atualizado, o que automaticamente regenera os agentes com os novos precos
- Mesmo estilo visual (glass cards, motion animations)

### Fluxo
1. Usuario abre /app/atendente
2. Ve secao "Servicos e Precos" com dados atuais
3. Clica "Editar"
4. Modifica servicos, precos, pagamento
5. Clica "Salvar" → salva no banco → regenera agentes automaticamente
6. Toast de confirmacao

### Sem alteracoes de banco
A coluna `service_prices` (jsonb) ja existe na tabela `business_profiles`. Nenhuma migracao necessaria.

