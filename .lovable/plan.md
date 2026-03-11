
Objetivo: impedir que usuários já onboarded (como `madaraschumacher@gmail.com`) sejam enviados para `/onboarding` a cada novo login.

Diagnóstico confirmado:
- No banco, o perfil desse usuário está com `is_onboarded = true` (persistência está ok).
- O problema é de sincronização/roteamento no frontend, não de salvamento no Supabase.
- Em `AuthContext`, durante o evento de login (`SIGNED_IN`), `session` pode ser atualizada antes do `profile` terminar de carregar, enquanto `isLoading` já está `false`.
- Nesse intervalo, o app entende `isAuthenticated=true` e `isOnboarded=false` (porque `profile` ainda está `null`) e redireciona para `/onboarding`.
- A rota `/onboarding` hoje permite qualquer usuário autenticado, inclusive já onboarded, então ele fica preso nessa tela.

Do I know what the issue is? Sim.

Plano de implementação:

1) Blindar hidratação de auth/profile no `AuthContext`
- Arquivo: `src/contexts/AuthContext.tsx`
- Criar um fluxo único de “hidratar sessão + perfil” com `try/finally`:
  - setar `isLoading(true)` antes de carregar perfil em transições críticas de auth.
  - só finalizar (`isLoading(false)`) após concluir fetch do perfil (ou tratar erro).
- Ajustar `onAuthStateChange` para tratar por tipo de evento:
  - `SIGNED_IN` / `INITIAL_SESSION`: hidratar perfil com loading.
  - `SIGNED_OUT`: limpar `session/profile` imediatamente.
  - `TOKEN_REFRESHED`: atualizar sessão sem reabrir loading global.
- Isso elimina o estado intermediário que causa redirecionamento incorreto.

2) Corrigir guarda da rota de onboarding
- Arquivo: `src/App.tsx`
- Alterar a rota `/onboarding` para:
  - se não autenticado: `Navigate("/")`
  - se autenticado **e já onboarded**: `Navigate("/app")`
  - só renderizar `OnboardingPage` quando autenticado e `!isOnboarded`
- Resultado: mesmo que alguém caia em `/onboarding` por race ou URL manual, será redirecionado para `/app`.

3) Endurecer tratamento de erro ao salvar onboarding
- Arquivos: `src/contexts/AuthContext.tsx`, `src/pages/OnboardingPage.tsx`
- Fazer `completeOnboarding` propagar erro real (em vez de falhar silenciosamente).
- Em `finish`, navegar para `/app` apenas com confirmação de sucesso.
- Exibir toast de erro quando houver falha real de update.
- Isso evita casos futuros em que pareça “salvo” sem ter persistido.

4) Validação pós-fix (E2E)
- Login com `madaraschumacher@gmail.com`.
- Confirmar que:
  - não aparece onboarding novamente após novo login;
  - refresh de página mantém acesso direto ao `/app`;
  - abrir `/onboarding` manualmente redireciona para `/app` quando `is_onboarded=true`.
- Testar também sign-out → sign-in para garantir ausência de regressão.

Escopo de arquivos:
- `src/contexts/AuthContext.tsx`
- `src/App.tsx`
- `src/pages/OnboardingPage.tsx`

Sem mudanças de banco/migration (RLS e persistência estão corretos para este caso).
