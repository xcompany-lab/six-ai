import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';
import { PlanGate } from '@/components/ui/plan-gate';
import { CalendarCheck, Clock, Settings2 } from 'lucide-react';

const appointments = [
  { name: 'Maria Silva', service: 'Limpeza de Pele', date: '10/03', time: '14:00', status: 'confirmed' },
  { name: 'João Costa', service: 'Botox', date: '10/03', time: '15:30', status: 'pending' },
  { name: 'Ana Oliveira', service: 'Preenchimento', date: '10/03', time: '16:00', status: 'confirmed' },
  { name: 'Pedro Santos', service: 'Avaliação', date: '11/03', time: '09:00', status: 'pending' },
  { name: 'Lucia Ferreira', service: 'Peeling', date: '11/03', time: '10:30', status: 'confirmed' },
];

const statusColors: Record<string, string> = {
  confirmed: 'bg-accent/10 text-accent',
  pending: 'bg-warning/10 text-warning',
  cancelled: 'bg-destructive/10 text-destructive',
};

const statusLabels: Record<string, string> = {
  confirmed: 'Confirmado',
  pending: 'Pendente',
  cancelled: 'Cancelado',
};

export default function AppointmentsPage() {
  return (
    <PlanGate requiredPlan="plus">
      <PageHeader title="Agendamentos com IA" subtitle="Automação inteligente de agendamentos">
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all">
          <Settings2 size={16} /> Configurar
        </button>
      </PageHeader>

      {/* Config cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Duração Padrão', value: '60 min', icon: Clock },
          { label: 'Intervalo/Buffer', value: '15 min', icon: Clock },
          { label: 'Horário', value: '08:00 - 18:00', icon: CalendarCheck },
        ].map((c, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="glass rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><c.icon size={18} className="text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="text-sm font-semibold text-foreground">{c.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Appointments table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Paciente</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Serviço</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Data</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Horário</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-foreground">{a.name}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{a.service}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{a.date}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{a.time}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[a.status]}`}>
                      {statusLabels[a.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </PlanGate>
  );
}
