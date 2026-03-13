

## Diagnóstico

O problema está na rota `/onboarding` em `App.tsx` (linha 69-73):

```tsx
<Route path="/onboarding" element={
  !isAuthenticated ? <Navigate to="/" replace /> :
  isOnboarded ? <Navigate to="/app" replace /> :  // ← AQUI
  <OnboardingPage />
} />
```

Como o usuário já completou o onboarding (`isOnboarded = true`), ao clicar em "Iniciar configuração guiada" e navegar para `/onboarding`, o router imediatamente redireciona de volta para `/app`.

## Correção

**`src/App.tsx`** — Permitir acesso ao onboarding mesmo para usuários já onboarded, usando um query param `?reconfigure=true`:

```tsx
<Route path="/onboarding" element={
  !isAuthenticated ? <Navigate to="/" replace /> :
  <OnboardingPage />
} />
```

Remover o guard `isOnboarded` da rota `/onboarding`. Usuários onboarded que acessam `/onboarding` diretamente (sem intenção) não serão afetados negativamente — o onboarding simplesmente sobrescreve o perfil existente.

**`src/pages/AIAgentPage.tsx`** — Confirmar que o botão navega para `/onboarding` (já deve estar assim).

**`src/pages/OnboardingPage.tsx`** — Pré-preencher os campos com dados existentes do `business_profile` quando o usuário está reconfigurando, para que não precise digitar tudo de novo. Usar `useBusinessProfile()` para carregar dados e inicializar o state.

