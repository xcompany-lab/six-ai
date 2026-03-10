import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';
import { PlanGate } from '@/components/ui/plan-gate';
import { KanbanColumn } from '@/types';
import { Plus, GripVertical, MessageSquare, Eye, Edit2 } from 'lucide-react';

interface KanbanLead {
  id: string;
  name: string;
  phone: string;
  interest: string;
  lastContact: string;
  aiStatus: string;
}

const columns: { key: KanbanColumn; label: string; color: string }[] = [
  { key: 'new', label: 'Novos Leads', color: 'bg-primary' },
  { key: 'in_progress', label: 'Em Atendimento', color: 'bg-glow-cyan' },
  { key: 'interested', label: 'Interessados', color: 'bg-accent' },
  { key: 'awaiting_schedule', label: 'Aguardando Agend.', color: 'bg-warning' },
  { key: 'scheduled', label: 'Agendados', color: 'bg-accent' },
  { key: 'no_show', label: 'Não Compareceram', color: 'bg-destructive' },
  { key: 'client', label: 'Clientes', color: 'bg-accent' },
];

const initialLeads: Record<KanbanColumn, KanbanLead[]> = {
  new: [
    { id: '1', name: 'Carla Mendes', phone: '+55 11 9xxxx-1111', interest: 'Botox', lastContact: '1h', aiStatus: 'Qualificando' },
    { id: '2', name: 'Roberto Lima', phone: '+55 11 9xxxx-2222', interest: 'Limpeza', lastContact: '3h', aiStatus: 'Aguardando' },
  ],
  in_progress: [
    { id: '3', name: 'Maria Silva', phone: '+55 11 9xxxx-3333', interest: 'Preenchimento', lastContact: '30min', aiStatus: 'Respondendo' },
  ],
  interested: [
    { id: '4', name: 'João Costa', phone: '+55 11 9xxxx-4444', interest: 'Botox', lastContact: '2h', aiStatus: 'Interessado' },
  ],
  awaiting_schedule: [
    { id: '5', name: 'Ana Oliveira', phone: '+55 11 9xxxx-5555', interest: 'Peeling', lastContact: '1h', aiStatus: 'Propondo horários' },
  ],
  scheduled: [
    { id: '6', name: 'Pedro Santos', phone: '+55 11 9xxxx-6666', interest: 'Avaliação', lastContact: '4h', aiStatus: 'Confirmado' },
  ],
  no_show: [
    { id: '7', name: 'Lucia F.', phone: '+55 11 9xxxx-7777', interest: 'Botox', lastContact: '2d', aiStatus: 'Follow-up ativo' },
  ],
  client: [
    { id: '8', name: 'Fernanda Alves', phone: '+55 11 9xxxx-8888', interest: 'Cliente fiel', lastContact: '7d', aiStatus: '—' },
  ],
};

export default function KanbanPage() {
  const [leads] = useState(initialLeads);

  return (
    <PlanGate requiredPlan="pro">
      <PageHeader title="Kanban CRM" subtitle="Gerencie seus leads em um funil visual">
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-brand text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
          <Plus size={16} /> Novo Lead
        </button>
      </PageHeader>

      <div className="overflow-x-auto pb-4 -mx-2">
        <div className="flex gap-4 min-w-max px-2">
          {columns.map((col, ci) => (
            <motion.div
              key={col.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ci * 0.05 }}
              className="w-[280px] flex-shrink-0"
            >
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
                <span className="text-xs text-muted-foreground ml-auto">{leads[col.key].length}</span>
              </div>

              <div className="space-y-2">
                {leads[col.key].map((lead) => (
                  <div key={lead.id} className="glass rounded-lg p-3 hover:border-primary/30 transition-all cursor-pointer group">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <GripVertical size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="text-sm font-medium text-foreground">{lead.name}</span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1 rounded hover:bg-secondary"><MessageSquare size={12} className="text-muted-foreground" /></button>
                        <button className="p-1 rounded hover:bg-secondary"><Eye size={12} className="text-muted-foreground" /></button>
                        <button className="p-1 rounded hover:bg-secondary"><Edit2 size={12} className="text-muted-foreground" /></button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{lead.interest}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">há {lead.lastContact}</span>
                      <span className="text-xs text-primary">{lead.aiStatus}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </PlanGate>
  );
}
