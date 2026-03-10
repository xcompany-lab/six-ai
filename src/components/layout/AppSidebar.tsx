import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, User, CreditCard, Bot, CalendarCheck, RotateCcw,
  Zap, Bell, Calendar, MessageSquare, Columns3, Brain, Settings, HelpCircle,
  ChevronLeft, ChevronRight, LogOut, X,
} from 'lucide-react';
import sixLogo from '@/assets/six-logo-dark.png';

interface MenuItem {
  label: string;
  icon: React.ElementType;
  path: string;
  requiredPlan?: 'start' | 'plus' | 'pro';
}

interface AppSidebarProps {
  onClose?: () => void;
  isMobile?: boolean;
}

const menuItems: MenuItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/app' },
  { label: 'Perfil', icon: User, path: '/app/perfil' },
  { label: 'Plano', icon: CreditCard, path: '/app/plano' },
  { label: 'Atendente IA', icon: Bot, path: '/app/atendente-ia' },
  { label: 'Agendamentos', icon: CalendarCheck, path: '/app/agendamentos', requiredPlan: 'plus' },
  { label: 'Follow Up', icon: RotateCcw, path: '/app/followup', requiredPlan: 'pro' },
  { label: 'Ativação Base', icon: Zap, path: '/app/ativacao', requiredPlan: 'pro' },
  { label: 'Lembretes', icon: Bell, path: '/app/lembretes', requiredPlan: 'plus' },
  { label: 'Agenda', icon: Calendar, path: '/app/agenda' },
  { label: 'WhatsApp', icon: MessageSquare, path: '/app/whatsapp' },
  { label: 'Kanban CRM', icon: Columns3, path: '/app/kanban', requiredPlan: 'pro' },
  { label: 'Insights IA', icon: Brain, path: '/app/insights', requiredPlan: 'pro' },
  { label: 'Configurações', icon: Settings, path: '/app/configuracoes' },
  { label: 'Suporte', icon: HelpCircle, path: '/app/suporte' },
];

export default function AppSidebar({ onClose, isMobile }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut, hasPlanAccess } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleNavigate = (path: string, locked: boolean) => {
    if (locked) return;
    navigate(path);
    if (isMobile) onClose?.();
  };

  const showLabels = isMobile || !collapsed;
  const sidebarWidth = isMobile ? 280 : collapsed ? 72 : 260;

  return (
    <motion.aside
      animate={{ width: sidebarWidth }}
      transition={{ duration: 0.2 }}
      className="h-screen flex flex-col bg-sidebar border-r border-sidebar-border sticky top-0 z-40 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 h-16 border-b border-sidebar-border">
        <AnimatePresence>
          {showLabels && (
            <motion.img src={sixLogo} alt="SIX AI" className="h-8 object-contain"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          )}
        </AnimatePresence>
        {isMobile ? (
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground transition-colors">
            <X size={18} />
          </button>
        ) : (
          <button onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground transition-colors">
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        )}
      </div>

      {profile?.plan === 'trial' && showLabels && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-gradient-brand text-xs font-semibold text-primary-foreground text-center">
          Trial · {Math.max(0, Math.ceil((new Date(profile.trial_ends_at!).getTime() - Date.now()) / 86400000))} dias restantes
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const locked = item.requiredPlan && !hasPlanAccess(item.requiredPlan);
          const Icon = item.icon;

          return (
            <button key={item.path} onClick={() => handleNavigate(item.path, !!locked)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                ${isActive ? 'bg-primary/10 text-primary glow-blue'
                  : locked ? 'text-muted-foreground/40 cursor-not-allowed'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}
              title={locked ? `Disponível no plano ${item.requiredPlan}` : item.label}>
              <Icon size={20} className={isActive ? 'text-primary' : ''} />
              <AnimatePresence>
                {showLabels && (
                  <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}
                    className="whitespace-nowrap overflow-hidden">
                    {item.label}{locked && ' 🔒'}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </nav>

      {profile && showLabels && (
        <div className="mx-3 mb-2 p-3 rounded-lg bg-secondary">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Uso de IA</span>
            <span>{profile.ai_usage_percent}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-gradient-brand transition-all"
              style={{ width: `${profile.ai_usage_percent}%` }} />
          </div>
        </div>
      )}

      <div className="border-t border-sidebar-border p-3">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-destructive transition-colors">
          <LogOut size={18} />
          {showLabels && <span>Sair</span>}
        </button>
      </div>
    </motion.aside>
  );
}
