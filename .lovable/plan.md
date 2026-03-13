

## Problem: Infinite Loading on F5 (Page Refresh)

The loading spinner gets stuck because of a race condition in `AuthContext.tsx`. When the page refreshes, two async paths compete to initialize the auth state:

1. `getSession().then(...)` — guarded by `initializedRef`
2. `onAuthStateChange` — for `INITIAL_SESSION` event, also uses `initializedRef`

The issue: In Supabase v2, `onAuthStateChange` fires `INITIAL_SESSION` immediately during setup. If it fires and sets `initializedRef = true` before `getSession().then()` resolves, the `getSession` path is skipped entirely. Meanwhile, the `onAuthStateChange` handler calls `await hydrateSession(newSession)` which calls `fetchProfile` — if this request is slow or fails silently, loading can hang. Additionally, if the `INITIAL_SESSION` event fires synchronously during the `onAuthStateChange` call but the `await hydrateSession` inside it takes time, there's no timeout or error boundary.

The deeper structural issue: `onAuthStateChange` should NOT `await` async operations like `fetchProfile` inside its callback, as this can block the Supabase auth event queue.

## Plan

**File: `src/contexts/AuthContext.tsx`**

1. **Set up `onAuthStateChange` BEFORE `getSession`** (recommended by Supabase docs)

2. **Don't await async work inside `onAuthStateChange`** — use a non-blocking pattern to avoid blocking the auth event queue

3. **Add a safety timeout** — if loading hasn't resolved after 5 seconds, force `isLoading = false`

4. **Simplify initialization logic** — remove `initializedRef` race condition by letting `onAuthStateChange` handle `INITIAL_SESSION` as the primary path, and use `getSession` only as fallback

Revised `useEffect`:

```typescript
useEffect(() => {
  let mounted = true;
  
  // 1. Set up listener FIRST (catches INITIAL_SESSION)
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, newSession) => {
      if (!mounted) return;
      
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setProfile(null);
        setIsLoading(false);
        return;
      }
      
      if (event === 'TOKEN_REFRESHED') {
        setSession(newSession);
        return;
      }
      
      // INITIAL_SESSION, SIGNED_IN, etc.
      setSession(newSession);
      if (newSession?.user) {
        // Non-blocking profile fetch
        fetchProfile(newSession.user.id).finally(() => {
          if (mounted) setIsLoading(false);
        });
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    }
  );
  
  // 2. Safety timeout — prevent infinite loading
  const timeout = setTimeout(() => {
    if (mounted) setIsLoading(false);
  }, 5000);
  
  return () => {
    mounted = false;
    clearTimeout(timeout);
    subscription.unsubscribe();
  };
}, []);
```

This eliminates the race condition by using a single initialization path (`onAuthStateChange` with `INITIAL_SESSION`) and adds a safety net timeout.

