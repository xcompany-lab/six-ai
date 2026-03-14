import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { PlanType } from '@/types';

interface Profile {
  id: string;
  name: string;
  brand_name: string;
  email: string;
  niche: string;
  whatsapp: string;
  services: string[];
  objective: string;
  plan: string;
  trial_ends_at: string | null;
  ai_usage_percent: number;
  contacts_used: number;
  contacts_limit: number;
  avatar: string | null;
  address: string | null;
  business_hours: string | null;
  voice_tone: string | null;
  business_description: string | null;
  is_onboarded: boolean;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  completeOnboarding: (data: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasPlanAccess: (requiredPlan: PlanType) => boolean;
}

const planHierarchy: PlanType[] = ['start', 'plus', 'pro', 'trial'];

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchAdminStatus = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    setIsAdmin(!!data);
  };

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (!error && data) {
      setProfile(data as unknown as Profile);
    }
    return data as unknown as Profile | null;
  };

  useEffect(() => {
    let mounted = true;

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

        if (event === 'SIGNED_IN') {
          setIsLoading(true);
        }

        setSession(newSession);
        if (newSession?.user) {
          Promise.all([
            fetchProfile(newSession.user.id),
            fetchAdminStatus(newSession.user.id),
          ]).finally(() => {
            if (mounted) setIsLoading(false);
          });
        } else {
          setProfile(null);
          setIsLoading(false);
        }
      }
    );

    const timeout = setTimeout(() => {
      if (mounted) setIsLoading(false);
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message || null };
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error: error?.message || null };
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error?.message || null };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error?.message || null };
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!session?.user) return;
    const { error } = await supabase
      .from('profiles')
      .update(data as any)
      .eq('id', session.user.id);
    if (!error) {
      setProfile(prev => prev ? { ...prev, ...data } : prev);
    }
  };

  const completeOnboarding = async (data: Partial<Profile>) => {
    if (!session?.user) throw new Error('Usuário não autenticado');
    const updateData = { ...data, is_onboarded: true };
    const { error } = await supabase
      .from('profiles')
      .update(updateData as any)
      .eq('id', session.user.id);
    if (error) {
      throw new Error(error.message);
    }
    setProfile(prev => prev ? { ...prev, ...updateData } : prev);
  };

  const refreshProfile = async () => {
    if (session?.user) {
      await fetchProfile(session.user.id);
    }
  };

  const hasPlanAccess = (requiredPlan: PlanType) => {
    if (isAdmin) return true;
    if (!profile) return false;
    const userPlan = profile.plan as PlanType;
    if (userPlan === 'trial') return true;
    const userIdx = planHierarchy.indexOf(userPlan);
    const reqIdx = planHierarchy.indexOf(requiredPlan);
    return userIdx >= reqIdx;
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user || null,
        profile,
        isAuthenticated: !!session?.user,
        isOnboarded: profile?.is_onboarded || false,
        isAdmin,
        isLoading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        resetPassword,
        updatePassword,
        updateProfile,
        completeOnboarding,
        refreshProfile,
        hasPlanAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

const fallbackAuthContext: AuthContextType = {
  session: null,
  user: null,
  profile: null,
  isAuthenticated: false,
  isOnboarded: false,
  isLoading: false,
  signIn: async () => ({ error: 'AuthProvider não inicializado' }),
  signUp: async () => ({ error: 'AuthProvider não inicializado' }),
  signInWithGoogle: async () => {},
  signOut: async () => {},
  resetPassword: async () => ({ error: 'AuthProvider não inicializado' }),
  updatePassword: async () => ({ error: 'AuthProvider não inicializado' }),
  updateProfile: async () => {},
  completeOnboarding: async () => {},
  refreshProfile: async () => {},
  hasPlanAccess: () => false,
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    console.error('AuthContext ausente na árvore React; usando fallback seguro.');
    return fallbackAuthContext;
  }
  return ctx;
};
