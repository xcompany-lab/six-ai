import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { useAuth } from '@/contexts/AuthContext';
import { useLeadStats, useLeads } from '@/hooks/use-leads';
import {
  Users, TrendingUp, CalendarCheck, DollarSign, RotateCcw, Cpu,
  AlertTriangle, Clock, UserPlus, CalendarX, CheckCircle, MessageSquare, Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function DashboardPage() {
  const { profile } = useAuth();
  const { total, clients, scheduled, conversionRate } = useLeadStats();
  const { data: leads, isLoading } = useLeads();

  // Build recent activity from latest leads
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Total de Leads" value={total.toLocaleString()} glowColor="blue" />
        <StatCard icon={TrendingUp} label="Taxa de Conversão" value={`${conversionRate}%`} glowColor="cyan" />
        <StatCard icon={CalendarCheck} label="Agendados" value={scheduled.toLocaleString()} glowColor="green" />
        <StatCard icon={CheckCircle} label="Clientes" value={clients.toLocaleString()} glowColor="blue" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={DollarSign} label="Projeção Mensal" value="—" glowColor="cyan" />
        <StatCard icon={RotateCcw} label="Recuperação Follow-up" value="—" glowColor="green" />
        <StatCard icon={Cpu} label="Uso de IA" value={`${profile?.ai_usage_percent ?? 0}%`} glowColor="blue" />
        <StatCard icon={Clock} label="Tempo Médio Resposta" value="—" glowColor="cyan" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-4">
          <div className="glass rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Status WhatsApp</h3>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground" />
              <span className="text-sm text-muted-foreground font-medium">Não conectado</span>
            </div>
          </div>

          <div className="glass rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Alertas</h3>
            <div className="space-y-2">
              {profile?.ai_usage_percent && profile.ai_usage_percent >= 80 && (
                <div className="flex items-start gap-2 text-sm">
                  <AlertTriangle size={14} className="text-warning mt-0.5" />
                  <span className="text-muted-foreground">Uso de IA em {profile.ai_usage_percent}%</span>
                </div>
              )}
              {total === 0 && (
                <div className="flex items-start gap-2 text-sm">
                  <AlertTriangle size={14} className="text-primary mt-0.5" />
                  <span className="text-muted-foreground">Nenhum lead cadastrado ainda</span>
                </div>
              )}
              {total > 0 && (
                <div className="flex items-start gap-2 text-sm">
                  <AlertTriangle size={14} className="text-primary mt-0.5" />
                  <span className="text-muted-foreground">{total} leads no funil</span>
                </div>
              )}
            </div>
          </div>

          <div className="glass rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Resumo do Funil</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between"><span>Total de leads</span><span className="text-foreground font-medium">{total}</span></div>
              <div className="flex justify-between"><span>Agendados</span><span className="text-foreground font-medium">{scheduled}</span></div>
              <div className="flex justify-between"><span>Clientes</span><span className="text-foreground font-medium">{clients}</span></div>
              <div className="flex justify-between"><span>Conversão</span><span className="text-foreground font-medium">{conversionRate}%</span></div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
