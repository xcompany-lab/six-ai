import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';
import { Bot, Save, MessageSquare, Brain, Shield, BookOpen, Mic, AlertCircle, Loader2, Users, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAIAgentConfig, useSaveAIAgentConfig, useContactMemories } from '@/hooks/use-ai-agent';

export default function AIAgentPage() {
  const { data: savedConfig, isLoading } = useAIAgentConfig();
  const saveConfig = useSaveAIAgentConfig();
  const { data: memories = [] } = useContactMemories();

  const [config, setConfig] = useState({
    prompt: 'Você é um assistente inteligente da clínica. Responda de forma profissional e acolhedora...',
    voice_tone: 'Profissional e empático',
    energy: 'Moderada',
    prohibited_words: 'concorrente, barato, desconto',
    fallback_message: 'Desculpe, não entendi bem. Posso te ajudar de outra forma?',
    opening_message: 'Olá! 👋 Que bom ter você aqui. Como posso ajudar?',
    out_of_scope: 'Vou encaminhar sua dúvida para nossa equipe. Em breve retornamos!',
    faq: '',
    knowledge_base: '',
    pitch: '',
    objections: '',
    active: true,
  });

  useEffect(() => {
    if (savedConfig) {
      setConfig({
        prompt: savedConfig.prompt,
        voice_tone: savedConfig.voice_tone,
        energy: savedConfig.energy,
        prohibited_words: savedConfig.prohibited_words,
        fallback_message: savedConfig.fallback_message,
        opening_message: savedConfig.opening_message,
        out_of_scope: savedConfig.out_of_scope,
        faq: savedConfig.faq,
        knowledge_base: savedConfig.knowledge_base,
        pitch: savedConfig.pitch,
        objections: savedConfig.objections,
        active: savedConfig.active,
      });
    }
  }, [savedConfig]);

  const tabs = [
    { id: 'prompt', label: 'Prompt', icon: Brain },
    { id: 'behavior', label: 'Comportamento', icon: Shield },
    { id: 'knowledge', label: 'Conhecimento', icon: BookOpen },
    { id: 'messages', label: 'Mensagens', icon: MessageSquare },
    { id: 'memory', label: 'Memória', icon: Users },
  ];

  const [activeTab, setActiveTab] = useState('prompt');

  const handleSave = async () => {
    try {
      await saveConfig.mutateAsync(config);
      toast.success('Configurações salvas e publicadas!');
    } catch {
      toast.error('Erro ao salvar configurações');
    }
  };

  const TextArea = ({ label, field, placeholder, rows = 4 }: { label: string; field: string; placeholder: string; rows?: number }) => (
    <div>
      <label className="text-sm font-medium text-foreground mb-1.5 block">{label}</label>
      <textarea
        value={(config as any)[field]}
        onChange={(e) => setConfig(c => ({ ...c, [field]: e.target.value }))}
        rows={rows}
        className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-mono text-sm"
        placeholder={placeholder}
      />
    </div>
  );

  const Input = ({ label, field, placeholder }: { label: string; field: string; placeholder: string }) => (
    <div>
      <label className="text-sm font-medium text-foreground mb-1.5 block">{label}</label>
      <input
        value={(config as any)[field]}
        onChange={(e) => setConfig(c => ({ ...c, [field]: e.target.value }))}
        className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        placeholder={placeholder}
      />
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Atendente IA" subtitle="Configure seu agente inteligente de atendimento">
        <button onClick={handleSave} disabled={saveConfig.isPending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-brand text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
          {saveConfig.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar & Publicar
        </button>
      </PageHeader>

      {/* Status card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-5 mb-6 flex items-center gap-4">
        <div className="p-3 rounded-xl bg-primary/10"><Bot size={24} className="text-primary" /></div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">{config.active ? 'Agente Ativo' : 'Agente Inativo'}</h3>
          <p className="text-sm text-muted-foreground">
            {config.active ? 'Respondendo automaticamente via WhatsApp' : 'Agente pausado'}
          </p>
        </div>
        <button onClick={() => setConfig(c => ({ ...c, active: !c.active }))}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${config.active ? 'bg-accent/10 text-accent' : 'bg-destructive/10 text-destructive'}`}>
          {config.active ? 'Ativo' : 'Inativo'}
        </button>
        <div className="flex items-center gap-2 text-sm">
          <Mic size={14} className="text-accent" />
          <span className="text-muted-foreground">Áudio: transcrição ativa</span>
        </div>
      </motion.div>

      {/* Media limitation notice */}
      <div className="glass rounded-xl p-4 mb-6 flex items-center gap-3 border-warning/20">
        <AlertCircle size={16} className="text-warning flex-shrink-0" />
        <p className="text-sm text-muted-foreground">Na v1, imagens e arquivos não são interpretados. O agente informa educadamente a limitação.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl bg-secondary w-fit overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === t.id ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6 space-y-5">
        {activeTab === 'prompt' && (
          <>
            <TextArea label="Prompt Principal" field="prompt" placeholder="Instruções principais do agente..." rows={8} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input label="Tom de Voz" field="voice_tone" placeholder="Ex: Profissional e empático" />
              <Input label="Energia" field="energy" placeholder="Ex: Moderada, Alta, Suave" />
            </div>
          </>
        )}
        {activeTab === 'behavior' && (
          <>
            <Input label="Palavras Proibidas (separadas por vírgula)" field="prohibited_words" placeholder="concorrente, barato..." />
            <TextArea label="Comportamento Fora do Escopo" field="out_of_scope" placeholder="O que fazer quando receber algo fora do escopo..." />
          </>
        )}
        {activeTab === 'knowledge' && (
          <>
            <TextArea label="FAQ" field="faq" placeholder="Perguntas e respostas frequentes..." rows={6} />
            <TextArea label="Base de Conhecimento" field="knowledge_base" placeholder="Informações sobre serviços, preços, procedimentos..." rows={6} />
            <TextArea label="Pitch Principal" field="pitch" placeholder="Como apresentar sua oferta..." />
            <TextArea label="Tratamento de Objeções" field="objections" placeholder="Como lidar com objeções comuns..." />
          </>
        )}
        {activeTab === 'messages' && (
          <>
            <TextArea label="Mensagem de Abertura" field="opening_message" placeholder="Primeira mensagem do agente..." />
            <TextArea label="Mensagem de Fallback" field="fallback_message" placeholder="Quando não entender..." />
          </>
        )}
        {activeTab === 'memory' && (
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Memória automática de cada contato — o agente lembra contexto, preferências e histórico.
            </p>
            {memories.length === 0 ? (
              <div className="text-center py-12">
                <Users size={48} className="mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">Nenhuma memória registrada ainda</p>
                <p className="text-xs text-muted-foreground mt-1">As memórias serão criadas automaticamente conforme o agente interage</p>
              </div>
            ) : (
              <div className="space-y-3">
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
          </div>
        )}
      </motion.div>
    </div>
  );
}
