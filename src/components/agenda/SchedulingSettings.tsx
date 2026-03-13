import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useSchedulingConfig, useUpsertSchedulingConfig } from '@/hooks/use-appointments';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, X, Clock, CalendarOff, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DURATION_OPTIONS = [15, 30, 45, 60];
const BUFFER_OPTIONS = [0, 5, 10, 15, 30];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SchedulingSettings({ open, onOpenChange }: Props) {
  const { data: config, isLoading } = useSchedulingConfig();
  const upsert = useUpsertSchedulingConfig();
  const { toast } = useToast();

  const [workStart, setWorkStart] = useState('08:00');
  const [workEnd, setWorkEnd] = useState('18:00');
  const [lunchEnabled, setLunchEnabled] = useState(true);
  const [lunchStart, setLunchStart] = useState('12:00');
  const [lunchEnd, setLunchEnd] = useState('13:00');
  const [defaultDuration, setDefaultDuration] = useState(60);
  const [bufferMinutes, setBufferMinutes] = useState(15);
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);

  useEffect(() => {
    if (config) {
      setWorkStart(config.work_start?.slice(0, 5) || '08:00');
      setWorkEnd(config.work_end?.slice(0, 5) || '18:00');
      setLunchEnabled(!!config.lunch_start);
      setLunchStart(config.lunch_start?.slice(0, 5) || '12:00');
      setLunchEnd(config.lunch_end?.slice(0, 5) || '13:00');
      setDefaultDuration(config.default_duration || 60);
      setBufferMinutes(config.buffer_minutes || 15);
      setWorkDays(config.work_days || [1, 2, 3, 4, 5]);
      setBlockedDates(config.blocked_dates || []);
    }
  }, [config]);

  const toggleDay = (day: number) => {
    setWorkDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort());
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    const dateStr = format(date, 'yyyy-MM-dd');
    setBlockedDates(prev =>
      prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr].sort()
    );
  };

  const handleSave = () => {
    upsert.mutate(
      {
        work_start: workStart,
        work_end: workEnd,
        lunch_start: lunchEnabled ? lunchStart : null,
        lunch_end: lunchEnabled ? lunchEnd : null,
        default_duration: defaultDuration,
        buffer_minutes: bufferMinutes,
        work_days: workDays,
        blocked_dates: blockedDates,
      } as any,
      {
        onSuccess: () => {
          toast({ title: 'Configurações salvas', description: 'Suas configurações de agendamento foram atualizadas.' });
          onOpenChange(false);
        },
        onError: () => {
          toast({ title: 'Erro ao salvar', description: 'Tente novamente.', variant: 'destructive' });
        },
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Configurações da Agenda</SheetTitle>
          <SheetDescription>Defina horários, dias de atendimento e bloqueios.</SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-8 mt-6 pb-6">
            {/* Horário de atendimento */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Clock size={16} className="text-primary" />
                Horário de Atendimento
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Início</label>
                  <input type="time" value={workStart} onChange={e => setWorkStart(e.target.value)}
                    className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Fim</label>
                  <input type="time" value={workEnd} onChange={e => setWorkEnd(e.target.value)}
                    className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground" />
                </div>
              </div>

              {/* Lunch toggle */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Intervalo de almoço</span>
                <button onClick={() => setLunchEnabled(!lunchEnabled)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${lunchEnabled ? 'bg-primary' : 'bg-muted'}`}>
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-background transition-transform ${lunchEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              {lunchEnabled && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Início almoço</label>
                    <input type="time" value={lunchStart} onChange={e => setLunchStart(e.target.value)}
                      className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Fim almoço</label>
                    <input type="time" value={lunchEnd} onChange={e => setLunchEnd(e.target.value)}
                      className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Duração padrão</label>
                  <select value={defaultDuration} onChange={e => setDefaultDuration(Number(e.target.value))}
                    className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground">
                    {DURATION_OPTIONS.map(d => <option key={d} value={d}>{d} min</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Intervalo entre</label>
                  <select value={bufferMinutes} onChange={e => setBufferMinutes(Number(e.target.value))}
                    className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground">
                    {BUFFER_OPTIONS.map(b => <option key={b} value={b}>{b} min</option>)}
                  </select>
                </div>
              </div>
            </section>

            {/* Dias da semana */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <CalendarDays size={16} className="text-primary" />
                Dias de Atendimento
              </div>
              <div className="flex gap-2 flex-wrap">
                {DAY_LABELS.map((label, i) => (
                  <button key={i} onClick={() => toggleDay(i)}
                    className={`w-10 h-10 rounded-full text-xs font-medium transition-all ${
                      workDays.includes(i)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
            </section>

            {/* Bloqueio de datas */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <CalendarOff size={16} className="text-primary" />
                Bloqueio de Datas
              </div>
              <Calendar
                mode="multiple"
                selected={blockedDates.map(d => new Date(d + 'T12:00:00'))}
                onSelect={(dates) => {
                  if (dates) {
                    setBlockedDates(dates.map(d => format(d, 'yyyy-MM-dd')).sort());
                  }
                }}
                locale={ptBR}
                className="rounded-lg border border-border"
              />
              {blockedDates.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {blockedDates.map(d => (
                    <span key={d} className="flex items-center gap-1 px-2 py-1 rounded-md bg-destructive/10 text-destructive text-xs">
                      {format(new Date(d + 'T12:00:00'), 'dd/MM/yyyy')}
                      <button onClick={() => setBlockedDates(prev => prev.filter(x => x !== d))}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* Save */}
            <button onClick={handleSave} disabled={upsert.isPending}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {upsert.isPending && <Loader2 size={14} className="animate-spin" />}
              Salvar Configurações
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
