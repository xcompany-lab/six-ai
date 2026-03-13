import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';
import { Bot, Users, Settings2, Loader2, ArrowRight, Mic, Brain, Calendar, MessageSquare, UserCheck, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBusinessProfile } from '@/hooks/use-business-profile';
import { useAIAgentConfig, useContactMemories } from '@/hooks/use-ai-agent';
import { useAgentConfigs } from '@/hooks/use-agent-configs';

const agentLabels: Record<string, { label: string; icon: typeof Bot }> = {
  attendant: { label: 'Atendente', icon: MessageSquare },
  scheduler: { label: 'Agendador', icon: Calendar },
  followup: { label: 'Follow-up', icon: ArrowRight },
  crm: { label: 'CRM', icon: UserCheck },
};

export default function AIAgentPage() {
  const navigate = useNavigate();
  const { data: profile, isLoading: loadingProfile } = useBusinessProfile();
  const { data: agentConfig, isLoading: loadingConfig } = useAIAgentConfig();
  const { data: agentConfigs = [] } = useAgentConfigs();
  const { data: memories = [] } = useContactMemories();

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
        /* Profile summary + agents + memory */
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

          {/* Active agents */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="glass rounded-xl p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Bot size={18} className="text-primary" /> Agentes Configurados
            </h3>
            {agentConfigs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum agente configurado. Execute o onboarding para gerar automaticamente.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {agentConfigs.map(ac => {
                  const meta = agentLabels[ac.agent_type] || { label: ac.agent_type, icon: Bot };
                  const Icon = meta.icon;
                  return (
                    <div key={ac.id} className="p-4 rounded-lg bg-secondary/50 border border-border flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10"><Icon size={18} className="text-primary" /></div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{meta.label}</p>
                        <p className="text-xs text-muted-foreground">{ac.system_prompt ? `${ac.system_prompt.length} chars` : 'Vazio'}</p>
                      </div>
                    </div>
                  );
                })}
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

function InfoItem({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground truncate">{value}</p>
    </div>
  );
}
