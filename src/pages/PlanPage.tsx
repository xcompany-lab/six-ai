import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/contexts/AuthContext';
import { useBillingUsage } from '@/hooks/use-billing';
import { PLAN_FEATURES, PlanType, TICTO_RECHARGE_URL } from '@/types';
import { Check, Zap, AlertTriangle, Users, Cpu, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const RECHARGE_OPTIONS = [
  { value: 'R$ 10', label: 'Recarga básica', url: 'https://checkout.ticto.app/O7FB21253' },
  { value: 'R$ 15', label: 'Uso moderado', url: 'https://checkout.ticto.app/O82700531' },
  { value: 'R$ 25', label: 'Uso avançado', url: 'https://checkout.ticto.app/OF75DAE2F' },
  { value: 'R$ 35', label: 'Alto volume', url: 'https://checkout.ticto.app/O31D85879' },
];

export default function PlanPage() {
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const { profile } = useAuth();
  const billing = useBillingUsage();
  const plans: PlanType[] = ['start', 'plus', 'pro'];

  return (
    <div>
      <PageHeader title="Plano & Assinatura" subtitle="Gerencie seu plano e acompanhe seu uso" />

      {/* Trial warning */}
      {billing.plan === 'trial' && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className={`glass rounded-xl p-4 mb-6 flex items-center gap-3 ${billing.isTrialExpired ? 'border-destructive/30' : 'border-warning/20'}`}>
          <AlertTriangle size={18} className={billing.isTrialExpired ? 'text-destructive' : 'text-warning'} />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {billing.isTrialExpired ? 'Seu trial expirou!' : `Seu trial expira em ${billing.trialDaysLeft} dia${billing.trialDaysLeft !== 1 ? 's' : ''}`}
            </p>
            <p className="text-xs text-muted-foreground">
              {billing.isTrialExpired ? 'Escolha um plano para continuar usando o sistema.' : 'Aproveite todos os recursos Pro enquanto o trial está ativo.'}
            </p>
          </div>
        </motion.div>
      )}

      {/* Current plan status */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Plano atual</p>
            <p className="text-2xl font-bold text-gradient-brand capitalize">
              {PLAN_FEATURES[(profile?.plan as PlanType) || 'trial']?.name || 'Trial Free'}
            </p>
          </div>
          <div className="flex gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Contatos</p>
              <p className="text-lg font-semibold text-foreground">{billing.contactsUsed.toLocaleString()} / {billing.contactsLimit.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Uso IA</p>
              <p className="text-lg font-semibold text-foreground">{billing.aiUsagePercent}%</p>
            </div>
          </div>
        </div>

        {/* Usage bars */}
        <div className="mt-6 space-y-4">
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span className="flex items-center gap-1"><Users size={12} /> Contatos</span>
              <span>{billing.contactsPercent}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full transition-all ${billing.contactsPercent > 90 ? 'bg-destructive' : billing.contactsPercent > 70 ? 'bg-warning' : 'bg-gradient-brand'}`}
                style={{ width: `${billing.contactsPercent}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span className="flex items-center gap-1"><Cpu size={12} /> Uso de IA</span>
              <span>{billing.aiUsagePercent}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full transition-all ${billing.aiUsagePercent > 90 ? 'bg-destructive' : billing.aiUsagePercent > 70 ? 'bg-warning' : 'bg-gradient-brand'}`}
                style={{ width: `${billing.aiUsagePercent}%` }} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {plans.map((planKey, i) => {
          const plan = PLAN_FEATURES[planKey];
          const isCurrent = profile?.plan === planKey;
          const isPopular = planKey === 'pro';

          return (
            <motion.div key={planKey} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className={`glass rounded-xl p-6 relative ${isPopular ? 'border-primary/40 glow-blue' : ''}`}>
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-brand text-xs font-semibold text-primary-foreground">
                  Mais Popular
                </div>
              )}
              <h3 className="text-xl font-bold text-foreground mb-1">{plan.name}</h3>
              <p className="text-2xl font-bold text-gradient-brand mb-1">{plan.price}</p>
              <p className="text-xs text-muted-foreground mb-4">Até {plan.contactsLimit.toLocaleString()} contatos</p>
              <ul className="space-y-2 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check size={14} className="text-accent flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => {
                  if (!isCurrent && plan.checkoutUrl) {
                    const url = `${plan.checkoutUrl}?email=${encodeURIComponent(profile?.email || '')}`;
                    window.open(url, '_blank');
                  }
                }}
                className={`w-full py-3 rounded-lg font-semibold text-sm transition-all ${
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

      {/* Feature comparison */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Shield size={18} className="text-primary" /> Comparativo de Recursos
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 text-muted-foreground font-medium">Recurso</th>
                {plans.map(p => <th key={p} className="text-center py-3 text-foreground font-semibold">{PLAN_FEATURES[p].name}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                { feature: 'Atendente IA', start: true, plus: true, pro: true },
                { feature: 'Conexão WhatsApp', start: true, plus: true, pro: true },
                { feature: 'Agendamentos com IA', start: false, plus: true, pro: true },
                { feature: 'Google Agenda', start: false, plus: true, pro: true },
                { feature: 'Lembretes com IA', start: false, plus: true, pro: true },
                { feature: 'Follow-up com IA', start: false, plus: false, pro: true },
                { feature: 'Ativação de base', start: false, plus: false, pro: true },
                { feature: 'CRM / Kanban', start: false, plus: false, pro: true },
                { feature: 'Insight Sales System', start: false, plus: false, pro: true },
              ].map((row, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-3 text-muted-foreground">{row.feature}</td>
                  {(['start', 'plus', 'pro'] as const).map(p => (
                    <td key={p} className="text-center py-3">
                      {row[p] ? <Check size={16} className="text-accent mx-auto" /> : <span className="text-muted-foreground/30">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Recharge */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass rounded-xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <Zap className="text-warning" size={20} />
          <h3 className="text-lg font-semibold text-foreground">Recarga Pré-Paga via Pix</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Atingiu o limite de IA? Recarregue para continuar usando sem trocar de plano.</p>
        <button onClick={() => {
            const url = `${TICTO_RECHARGE_URL}?email=${encodeURIComponent(profile?.email || '')}`;
            window.open(url, '_blank');
          }}
          className="px-6 py-2.5 rounded-lg border border-primary/30 text-primary font-semibold text-sm hover:bg-primary/10 transition-colors">
          Recarregar Agora
        </button>
      </motion.div>
    </div>
  );
}
