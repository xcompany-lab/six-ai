import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';
import { Bot, Save, MessageSquare, Brain, Shield, BookOpen, Mic, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AIAgentPage() {
  const [config, setConfig] = useState({
    prompt: 'Você é um assistente inteligente da clínica. Responda de forma profissional e acolhedora...',
    voiceTone: 'Profissional e empático',
    energy: 'Moderada',
    prohibitedWords: 'concorrente, barato, desconto',
    fallbackMessage: 'Desculpe, não entendi bem. Posso te ajudar de outra forma?',
    openingMessage: 'Olá! 👋 Que bom ter você aqui. Como posso ajudar?',
    outOfScope: 'Vou encaminhar sua dúvida para nossa equipe. Em breve retornamos!',
    faq: '',
    knowledgeBase: '',
    pitch: '',
    objections: '',
  });

  const tabs = [
    { id: 'prompt', label: 'Prompt', icon: Brain },
    { id: 'behavior', label: 'Comportamento', icon: Shield },
    { id: 'knowledge', label: 'Conhecimento', icon: BookOpen },
    { id: 'messages', label: 'Mensagens', icon: MessageSquare },
  ];

  const [activeTab, setActiveTab] = useState('prompt');

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

  return (
    <div>
      <PageHeader title="Atendente IA" subtitle="Configure seu agente inteligente de atendimento">
        <button onClick={() => toast.success('Configurações salvas!')} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-brand text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
          <Save size={16} /> Salvar & Publicar
        </button>
      </PageHeader>

      {/* Status card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-5 mb-6 flex items-center gap-4">
        <div className="p-3 rounded-xl bg-primary/10"><Bot size={24} className="text-primary" /></div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">Agente Ativo</h3>
          <p className="text-sm text-muted-foreground">Respondendo automaticamente via WhatsApp</p>
        </div>
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
      <div className="flex gap-1 mb-6 p-1 rounded-xl bg-secondary w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === t.id ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6 space-y-5">
        {activeTab === 'prompt' && (
          <>
            <TextArea label="Prompt Principal" field="prompt" placeholder="Instruções principais do agente..." rows={8} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input label="Tom de Voz" field="voiceTone" placeholder="Ex: Profissional e empático" />
              <Input label="Energia" field="energy" placeholder="Ex: Moderada, Alta, Suave" />
            </div>
          </>
        )}
        {activeTab === 'behavior' && (
          <>
            <Input label="Palavras Proibidas (separadas por vírgula)" field="prohibitedWords" placeholder="concorrente, barato..." />
            <TextArea label="Comportamento Fora do Escopo" field="outOfScope" placeholder="O que fazer quando receber algo fora do escopo..." />
          </>
        )}
        {activeTab === 'knowledge' && (
          <>
            <TextArea label="FAQ" field="faq" placeholder="Perguntas e respostas frequentes..." rows={6} />
            <TextArea label="Base de Conhecimento" field="knowledgeBase" placeholder="Informações sobre serviços, preços, procedimentos..." rows={6} />
            <TextArea label="Pitch Principal" field="pitch" placeholder="Como apresentar sua oferta..." />
            <TextArea label="Tratamento de Objeções" field="objections" placeholder="Como lidar com objeções comuns..." />
          </>
        )}
        {activeTab === 'messages' && (
          <>
            <TextArea label="Mensagem de Abertura" field="openingMessage" placeholder="Primeira mensagem do agente..." />
            <TextArea label="Mensagem de Fallback" field="fallbackMessage" placeholder="Quando não entender..." />
          </>
        )}
      </motion.div>
    </div>
  );
}
