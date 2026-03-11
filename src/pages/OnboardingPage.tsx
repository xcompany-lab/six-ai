import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import sixLogo from '@/assets/six-logo-dark.png';

const steps = ['Sobre Você', 'Sua Empresa', 'Objetivos'];

const objectives = [
  'Agendar mais', 'Responder mais rápido', 'Recuperar leads perdidos',
  'Confirmar consultas', 'Vender mais avaliações', 'Organizar atendimento',
];

const niches = [
  'Estética', 'Odontologia', 'Medicina', 'Psicologia', 'Nutrição',
  'Fisioterapia', 'Advocacia', 'Contabilidade', 'Educação', 'Outro',
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    name: '', brand_name: '', whatsapp: '', niche: '', services: '',
    objective: [] as string[],
  });
  const navigate = useNavigate();
  const { completeOnboarding } = useAuth();

  const toggleObjective = (obj: string) => {
    setData(d => ({
      ...d,
      objective: d.objective.includes(obj) ? d.objective.filter(o => o !== obj) : [...d.objective, obj],
    }));
  };

  const finish = async () => {
    setLoading(true);
    try {
      await completeOnboarding({
        name: data.name,
        brand_name: data.brand_name,
        whatsapp: data.whatsapp,
        niche: data.niche,
        services: data.services.split(',').map(s => s.trim()).filter(Boolean),
        objective: data.objective[0] || '',
      });
      toast.success('Dados salvos com sucesso!');
      navigate('/app', { replace: true });
    } catch (err) {
      console.error('Onboarding save error:', err);
      toast.error('Erro ao salvar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse-glow" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg relative z-10">
        <img src={sixLogo} alt="SIX AI" className="h-12 mx-auto mb-8" />

        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                i <= step ? 'bg-gradient-brand text-primary-foreground' : 'bg-secondary text-muted-foreground'
              }`}>
                {i < step ? <Check size={16} /> : i + 1}
              </div>
              {i < steps.length - 1 && <div className={`w-12 h-0.5 ${i < step ? 'bg-primary' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        <div className="glass-strong rounded-2xl p-8">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {step === 0 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-foreground">Sobre você</h2>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Nome completo</label>
                    <input value={data.name} onChange={e => setData(d => ({ ...d, name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Seu nome" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">WhatsApp principal</label>
                    <input value={data.whatsapp} onChange={e => setData(d => ({ ...d, whatsapp: e.target.value }))}
                      className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="+55 11 99999-9999" />
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-foreground">Sua empresa</h2>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Nome da marca/empresa</label>
                    <input value={data.brand_name} onChange={e => setData(d => ({ ...d, brand_name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Nome da sua marca" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Nicho</label>
                    <div className="grid grid-cols-2 gap-2">
                      {niches.map(n => (
                        <button key={n} onClick={() => setData(d => ({ ...d, niche: n }))}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${data.niche === n ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-secondary text-muted-foreground border border-border hover:border-primary/20'}`}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Serviços (separados por vírgula)</label>
                    <input value={data.services} onChange={e => setData(d => ({ ...d, services: e.target.value }))}
                      className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Ex: Limpeza de Pele, Botox, Peeling" />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-foreground">Seus objetivos</h2>
                  <p className="text-muted-foreground text-sm">Selecione o que você deseja alcançar com o SIX AI</p>
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
            {step < 2 ? (
              <button onClick={() => setStep(step + 1)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-brand text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
                Próximo <ArrowRight size={16} />
              </button>
            ) : (
              <button onClick={finish} disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-brand text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Começar
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
