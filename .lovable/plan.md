

# Fix: Onboarding sendo exibido repetidamente após login

## Problema

Os dados do onboarding **estão salvos corretamente** no banco (`is_onboarded: true`). O bug é um race condition no `AuthContext`:

1. `onAuthStateChange` dispara e seta a session
2. `fetchProfile` é chamado via `setTimeout(..., 0)` (assíncrono, para evitar deadlock do Supabase)
3. `setIsLoading(false)` roda **antes** do `fetchProfile` terminar
4. O app renderiza com `session` definida mas `profile = null` → `isOnboarded = false` → redireciona para `/onboarding`

## Solução

Alterar o `AuthContext` para só setar `isLoading = false` **depois** que o profile for carregado:

- No `onAuthStateChange`: quando há session, aguardar o `fetchProfile` completar antes de `setIsLoading(false)`
- Manter o `setTimeout` para evitar deadlock, mas encapsular numa Promise que resolve após o fetch
- No `getSession` inicial: mesmo tratamento — só liberar loading após profile carregado

Trecho chave da mudança no `useEffect`:

```
onAuthStateChange(async (_event, session) => {
  setSession(session);
  if (session?.user) {
    await fetchProfile(session.user.id);
  } else {
    setProfile(null);
  }
  setIsLoading(false);
});
```

Remover o `setTimeout` wrapper e chamar `fetchProfile` diretamente com `await`. O comentário sobre "deadlock" refere-se a um problema antigo do Supabase que já foi resolvido nas versões recentes do SDK (`@supabase/supabase-js ^2.99`).

## Escopo

- Arquivo único: `src/contexts/AuthContext.tsx`
- Sem mudanças no banco ou em outros componentes

