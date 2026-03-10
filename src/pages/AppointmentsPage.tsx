import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';
import { PlanGate } from '@/components/ui/plan-gate';
import {
  useAppointments, useCreateAppointment, useUpdateAppointment, useDeleteAppointment,
  useSchedulingConfig, useUpsertSchedulingConfig, Appointment,
} from '@/hooks/use-appointments';
import { CalendarCheck, Clock, Settings2, Plus, X, Loader2, Trash2, Edit2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusColors: Record<string, string> = {
  confirmed: 'bg-accent/10 text-accent',
  pending: 'bg-warning/10 text-warning',
  cancelled: 'bg-destructive/10 text-destructive',
  completed: 'bg-primary/10 text-primary',
  no_show: 'bg-destructive/10 text-destructive',
};

const statusLabels: Record<string, string> = {
  confirmed: 'Confirmado',
  pending: 'Pendente',
  cancelled: 'Cancelado',
  completed: 'Concluído',
  no_show: 'Não compareceu',
};

const dayLabels: Record<number, string> = { 0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb' };

export default function AppointmentsPage() {
  const { data: appointments, isLoading } = useAppointments();
  const createAppt = useCreateAppointment();
  const updateAppt = useUpdateAppointment();
  const deleteAppt = useDeleteAppointment();
  const { data: config } = useSchedulingConfig();
  const upsertConfig = useUpsertSchedulingConfig();

  const [showNew, setShowNew] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);

  return (
    <PlanGate requiredPlan="plus">
      <PageHeader title="Agendamentos com IA" subtitle="Automação inteligente de agendamentos">
        <div className="flex gap-2">
          <button onClick={() => setShowConfig(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all">
            <Settings2 size={16} /> Configurar
          </button>
          <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-brand text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
            <Plus size={16} /> Novo
          </button>
        </div>
      </PageHeader>

      {/* Config summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Duração Padrão', value: `${config?.default_duration ?? 60} min`, icon: Clock },
          { label: 'Intervalo/Buffer', value: `${config?.buffer_minutes ?? 15} min`, icon: Clock },
          { label: 'Horário', value: `${config?.work_start?.slice(0, 5) ?? '08:00'} - ${config?.work_end?.slice(0, 5) ?? '18:00'}`, icon: CalendarCheck },
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
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : !appointments?.length ? (
          <p className="text-center text-muted-foreground py-12 text-sm">Nenhum agendamento ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Paciente</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Serviço</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Data</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Horário</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{a.lead_name}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{a.service}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{format(new Date(a.date + 'T00:00'), 'dd/MM/yyyy')}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{a.time?.slice(0, 5)}</td>
                    <td className="px-6 py-4">
                      <select
                        value={a.status}
                        onChange={e => updateAppt.mutate({ id: a.id, status: e.target.value }, { onSuccess: () => toast.success('Status atualizado') })}
                        className="px-2.5 py-1 rounded-full text-xs font-medium bg-secondary border border-border text-foreground cursor-pointer"
                      >
                        {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        <button onClick={() => setEditingAppt(a)} className="p-1.5 rounded-lg hover:bg-secondary"><Edit2 size={14} className="text-muted-foreground" /></button>
                        <button onClick={() => { if (confirm('Excluir agendamento?')) deleteAppt.mutate(a.id, { onSuccess: () => toast.success('Excluído') }); }}
                          className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 size={14} className="text-destructive" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {showNew && <AppointmentFormModal onClose={() => setShowNew(false)} onSave={createAppt} config={config} />}
      {editingAppt && <AppointmentFormModal appointment={editingAppt} onClose={() => setEditingAppt(null)} onSave={updateAppt} config={config} />}
      {showConfig && <ConfigModal config={config} onClose={() => setShowConfig(false)} onSave={upsertConfig} />}
    </PlanGate>
  );
}

function AppointmentFormModal({ appointment, onClose, onSave, config }: {
  appointment?: Appointment;
  onClose: () => void;
  onSave: any;
  config: any;
}) {
  const isEdit = !!appointment;
  const [form, setForm] = useState({
    lead_name: appointment?.lead_name || '',
    service: appointment?.service || '',
    date: appointment?.date || format(new Date(), 'yyyy-MM-dd'),
    time: appointment?.time?.slice(0, 5) || config?.work_start?.slice(0, 5) || '08:00',
    duration_minutes: appointment?.duration_minutes || config?.default_duration || 60,
    status: appointment?.status || 'pending',
    notes: appointment?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = isEdit ? { id: appointment!.id, ...form } : form;
    onSave.mutate(payload, {
      onSuccess: () => { toast.success(isEdit ? 'Agendamento atualizado!' : 'Agendamento criado!'); onClose(); },
      onError: () => toast.error('Erro ao salvar'),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-strong rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-foreground">{isEdit ? 'Editar Agendamento' : 'Novo Agendamento'}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary"><X size={18} className="text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Paciente</label>
            <input value={form.lead_name} onChange={e => setForm(f => ({ ...f, lead_name: e.target.value }))} required
              className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Nome do paciente" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Serviço</label>
            <input value={form.service} onChange={e => setForm(f => ({ ...f, service: e.target.value }))} required
              className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Ex: Botox, Limpeza..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Data</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required
                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Horário</label>
              <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} required
                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Duração (min)</label>
              <input type="number" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) || 60 }))}
                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Observações</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[80px] resize-none"
              placeholder="Notas..." />
          </div>
          <button type="submit" disabled={onSave.isPending}
            className="w-full py-3 rounded-lg bg-gradient-brand text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
            {onSave.isPending && <Loader2 size={16} className="animate-spin" />}
            {isEdit ? 'Salvar' : 'Criar Agendamento'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function ConfigModal({ config, onClose, onSave }: { config: any; onClose: () => void; onSave: any }) {
  const [form, setForm] = useState({
    default_duration: config?.default_duration ?? 60,
    buffer_minutes: config?.buffer_minutes ?? 15,
    lunch_start: config?.lunch_start?.slice(0, 5) ?? '12:00',
    lunch_end: config?.lunch_end?.slice(0, 5) ?? '13:00',
    work_start: config?.work_start?.slice(0, 5) ?? '08:00',
    work_end: config?.work_end?.slice(0, 5) ?? '18:00',
    work_days: config?.work_days ?? [1, 2, 3, 4, 5],
  });

  const toggleDay = (day: number) => {
    setForm(f => ({
      ...f,
      work_days: f.work_days.includes(day) ? f.work_days.filter((d: number) => d !== day) : [...f.work_days, day].sort(),
    }));
  };

  const handleSave = () => {
    onSave.mutate(form, {
      onSuccess: () => { toast.success('Configurações salvas!'); onClose(); },
      onError: () => toast.error('Erro ao salvar'),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-strong rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-foreground">Configurações de Agenda</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary"><X size={18} className="text-muted-foreground" /></button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Duração padrão (min)</label>
              <input type="number" value={form.default_duration} onChange={e => setForm(f => ({ ...f, default_duration: parseInt(e.target.value) || 60 }))}
                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Buffer (min)</label>
              <input type="number" value={form.buffer_minutes} onChange={e => setForm(f => ({ ...f, buffer_minutes: parseInt(e.target.value) || 15 }))}
                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Início expediente</label>
              <input type="time" value={form.work_start} onChange={e => setForm(f => ({ ...f, work_start: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Fim expediente</label>
              <input type="time" value={form.work_end} onChange={e => setForm(f => ({ ...f, work_end: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Início almoço</label>
              <input type="time" value={form.lunch_start} onChange={e => setForm(f => ({ ...f, lunch_start: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Fim almoço</label>
              <input type="time" value={form.lunch_end} onChange={e => setForm(f => ({ ...f, lunch_end: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Dias de trabalho</label>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4, 5, 6].map(d => (
                <button key={d} type="button" onClick={() => toggleDay(d)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${form.work_days.includes(d) ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-secondary text-muted-foreground border border-border'}`}>
                  {dayLabels[d]}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleSave} disabled={onSave.isPending}
            className="w-full py-3 rounded-lg bg-gradient-brand text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
            {onSave.isPending && <Loader2 size={16} className="animate-spin" />}
            <Save size={16} /> Salvar Configurações
          </button>
        </div>
      </motion.div>
    </div>
  );
}
