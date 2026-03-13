import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Paperclip, Image, Link2, Send, Loader2, X, FileText, Globe } from 'lucide-react';
import { toast } from 'sonner';
import sixLogo from '@/assets/six-logo-dark.png';

// Types
interface Attachment {
  type: 'file' | 'image' | 'link';
  name: string;
  url?: string;
  storagePath?: string;
}

interface ChatMessage {
  role: 'ai' | 'user';
  content: string;
  attachments?: Attachment[];
}

// Hardcoded orchestrator questions
const QUESTIONS: string[] = [
  "Olá! 👋 Sou o orquestrador do SIX AI. Vou te fazer algumas perguntas sobre seu negócio e com suas respostas vou criar agentes de IA completos e personalizados para você.\n\nPara começar: **me conte tudo sobre seu negócio.** O que você faz, quem é seu cliente ideal, como você atende hoje?\n\nPode ser à vontade — quanto mais detalhe, melhor seus agentes ficam.\n\nVocê também pode anexar o link do seu Instagram, site, cardápio, tabela de preços ou qualquer arquivo que me ajude a entender sua marca.",
  "Perfeito! Agora me conta: **qual é a maior objeção que seus clientes têm antes de fechar?** E como você costuma responder quando isso acontece?\n\nSe tiver mais de uma objeção, pode listar todas!",
  "Última pergunta: **como você prefere que a IA se comunique com seus clientes?** Mais formal, descontraída, direta?\n\nE qual é o **resultado mais importante** que você quer alcançar com a automação?",
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'ai', content: QUESTIONS[0] },
  ]);
  const [currentStep, setCurrentStep] = useState(0);
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const userResponses = useRef<string[]>([]);
  const allAttachments = useRef<Attachment[]>([]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [inputText]);

  const uploadFile = async (file: File): Promise<Attachment | null> => {
    if (!user) return null;
    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('onboarding-files').upload(path, file);
      if (error) throw error;

      const { data: urlData } = supabase.storage.from('onboarding-files').getPublicUrl(path);
      const isImage = file.type.startsWith('image/');

      return {
        type: isImage ? 'image' : 'file',
        name: file.name,
        url: urlData.publicUrl,
        storagePath: path,
      };
    } catch (err) {
      console.error('Upload error:', err);
      toast.error(`Erro ao enviar ${file.name}`);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'file' | 'image') => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      const att = await uploadFile(file);
      if (att) setAttachments(prev => [...prev, att]);
    }
    e.target.value = '';
  };

  const addLink = () => {
    const url = prompt('Cole o link (Instagram, site, etc):');
    if (url && url.trim()) {
      setAttachments(prev => [...prev, { type: 'link', name: url.trim(), url: url.trim() }]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text && attachments.length === 0) return;
    if (isGenerating) return;

    // Add user message
    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    };
    setMessages(prev => [...prev, userMsg]);
    userResponses.current.push(text);
    allAttachments.current.push(...attachments);
    setInputText('');
    setAttachments([]);

    const nextStep = currentStep + 1;

    if (nextStep < QUESTIONS.length) {
      // Show next question after a short delay
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'ai', content: QUESTIONS[nextStep] }]);
        setCurrentStep(nextStep);
      }, 800);
    } else {
      // All questions answered — generate agents
      setCurrentStep(nextStep);
      setIsGenerating(true);

      try {
        // Separate attachments by type
        const links = allAttachments.current.filter(a => a.type === 'link').map(a => a.url!);
        const files = allAttachments.current.filter(a => a.type === 'file').map(a => a.url!);
        const images = allAttachments.current.filter(a => a.type === 'image').map(a => a.url!);

        const { data, error } = await supabase.functions.invoke('generate-agent-configs', {
          body: {
            free_text: userResponses.current.join('\n\n---\n\n'),
            links,
            files,
            images,
          },
        });

        if (error) throw error;

        setMessages(prev => [...prev, {
          role: 'ai',
          content: '✅ **Seus agentes foram criados com sucesso!**\n\nCriei 4 agentes personalizados para o seu negócio:\n\n🎯 **Atendente** — responde dúvidas e conversa com seus clientes\n📅 **Agendador** — cuida dos agendamentos\n🔄 **Follow-up** — recupera leads que esfriaram\n📊 **CRM** — analisa e move leads no funil\n\nRedirecionando para o painel...',
        }]);

        await refreshProfile();
        setTimeout(() => navigate('/app', { replace: true }), 3000);
      } catch (err) {
        console.error('Generation error:', err);
        setIsGenerating(false);
        toast.error('Erro ao gerar agentes. Tente novamente.');
        setMessages(prev => [...prev, {
          role: 'ai',
          content: '❌ Houve um erro ao gerar seus agentes. Por favor, tente enviar sua última resposta novamente.',
        }]);
        setCurrentStep(QUESTIONS.length - 1);
      }
    }
  }, [inputText, attachments, currentStep, isGenerating, navigate, refreshProfile]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const totalSteps = QUESTIONS.length;
  const isDone = currentStep >= totalSteps;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <img src={sixLogo} alt="SIX AI" className="h-8" />
          <div className="flex items-center gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  i < currentStep ? 'bg-primary' :
                  i === currentStep && !isDone ? 'bg-primary/50 animate-pulse' :
                  isDone ? 'bg-primary' :
                  'bg-muted'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {isDone ? 'Concluído' : `${currentStep + 1} de ${totalSteps}`}
          </span>
        </div>
      </div>

      {/* Subtitle */}
      <div className="flex-shrink-0 text-center py-3">
        <p className="text-sm text-muted-foreground">Conte sobre seu negócio — nossa IA vai configurar tudo</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="max-w-3xl mx-auto space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-card border border-border text-foreground rounded-bl-md'
                }`}>
                  {/* Message content with basic markdown bold */}
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {msg.content.split(/(\*\*.*?\*\*)/).map((part, j) =>
                      part.startsWith('**') && part.endsWith('**')
                        ? <strong key={j}>{part.slice(2, -2)}</strong>
                        : part
                    )}
                  </div>

                  {/* Attachment pills */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-border/30">
                      {msg.attachments.map((att, j) => (
                        <span
                          key={j}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                            msg.role === 'user'
                              ? 'bg-primary-foreground/20 text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {att.type === 'file' && <FileText size={12} />}
                          {att.type === 'image' && <Image size={12} />}
                          {att.type === 'link' && <Globe size={12} />}
                          <span className="max-w-[150px] truncate">{att.name}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Generating state */}
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 size={16} className="animate-spin text-primary" />
                  <span>Gerando seus agentes personalizados...</span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      {!isDone && (
        <div className="flex-shrink-0 border-t border-border px-4 py-3 bg-background">
          <div className="max-w-3xl mx-auto">
            {/* Attachment pills */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {attachments.map((att, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs"
                  >
                    {att.type === 'file' && <FileText size={12} />}
                    {att.type === 'image' && <Image size={12} />}
                    {att.type === 'link' && <Globe size={12} />}
                    <span className="max-w-[120px] truncate">{att.name}</span>
                    <button onClick={() => removeAttachment(i)} className="hover:text-destructive ml-0.5">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2">
              {/* Attachment buttons */}
              <div className="flex gap-1 pb-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Anexar arquivo (PDF, DOCX, XLSX)"
                >
                  <Paperclip size={18} />
                </button>
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Anexar foto"
                >
                  <Image size={18} />
                </button>
                <button
                  onClick={addLink}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Adicionar link (Instagram, site, etc)"
                >
                  <Link2 size={18} />
                </button>
              </div>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua resposta..."
                rows={1}
                className="flex-1 resize-none rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 max-h-40"
                disabled={isGenerating}
              />

              {/* Send button */}
              <button
                onClick={sendMessage}
                disabled={(!inputText.trim() && attachments.length === 0) || isGenerating || isUploading}
                className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors mb-0.5"
              >
                {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>

            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.xlsx,.doc,.xls,.csv,.txt"
              multiple
              onChange={e => handleFileSelect(e, 'file')}
              className="hidden"
            />
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={e => handleFileSelect(e, 'image')}
              className="hidden"
            />
          </div>
        </div>
      )}
    </div>
  );
}
