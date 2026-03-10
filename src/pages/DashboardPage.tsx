import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users, TrendingUp, CalendarCheck, DollarSign, RotateCcw, Cpu,
  MessageSquare, AlertTriangle, Clock, UserPlus, CalendarX, CheckCircle,
} from 'lucide-react';

const recentActivity = [
  { icon: UserPlus, text: 'Novo lead: Maria Silva', time: '2 min', color: 'text-accent' },
  { icon: CalendarCheck, text: 'Agendamento confirmado: João Costa', time: '15 min', color: 'text-primary' },
  { icon: MessageSquare, text: 'Conversa iniciada: Ana Oliveira', time: '32 min', color: 'text-glow-cyan' },
  { icon: CalendarX, text: 'No-show: Pedro Santos', time: '1h', color: 'text-destructive' },
  { icon: CheckCircle, text: 'Lead convertido: Lucia Ferreira', time: '2h', color: 'text-accent' },
  { icon: RotateCcw, text: 'Follow-up enviado: 12 leads', time: '3h', color: 'text-primary' },
];

const alerts = [
  { type: 'warning' as const, text: '23 leads sem resposta há mais de 24h' },
  { type: 'info' as const, text: 'Uso de IA em 42% — 58% disponível' },
  { type: 'warning' as const, text: '5 agendamentos pendentes de confirmação' },
];

export default function DashboardPage() {
  const { profile } = useAuth();

  return (
    <div>
      <PageHeader title="Dashboard SIX" subtitle={`Olá, ${user?.name?.split(' ')[0]}. Aqui está sua visão geral.`} />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Total de Leads" value="1.847" change="+12%" trend="up" glowColor="blue" />
        <StatCard icon={TrendingUp} label="Taxa de Conversão" value="18.3%" change="+2.4%" trend="up" glowColor="cyan" />
        <StatCard icon={CalendarCheck} label="Agendamentos" value="142" change="+8%" trend="up" glowColor="green" />
        <StatCard icon={DollarSign} label="Faturamento" value="R$ 28.450" change="+15%" trend="up" glowColor="blue" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={DollarSign} label="Projeção Mensal" value="R$ 42.600" glowColor="cyan" />
        <StatCard icon={RotateCcw} label="Recuperação Follow-up" value="32%" change="+5%" trend="up" glowColor="green" />
        <StatCard icon={Cpu} label="Uso de IA" value={`${user?.aiUsagePercent}%`} glowColor="blue" />
        <StatCard icon={Clock} label="Tempo Médio Resposta" value="1.2 min" change="-18%" trend="up" glowColor="cyan" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 glass rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Atividade Recente</h3>
          <div className="space-y-3">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                <div className="p-1.5 rounded-lg bg-secondary">
                  <item.icon size={16} className={item.color} />
                </div>
                <span className="flex-1 text-sm text-foreground">{item.text}</span>
                <span className="text-xs text-muted-foreground">{item.time}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Alerts & Status */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-4">
          {/* WhatsApp Status */}
          <div className="glass rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Status WhatsApp</h3>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
              <span className="text-sm text-accent font-medium">Conectado</span>
            </div>
          </div>

          {/* Alerts */}
          <div className="glass rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Alertas</h3>
            <div className="space-y-2">
              {alerts.map((a, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <AlertTriangle size={14} className={a.type === 'warning' ? 'text-warning mt-0.5' : 'text-primary mt-0.5'} />
                  <span className="text-muted-foreground">{a.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Next Appointments */}
          <div className="glass rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Próximos Agendamentos</h3>
            <div className="space-y-2">
              {['Maria Silva — 14:00', 'João Costa — 15:30', 'Ana Oliveira — 16:00'].map((a, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarCheck size={14} className="text-primary" />
                  {a}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
