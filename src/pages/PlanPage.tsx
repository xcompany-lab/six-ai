import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/contexts/AuthContext';
import { PLAN_FEATURES, PlanType } from '@/types';
import { Check, Zap } from 'lucide-react';

export default function PlanPage() {
  const { profile } = useAuth();
  const plans: PlanType[] = ['start', 'plus', 'pro'];

  return (
    <div>
      <PageHeader title="Plano & Assinatura" subtitle="Gerencie seu plano e acompanhe seu uso" />

      {/* Current plan status */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Plano atual</p>
            <p className="text-2xl font-bold text-gradient-brand capitalize">{PLAN_FEATURES[(profile?.plan as PlanType) || 'trial'].name}</p>
            {profile?.plan === 'trial' && profile.trial_ends_at && (
              <p className="text-sm text-warning mt-1">Trial expira em {Math.max(0, Math.ceil((new Date(profile.trial_ends_at).getTime() - Date.now()) / 86400000))} dias</p>
            )}
          </div>
          <div className="flex gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Contatos</p>
              <p className="text-lg font-semibold text-foreground">{profile?.contacts_used?.toLocaleString()} / {profile?.contacts_limit?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Uso IA</p>
              <p className="text-lg font-semibold text-foreground">{user?.aiUsagePercent}%</p>
            </div>
          </div>
        </div>
        {/* Usage bar */}
        <div className="mt-4">
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-gradient-brand transition-all" style={{ width: `${user?.aiUsagePercent}%` }} />
          </div>
        </div>
      </motion.div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {plans.map((planKey, i) => {
          const plan = PLAN_FEATURES[planKey];
          const isCurrent = user?.plan === planKey;
          const isPopular = planKey === 'pro';

          return (
            <motion.div
              key={planKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`glass rounded-xl p-6 relative ${isPopular ? 'border-primary/40 glow-blue' : ''}`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-brand text-xs font-semibold text-primary-foreground">
                  Mais Popular
                </div>
              )}
              <h3 className="text-xl font-bold text-foreground mb-1">{plan.name}</h3>
              <p className="text-2xl font-bold text-gradient-brand mb-4">{plan.price}</p>
              <ul className="space-y-2 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check size={14} className="text-accent flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <button className={`w-full py-3 rounded-lg font-semibold text-sm transition-all ${
                isCurrent 
                  ? 'bg-secondary text-muted-foreground cursor-default' 
                  : 'bg-gradient-brand text-primary-foreground hover:opacity-90'
              }`}>
                {isCurrent ? 'Plano Atual' : 'Fazer Upgrade'}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Recharge */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass rounded-xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <Zap className="text-warning" size={20} />
          <h3 className="text-lg font-semibold text-foreground">Recarga Pré-Paga via Pix</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Atingiu o limite de IA? Recarregue para continuar usando sem trocar de plano.</p>
        <button className="px-6 py-2.5 rounded-lg border border-primary/30 text-primary font-semibold text-sm hover:bg-primary/10 transition-colors">
          Recarregar Agora
        </button>
      </motion.div>
    </div>
  );
}
