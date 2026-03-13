

## Problem: Onboarding Flash After Login

When the user logs in, the `SIGNED_IN` event fires and immediately sets the session (making `isAuthenticated = true`), but the profile hasn't been fetched yet so `isOnboarded = false`. The routing logic sees "authenticated but not onboarded" and briefly shows the onboarding page until the profile loads and `isOnboarded` becomes `true`.

## Fix

**File: `src/contexts/AuthContext.tsx`**

In the `onAuthStateChange` handler, when a `SIGNED_IN` event occurs, set `isLoading = true` **before** fetching the profile. This keeps the loading screen visible until the profile is fully loaded, preventing the onboarding flash.

```typescript
// In onAuthStateChange handler, before fetchProfile:
if (event === 'SIGNED_IN') {
  setIsLoading(true);
}

setSession(newSession);
if (newSession?.user) {
  fetchProfile(newSession.user.id).finally(() => {
    if (mounted) setIsLoading(false);
  });
}
```

This is a one-line addition that re-enables the loading screen during the sign-in transition, so the user sees the spinner instead of a flash of the onboarding form.

