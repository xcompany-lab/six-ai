import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';
import { PlanGate } from '@/components/ui/plan-gate';
import { Zap, Filter, Send, Users, Clock, UserX, Gift } from 'lucide-react';

const filters = [
  { label: 'Leads antigos', icon: Clock, count: 234 },
  { label: 'Não responderam', icon: UserX, count: 87 },
  { label: 'Fizeram avaliação', icon: Users, count: 56 },
  { label: 'Aniversariantes', icon: Gift, count: 12 },
];

const contacts = [
  { name: 'Maria Silva', phone: '+55 11 9xxxx-1234', lastContact: '45 dias', status: 'Não respondeu' },
  { name: 'João Costa', phone: '+55 11 9xxxx-5678', lastContact: '30 dias', status: 'Lead antigo' },
  { name: 'Ana Oliveira', phone: '+55 11 9xxxx-9012', lastContact: '60 dias', status: 'Fez avaliação' },
  { name: 'Pedro Santos', phone: '+55 11 9xxxx-3456', lastContact: '15 dias', status: 'Não compareceu' },
  { name: 'Lucia Ferreira', phone: '+55 11 9xxxx-7890', lastContact: '90 dias', status: 'Cliente antigo' },
];

export default function ActivationPage() {
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  return (
    <PlanGate requiredPlan="pro">
      <PageHeader title="Ativação de Base com IA" subtitle="Reative contatos antigos com campanhas inteligentes">
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-brand text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
          <Send size={16} /> Nova Campanha
        </button>
      </PageHeader>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {filters.map((f, i) => (
          <motion.button
            key={f.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setSelectedFilter(selectedFilter === f.label ? null : f.label)}
            className={`glass rounded-xl p-4 text-left transition-all ${selectedFilter === f.label ? 'border-primary/40 glow-blue' : 'hover:border-primary/20'}`}
          >
            <f.icon size={20} className="text-primary mb-2" />
            <p className="text-sm font-medium text-foreground">{f.label}</p>
            <p className="text-2xl font-bold text-gradient-brand">{f.count}</p>
          </motion.button>
        ))}
      </div>

      {/* Contacts table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Contatos para Ativação</h3>
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <Filter size={14} /> Filtrar
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Nome</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Telefone</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Último Contato</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Ação</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-6 py-3 text-sm font-medium text-foreground">{c.name}</td>
                  <td className="px-6 py-3 text-sm text-muted-foreground font-mono">{c.phone}</td>
                  <td className="px-6 py-3 text-sm text-muted-foreground">{c.lastContact}</td>
                  <td className="px-6 py-3"><span className="px-2.5 py-1 rounded-full text-xs bg-secondary text-muted-foreground">{c.status}</span></td>
                  <td className="px-6 py-3">
                    <button className="flex items-center gap-1 text-xs text-primary hover:underline"><Zap size={12} /> Ativar</button>
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
