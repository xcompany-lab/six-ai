import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';
import { PlanGate } from '@/components/ui/plan-gate';
import { Plus, Play, Pause, RotateCcw, Clock, Target, MessageSquare } from 'lucide-react';

const flows = [
  { id: '1', name: 'Lead Esfriou', trigger: 'Sem resposta há 24h', status: 'Em Atendimento', attempts: 3, interval: '24h', active: true },
  { id: '2', name: 'Pós-Avaliação', trigger: 'Após avaliação gratuita', status: 'Interessados', attempts: 5, interval: '48h', active: true },
  { id: '3', name: 'Não Confirmou', trigger: 'Agendamento pendente', status: 'Agendados', attempts: 2, interval: '12h', active: false },
  { id: '4', name: 'Lead Sumido', trigger: 'Sem contato há 7 dias', status: 'Novos Leads', attempts: 4, interval: '72h', active: true },
];

export default function FollowUpPage() {
  const [flowList] = useState(flows);

  return (
    <PlanGate requiredPlan="pro">
      <PageHeader title="Follow Up com IA" subtitle="Automatize o acompanhamento dos seus leads">
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-brand text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
          <Plus size={16} /> Novo Fluxo
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {flowList.map((flow, i) => (
          <motion.div
            key={flow.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`glass rounded-xl p-5 hover:border-primary/30 transition-all ${flow.active ? '' : 'opacity-60'}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <RotateCcw size={18} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{flow.name}</h3>
                  <p className="text-xs text-muted-foreground">{flow.trigger}</p>
                </div>
              </div>
              <button className={`p-2 rounded-lg transition-colors ${flow.active ? 'bg-accent/10 text-accent hover:bg-accent/20' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                {flow.active ? <Pause size={16} /> : <Play size={16} />}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Target size={12} /> <span>{flow.status}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MessageSquare size={12} /> <span>{flow.attempts} tentativas</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock size={12} /> <span>A cada {flow.interval}</span>
              </div>
            </div>

            {/* Timeline */}
            <div className="flex items-center gap-1 mt-4">
              {Array.from({ length: flow.attempts }).map((_, j) => (
                <div key={j} className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${j === 0 ? 'bg-primary' : 'bg-secondary border border-border'}`} />
                  {j < flow.attempts - 1 && <div className="w-6 h-0.5 bg-border" />}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </PlanGate>
  );
}
