

## Diagnostico

O `sessionStorage` e vinculado a uma unica aba/contexto de navegacao. Se o preview recarrega ou o iframe e recriado ao trocar de janela, o sessionStorage e perdido. Alem disso, se a usuario abrir o onboarding em outra aba/janela, nao encontra os dados.

## Solucao

Trocar `sessionStorage` por `localStorage` com chave por usuario (`six-onboarding-${userId}`), garantindo persistencia entre abas e reloads.

### Alteracoes em `src/pages/OnboardingPage.tsx`

1. Mudar `loadSavedState()` para receber `userId` e usar `localStorage.getItem('six-onboarding-' + userId)`
2. Mudar o `useEffect` de persist para usar `localStorage.setItem` com a mesma chave
3. Mudar o `sessionStorage.removeItem` no final para `localStorage.removeItem`
4. A chave passa a ser `six-onboarding-${user.id}` — precisa do `user` disponivel antes de inicializar os estados

Como o `user` vem do `useAuth()` e pode ser `null` inicialmente, a abordagem sera:
- Manter a inicializacao com `loadSavedState` usando uma chave generica de fallback
- No `useEffect` de persist, usar a chave com userId quando disponivel
- Adicionar um `useEffect` que, ao receber o `user.id`, re-carrega do localStorage se o estado ainda esta no step 0

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/OnboardingPage.tsx` | Substituir `sessionStorage` por `localStorage` com chave por usuario |

