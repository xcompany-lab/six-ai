import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';
import { PlanGate } from '@/components/ui/plan-gate';
import { Brain, AlertTriangle, TrendingUp, Zap, Clock, Target, BarChart3, Users, CalendarCheck, Percent, MapPin, Loader2, RefreshCw, Send, MessageSquare, SmilePlus, Meh, Frown, Rocket } from 'lucide-react';
import { useInsightsData } from '@/hooks/use-billing';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, Legend } from 'recharts';

const typeConfig = {
  warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
  opportunity: { icon: TrendingUp, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20' },
  action: { icon: Zap, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
  info: { icon: BarChart3, color: 'text-muted-foreground', bg: 'bg-secondary', border: 'border-border' },
};

const priorityColors = { high: 'bg-destructive/10 text-destructive', medium: 'bg-warning/10 text-warning', low: 'bg-secondary text-muted-foreground' };

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--destructive))', 'hsl(var(--warning, 45 93% 47%))', 'hsl(var(--muted-foreground))'];
const PIE_COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6'];

export default function InsightsPage() {
  const { data: insights, isLoading } = useInsightsData();

  const generateInsights = () => {
    if (!insights) return [];
    const list: Array<{ id: string; type: keyof typeof typeConfig; priority: 'high' | 'medium' | 'low'; title: string; description: string; actionLabel?: string }> = [];

    if (insights.noShowRate > 15) list.push({ id: '1', type: 'warning', priority: 'high', title: 'Taxa de no-show elevada', description: `Sua taxa de no-show está em ${insights.noShowRate}%. Considere ajustar os lembretes para reduzir faltas.`, actionLabel: 'Ajustar Lembretes' });
    if (insights.reactivationPool > 5) list.push({ id: '2', type: 'opportunity', priority: 'high', title: `${insights.reactivationPool} leads prontos para reativação`, description: `Existem ${insights.reactivationPool} leads sem contato há mais de 30 dias. Uma campanha de reativação pode recuperar até 15%.`, actionLabel: 'Criar Campanha' });
    if (insights.pendingFollowUps > 3) list.push({ id: '3', type: 'action', priority: 'medium', title: `${insights.pendingFollowUps} follow-ups pendentes`, description: `Há ${insights.pendingFollowUps} leads em andamento sem contato na última semana.`, actionLabel: 'Ver Leads' });
    if (insights.conversionRate > 0 && insights.conversionRate < 20) list.push({ id: '4', type: 'warning', priority: 'medium', title: 'Taxa de conversão abaixo do ideal', description: `Sua conversão está em ${insights.conversionRate}%. Revise seu pitch e tratamento de objeções.`, actionLabel: 'Otimizar Agente' });
    if (insights.monthlyGrowth > 20) list.push({ id: '5', type: 'info', priority: 'low', title: `Crescimento de ${insights.monthlyGrowth}% este mês`, description: `Seus leads cresceram ${insights.monthlyGrowth}% em relação ao mês anterior. Continue assim!` });
    if (insights.avgCampaignResponseRate > 0) list.push({ id: '7', type: 'info', priority: 'low', title: `Taxa média de resposta: ${insights.avgCampaignResponseRate}%`, description: `Suas campanhas de ativação têm uma taxa média de resposta de ${insights.avgCampaignResponseRate}%.` });
    if (list.length === 0) list.push({ id: '0', type: 'info', priority: 'low', title: 'Dados insuficientes', description: 'Adicione mais leads e agendamentos para gerar insights inteligentes.' });
    return list;
  };

  const dynamicInsights = generateInsights();

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }

  const sentimentData = insights ? [
    { name: 'Positivo', value: insights.aiPositiveSentiment, color: '#22c55e' },
    { name: 'Neutro', value: insights.aiNeutralSentiment, color: '#6b7280' },
    { name: 'Negativo', value: insights.aiNegativeSentiment, color: '#ef4444' },
  ].filter(d => d.value > 0) : [];

  return (
    <PlanGate requiredPlan="pro">
      <PageHeader title="Insight Sales System" subtitle="Sua IA estratégica com visão 360° da operação">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10">
          <Brain size={16} className="text-primary" />
          <span className="text-sm font-medium text-primary">IA Ativa</span>
        </div>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        {[
          { label: 'Total Leads', value: insights?.totalLeads || 0, icon: Users, color: 'text-primary' },
          { label: 'Conversão', value: `${insights?.conversionRate || 0}%`, icon: Percent, color: 'text-accent' },
          { label: 'No-show', value: `${insights?.noShowRate || 0}%`, icon: AlertTriangle, color: 'text-destructive' },
          { label: 'Novos (7d)', value: insights?.newLeadsThisWeek || 0, icon: TrendingUp, color: 'text-accent' },
          { label: 'Campanhas Enviadas', value: insights?.totalCampaignsSent || 0, icon: Send, color: 'text-primary' },
          { label: 'Conversas IA', value: insights?.aiConversations || 0, icon: MessageSquare, color: 'text-primary' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="glass rounded-xl p-4 text-center">
            <s.icon size={18} className={`${s.color} mx-auto mb-1.5`} />
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1: Lead Trend + Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Lead Trend Area Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-primary" /> Novos Leads (7 dias)</h3>
          {(insights?.leadTrend?.length || 0) > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={insights!.leadTrend}>
                <defs>
                  <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="leads" stroke="hsl(var(--primary))" fill="url(#leadGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground text-center py-8">Sem dados suficientes</p>}
        </motion.div>

        {/* Funnel Bar Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Target size={16} className="text-primary" /> Funil de Conversão</h3>
          {(insights?.funnelData?.length || 0) > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={insights!.funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis dataKey="stage" type="category" width={90} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {(insights?.funnelData || []).map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground text-center py-8">Sem dados suficientes</p>}
        </motion.div>
      </div>

      {/* Charts Row 2: Appointment Trend + AI Sentiment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Appointment Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><CalendarCheck size={16} className="text-primary" /> Agendamentos (últimas 4 semanas)</h3>
          {(insights?.appointmentTrend?.length || 0) > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={insights!.appointmentTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="confirmed" name="Confirmados" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="noshow" name="No-show/Cancelados" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground text-center py-8">Sem dados suficientes</p>}
        </motion.div>

        {/* AI Sentiment Pie */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Brain size={16} className="text-primary" /> Sentimento IA</h3>
          {sentimentData.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={sentimentData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} strokeWidth={0}>
                    {sentimentData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {[
                  { icon: SmilePlus, label: 'Positivo', value: insights?.aiPositiveSentiment || 0, color: 'text-accent' },
                  { icon: Meh, label: 'Neutro', value: insights?.aiNeutralSentiment || 0, color: 'text-muted-foreground' },
                  { icon: Frown, label: 'Negativo', value: insights?.aiNegativeSentiment || 0, color: 'text-destructive' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <s.icon size={16} className={s.color} />
                    <span className="text-sm text-foreground">{s.label}</span>
                    <span className="text-sm font-bold text-foreground ml-auto">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Brain size={32} className="text-muted-foreground mx-auto mb-2 opacity-30" />
              <p className="text-sm text-muted-foreground">Sem conversas analisadas ainda</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Campaign Performance */}
      {(insights?.campaignStats?.length || 0) > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Rocket size={16} className="text-primary" /> Performance de Campanhas</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Campanha</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Enviados</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Respostas</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Taxa</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {insights!.campaignStats.map((c, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{c.name}</td>
                    <td className="px-4 py-3 text-sm text-center text-muted-foreground">{c.sent}</td>
                    <td className="px-4 py-3 text-sm text-center text-muted-foreground">{c.responded}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.rate >= 15 ? 'bg-accent/10 text-accent' : c.rate > 0 ? 'bg-warning/10 text-warning' : 'bg-secondary text-muted-foreground'}`}>
                        {c.rate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${c.status === 'completed' ? 'bg-primary/10 text-primary' : c.status === 'active' ? 'bg-accent/10 text-accent' : 'bg-secondary text-muted-foreground'}`}>
                        {c.status === 'completed' ? 'Concluída' : c.status === 'active' ? 'Ativa' : 'Rascunho'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Leads by Origin */}
      {insights && Object.keys(insights.leadsByOrigin).length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><MapPin size={16} className="text-primary" /> Leads por Origem</h3>
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

      {/* AI Insights */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2"><Brain size={16} className="text-primary" /> Insights Inteligentes</h3>
        {dynamicInsights.map((insight, i) => {
          const tc = typeConfig[insight.type];
          const Icon = tc.icon;
          return (
            <motion.div key={insight.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.08 }}
              className={`glass rounded-xl p-5 ${tc.border} hover:border-primary/30 transition-all`}>
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-xl ${tc.bg} flex-shrink-0`}>
                  <Icon size={20} className={tc.color} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                    <h4 className="font-semibold text-foreground text-sm">{insight.title}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${priorityColors[insight.priority]}`}>
                      {{ high: 'Alto Impacto', medium: 'Médio', low: 'Baixo' }[insight.priority]}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{insight.description}</p>
                  {insight.actionLabel && (
                    <button className="mt-2.5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-brand text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity">
                      <Zap size={12} /> {insight.actionLabel}
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
