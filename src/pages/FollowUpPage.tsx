import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';
import { PlanGate } from '@/components/ui/plan-gate';
import { useFollowUpFlows, useCreateFollowUpFlow, useUpdateFollowUpFlow, useDeleteFollowUpFlow, FollowUpFlow } from '@/hooks/use-followup';
import { Plus, Play, Pause, RotateCcw, Clock, Target, MessageSquare, X, Loader2, Trash2, Edit2, Save } from 'lucide-react';
import { toast } from 'sonner';

const leadStatuses = [
  { key: 'new', label: 'Novos Leads' },
  { key: 'in_progress', label: 'Em Atendimento' },
  { key: 'interested', label: 'Interessados' },
  { key: 'awaiting_schedule', label: 'Aguardando Agendamento' },
  { key: 'scheduled', label: 'Agendados' },
  { key: 'no_show', label: 'Não Compareceram' },
];

export default function FollowUpPage() {
  const { data: flows, isLoading } = useFollowUpFlows();
  const createFlow = useCreateFollowUpFlow();
  const updateFlow = useUpdateFollowUpFlow();
  const deleteFlow = useDeleteFollowUpFlow();
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<FollowUpFlow | null>(null);

  const toggleActive = (flow: FollowUpFlow) => {
    updateFlow.mutate({ id: flow.id, active: !flow.active }, {
      onSuccess: () => toast.success(flow.active ? 'Fluxo pausado' : 'Fluxo ativado'),
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Excluir este fluxo?')) {
      deleteFlow.mutate(id, { onSuccess: () => toast.success('Fluxo excluído') });
    }
  };

  return (
    <PlanGate requiredPlan="pro">
      <PageHeader title="Follow Up com IA" subtitle="Automatize o acompanhamento dos seus leads">
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-brand text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
          <Plus size={16} /> Novo Fluxo
        </button>
      </PageHeader>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : !flows?.length ? (
        <div className="glass rounded-xl p-12 text-center">
          <RotateCcw size={40} className="text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum fluxo de follow-up criado ainda.</p>
          <button onClick={() => setShowNew(true)} className="mt-4 px-5 py-2.5 rounded-lg bg-gradient-brand text-primary-foreground font-semibold text-sm hover:opacity-90">
            Criar primeiro fluxo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {flows.map((flow, i) => (
            <motion.div key={flow.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`glass rounded-xl p-5 hover:border-primary/30 transition-all ${flow.active ? '' : 'opacity-60'}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10"><RotateCcw size={18} className="text-primary" /></div>
                  <div>
                    <h3 className="font-semibold text-foreground">{flow.name}</h3>
                    <p className="text-xs text-muted-foreground">{flow.trigger_description}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditing(flow)} className="p-1.5 rounded-lg hover:bg-secondary"><Edit2 size={14} className="text-muted-foreground" /></button>
                  <button onClick={() => handleDelete(flow.id)} className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 size={14} className="text-destructive" /></button>
                  <button onClick={() => toggleActive(flow)}
                    className={`p-1.5 rounded-lg transition-colors ${flow.active ? 'bg-accent/10 text-accent hover:bg-accent/20' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                    {flow.active ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Target size={12} /><span>{leadStatuses.find(s => s.key === flow.lead_status)?.label || flow.lead_status}</span></div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><MessageSquare size={12} /><span>{flow.attempts} tentativas</span></div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock size={12} /><span>A cada {flow.interval_time}</span></div>
              </div>
              <div className="flex items-center gap-1 mt-4">
                {Array.from({ length: flow.attempts }).map((_, j) => (
                  <div key={j} className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${j === 0 ? 'bg-primary' : 'bg-secondary border border-border'}`} />
                    {j < flow.attempts - 1 && <div className="w-6 h-0.5 bg-border" />}
                  </div>
                ))}
              </div>
              {flow.objective && <p className="text-xs text-muted-foreground mt-3 italic">Objetivo: {flow.objective}</p>}
            </motion.div>
          ))}
        </div>
      )}

      {(showNew || editing) && (
        <FlowFormModal
          flow={editing || undefined}
          onClose={() => { setShowNew(false); setEditing(null); }}
          onCreate={createFlow}
          onUpdate={updateFlow}
        />
      )}
    </PlanGate>
  );
}

function FlowFormModal({ flow, onClose, onCreate, onUpdate }: {
  flow?: FollowUpFlow;
  onClose: () => void;
  onCreate: ReturnType<typeof useCreateFollowUpFlow>;
  onUpdate: ReturnType<typeof useUpdateFollowUpFlow>;
}) {
  const isEdit = !!flow;
  const [form, setForm] = useState({
    name: flow?.name || '',
    trigger_description: flow?.trigger_description || '',
    lead_status: flow?.lead_status || 'new',
    no_response_time: flow?.no_response_time || '24h',
    attempts: flow?.attempts || 3,
    interval_time: flow?.interval_time || '24h',
    objective: flow?.objective || '',
    message_prompt: flow?.message_prompt || '',
    active: flow?.active ?? false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      onUpdate.mutate({ id: flow!.id, ...form }, {
        onSuccess: () => { toast.success('Fluxo atualizado!'); onClose(); },
        onError: () => toast.error('Erro ao atualizar'),
      });
    } else {
      onCreate.mutate(form, {
        onSuccess: () => { toast.success('Fluxo criado!'); onClose(); },
        onError: () => toast.error('Erro ao criar'),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-strong rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-foreground">{isEdit ? 'Editar Fluxo' : 'Novo Fluxo de Follow-up'}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary"><X size={18} className="text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Nome do fluxo</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
              className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Ex: Lead Esfriou" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Gatilho de entrada</label>
            <input value={form.trigger_description} onChange={e => setForm(f => ({ ...f, trigger_description: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Ex: Sem resposta há 24h" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Status do lead</label>
              <select value={form.lead_status} onChange={e => setForm(f => ({ ...f, lead_status: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                {leadStatuses.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Tempo sem resposta</label>
              <input value={form.no_response_time} onChange={e => setForm(f => ({ ...f, no_response_time: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="24h" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Tentativas</label>
              <input type="number" min={1} max={10} value={form.attempts} onChange={e => setForm(f => ({ ...f, attempts: parseInt(e.target.value) || 3 }))}
                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Intervalo entre msgs</label>
              <input value={form.interval_time} onChange={e => setForm(f => ({ ...f, interval_time: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="24h" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Objetivo do follow-up</label>
            <input value={form.objective} onChange={e => setForm(f => ({ ...f, objective: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Ex: Recuperar lead e agendar avaliação" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Prompt/mensagem base</label>
            <textarea value={form.message_prompt} onChange={e => setForm(f => ({ ...f, message_prompt: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px] resize-none"
              placeholder="Escreva o prompt que a IA usará para gerar as mensagens de follow-up..." />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="active" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary/50" />
            <label htmlFor="active" className="text-sm text-foreground">Ativar fluxo imediatamente</label>
          </div>
          <button type="submit" disabled={onCreate.isPending || onUpdate.isPending}
            className="w-full py-3 rounded-lg bg-gradient-brand text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
            {(onCreate.isPending || onUpdate.isPending) && <Loader2 size={16} className="animate-spin" />}
            {isEdit ? 'Salvar Alterações' : 'Criar Fluxo'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
