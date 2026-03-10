import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';
import { PlanGate } from '@/components/ui/plan-gate';
import { Brain, AlertTriangle, TrendingUp, Zap, Play, Clock, Target, BarChart3 } from 'lucide-react';
import type { Insight } from '@/types';

const insights: Insight[] = [
  { id: '1', type: 'warning', priority: 'high', title: 'Leads perdidos na confirmação', description: 'Você está perdendo 23% dos leads no estágio de confirmação. Sugiro ajustar o lembrete para 4h antes e adicionar um segundo toque.', actionLabel: 'Ajustar Lembretes', createdAt: '2h' },
  { id: '2', type: 'opportunity', priority: 'high', title: '37 leads prontos para reativação', description: 'Existem 37 leads que fizeram avaliação nos últimos 60 dias e não retornaram. Uma campanha de reativação pode recuperar até 15%.', actionLabel: 'Criar Campanha', createdAt: '3h' },
  { id: '3', type: 'action', priority: 'medium', title: 'Tempo médio de resposta impactando conversão', description: 'Seu tempo médio de resposta está em 4.2 min. Leads respondidos em menos de 1 min convertem 3x mais.', actionLabel: 'Otimizar Agente', createdAt: '5h' },
  { id: '4', type: 'info', priority: 'medium', title: 'Pitch de Botox performa 2x melhor', description: 'O pitch do serviço Botox tem taxa de conversão de 34%, contra 17% do Preenchimento. Considere replicar a abordagem.', actionLabel: 'Ver Análise', createdAt: '8h' },
  { id: '5', type: 'opportunity', priority: 'low', title: 'Janelas ociosas na agenda', description: 'Sua agenda tem 6 slots vazios nesta semana. Uma campanha rápida de last-minute pode preencher esses horários.', actionLabel: 'Preencher Agenda', createdAt: '12h' },
];

const typeConfig = {
  warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
  opportunity: { icon: TrendingUp, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20' },
  action: { icon: Zap, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
  info: { icon: BarChart3, color: 'text-glow-cyan', bg: 'bg-primary/10', border: 'border-primary/20' },
};

const priorityLabels = { high: 'Alto Impacto', medium: 'Médio Impacto', low: 'Baixo Impacto' };
const priorityColors = { high: 'bg-destructive/10 text-destructive', medium: 'bg-warning/10 text-warning', low: 'bg-secondary text-muted-foreground' };

export default function InsightsPage() {
  return (
    <PlanGate requiredPlan="pro">
      <PageHeader title="Insight Sales System" subtitle="Sua IA estratégica com visão 360° da operação">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10">
          <Brain size={16} className="text-primary" />
          <span className="text-sm font-medium text-primary">IA Ativa</span>
        </div>
      </PageHeader>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Insights Ativos', value: '5', icon: Brain, color: 'text-primary' },
          { label: 'Alto Impacto', value: '2', icon: AlertTriangle, color: 'text-destructive' },
          { label: 'Oportunidades', value: '2', icon: TrendingUp, color: 'text-accent' },
          { label: 'Ações Pendentes', value: '3', icon: Target, color: 'text-warning' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass rounded-xl p-4 text-center">
            <s.icon size={20} className={`${s.color} mx-auto mb-2`} />
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Insights list */}
      <div className="space-y-4">
        {insights.map((insight, i) => {
          const tc = typeConfig[insight.type];
          const Icon = tc.icon;

          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`glass rounded-xl p-6 ${tc.border} hover:border-primary/30 transition-all`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-xl ${tc.bg} flex-shrink-0`}>
                  <Icon size={22} className={tc.color} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-foreground">{insight.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[insight.priority]}`}>
                      {priorityLabels[insight.priority]}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{insight.description}</p>
                  <div className="flex items-center gap-4">
                    {insight.actionLabel && (
                      <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-brand text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
                        <Play size={14} /> {insight.actionLabel}
                      </button>
                    )}
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock size={12} /> há {insight.createdAt}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </PlanGate>
  );
}
