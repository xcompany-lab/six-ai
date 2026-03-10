import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';
import { useAppointmentsByDateRange, Appointment } from '@/hooks/use-appointments';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { format, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type ViewType = 'day' | 'week' | 'month';
const viewLabels: Record<ViewType, string> = { day: 'Dia', week: 'Semana', month: 'Mês' };

const statusColors: Record<string, string> = {
  confirmed: 'bg-accent/10 text-accent border-accent/20',
  pending: 'bg-warning/10 text-warning border-warning/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
  completed: 'bg-primary/10 text-primary border-primary/20',
  no_show: 'bg-destructive/10 text-destructive border-destructive/20',
};
const statusLabels: Record<string, string> = {
  confirmed: 'Confirmado', pending: 'Pendente', cancelled: 'Cancelado', completed: 'Concluído', no_show: 'Não compareceu',
};

export default function AgendaPage() {
  const [view, setView] = useState<ViewType>('day');
  const [currentDate, setCurrentDate] = useState(new Date());

  const { startDate, endDate } = useMemo(() => {
    if (view === 'day') return { startDate: format(currentDate, 'yyyy-MM-dd'), endDate: format(currentDate, 'yyyy-MM-dd') };
    if (view === 'week') return { startDate: format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd'), endDate: format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd') };
    return { startDate: format(startOfMonth(currentDate), 'yyyy-MM-dd'), endDate: format(endOfMonth(currentDate), 'yyyy-MM-dd') };
  }, [view, currentDate]);

  const { data: appointments, isLoading } = useAppointmentsByDateRange(startDate, endDate);

  const navigate = (dir: number) => {
    if (view === 'day') setCurrentDate(d => dir > 0 ? addDays(d, 1) : subDays(d, 1));
    else if (view === 'week') setCurrentDate(d => dir > 0 ? addWeeks(d, 1) : subWeeks(d, 1));
    else setCurrentDate(d => dir > 0 ? addMonths(d, 1) : subMonths(d, 1));
  };

  const dateLabel = () => {
    if (view === 'day') return format(currentDate, "dd 'de' MMMM, yyyy", { locale: ptBR });
    if (view === 'week') {
      const s = startOfWeek(currentDate, { weekStartsOn: 1 });
      const e = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(s, 'dd/MM')} — ${format(e, 'dd/MM/yyyy')}`;
    }
    return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
  };

  return (
    <div>
      <PageHeader title="Agenda Integrada" subtitle="Visualize e gerencie sua agenda">
        <div className="flex gap-1 p-1 rounded-lg bg-secondary">
          {(Object.keys(viewLabels) as ViewType[]).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === v ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              {viewLabels[v]}
            </button>
          ))}
        </div>
      </PageHeader>

      {/* Navigation */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-4 mb-6 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <CalendarIcon size={18} className="text-primary" />
          <span className="font-semibold text-foreground capitalize">{dateLabel()}</span>
          <button onClick={() => setCurrentDate(new Date())} className="ml-2 px-2 py-0.5 rounded text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors">Hoje</button>
        </div>
        <button onClick={() => navigate(1)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
          <ChevronRight size={20} />
        </button>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : view === 'day' ? (
        <DayView appointments={appointments || []} date={currentDate} />
      ) : view === 'week' ? (
        <WeekView appointments={appointments || []} currentDate={currentDate} />
      ) : (
        <MonthView appointments={appointments || []} currentDate={currentDate} onSelectDay={(d) => { setCurrentDate(d); setView('day'); }} />
      )}
    </div>
  );
}

function DayView({ appointments, date }: { appointments: Appointment[]; date: Date }) {
  const dayAppts = appointments.filter(a => a.date === format(date, 'yyyy-MM-dd'));
  const hours = Array.from({ length: 12 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-xl p-6">
      {dayAppts.length === 0 ? (
        <p className="text-center text-muted-foreground py-12 text-sm">Nenhum agendamento neste dia.</p>
      ) : (
        <div className="space-y-3">
          {dayAppts.map((a) => (
            <div key={a.id} className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${statusColors[a.status] || 'bg-secondary/50'}`}>
              <div className="text-sm font-mono font-semibold text-primary min-w-[60px]">{a.time?.slice(0, 5)}</div>
              <div className="w-1 h-10 rounded-full bg-gradient-brand" />
              <div className="flex-1">
                <p className="font-medium text-foreground">{a.lead_name}</p>
                <p className="text-sm text-muted-foreground">{a.service} · {a.duration_minutes}min</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[a.status] || ''}`}>
                {statusLabels[a.status] || a.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function WeekView({ appointments, currentDate }: { appointments: Appointment[]; currentDate: Date }) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: endOfWeek(currentDate, { weekStartsOn: 1 }) });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-7 gap-2">
      {days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayAppts = appointments.filter(a => a.date === dayStr);
        return (
          <div key={dayStr} className={`glass rounded-xl p-3 min-h-[200px] ${isToday(day) ? 'border-primary/40 glow-blue' : ''}`}>
            <div className="text-center mb-3">
              <p className="text-xs text-muted-foreground uppercase">{format(day, 'EEE', { locale: ptBR })}</p>
              <p className={`text-lg font-bold ${isToday(day) ? 'text-primary' : 'text-foreground'}`}>{format(day, 'dd')}</p>
            </div>
            <div className="space-y-1.5">
              {dayAppts.map(a => (
                <div key={a.id} className={`p-2 rounded-lg text-xs border ${statusColors[a.status] || 'bg-secondary/50'}`}>
                  <p className="font-medium truncate">{a.time?.slice(0, 5)} {a.lead_name}</p>
                  <p className="text-muted-foreground truncate">{a.service}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}

function MonthView({ appointments, currentDate, onSelectDay }: { appointments: Appointment[]; currentDate: Date; onSelectDay: (d: Date) => void }) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const allDays = eachDayOfInterval({ start: calStart, end: calEnd });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => (
          <div key={d} className="text-center text-xs text-muted-foreground py-2 font-medium">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {allDays.map(day => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayAppts = appointments.filter(a => a.date === dayStr);
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          return (
            <button key={dayStr} onClick={() => onSelectDay(day)}
              className={`glass rounded-lg p-2 min-h-[80px] text-left transition-all hover:border-primary/30 ${!isCurrentMonth ? 'opacity-30' : ''} ${isToday(day) ? 'border-primary/40 glow-blue' : ''}`}>
              <p className={`text-sm font-medium mb-1 ${isToday(day) ? 'text-primary' : 'text-foreground'}`}>{format(day, 'd')}</p>
              {dayAppts.length > 0 && (
                <div className="space-y-0.5">
                  {dayAppts.slice(0, 2).map(a => (
                    <div key={a.id} className="text-[10px] px-1 py-0.5 rounded bg-primary/10 text-primary truncate">
                      {a.time?.slice(0, 5)} {a.lead_name}
                    </div>
                  ))}
                  {dayAppts.length > 2 && <p className="text-[10px] text-muted-foreground">+{dayAppts.length - 2} mais</p>}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
