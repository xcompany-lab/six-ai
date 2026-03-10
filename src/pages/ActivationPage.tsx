import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';
import { PlanGate } from '@/components/ui/plan-gate';
import { useActivationCampaigns, useCreateCampaign, useUpdateCampaign, useDeleteCampaign, ActivationCampaign } from '@/hooks/use-activation';
import { useLeads } from '@/hooks/use-leads';
import { Zap, Filter, Send, Users, Clock, UserX, Gift, Plus, X, Loader2, Trash2, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const filterTypes = [
  { key: 'old_leads', label: 'Leads antigos', icon: Clock },
  { key: 'no_response', label: 'Não responderam', icon: UserX },
  { key: 'evaluated', label: 'Fizeram avaliação', icon: Users },
  { key: 'no_show', label: 'Não compareceram', icon: UserX },
  { key: 'old_clients', label: 'Clientes antigos', icon: Gift },
];

export default function ActivationPage() {
  const { data: campaigns, isLoading: campaignsLoading } = useActivationCampaigns();
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const deleteCampaign = useDeleteCampaign();
  const { data: leads, isLoading: leadsLoading } = useLeads();
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [showNewCampaign, setShowNewCampaign] = useState(false);

  // Compute filter counts from real leads
  const filterCounts = useMemo(() => {
    if (!leads) return {};
    const now = new Date();
    return {
      old_leads: leads.filter(l => new Date(l.last_contact) < subDays(now, 30)).length,
      no_response: leads.filter(l => l.status === 'new' && new Date(l.last_contact) < subDays(now, 7)).length,
      evaluated: leads.filter(l => l.interest?.toLowerCase().includes('avaliação')).length,
      no_show: leads.filter(l => l.status === 'no_show').length,
      old_clients: leads.filter(l => l.status === 'client' && new Date(l.last_contact) < subDays(now, 60)).length,
    };
  }, [leads]);

  // Filter leads for display
  const filteredLeads = useMemo(() => {
    if (!leads || !selectedFilter) return leads || [];
    const now = new Date();
    switch (selectedFilter) {
      case 'old_leads': return leads.filter(l => new Date(l.last_contact) < subDays(now, 30));
      case 'no_response': return leads.filter(l => l.status === 'new' && new Date(l.last_contact) < subDays(now, 7));
      case 'evaluated': return leads.filter(l => l.interest?.toLowerCase().includes('avaliação'));
      case 'no_show': return leads.filter(l => l.status === 'no_show');
      case 'old_clients': return leads.filter(l => l.status === 'client' && new Date(l.last_contact) < subDays(now, 60));
      default: return leads;
    }
  }, [leads, selectedFilter]);

  const handleDeleteCampaign = (id: string) => {
    if (confirm('Excluir campanha?')) deleteCampaign.mutate(id, { onSuccess: () => toast.success('Campanha excluída') });
  };

  return (
    <PlanGate requiredPlan="pro">
      <PageHeader title="Ativação de Base com IA" subtitle="Reative contatos antigos com campanhas inteligentes">
        <button onClick={() => setShowNewCampaign(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-brand text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
          <Plus size={16} /> Nova Campanha
        </button>
      </PageHeader>

      {/* Campaigns */}
      {campaigns && campaigns.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {campaigns.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`glass rounded-xl p-4 ${c.status === 'active' ? 'border-primary/30' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-foreground text-sm">{c.name}</h4>
                  <p className="text-xs text-muted-foreground">{filterTypes.find(f => f.key === c.filter_type)?.label || c.filter_type}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => updateCampaign.mutate({ id: c.id, status: c.status === 'active' ? 'paused' : 'active' })}
                    className="p-1.5 rounded-lg hover:bg-secondary">
                    {c.status === 'active' ? <Pause size={14} className="text-accent" /> : <Play size={14} className="text-muted-foreground" />}
                  </button>
                  <button onClick={() => handleDeleteCampaign(c.id)} className="p-1.5 rounded-lg hover:bg-destructive/10">
                    <Trash2 size={14} className="text-destructive" />
                  </button>
                </div>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>{c.contacts_count} contatos</span>
                <span>{c.responses_count} respostas</span>
                <span className={`px-2 py-0.5 rounded-full ${c.status === 'active' ? 'bg-accent/10 text-accent' : c.status === 'draft' ? 'bg-secondary text-muted-foreground' : 'bg-warning/10 text-warning'}`}>
                  {c.status === 'active' ? 'Ativa' : c.status === 'draft' ? 'Rascunho' : 'Pausada'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {filterTypes.map((f, i) => (
          <motion.button key={f.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            onClick={() => setSelectedFilter(selectedFilter === f.key ? null : f.key)}
            className={`glass rounded-xl p-4 text-left transition-all ${selectedFilter === f.key ? 'border-primary/40 glow-blue' : 'hover:border-primary/20'}`}>
            <f.icon size={20} className="text-primary mb-2" />
            <p className="text-sm font-medium text-foreground">{f.label}</p>
            <p className="text-2xl font-bold text-gradient-brand">{(filterCounts as any)[f.key] ?? 0}</p>
          </motion.button>
        ))}
      </div>

      {/* Leads table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground">
            Contatos{selectedFilter ? ` — ${filterTypes.find(f => f.key === selectedFilter)?.label}` : ''}
          </h3>
          <span className="text-xs text-muted-foreground">{filteredLeads.length} contatos</span>
        </div>
        {leadsLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : !filteredLeads.length ? (
          <p className="text-center text-muted-foreground py-12 text-sm">Nenhum contato encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Nome</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Telefone</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Último Contato</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.slice(0, 20).map((l) => (
                  <tr key={l.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-3 text-sm font-medium text-foreground">{l.name}</td>
                    <td className="px-6 py-3 text-sm text-muted-foreground font-mono">{l.phone}</td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">{formatDistanceToNow(new Date(l.last_contact), { addSuffix: true, locale: ptBR })}</td>
                    <td className="px-6 py-3"><span className="px-2.5 py-1 rounded-full text-xs bg-secondary text-muted-foreground">{l.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {showNewCampaign && <CampaignFormModal onClose={() => setShowNewCampaign(false)} onCreate={createCampaign} leadsCount={filteredLeads.length} selectedFilter={selectedFilter} />}
    </PlanGate>
  );
}

function CampaignFormModal({ onClose, onCreate, leadsCount, selectedFilter }: {
  onClose: () => void;
  onCreate: ReturnType<typeof useCreateCampaign>;
  leadsCount: number;
  selectedFilter: string | null;
}) {
  const [form, setForm] = useState({
    name: '',
    filter_type: selectedFilter || 'old_leads',
    filter_days_since: 30,
    message_prompt: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate.mutate({ ...form, contacts_count: leadsCount, status: 'draft' }, {
      onSuccess: () => { toast.success('Campanha criada!'); onClose(); },
      onError: () => toast.error('Erro ao criar'),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-strong rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-foreground">Nova Campanha de Ativação</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary"><X size={18} className="text-muted-foreground" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Nome da campanha</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
              className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Ex: Reativação Março" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Filtro</label>
              <select value={form.filter_type} onChange={e => setForm(f => ({ ...f, filter_type: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                {filterTypes.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Dias sem contato</label>
              <input type="number" value={form.filter_days_since} onChange={e => setForm(f => ({ ...f, filter_days_since: parseInt(e.target.value) || 30 }))}
                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Prompt da campanha</label>
            <textarea value={form.message_prompt} onChange={e => setForm(f => ({ ...f, message_prompt: e.target.value }))}
              className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px] resize-none"
              placeholder="Descreva a abordagem que a IA deve usar..." />
          </div>
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-sm text-muted-foreground">
            <Zap size={14} className="inline text-primary mr-1" /> {leadsCount} contatos serão incluídos nesta campanha
          </div>
          <button type="submit" disabled={onCreate.isPending}
            className="w-full py-3 rounded-lg bg-gradient-brand text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
            {onCreate.isPending && <Loader2 size={16} className="animate-spin" />}
            Criar Campanha
          </button>
        </form>
      </motion.div>
    </div>
  );
}
