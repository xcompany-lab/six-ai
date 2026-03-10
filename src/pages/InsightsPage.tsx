import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';
import { PlanGate } from '@/components/ui/plan-gate';
import { Brain, AlertTriangle, TrendingUp, Zap, Clock, Target, BarChart3, Users, CalendarCheck, Percent, MapPin, Loader2, RefreshCw } from 'lucide-react';
import { useInsightsData } from '@/hooks/use-billing';

const typeConfig = {
  warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
  opportunity: { icon: TrendingUp, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20' },
  action: { icon: Zap, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
  info: { icon: BarChart3, color: 'text-muted-foreground', bg: 'bg-secondary', border: 'border-border' },
};

const priorityColors = { high: 'bg-destructive/10 text-destructive', medium: 'bg-warning/10 text-warning', low: 'bg-secondary text-muted-foreground' };

export default function InsightsPage() {
  const { data: insights, isLoading } = useInsightsData();

  // Generate dynamic insights from real data
  const generateInsights = () => {
    if (!insights) return [];
    const list: Array<{ id: string; type: keyof typeof typeConfig; priority: 'high' | 'medium' | 'low'; title: string; description: string; actionLabel?: string }> = [];

    if (insights.noShowRate > 15) {
      list.push({ id: '1', type: 'warning', priority: 'high', title: 'Taxa de no-show elevada', description: `Sua taxa de no-show está em ${insights.noShowRate}%. Considere ajustar os lembretes para reduzir faltas.`, actionLabel: 'Ajustar Lembretes' });
    }

    if (insights.reactivationPool > 5) {
      list.push({ id: '2', type: 'opportunity', priority: 'high', title: `${insights.reactivationPool} leads prontos para reativação`, description: `Existem ${insights.reactivationPool} leads sem contato há mais de 30 dias. Uma campanha de reativação pode recuperar até 15%.`, actionLabel: 'Criar Campanha' });
    }

    if (insights.pendingFollowUps > 3) {
      list.push({ id: '3', type: 'action', priority: 'medium', title: `${insights.pendingFollowUps} follow-ups pendentes`, description: `Há ${insights.pendingFollowUps} leads em andamento sem contato na última semana. Retome o contato para não perder o timing.`, actionLabel: 'Ver Leads' });
    }

    if (insights.conversionRate > 0 && insights.conversionRate < 20) {
      list.push({ id: '4', type: 'warning', priority: 'medium', title: 'Taxa de conversão abaixo do ideal', description: `Sua conversão está em ${insights.conversionRate}%. Revise seu pitch e tratamento de objeções para melhorar.`, actionLabel: 'Otimizar Agente' });
    }

    if (insights.monthlyGrowth > 20) {
      list.push({ id: '5', type: 'info', priority: 'low', title: `Crescimento de ${insights.monthlyGrowth}% este mês`, description: `Seus leads cresceram ${insights.monthlyGrowth}% em relação ao mês anterior. Continue assim!` });
    }

    if (insights.topOrigin !== 'N/A') {
      list.push({ id: '6', type: 'info', priority: 'low', title: `Principal origem: ${insights.topOrigin}`, description: `A maioria dos seus leads vem de ${insights.topOrigin}. Considere investir mais nesse canal.` });
    }

    if (list.length === 0) {
      list.push({ id: '0', type: 'info', priority: 'low', title: 'Dados insuficientes', description: 'Adicione mais leads e agendamentos para gerar insights inteligentes sobre sua operação.' });
    }

    return list;
  };

  const dynamicInsights = generateInsights();
  const highImpact = dynamicInsights.filter(i => i.priority === 'high').length;
  const opportunities = dynamicInsights.filter(i => i.type === 'opportunity').length;
  const actions = dynamicInsights.filter(i => i.type === 'action' || i.type === 'warning').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <PlanGate requiredPlan="pro">
      <PageHeader title="Insight Sales System" subtitle="Sua IA estratégica com visão 360° da operação">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10">
          <Brain size={16} className="text-primary" />
          <span className="text-sm font-medium text-primary">IA Ativa</span>
        </div>
      </PageHeader>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Leads', value: insights?.totalLeads || 0, icon: Users, color: 'text-primary' },
          { label: 'Conversão', value: `${insights?.conversionRate || 0}%`, icon: Percent, color: 'text-accent' },
          { label: 'No-show', value: `${insights?.noShowRate || 0}%`, icon: AlertTriangle, color: 'text-destructive' },
          { label: 'Novos (7d)', value: insights?.newLeadsThisWeek || 0, icon: TrendingUp, color: 'text-accent' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass rounded-xl p-4 text-center">
            <s.icon size={20} className={`${s.color} mx-auto mb-2`} />
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Agenda (7d)', value: insights?.scheduledThisWeek || 0, icon: CalendarCheck },
          { label: 'Follow-ups Pendentes', value: insights?.pendingFollowUps || 0, icon: Clock },
          { label: 'Pool Reativação', value: insights?.reactivationPool || 0, icon: RefreshCw },
          { label: 'Crescimento Mensal', value: `${insights?.monthlyGrowth || 0}%`, icon: TrendingUp },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}
            className="glass rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><s.icon size={12} /> {s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Leads by Origin */}
      {insights && Object.keys(insights.leadsByOrigin).length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><MapPin size={18} className="text-primary" /> Leads por Origem</h3>
          <div className="space-y-3">
            {Object.entries(insights.leadsByOrigin).sort((a, b) => b[1] - a[1]).map(([origin, count]) => (
              <div key={origin} className="flex items-center gap-3">
                <span className="text-sm text-foreground w-28 truncate">{origin}</span>
                <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-brand transition-all" style={{ width: `${(count / insights.totalLeads) * 100}%` }} />
                </div>
                <span className="text-sm font-medium text-foreground w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Insights header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Insights Ativos', value: dynamicInsights.length, icon: Brain, color: 'text-primary' },
          { label: 'Alto Impacto', value: highImpact, icon: AlertTriangle, color: 'text-destructive' },
          { label: 'Oportunidades', value: opportunities, icon: TrendingUp, color: 'text-accent' },
          { label: 'Ações Pendentes', value: actions, icon: Target, color: 'text-warning' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.05 }}
            className="glass rounded-xl p-4 text-center">
            <s.icon size={20} className={`${s.color} mx-auto mb-2`} />
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Dynamic Insights list */}
      <div className="space-y-4">
        {dynamicInsights.map((insight, i) => {
          const tc = typeConfig[insight.type];
          const Icon = tc.icon;
          return (
            <motion.div key={insight.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }}
              className={`glass rounded-xl p-6 ${tc.border} hover:border-primary/30 transition-all`}>
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-xl ${tc.bg} flex-shrink-0`}>
                  <Icon size={22} className={tc.color} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{insight.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[insight.priority]}`}>
                      {{ high: 'Alto Impacto', medium: 'Médio Impacto', low: 'Baixo Impacto' }[insight.priority]}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                  {insight.actionLabel && (
                    <button className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-brand text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
                      <Zap size={14} /> {insight.actionLabel}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </PlanGate>
  );
}
