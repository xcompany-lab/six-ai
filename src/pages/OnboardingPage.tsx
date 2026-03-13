import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessProfile, useSaveBusinessProfile } from '@/hooks/use-business-profile';
import { ArrowRight, ArrowLeft, Check, Loader2, Plus, Trash2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import sixLogo from '@/assets/six-logo-dark.png';

const steps = ['Sobre Você', 'Sua Empresa', 'Tom & FAQ', 'Objeções', 'Funil & Horários', 'Objetivos'];

const tones = [
  { label: 'Profissional e empático', emoji: '💼' },
  { label: 'Descontraído e amigável', emoji: '😄' },
  { label: 'Formal e objetivo', emoji: '📋' },
  { label: 'Urgente e direto', emoji: '⚡' },
];

const objectives = [
  'Agendar mais', 'Responder mais rápido', 'Recuperar leads perdidos',
  'Confirmar consultas', 'Vender mais avaliações', 'Organizar atendimento',
];

const niches = [
  'Estética', 'Odontologia', 'Medicina', 'Psicologia', 'Nutrição',
  'Fisioterapia', 'Advocacia', 'Contabilidade', 'Educação', 'Outro',
];

const defaultFunnelStages = ['Novo', 'Em andamento', 'Interessado', 'Agendado', 'Cliente'];

const weekDays = [
  { key: 'mon', label: 'Seg' },
  { key: 'tue', label: 'Ter' },
  { key: 'wed', label: 'Qua' },
  { key: 'thu', label: 'Qui' },
  { key: 'fri', label: 'Sex' },
  { key: 'sat', label: 'Sáb' },
  { key: 'sun', label: 'Dom' },
];

const inputClass = "w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { completeOnboarding, profile: authProfile } = useAuth();
  const saveBusinessProfile = useSaveBusinessProfile();
  const { data: existingBP } = useBusinessProfile();

  const [data, setData] = useState({
    name: '',
    brand_name: '',
    whatsapp: '',
    niche: '',
    services: '',
    tone: 'Profissional e empático',
    faq: [{ q: '', a: '' }] as { q: string; a: string }[],
    objections: [{ objection: '', response: '' }] as { objection: string; response: string }[],
    funnel_stages: [...defaultFunnelStages],
    qualified_lead_criteria: '',
    working_days: ['mon', 'tue', 'wed', 'thu', 'fri'] as string[],
    work_start: '08:00',
    work_end: '18:00',
    objective: [] as string[],
  });

  // Pre-populate with existing data when reconfiguring
  useEffect(() => {
    if (existingBP || authProfile) {
      setData(d => ({
        ...d,
        name: authProfile?.name || d.name,
        brand_name: existingBP?.business_name || authProfile?.brand_name || d.brand_name,
        whatsapp: authProfile?.whatsapp || d.whatsapp,
        niche: existingBP?.segment || authProfile?.niche || d.niche,
        services: existingBP?.services ? (existingBP.services as string[]).join(', ') : (authProfile?.services?.join(', ') || d.services),
        tone: existingBP?.tone || d.tone,
        faq: existingBP?.faq?.length ? existingBP.faq as { q: string; a: string }[] : d.faq,
        objections: existingBP?.objections?.length ? existingBP.objections as { objection: string; response: string }[] : d.objections,
        funnel_stages: existingBP?.funnel_stages?.length ? existingBP.funnel_stages as string[] : d.funnel_stages,
        qualified_lead_criteria: existingBP?.qualified_lead_criteria || d.qualified_lead_criteria,
        working_days: (existingBP?.working_hours as any)?.days || d.working_days,
        work_start: (existingBP?.working_hours as any)?.start || d.work_start,
        work_end: (existingBP?.working_hours as any)?.end || d.work_end,
      }));
    }
  }, [existingBP, authProfile]);

  const updateField = <K extends keyof typeof data>(key: K, value: (typeof data)[K]) => {
    setData(d => ({ ...d, [key]: value }));
  };

  const toggleObjective = (obj: string) => {
    setData(d => ({
      ...d,
      objective: d.objective.includes(obj) ? d.objective.filter(o => o !== obj) : [...d.objective, obj],
    }));
  };

  const addFaq = () => updateField('faq', [...data.faq, { q: '', a: '' }]);
  const removeFaq = (i: number) => updateField('faq', data.faq.filter((_, idx) => idx !== i));
  const updateFaq = (i: number, field: 'q' | 'a', value: string) => {
    const updated = [...data.faq];
    updated[i] = { ...updated[i], [field]: value };
    updateField('faq', updated);
  };

  const addObjection = () => updateField('objections', [...data.objections, { objection: '', response: '' }]);
  const removeObjection = (i: number) => updateField('objections', data.objections.filter((_, idx) => idx !== i));
  const updateObjection = (i: number, field: 'objection' | 'response', value: string) => {
    const updated = [...data.objections];
    updated[i] = { ...updated[i], [field]: value };
    updateField('objections', updated);
  };

  const toggleDay = (day: string) => {
    updateField('working_days', data.working_days.includes(day) ? data.working_days.filter(d => d !== day) : [...data.working_days, day]);
  };

  const finish = async () => {
    setLoading(true);
    try {
      const servicesList = data.services.split(',').map(s => s.trim()).filter(Boolean);

      // Save to profiles (onboarding)
      await completeOnboarding({
        name: data.name,
        brand_name: data.brand_name,
        whatsapp: data.whatsapp,
        niche: data.niche,
        services: servicesList,
        objective: data.objective[0] || '',
      });

      // Save business profile (multi-agent orchestrator)
      await saveBusinessProfile.mutateAsync({
        business_name: data.brand_name,
        segment: data.niche,
        services: servicesList,
        tone: data.tone,
        faq: data.faq.filter(f => f.q && f.a),
        objections: data.objections.filter(o => o.objection && o.response),
        funnel_stages: data.funnel_stages,
        qualified_lead_criteria: data.qualified_lead_criteria,
        working_hours: {
          days: data.working_days,
          start: data.work_start,
          end: data.work_end,
        },
      } as any);

      toast.success('Configuração concluída! Seus agentes de IA foram criados.');
      navigate('/app', { replace: true });
    } catch (err) {
      console.error('Onboarding error:', err);
      toast.error('Erro ao salvar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return data.name.trim() && data.whatsapp.trim();
      case 1: return data.brand_name.trim() && data.niche;
      default: return true;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-6 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse-glow" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl relative z-10">
        <img src={sixLogo} alt="SIX AI" className="h-12 mx-auto mb-6" />

        {/* Progress bar */}
        <div className="flex items-center justify-center gap-1 mb-6 flex-wrap">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                i <= step ? 'bg-gradient-brand text-primary-foreground' : 'bg-secondary text-muted-foreground'
              }`}>
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              {i < steps.length - 1 && <div className={`w-6 h-0.5 ${i < step ? 'bg-primary' : 'bg-border'}`} />}
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground mb-4">{steps[step]}</p>

        <div className="glass-strong rounded-2xl p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>

              {/* Step 0: Sobre Você */}
              {step === 0 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <MessageSquare size={20} className="text-primary" /> Vamos configurar sua IA
                  </h2>
                  <p className="text-sm text-muted-foreground">Essas informações serão usadas para treinar seus agentes de IA automaticamente.</p>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Nome completo</label>
                    <input value={data.name} onChange={e => updateField('name', e.target.value)} className={inputClass} placeholder="Seu nome" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">WhatsApp principal</label>
                    <input value={data.whatsapp} onChange={e => updateField('whatsapp', e.target.value)} className={inputClass} placeholder="+55 11 99999-9999" />
                  </div>
                </div>
              )}

              {/* Step 1: Empresa */}
              {step === 1 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-foreground">Sua empresa</h2>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Nome da marca/empresa</label>
                    <input value={data.brand_name} onChange={e => updateField('brand_name', e.target.value)} className={inputClass} placeholder="Nome da sua marca" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Nicho</label>
                    <div className="grid grid-cols-2 gap-2">
                      {niches.map(n => (
                        <button key={n} onClick={() => updateField('niche', n)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${data.niche === n ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-secondary text-muted-foreground border border-border hover:border-primary/20'}`}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Serviços (separados por vírgula)</label>
                    <input value={data.services} onChange={e => updateField('services', e.target.value)} className={inputClass} placeholder="Ex: Limpeza de Pele, Botox, Peeling" />
                  </div>
                </div>
              )}

              {/* Step 2: Tom & FAQ */}
              {step === 2 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-foreground">Tom de voz & FAQ</h2>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Tom de voz da IA</label>
                    <div className="grid grid-cols-2 gap-2">
                      {tones.map(t => (
                        <button key={t.label} onClick={() => updateField('tone', t.label)}
                          className={`px-3 py-3 rounded-lg text-sm font-medium transition-all text-left ${data.tone === t.label ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-secondary text-muted-foreground border border-border hover:border-primary/20'}`}>
                          {t.emoji} {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-foreground">Perguntas frequentes (FAQ)</label>
                      <button onClick={addFaq} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
                        <Plus size={14} /> Adicionar
                      </button>
                    </div>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {data.faq.map((f, i) => (
                        <div key={i} className="bg-secondary/50 rounded-lg p-3 space-y-2 relative">
                          {data.faq.length > 1 && (
                            <button onClick={() => removeFaq(i)} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive">
                              <Trash2 size={14} />
                            </button>
                          )}
                          <input value={f.q} onChange={e => updateFaq(i, 'q', e.target.value)} className={inputClass} placeholder="Pergunta do cliente" />
                          <input value={f.a} onChange={e => updateFaq(i, 'a', e.target.value)} className={inputClass} placeholder="Resposta da IA" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Objeções */}
              {step === 3 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-foreground">Objeções comuns</h2>
                  <p className="text-sm text-muted-foreground">Adicione as objeções que seus clientes costumam fazer e como a IA deve responder.</p>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-foreground">Objeções</label>
                      <button onClick={addObjection} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
                        <Plus size={14} /> Adicionar
                      </button>
                    </div>
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {data.objections.map((o, i) => (
                        <div key={i} className="bg-secondary/50 rounded-lg p-3 space-y-2 relative">
                          {data.objections.length > 1 && (
                            <button onClick={() => removeObjection(i)} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive">
                              <Trash2 size={14} />
                            </button>
                          )}
                          <input value={o.objection} onChange={e => updateObjection(i, 'objection', e.target.value)} className={inputClass} placeholder="Objeção do cliente (ex: 'Tá caro')" />
                          <input value={o.response} onChange={e => updateObjection(i, 'response', e.target.value)} className={inputClass} placeholder="Resposta da IA" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Funil & Horários */}
              {step === 4 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-foreground">Funil & Horários</h2>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Etapas do funil de vendas</label>
                    <div className="flex flex-wrap gap-2">
                      {data.funnel_stages.map((stage, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm">
                          {stage}
                          {data.funnel_stages.length > 2 && (
                            <button onClick={() => updateField('funnel_stages', data.funnel_stages.filter((_, idx) => idx !== i))}
                              className="hover:text-destructive"><Trash2 size={12} /></button>
                          )}
                        </span>
                      ))}
                      <input
                        placeholder="+ Nova etapa"
                        className="px-3 py-1.5 rounded-full bg-secondary border border-border text-sm text-foreground w-32 focus:outline-none focus:ring-1 focus:ring-primary/50"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                            updateField('funnel_stages', [...data.funnel_stages, (e.target as HTMLInputElement).value.trim()]);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Critério de lead qualificado</label>
                    <input value={data.qualified_lead_criteria} onChange={e => updateField('qualified_lead_criteria', e.target.value)} className={inputClass} placeholder="Ex: Demonstrou interesse em agendar" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Dias de atendimento</label>
                    <div className="flex gap-2">
                      {weekDays.map(d => (
                        <button key={d.key} onClick={() => toggleDay(d.key)}
                          className={`w-10 h-10 rounded-lg text-xs font-semibold transition-all ${data.working_days.includes(d.key) ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-secondary text-muted-foreground border border-border'}`}>
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Início</label>
                      <input type="time" value={data.work_start} onChange={e => updateField('work_start', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Fim</label>
                      <input type="time" value={data.work_end} onChange={e => updateField('work_end', e.target.value)} className={inputClass} />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Objetivos */}
              {step === 5 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-foreground">Seus objetivos</h2>
                  <p className="text-muted-foreground text-sm">O que você deseja alcançar com o SIX AI?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {objectives.map(obj => (
                      <button key={obj} onClick={() => toggleObjective(obj)}
                        className={`px-3 py-3 rounded-lg text-sm font-medium transition-all text-left ${data.objective.includes(obj) ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-secondary text-muted-foreground border border-border hover:border-primary/20'}`}>
                        {data.objective.includes(obj) && <Check size={14} className="inline mr-1" />}
                        {obj}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-8">
            <button onClick={() => step > 0 && setStep(step - 1)} disabled={step === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
              <ArrowLeft size={16} /> Voltar
            </button>
            {step < steps.length - 1 ? (
              <button onClick={() => setStep(step + 1)} disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-brand text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
                Próximo <ArrowRight size={16} />
              </button>
            ) : (
              <button onClick={finish} disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-brand text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Criar Agentes & Começar
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
