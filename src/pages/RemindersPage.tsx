import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';
import { PlanGate } from '@/components/ui/plan-gate';
import { useRemindersConfig, useUpsertRemindersConfig, useScheduledReminders, useDeleteReminder } from '@/hooks/use-reminders';
import { Bell, Clock, MessageSquare, Settings2, X, Loader2, Save, CheckCircle2, AlertCircle, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const statusMap: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  pending: { label: 'Agendado', className: 'bg-secondary text-muted-foreground', icon: Clock },
  sent: { label: 'Enviado', className: 'bg-amber-500/10 text-amber-500', icon: Send },
  confirmed: { label: 'Confirmado', className: 'bg-green-500/10 text-green-500', icon: CheckCircle2 },
  failed: { label: 'Falhou', className: 'bg-destructive/10 text-destructive', icon: AlertCircle },
};

export default function RemindersPage() {
  const { data: config, isLoading: configLoading } = useRemindersConfig();
  const upsertConfig = useUpsertRemindersConfig();
  const deleteReminder = useDeleteReminder();
  const { data: reminders, isLoading: remindersLoading } = useScheduledReminders();
  const [showConfig, setShowConfig] = useState(false);

  const sentCount = (reminders || []).filter(r => r.status === 'sent').length;
  const pendingCount = (reminders || []).filter(r => r.status === 'pending').length;

  return (
    <PlanGate requiredPlan="plus">
      <PageHeader title="Lembretes e Confirmações" subtitle="Reduza faltas com lembretes automáticos via IA">
        <button onClick={() => setShowConfig(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all">
          <Settings2 size={16} /> Configurar
        </button>
      </PageHeader>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Lembrete 1', value: config?.first_reminder || '24h antes', icon: Clock },
          { label: 'Lembrete 2', value: config?.second_reminder || '2h antes', icon: Bell },
          { label: 'Enviados', value: String(sentCount), icon: Send },
          { label: 'Status', value: config?.active !== false ? 'Ativo' : 'Inativo', icon: MessageSquare },
        ].map((c, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
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
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Lembretes Agendados</h3>
          <span className="text-xs text-muted-foreground">{pendingCount} pendente(s)</span>
        </div>
        {remindersLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : !(reminders || []).length ? (
          <p className="text-center text-muted-foreground py-12 text-sm">Nenhum lembrete agendado. Crie agendamentos para gerar lembretes automaticamente.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Contato</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Serviço</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Agendamento</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Envio em</th>
                   <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Status</th>
                   <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {(reminders || []).map((r) => {
                  const st = statusMap[r.status] || statusMap.pending;
                  const StIcon = st.icon;
                  return (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-foreground">{r.contact_name}</p>
                        <p className="text-xs text-muted-foreground">{r.contact_phone}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{r.service_name || '—'}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {r.appointment_at ? format(new Date(r.appointment_at), 'dd/MM HH:mm') : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {format(new Date(r.send_at), 'dd/MM HH:mm')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${st.className}`}>
                          <StIcon size={12} /> {st.label}
                        </span>
                       </td>
                       <td className="px-6 py-4 text-right">
                         {r.status === 'pending' && (
                           <button
                             onClick={() => {
                               deleteReminder.mutate(r.id, {
                                 onSuccess: () => toast.success('Lembrete excluído'),
                                 onError: () => toast.error('Erro ao excluir'),
                               });
                             }}
                             disabled={deleteReminder.isPending}
                             className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                             title="Excluir lembrete"
                           >
                             <Trash2 size={14} />
                           </button>
                         )}
                       </td>
                     </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {showConfig && <ReminderConfigModal config={config} onClose={() => setShowConfig(false)} onSave={upsertConfig} />}
    </PlanGate>
  );
}

function parseReminderValue(val: string): { num: number; unit: 'h' | 'm' } {
  const match = val.match(/^(\d+)(h|m)?$/);
  if (match) return { num: parseInt(match[1], 10), unit: (match[2] as 'h' | 'm') || 'h' };
  return { num: 24, unit: 'h' };
}

function ReminderConfigModal({ config, onClose, onSave }: { config: any; onClose: () => void; onSave: any }) {
  const parsed1 = parseReminderValue(config?.first_reminder || '24h');
  const parsed2 = parseReminderValue(config?.second_reminder || '2h');

  const [form, setForm] = useState({
    first_num: parsed1.num,
    first_unit: parsed1.unit,
    second_num: parsed2.num,
    second_unit: parsed2.unit,
    message_template: config?.message_template || '',
    confirmation_expected: config?.confirmation_expected || 'Sim/Confirmo',
    active: config?.active ?? true,
  });

  const handleSave = () => {
    const payload = {
      first_reminder: `${form.first_num}${form.first_unit}`,
      second_reminder: `${form.second_num}${form.second_unit}`,
      message_template: form.message_template,
      confirmation_expected: form.confirmation_expected,
      active: form.active,
    };
    onSave.mutate(payload, {
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
              <div className="flex gap-2">
                <input type="number" min={1} value={form.first_num} onChange={e => setForm(f => ({ ...f, first_num: Math.max(1, parseInt(e.target.value) || 1) }))}
                  className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                <select value={form.first_unit} onChange={e => setForm(f => ({ ...f, first_unit: e.target.value as 'h' | 'm' }))}
                  className="px-3 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="h">horas</option>
                  <option value="m">min</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">2º Lembrete (antes)</label>
              <div className="flex gap-2">
                <input type="number" min={1} value={form.second_num} onChange={e => setForm(f => ({ ...f, second_num: Math.max(1, parseInt(e.target.value) || 1) }))}
                  className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                <select value={form.second_unit} onChange={e => setForm(f => ({ ...f, second_unit: e.target.value as 'h' | 'm' }))}
                  className="px-3 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="h">horas</option>
                  <option value="m">min</option>
                </select>
              </div>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Modelo de mensagem</label>
            <textarea value={form.message_template} onChange={e => setForm(f => ({ ...f, message_template: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px] resize-none"
              placeholder="Olá {nome}, gostaríamos de confirmar seu agendamento para {data} às {hora}..." />
            <p className="text-xs text-muted-foreground mt-1">Variáveis: {'{nome}'}, {'{servico}'}, {'{data}'}, {'{hora}'}</p>
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
