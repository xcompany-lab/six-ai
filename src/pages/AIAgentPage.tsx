import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';
import { Bot, Users, Settings2, Loader2, ArrowRight, Mic, Brain, Calendar, MessageSquare, UserCheck, ChevronDown, DollarSign, Plus, Trash2, Save, Edit3, X, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBusinessProfile, useSaveBusinessProfile, type ServicePriceItem } from '@/hooks/use-business-profile';
import { useAIAgentConfig, useContactMemories } from '@/hooks/use-ai-agent';
import { useAgentConfigs, useRefineAgentPrompt } from '@/hooks/use-agent-configs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

const agentLabels: Record<string, { label: string; icon: typeof Bot }> = {
  attendant: { label: 'Atendente', icon: MessageSquare },
  scheduler: { label: 'Agendador', icon: Calendar },
  followup: { label: 'Follow-up', icon: ArrowRight },
  crm: { label: 'CRM', icon: UserCheck },
};

const PAYMENT_OPTIONS = ['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Boleto', 'Transferência'];

export default function AIAgentPage() {
  const navigate = useNavigate();
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [refineInput, setRefineInput] = useState('');
  const { data: profile, isLoading: loadingProfile } = useBusinessProfile();
  const { data: agentConfig, isLoading: loadingConfig } = useAIAgentConfig();
  const { data: agentConfigs = [] } = useAgentConfigs();
  const { data: memories = [] } = useContactMemories();
  const refinePrompt = useRefineAgentPrompt();

  const isActive = agentConfig?.active ?? true;

  if (loadingProfile || loadingConfig) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Atendente IA" subtitle="Seu agente inteligente de atendimento" />

      {/* Status card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-5 mb-6 flex items-center gap-4 flex-wrap">
        <div className="p-3 rounded-xl bg-primary/10"><Bot size={24} className="text-primary" /></div>
        <div className="flex-1 min-w-[200px]">
          <h3 className="font-semibold text-foreground">{isActive ? 'Agente Ativo' : 'Agente Inativo'}</h3>
          <p className="text-sm text-muted-foreground">
            {isActive ? 'Respondendo automaticamente via WhatsApp' : 'Agente pausado'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Mic size={14} className="text-accent" />
          <span className="text-muted-foreground">Áudio: transcrição ativa</span>
        </div>
      </motion.div>

      {!profile ? (
        /* Onboarding banner */
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass rounded-xl p-8 text-center space-y-4">
          <div className="p-4 rounded-2xl bg-primary/10 w-fit mx-auto">
            <Brain size={40} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Configure seu agente em minutos</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Responda algumas perguntas sobre seu negócio e o sistema vai gerar automaticamente os prompts de todos os agentes de IA.
          </p>
          <button onClick={() => navigate('/onboarding')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-brand text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
            Iniciar configuração guiada <ArrowRight size={18} />
          </button>
        </motion.div>
      ) : (
        /* Profile summary + services + agents + memory */
        <div className="space-y-6">
          {/* Business profile summary */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Settings2 size={18} className="text-primary" /> Perfil do Negócio
              </h3>
              <button onClick={() => navigate('/onboarding')}
                className="text-sm text-primary hover:underline flex items-center gap-1">
                Reconfigurar <ArrowRight size={14} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <InfoItem label="Nome" value={profile.business_name} />
              <InfoItem label="Segmento" value={profile.segment} />
              <InfoItem label="Tom de Voz" value={profile.tone} />
              <InfoItem label="Serviços" value={Array.isArray(profile.services) ? (profile.services as string[]).join(', ') : ''} />
              <InfoItem label="Critério de Lead Qualificado" value={profile.qualified_lead_criteria} />
            </div>
          </motion.div>

          {/* Services & Pricing section */}
          <ServicePricingSection profile={profile} />

          {/* Active agents */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="glass rounded-xl p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Bot size={18} className="text-primary" /> Agentes Configurados
            </h3>
            {agentConfigs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum agente configurado. Execute o onboarding para gerar automaticamente.</p>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {agentConfigs.map(ac => {
                    const meta = agentLabels[ac.agent_type] || { label: ac.agent_type, icon: Bot };
                    const Icon = meta.icon;
                    const isExpanded = expandedAgent === ac.id;
                    return (
                      <button key={ac.id} onClick={() => setExpandedAgent(isExpanded ? null : ac.id)}
                        className="p-4 rounded-lg bg-secondary/50 border border-border flex items-center gap-3 text-left w-full hover:bg-secondary/80 transition-colors">
                        <div className="p-2 rounded-lg bg-primary/10"><Icon size={18} className="text-primary" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm">{meta.label}</p>
                          <p className="text-xs text-muted-foreground">{ac.system_prompt ? `${ac.system_prompt.length} chars` : 'Vazio'}</p>
                        </div>
                        <ChevronDown size={16} className={`text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    );
                  })}
                </div>
                <AnimatePresence>
                  {agentConfigs.map(ac => expandedAgent === ac.id && ac.system_prompt ? (
                    <motion.div key={`prompt-${ac.id}`}
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden">
                      <ScrollArea className="max-h-[400px] rounded-lg border border-border bg-secondary/30 p-4">
                        <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">{ac.system_prompt}</pre>
                      </ScrollArea>
                    </motion.div>
                  ) : null)}
                </AnimatePresence>
              </div>
            )}
          </motion.div>

          {/* Memory section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass rounded-xl p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users size={18} className="text-primary" /> Memória de Contatos
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Memória automática — o agente lembra contexto, preferências e histórico de cada contato.
            </p>
            {memories.length === 0 ? (
              <div className="text-center py-8">
                <Users size={40} className="mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">Nenhuma memória registrada ainda</p>
                <p className="text-xs text-muted-foreground mt-1">As memórias serão criadas conforme o agente interage</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {memories.map(m => (
                  <div key={m.id} className="p-4 rounded-lg bg-secondary/50 border border-border">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-foreground">{m.contact_name || m.contact_phone}</h4>
                        <p className="text-xs text-muted-foreground">{m.contact_phone} · {m.interaction_count} interações</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        m.sentiment === 'positive' ? 'bg-accent/10 text-accent' :
                        m.sentiment === 'negative' ? 'bg-destructive/10 text-destructive' :
                        'bg-muted text-muted-foreground'
                      }`}>{m.sentiment}</span>
                    </div>
                    {m.summary && <p className="text-sm text-muted-foreground">{m.summary}</p>}
                    {m.last_topics && <p className="text-xs text-muted-foreground mt-1">Tópicos: {m.last_topics}</p>}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}

/* ── Service Pricing Section ── */

interface ServicePricingSectionProps {
  profile: {
    service_prices?: ServicePriceItem[];
  };
}

function ServicePricingSection({ profile }: ServicePricingSectionProps) {
  const saveProfile = useSaveBusinessProfile();
  const [editing, setEditing] = useState(false);
  const [services, setServices] = useState<ServicePriceItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [plans, setPlans] = useState('');

  const rawPrices = (profile.service_prices || []) as ServicePriceItem[];

  const startEditing = () => {
    setServices(rawPrices.length > 0 ? rawPrices.map(s => ({ ...s })) : [{ name: '', price: '', notes: '' }]);
    // Extract global payment methods and plans from first item or defaults
    const first = rawPrices[0];
    setPaymentMethods(first?.payment_methods || []);
    setPlans(first?.plans || '');
    setEditing(true);
  };

  const cancelEditing = () => setEditing(false);

  const updateService = (idx: number, field: keyof ServicePriceItem, value: string) => {
    setServices(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const addService = () => {
    setServices(prev => [...prev, { name: '', price: '', notes: '' }]);
  };

  const removeService = (idx: number) => {
    setServices(prev => prev.filter((_, i) => i !== idx));
  };

  const togglePayment = (method: string) => {
    setPaymentMethods(prev => prev.includes(method) ? prev.filter(m => m !== method) : [...prev, method]);
  };

  const handleSave = async () => {
    const validServices = services.filter(s => s.name.trim());
    const enriched = validServices.map(s => ({
      ...s,
      payment_methods: paymentMethods,
      plans,
    }));

    try {
      await saveProfile.mutateAsync({ service_prices: enriched } as any);
      toast({ title: 'Serviços atualizados', description: 'Os agentes serão regenerados com os novos preços.' });
      setEditing(false);
    } catch {
      toast({ title: 'Erro ao salvar', description: 'Tente novamente.', variant: 'destructive' });
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
      className="glass rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <DollarSign size={18} className="text-primary" /> Serviços e Preços
        </h3>
        {!editing ? (
          <Button variant="ghost" size="sm" onClick={startEditing} className="gap-1">
            <Edit3 size={14} /> Editar
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={cancelEditing} className="gap-1">
              <X size={14} /> Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saveProfile.isPending} className="gap-1">
              <Save size={14} /> {saveProfile.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        )}
      </div>

      {!editing ? (
        /* View mode */
        rawPrices.length === 0 ? (
          <div className="text-center py-6">
            <DollarSign size={32} className="mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-muted-foreground text-sm">Nenhum serviço cadastrado</p>
            <Button variant="outline" size="sm" className="mt-3 gap-1" onClick={startEditing}>
              <Plus size={14} /> Adicionar serviços
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-2">
              {rawPrices.map((s, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{s.name}</p>
                    {s.notes && <p className="text-xs text-muted-foreground">{s.notes}</p>}
                  </div>
                  <span className="text-sm font-semibold text-primary whitespace-nowrap">{s.price || '—'}</span>
                </div>
              ))}
            </div>
            {rawPrices[0]?.payment_methods && rawPrices[0].payment_methods.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Formas de pagamento</p>
                <div className="flex flex-wrap gap-1.5">
                  {rawPrices[0].payment_methods.map(m => (
                    <span key={m} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{m}</span>
                  ))}
                </div>
              </div>
            )}
            {rawPrices[0]?.plans && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Planos / Pacotes</p>
                <p className="text-sm text-foreground">{rawPrices[0].plans}</p>
              </div>
            )}
          </div>
        )
      ) : (
        /* Edit mode */
        <div className="space-y-4">
          <div className="space-y-3">
            {services.map((s, i) => (
              <div key={i} className="p-4 rounded-lg bg-secondary/50 border border-border space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input placeholder="Nome do serviço" value={s.name} onChange={e => updateService(i, 'name', e.target.value)} />
                    <Input placeholder="R$ 0,00" value={s.price} onChange={e => updateService(i, 'price', e.target.value)} />
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => removeService(i)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
                <Input placeholder="Observações (opcional)" value={s.notes || ''} onChange={e => updateService(i, 'notes', e.target.value)} />
              </div>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={addService} className="gap-1">
            <Plus size={14} /> Adicionar serviço
          </Button>

          {/* Payment methods */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Formas de pagamento aceitas</p>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_OPTIONS.map(method => (
                <button key={method} onClick={() => togglePayment(method)}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                    paymentMethods.includes(method)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary/50 text-muted-foreground border-border hover:border-primary/50'
                  }`}>
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Plans */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Planos / Pacotes</p>
            <Textarea placeholder="Descreva seus planos, pacotes ou combos..." value={plans} onChange={e => setPlans(e.target.value)} rows={3} />
          </div>
        </div>
      )}
    </motion.div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground truncate">{value}</p>
    </div>
  );
}
