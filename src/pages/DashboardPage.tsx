import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { useAuth } from '@/contexts/AuthContext';
import { useLeads } from '@/hooks/use-leads';
import { useDashboardStats } from '@/hooks/use-dashboard';
import {
  Users, TrendingUp, CalendarCheck, CheckCircle, RotateCcw, Cpu,
  AlertTriangle, Clock, UserPlus, CalendarX, MessageSquare, Loader2,
  Zap, Phone, BarChart3, Calendar,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_LABELS: Record<string, string> = {
  new: 'Novo',
  in_progress: 'Em andamento',
  scheduled: 'Agendado',
  client: 'Cliente',
  no_show: 'Não compareceu',
  lost: 'Perdido',
};

export default function DashboardPage() {
  const { profile } = useAuth();
  const { data: leads, isLoading: leadsLoading } = useLeads();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();

  const isLoading = leadsLoading || statsLoading;
  const recentLeads = (leads || []).slice(0, 6);

  const getActivityIcon = (status: string) => {
    switch (status) {
      case 'new': return { icon: UserPlus, color: 'text-accent' };
      case 'scheduled': return { icon: CalendarCheck, color: 'text-primary' };
      case 'client': return { icon: CheckCircle, color: 'text-accent' };
      case 'no_show': return { icon: CalendarX, color: 'text-destructive' };
      case 'in_progress': return { icon: MessageSquare, color: 'text-primary' };
      default: return { icon: UserPlus, color: 'text-muted-foreground' };
    }
  };

  return (
    <div>
      <PageHeader title="Dashboard SIX" subtitle={`Olá, ${profile?.name?.split(' ')[0] || 'usuário'}. Aqui está sua visão geral.`} />

      {/* Row 1 — Core KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} label="Total de Leads" value={stats?.totalLeads?.toLocaleString() ?? '—'} change={stats?.leadsThisMonth ? `+${stats.leadsThisMonth} mês` : undefined} trend="up" glowColor="blue" />
        <StatCard icon={TrendingUp} label="Taxa de Conversão" value={`${stats?.conversionRate ?? 0}%`} glowColor="cyan" />
        <StatCard icon={CalendarCheck} label="Agendamentos (mês)" value={stats?.totalAppointmentsMonth?.toLocaleString() ?? '—'} change={stats?.appointmentRate ? `${stats.appointmentRate}% confirmados` : undefined} trend="up" glowColor="green" />
        <StatCard icon={CheckCircle} label="Clientes" value={stats?.clients?.toLocaleString() ?? '—'} glowColor="blue" />
      </div>

      {/* Row 2 — Operational metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={RotateCcw} label="Follow-ups Ativos" value={stats?.activeFollowUps?.toString() ?? '0'} change={stats?.totalFollowUps ? `${stats.totalFollowUps} total` : undefined} glowColor="green" />
        <StatCard icon={Cpu} label="Uso de IA" value={`${profile?.ai_usage_percent ?? 0}%`} glowColor="blue" />
        <StatCard icon={Phone} label="Contatos Atendidos" value={stats?.totalContacts?.toLocaleString() ?? '0'} change={stats?.totalInteractions ? `${stats.totalInteractions} interações` : undefined} glowColor="cyan" />
        <StatCard icon={Zap} label="Leads Novos" value={stats?.newLeads?.toLocaleString() ?? '0'} glowColor="cyan" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity feed */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 glass rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Atividade Recente</h3>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : recentLeads.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma atividade ainda. Crie seu primeiro lead no Kanban CRM.</p>
          ) : (
            <div className="space-y-3">
              {recentLeads.map((lead) => {
                const { icon: Icon, color } = getActivityIcon(lead.status);
                return (
                  <div key={lead.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                    <div className="p-1.5 rounded-lg bg-secondary">
                      <Icon size={16} className={color} />
                    </div>
                    <span className="flex-1 text-sm text-foreground">
                      {lead.name} — {lead.interest || lead.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Sidebar panels */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-4">
          {/* Today's appointments */}
          <div className="glass rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Calendar size={14} className="text-primary" /> Agenda de Hoje
            </h3>
            {stats?.todayAppointments && stats.todayAppointments.length > 0 ? (
              <div className="space-y-2">
                {stats.todayAppointments.slice(0, 4).map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground truncate max-w-[60%]">{a.lead_name || 'Sem nome'}</span>
                    <span className="text-muted-foreground text-xs">{a.time?.slice(0, 5)}</span>
                  </div>
                ))}
                {stats.todayAppointments.length > 4 && (
                  <p className="text-xs text-muted-foreground">+{stats.todayAppointments.length - 4} mais</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum agendamento hoje</p>
            )}
          </div>

          {/* Funnel breakdown */}
          <div className="glass rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <BarChart3 size={14} className="text-primary" /> Funil de Leads
            </h3>
            <div className="space-y-2 text-sm">
              {stats?.statusCounts && Object.entries(stats.statusCounts).length > 0 ? (
                Object.entries(stats.statusCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([status, count]) => (
                    <div key={status} className="flex justify-between">
                      <span className="text-muted-foreground">{STATUS_LABELS[status] || status}</span>
                      <span className="text-foreground font-medium">{count as number}</span>
                    </div>
                  ))
              ) : (
                <p className="text-muted-foreground">Sem dados</p>
              )}
            </div>
          </div>

          {/* Alerts */}
          <div className="glass rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Alertas</h3>
            <div className="space-y-2">
              {profile?.ai_usage_percent && profile.ai_usage_percent >= 80 && (
                <div className="flex items-start gap-2 text-sm">
                  <AlertTriangle size={14} className="text-destructive mt-0.5" />
                  <span className="text-muted-foreground">Uso de IA em {profile.ai_usage_percent}%</span>
                </div>
              )}
              {stats?.noShow && stats.noShow > 0 && (
                <div className="flex items-start gap-2 text-sm">
                  <AlertTriangle size={14} className="text-destructive mt-0.5" />
                  <span className="text-muted-foreground">{stats.noShow} leads não compareceram</span>
                </div>
              )}
              {stats?.totalLeads === 0 && (
                <div className="flex items-start gap-2 text-sm">
                  <AlertTriangle size={14} className="text-primary mt-0.5" />
                  <span className="text-muted-foreground">Nenhum lead cadastrado ainda</span>
                </div>
              )}
              {(stats?.totalLeads ?? 0) > 0 && !(profile?.ai_usage_percent && profile.ai_usage_percent >= 80) && !(stats?.noShow && stats.noShow > 0) && (
                <p className="text-sm text-muted-foreground">Tudo operacional ✓</p>
              )}
            </div>
          </div>

          {/* Top origins */}
          {stats?.topOrigins && stats.topOrigins.length > 0 && (
            <div className="glass rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Top Origens</h3>
              <div className="space-y-2 text-sm">
                {stats.topOrigins.map((o: any) => (
                  <div key={o.origin} className="flex justify-between">
                    <span className="text-muted-foreground">{o.origin}</span>
                    <span className="text-foreground font-medium">{o.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
