import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';
import { PlanGate } from '@/components/ui/plan-gate';
import { Bell, Clock, MessageSquare, Settings2 } from 'lucide-react';

const reminders = [
  { patient: 'Maria Silva', service: 'Limpeza de Pele', date: '10/03 14:00', reminderTime: '2h antes', status: 'Enviado', response: 'Confirmado ✅' },
  { patient: 'João Costa', service: 'Botox', date: '10/03 15:30', reminderTime: '2h antes', status: 'Enviado', response: 'Aguardando' },
  { patient: 'Ana Oliveira', service: 'Preenchimento', date: '10/03 16:00', reminderTime: '24h antes', status: 'Agendado', response: '—' },
  { patient: 'Pedro Santos', service: 'Avaliação', date: '11/03 09:00', reminderTime: '24h antes', status: 'Agendado', response: '—' },
];

export default function RemindersPage() {
  return (
    <PlanGate requiredPlan="plus">
      <PageHeader title="Lembretes e Confirmações" subtitle="Reduza faltas com lembretes automáticos via IA">
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all">
          <Settings2 size={16} /> Configurar
        </button>
      </PageHeader>

      {/* Config cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Lembrete Padrão', value: '24h antes', icon: Clock },
          { label: 'Segundo Lembrete', value: '2h antes', icon: Bell },
          { label: 'Modelo', value: 'Personalizado IA', icon: MessageSquare },
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

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Paciente</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Serviço</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Data</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Lembrete</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Resposta</th>
              </tr>
            </thead>
            <tbody>
              {reminders.map((r, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-foreground">{r.patient}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{r.service}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{r.date}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{r.reminderTime}</td>
                  <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${r.status === 'Enviado' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>{r.status}</span></td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{r.response}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </PlanGate>
  );
}
