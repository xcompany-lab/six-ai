import { createContext, useContext, useState, ReactNode } from 'react';
import { PlanType, UserProfile } from '@/types';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  login: (email: string, password: string) => void;
  signup: (email: string, password: string, name: string) => void;
  logout: () => void;
  completeOnboarding: (data: Partial<UserProfile>) => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  hasPlanAccess: (requiredPlan: PlanType) => boolean;
}

const planHierarchy: PlanType[] = ['start', 'plus', 'pro', 'trial'];

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isOnboarded, setIsOnboarded] = useState(false);

  const login = (_email: string, _password: string) => {
    setUser({
      id: '1',
      name: 'Usuário Demo',
      brandName: 'Clínica Exemplo',
      email: _email,
      niche: 'Estética',
      whatsapp: '+5511999999999',
      services: ['Limpeza de Pele', 'Botox', 'Preenchimento'],
      objective: 'Agendar mais',
      plan: 'pro',
      trialEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      aiUsagePercent: 42,
      contactsUsed: 1847,
      contactsLimit: 5000,
    });
    setIsOnboarded(true);
  };

  const signup = (_email: string, _password: string, _name: string) => {
    setUser({
      id: '1',
      name: _name,
      brandName: '',
      email: _email,
      niche: '',
      whatsapp: '',
      services: [],
      objective: '',
      plan: 'trial',
      trialEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      aiUsagePercent: 0,
      contactsUsed: 0,
      contactsLimit: 5000,
    });
    setIsOnboarded(false);
  };

  const logout = () => {
    setUser(null);
    setIsOnboarded(false);
  };

  const completeOnboarding = (data: Partial<UserProfile>) => {
    if (user) setUser({ ...user, ...data });
    setIsOnboarded(true);
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    if (user) setUser({ ...user, ...data });
  };

  const hasPlanAccess = (requiredPlan: PlanType) => {
    if (!user) return false;
    if (user.plan === 'trial') return true;
    const userIdx = planHierarchy.indexOf(user.plan);
    const reqIdx = planHierarchy.indexOf(requiredPlan);
    return userIdx >= reqIdx;
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isOnboarded, login, signup, logout, completeOnboarding, updateProfile, hasPlanAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
