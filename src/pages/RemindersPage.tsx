import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';
import { PlanGate } from '@/components/ui/plan-gate';
import { useRemindersConfig, useUpsertRemindersConfig } from '@/hooks/use-reminders';
import { useAppointments } from '@/hooks/use-appointments';
import { Bell, Clock, MessageSquare, Settings2, X, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function RemindersPage() {
  const { data: config, isLoading: configLoading } = useRemindersConfig();
  const upsertConfig = useUpsertRemindersConfig();
  const { data: appointments, isLoading: apptsLoading } = useAppointments();
  const [showConfig, setShowConfig] = useState(false);

  // Show upcoming appointments as "reminders"
  const upcomingAppts = (appointments || [])
    .filter(a => a.status !== 'cancelled' && a.status !== 'completed')
    .slice(0, 10);

  return (
    <PlanGate requiredPlan="plus">
      <PageHeader title="Lembretes e Confirmações" subtitle="Reduza faltas com lembretes automáticos via IA">
        <button onClick={() => setShowConfig(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all">
          <Settings2 size={16} /> Configurar
        </button>
      </PageHeader>

      {/* Config cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Lembrete 1', value: config?.first_reminder || '24h antes', icon: Clock },
          { label: 'Lembrete 2', value: config?.second_reminder || '2h antes', icon: Bell },
          { label: 'Status', value: config?.active !== false ? 'Ativo' : 'Inativo', icon: MessageSquare },
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
        {apptsLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : !upcomingAppts.length ? (
          <p className="text-center text-muted-foreground py-12 text-sm">Nenhum agendamento próximo para enviar lembretes.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Paciente</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Serviço</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Data</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Lembrete 1</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Lembrete 2</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {upcomingAppts.map((a) => (
                  <tr key={a.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{a.lead_name}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{a.service}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{format(new Date(a.date + 'T00:00'), 'dd/MM')} {a.time?.slice(0, 5)}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{config?.first_reminder || '24h'} antes</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{config?.second_reminder || '2h'} antes</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${a.status === 'confirmed' ? 'bg-accent/10 text-accent' : 'bg-secondary text-muted-foreground'}`}>
                        {a.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {showConfig && <ReminderConfigModal config={config} onClose={() => setShowConfig(false)} onSave={upsertConfig} />}
    </PlanGate>
  );
}

function ReminderConfigModal({ config, onClose, onSave }: { config: any; onClose: () => void; onSave: any }) {
  const [form, setForm] = useState({
    first_reminder: config?.first_reminder || '24h',
    second_reminder: config?.second_reminder || '2h',
    message_template: config?.message_template || '',
    confirmation_expected: config?.confirmation_expected || 'Sim/Confirmo',
    active: config?.active ?? true,
  });

  const handleSave = () => {
    onSave.mutate(form, {
      onSuccess: () => { toast.success('Configurações de lembretes salvas!'); onClose(); },
      onError: () => toast.error('Erro ao salvar'),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-strong rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-foreground">Configurar Lembretes</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary"><X size={18} className="text-muted-foreground" /></button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">1º Lembrete (antes)</label>
              <input value={form.first_reminder} onChange={e => setForm(f => ({ ...f, first_reminder: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="24h" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">2º Lembrete (antes)</label>
              <input value={form.second_reminder} onChange={e => setForm(f => ({ ...f, second_reminder: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="2h" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Modelo de mensagem</label>
            <textarea value={form.message_template} onChange={e => setForm(f => ({ ...f, message_template: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px] resize-none"
              placeholder="Olá {nome}, gostaríamos de confirmar seu agendamento para {data} às {hora}..." />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Resposta esperada</label>
            <input value={form.confirmation_expected} onChange={e => setForm(f => ({ ...f, confirmation_expected: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Sim/Confirmo" />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="reminderActive" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary/50" />
            <label htmlFor="reminderActive" className="text-sm text-foreground">Lembretes ativos</label>
          </div>
          <button onClick={handleSave} disabled={onSave.isPending}
            className="w-full py-3 rounded-lg bg-gradient-brand text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
            {onSave.isPending && <Loader2 size={16} className="animate-spin" />}
            <Save size={16} /> Salvar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
