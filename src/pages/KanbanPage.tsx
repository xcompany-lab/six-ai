import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';
import { PlanGate } from '@/components/ui/plan-gate';
import { useLeadsByStatus, useCreateLead, useUpdateLead, useDeleteLead, Lead } from '@/hooks/use-leads';
import { Plus, GripVertical, MessageSquare, Eye, Edit2, X, Loader2, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const columns: { key: string; label: string; color: string }[] = [
  { key: 'new', label: 'Novos Leads', color: 'bg-primary' },
  { key: 'in_progress', label: 'Em Atendimento', color: 'bg-[hsl(var(--glow-cyan))]' },
  { key: 'interested', label: 'Interessados', color: 'bg-accent' },
  { key: 'awaiting_schedule', label: 'Aguardando Agend.', color: 'bg-warning' },
  { key: 'scheduled', label: 'Agendados', color: 'bg-accent' },
  { key: 'no_show', label: 'Não Compareceram', color: 'bg-destructive' },
  { key: 'client', label: 'Clientes', color: 'bg-accent' },
];

export default function KanbanPage() {
  const { grouped, isLoading } = useLeadsByStatus();
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const handleDragStart = (lead: Lead) => {
    setDraggedLead(lead);
  };

  const handleDragOver = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    setDragOverColumn(columnKey);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (columnKey: string) => {
    if (draggedLead && draggedLead.status !== columnKey) {
      updateLead.mutate(
        { id: draggedLead.id, status: columnKey },
        { onSuccess: () => toast.success(`Lead movido para ${columns.find(c => c.key === columnKey)?.label}`) }
      );
    }
    setDraggedLead(null);
    setDragOverColumn(null);
  };

  return (
    <PlanGate requiredPlan="pro">
      <PageHeader title="Kanban CRM" subtitle="Gerencie seus leads em um funil visual">
        <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-brand text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
          <Plus size={16} /> Novo Lead
        </button>
      </PageHeader>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="overflow-x-auto pb-4 -mx-2">
          <div className="flex gap-4 min-w-max px-2">
            {columns.map((col, ci) => {
              const colLeads = grouped[col.key] || [];
              return (
                <motion.div
                  key={col.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: ci * 0.05 }}
                  className={`w-[280px] flex-shrink-0 rounded-xl p-2 transition-colors ${dragOverColumn === col.key ? 'bg-primary/5 border border-primary/20' : ''}`}
                  onDragOver={(e) => handleDragOver(e, col.key)}
                  onDragLeave={handleDragLeave}
                  onDrop={() => handleDrop(col.key)}
                >
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                    <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
                    <span className="text-xs text-muted-foreground ml-auto">{colLeads.length}</span>
                  </div>

                  <div className="space-y-2 min-h-[60px]">
                    {colLeads.map((lead) => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={() => handleDragStart(lead)}
                        className={`glass rounded-lg p-3 hover:border-primary/30 transition-all cursor-grab active:cursor-grabbing group ${draggedLead?.id === lead.id ? 'opacity-40' : ''}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <GripVertical size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="text-sm font-medium text-foreground">{lead.name}</span>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setSelectedLead(lead)} className="p-1 rounded hover:bg-secondary"><Eye size={12} className="text-muted-foreground" /></button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">{lead.interest || lead.origin || '—'}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(lead.last_contact), { addSuffix: true, locale: ptBR })}
                          </span>
                          {lead.ai_status && <span className="text-xs text-primary">{lead.ai_status}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* New Lead Modal */}
      {showNewModal && <NewLeadModal onClose={() => setShowNewModal(false)} onCreate={createLead} />}

      {/* Lead Detail Modal */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={updateLead}
          onDelete={deleteLead}
        />
      )}
    </PlanGate>
  );
}

function NewLeadModal({ onClose, onCreate }: { onClose: () => void; onCreate: ReturnType<typeof useCreateLead> }) {
  const [form, setForm] = useState({ name: '', phone: '', interest: '', origin: '', notes: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate.mutate(form, {
      onSuccess: () => { toast.success('Lead criado!'); onClose(); },
      onError: () => toast.error('Erro ao criar lead'),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-strong rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-foreground">Novo Lead</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary"><X size={18} className="text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: 'Nome', field: 'name', placeholder: 'Nome do lead', required: true },
            { label: 'Telefone', field: 'phone', placeholder: '+55 11 99999-9999' },
            { label: 'Interesse', field: 'interest', placeholder: 'Ex: Botox, Avaliação...' },
            { label: 'Origem', field: 'origin', placeholder: 'Instagram, Google, Indicação...' },
          ].map(f => (
            <div key={f.field}>
              <label className="text-sm font-medium text-foreground mb-1.5 block">{f.label}</label>
              <input value={(form as any)[f.field]} onChange={e => setForm(prev => ({ ...prev, [f.field]: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder={f.placeholder} required={f.required} />
            </div>
          ))}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Observações</label>
            <textarea value={form.notes} onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[80px] resize-none"
              placeholder="Notas sobre o lead..." />
          </div>
          <button type="submit" disabled={onCreate.isPending}
            className="w-full py-3 rounded-lg bg-gradient-brand text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
            {onCreate.isPending && <Loader2 size={16} className="animate-spin" />}
            Criar Lead
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function LeadDetailModal({ lead, onClose, onUpdate, onDelete }: {
  lead: Lead;
  onClose: () => void;
  onUpdate: ReturnType<typeof useUpdateLead>;
  onDelete: ReturnType<typeof useDeleteLead>;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: lead.name, phone: lead.phone, interest: lead.interest,
    origin: lead.origin, next_step: lead.next_step, notes: lead.notes, summary: lead.summary,
  });

  const handleSave = () => {
    onUpdate.mutate({ id: lead.id, ...form }, {
      onSuccess: () => { toast.success('Lead atualizado!'); setEditing(false); onClose(); },
      onError: () => toast.error('Erro ao atualizar'),
    });
  };

  const handleDelete = () => {
    if (confirm('Tem certeza que deseja excluir este lead?')) {
      onDelete.mutate(lead.id, {
        onSuccess: () => { toast.success('Lead excluído'); onClose(); },
        onError: () => toast.error('Erro ao excluir'),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-strong rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-foreground">{lead.name}</h2>
          <div className="flex gap-2">
            {!editing && (
              <>
                <button onClick={() => setEditing(true)} className="p-2 rounded-lg hover:bg-secondary"><Edit2 size={16} className="text-muted-foreground" /></button>
                <button onClick={handleDelete} className="p-2 rounded-lg hover:bg-destructive/10"><Trash2 size={16} className="text-destructive" /></button>
              </>
            )}
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary"><X size={16} className="text-muted-foreground" /></button>
          </div>
        </div>

        {editing ? (
          <div className="space-y-4">
            {[
              { label: 'Nome', field: 'name' },
              { label: 'Telefone', field: 'phone' },
              { label: 'Interesse', field: 'interest' },
              { label: 'Origem', field: 'origin' },
              { label: 'Próximo passo', field: 'next_step' },
            ].map(f => (
              <div key={f.field}>
                <label className="text-sm font-medium text-foreground mb-1.5 block">{f.label}</label>
                <input value={(form as any)[f.field]} onChange={e => setForm(prev => ({ ...prev, [f.field]: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            ))}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Observações</label>
              <textarea value={form.notes} onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[80px] resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={handleSave} disabled={onUpdate.isPending}
                className="flex-1 py-3 rounded-lg bg-gradient-brand text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                {onUpdate.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar
              </button>
              <button onClick={() => setEditing(false)} className="px-6 py-3 rounded-lg border border-border text-muted-foreground hover:text-foreground">Cancelar</button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {[
              { label: 'Telefone', value: lead.phone },
              { label: 'Status', value: columns.find(c => c.key === lead.status)?.label || lead.status },
              { label: 'Interesse', value: lead.interest },
              { label: 'Origem', value: lead.origin },
              { label: 'Status IA', value: lead.ai_status },
              { label: 'Próximo passo', value: lead.next_step },
              { label: 'Último contato', value: formatDistanceToNow(new Date(lead.last_contact), { addSuffix: true, locale: ptBR }) },
            ].filter(f => f.value).map(f => (
              <div key={f.label} className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">{f.label}</span>
                <span className="text-sm text-foreground font-medium">{f.value}</span>
              </div>
            ))}
            {lead.notes && (
              <div className="pt-2">
                <span className="text-sm text-muted-foreground block mb-1">Observações</span>
                <p className="text-sm text-foreground bg-secondary rounded-lg p-3">{lead.notes}</p>
              </div>
            )}
            {lead.summary && (
              <div className="pt-2">
                <span className="text-sm text-muted-foreground block mb-1">Resumo</span>
                <p className="text-sm text-foreground bg-secondary rounded-lg p-3">{lead.summary}</p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
