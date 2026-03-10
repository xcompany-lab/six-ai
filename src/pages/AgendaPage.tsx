import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

const events = [
  { time: '09:00', name: 'Pedro Santos', service: 'Avaliação', status: 'confirmed' },
  { time: '10:30', name: 'Lucia Ferreira', service: 'Peeling', status: 'confirmed' },
  { time: '14:00', name: 'Maria Silva', service: 'Limpeza de Pele', status: 'confirmed' },
  { time: '15:30', name: 'João Costa', service: 'Botox', status: 'pending' },
  { time: '16:00', name: 'Ana Oliveira', service: 'Preenchimento', status: 'confirmed' },
];

const views = ['Dia', 'Semana', 'Mês'];

export default function AgendaPage() {
  const [view, setView] = useState('Dia');

  return (
    <div>
      <PageHeader title="Agenda Integrada" subtitle="Visualize e gerencie sua agenda">
        <div className="flex gap-1 p-1 rounded-lg bg-secondary">
          {views.map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === v ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              {v}
            </button>
          ))}
        </div>
      </PageHeader>

      {/* Date navigation */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-4 mb-6 flex items-center justify-between">
        <button className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <CalendarIcon size={18} className="text-primary" />
          <span className="font-semibold text-foreground">10 de Março, 2026</span>
          <span className="text-sm text-muted-foreground">· Segunda-feira</span>
        </div>
        <button className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
          <ChevronRight size={20} />
        </button>
      </motion.div>

      {/* Day view */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-xl p-6">
        <div className="space-y-3">
          {events.map((e, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
              <div className="text-sm font-mono font-semibold text-primary min-w-[60px]">{e.time}</div>
              <div className="w-1 h-10 rounded-full bg-gradient-brand" />
              <div className="flex-1">
                <p className="font-medium text-foreground">{e.name}</p>
                <p className="text-sm text-muted-foreground">{e.service}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${e.status === 'confirmed' ? 'bg-accent/10 text-accent' : 'bg-warning/10 text-warning'}`}>
                {e.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
