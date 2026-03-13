import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Paperclip, Image, Link2, Send, Loader2, X, FileText, Globe, Check, Mic, Square, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import sixLogoHero from '@/assets/six-logo-hero.png';

// Types
interface Attachment {
  type: 'file' | 'image' | 'link';
  name: string;
  url?: string;
  storagePath?: string;
}

interface ServicePrice {
  name: string;
  price: string;
  notes: string;
}

const PAYMENT_METHODS = ['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Boleto', 'Transferência'];


// Hardcoded orchestrator questions
const QUESTIONS: { label: string; headline: string; subtitle?: string }[] = [
  {
    label: 'Sobre o negócio',
    headline: "Sou o orquestrador do SIX AI.\n\n**Me conte tudo sobre o seu negócio...**",
    subtitle: "O que você faz, quem é seu cliente ideal, como você atende hoje?\n\nQuanto mais detalhe, melhor seus agentes ficam.\n\nAnexe o link do seu Instagram, site, cardápio ou qualquer arquivo que ajude.",
  },
  {
    label: 'Objeções',
    headline: "**Qual é a maior objeção que seus clientes têm antes de fechar?**",
    subtitle: "E como você costuma responder quando isso acontece?\n\nSe tiver mais de uma objeção, pode listar todas!",
  },
  {
    label: 'Tom e objetivo',
    headline: "**Como você prefere que a IA se comunique com seus clientes?**",
    subtitle: "Mais formal, descontraída, direta?\n\nE qual é o resultado mais importante que você quer alcançar com a automação?",
  },
];

const LOADING_STAGES = [
  'Analisando suas respostas...',
  'Construindo perfil do negócio...',
  'Gerando seus 4 agentes de IA...',
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkInputValue, setLinkInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const userResponses = useRef<string[]>([]);
  const allAttachments = useRef<Attachment[]>([]);

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
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('onboarding-files').upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('onboarding-files').getPublicUrl(path);
      const isImage = file.type.startsWith('image/');
      return { type: isImage ? 'image' : 'file', name: file.name, url: urlData.publicUrl, storagePath: path };
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

  const confirmLink = () => {
    const url = linkInputValue.trim();
    if (url) {
      setAttachments(prev => [...prev, { type: 'link', name: url, url }]);
    }
    setLinkInputValue('');
    setShowLinkInput(false);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      // Gradient line
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, 'hsl(199, 89%, 48%)');
      gradient.addColorStop(0.5, 'hsl(185, 80%, 55%)');
      gradient.addColorStop(1, 'hsl(160, 84%, 50%)');

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = gradient;
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(width, height / 2);
      ctx.stroke();
    };

    draw();
  }, []);

  const stopWaveform = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      stopWaveform();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Setup audio analyser for waveform
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        audioContext.close();
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        setIsTranscribing(true);
        try {
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve, reject) => {
            reader.onloadend = () => {
              const result = reader.result as string;
              resolve(result.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          const { data, error } = await supabase.functions.invoke('transcribe-onboarding-audio', {
            body: { audio_base64: base64 },
          });

          if (error) throw error;
          if (data?.text) {
            setInputText(prev => prev ? `${prev} ${data.text}` : data.text);
          }
        } catch (err) {
          console.error('Transcription error:', err);
          toast.error('Erro ao transcrever áudio. Tente novamente.');
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start waveform after a tick so canvas is rendered
      setTimeout(() => drawWaveform(), 50);
    } catch (err) {
      console.error('Mic access error:', err);
      toast.error('Não foi possível acessar o microfone.');
    }
  };

  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text && attachments.length === 0) return;
    if (isGenerating) return;

    userResponses.current.push(text);
    allAttachments.current.push(...attachments);
    setCompletedSteps(prev => [...prev, currentStep]);
    setInputText('');
    setAttachments([]);

    const nextStep = currentStep + 1;

    if (nextStep < QUESTIONS.length) {
      setCurrentStep(nextStep);
    } else {
      setCurrentStep(nextStep);
      setIsGenerating(true);
      setLoadingStage(0);

      // Animate loading stages
      const stageTimer1 = setTimeout(() => setLoadingStage(1), 3000);
      const stageTimer2 = setTimeout(() => setLoadingStage(2), 6000);

      try {
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
        clearTimeout(stageTimer1);
        clearTimeout(stageTimer2);
        await refreshProfile();
        toast.success('4 agentes criados com sucesso! Seu atendente está pronto.');
        setTimeout(() => navigate('/app/atendente-ia', { replace: true }), 2000);
      } catch (err) {
        console.error('Generation error:', err);
        clearTimeout(stageTimer1);
        clearTimeout(stageTimer2);
        setIsGenerating(false);
        toast.error('Erro ao gerar agentes. Tente novamente.');
        setCurrentStep(QUESTIONS.length - 1);
        setCompletedSteps(prev => prev.filter(s => s !== QUESTIONS.length - 1));
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

  const renderMarkdown = (text: string | undefined) =>
    (text ?? '').split(/(\*\*.*?\*\*)/).map((part, j) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={j} className="text-foreground font-extrabold">{part.slice(2, -2)}</strong>
        : part
    );

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-4 py-8">
      {/* Animated gradient background */}
      <div className="fixed inset-0 bg-background" />
      <div
        className="fixed inset-0 opacity-[0.12] animate-gradient-shift"
        style={{
          background: 'radial-gradient(ellipse at 20% 50%, hsl(199 89% 48%), transparent 60%), radial-gradient(ellipse at 80% 50%, hsl(160 84% 50%), transparent 60%), radial-gradient(ellipse at 50% 100%, hsl(185 80% 55%), transparent 50%)',
          backgroundSize: '400% 400%',
        }}
      />

      {/* Floating orbs */}
      <div className="fixed top-[15%] left-[10%] w-[500px] h-[500px] rounded-full opacity-[0.06] blur-3xl animate-float-orb"
        style={{ background: 'radial-gradient(circle, hsl(199 89% 48%), transparent 70%)' }}
      />
      <div className="fixed bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full opacity-[0.05] blur-3xl animate-float-orb-2"
        style={{ background: 'radial-gradient(circle, hsl(160 84% 50%), transparent 70%)' }}
      />
      <div className="fixed top-[60%] left-[55%] w-[350px] h-[350px] rounded-full opacity-[0.04] blur-3xl animate-float-orb"
        style={{ background: 'radial-gradient(circle, hsl(185 80% 55%), transparent 70%)', animationDelay: '4s' }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center gap-8">
        {/* Logo */}
        <motion.img
          src={sixLogoHero}
          alt="SIX AI"
          className="h-14 md:h-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        />

        {/* Progress dots */}
        <div className="flex items-center gap-3">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className={`w-2 h-2 rounded-full transition-all duration-500 ${
                  completedSteps.includes(i) ? 'bg-accent w-2.5 h-2.5' :
                  i === currentStep && !isDone ? 'bg-primary animate-pulse w-3 h-3' :
                  isDone ? 'bg-accent w-2.5 h-2.5' :
                  'bg-muted-foreground/30'
                }`}
              />
              {i < totalSteps - 1 && (
                <div className={`w-8 h-px transition-colors duration-500 ${
                  completedSteps.includes(i) ? 'bg-accent/50' : 'bg-border'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Completed steps badges */}
        {completedSteps.length > 0 && !isDone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-wrap justify-center gap-2"
          >
            {completedSteps.map(step => (
              <span key={step} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-medium">
                <Check size={12} />
                {QUESTIONS[step].label}
              </span>
            ))}
          </motion.div>
        )}

        {/* Question */}
        <AnimatePresence mode="wait">
          {!isDone && !isGenerating && (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-relaxed whitespace-pre-wrap text-gradient-glow">
                {renderMarkdown(QUESTIONS[currentStep].headline)}
              </h1>
              {QUESTIONS[currentStep].subtitle && (
                <p className="mt-6 text-base md:text-lg text-muted-foreground whitespace-pre-wrap leading-relaxed max-w-2xl mx-auto">
                  {QUESTIONS[currentStep].subtitle}
                </p>
              )}
            </motion.div>
          )}

          {isGenerating && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center flex flex-col items-center gap-6"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center">
                <Loader2 size={28} className="animate-spin text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3">Criando seus agentes...</h2>
                <div className="flex flex-col gap-2">
                  {LOADING_STAGES.map((stage, i) => (
                    <motion.p
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: loadingStage >= i ? 1 : 0.3, x: 0 }}
                      transition={{ duration: 0.4, delay: i === loadingStage ? 0.1 : 0 }}
                      className={`text-sm flex items-center gap-2 justify-center ${loadingStage >= i ? 'text-foreground' : 'text-muted-foreground/40'}`}
                    >
                      {loadingStage > i ? (
                        <Check size={14} className="text-accent" />
                      ) : loadingStage === i ? (
                        <Loader2 size={14} className="animate-spin text-primary" />
                      ) : (
                        <span className="w-3.5" />
                      )}
                      {stage}
                    </motion.p>
                  ))}
                </div>
              </div>
              {/* Indeterminate progress bar */}
              <div className="w-48 h-1 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-brand"
                  initial={{ x: '-100%', width: '40%' }}
                  animate={{ x: '250%' }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
            </motion.div>
          )}

          {isDone && !isGenerating && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center">
                <Check size={28} className="text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">Agentes criados com sucesso!</h2>
                <p className="text-muted-foreground">Redirecionando para o painel...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input container — Claude style */}
        {!isDone && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full"
          >
            <div className="glass-strong rounded-2xl p-3 shadow-lg border-border/50 relative overflow-hidden">
              {/* Subtle gradient border effect */}
              <div className="absolute inset-0 rounded-2xl opacity-20 pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, hsl(199 89% 48% / 0.1), transparent 40%, hsl(160 84% 50% / 0.1))',
                }}
              />

              {/* Attachment pills */}
              {(attachments.length > 0 || showLinkInput) && (
                <div className="flex flex-wrap gap-1.5 mb-2 px-1 relative z-10">
                  {attachments.map((att, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs">
                      {att.type === 'file' && <FileText size={12} />}
                      {att.type === 'image' && <Image size={12} />}
                      {att.type === 'link' && <Globe size={12} />}
                      <span className="max-w-[120px] truncate">{att.name}</span>
                      <button onClick={() => removeAttachment(i)} className="hover:text-destructive ml-0.5">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {showLinkInput && (
                    <div className="flex items-center gap-1 w-full">
                      <input
                        type="url"
                        value={linkInputValue}
                        onChange={e => setLinkInputValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') { e.preventDefault(); confirmLink(); }
                          if (e.key === 'Escape') { setLinkInputValue(''); setShowLinkInput(false); }
                        }}
                        placeholder="Cole o link (Instagram, site, etc)"
                        autoFocus
                        className="flex-1 bg-muted rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      <button onClick={confirmLink} className="p-1.5 rounded-md text-accent hover:bg-muted/50"><Check size={14} /></button>
                      <button onClick={() => { setLinkInputValue(''); setShowLinkInput(false); }} className="p-1.5 rounded-md text-muted-foreground hover:bg-muted/50"><X size={14} /></button>
                    </div>
                  )}
                </div>
              )}

              {/* Textarea or Waveform */}
              {isRecording ? (
                <div className="relative z-10 flex items-center gap-3 px-2 py-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse shrink-0" />
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={60}
                    className="w-full h-[60px] rounded-lg"
                  />
                </div>
              ) : (
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isTranscribing ? "Transcrevendo áudio..." : "Digite sua resposta ou use o microfone..."}
                  rows={3}
                  className="w-full resize-none bg-transparent px-2 py-2 text-base text-foreground placeholder:text-muted-foreground focus:outline-none max-h-48 relative z-10"
                  disabled={isGenerating || isTranscribing}
                />
              )}

              {/* Bottom bar: attachment buttons + send */}
              <div className="flex items-center justify-between pt-1 px-1 relative z-10">
                <div className="flex gap-0.5">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    title="Anexar arquivo"
                  >
                    <Paperclip size={18} />
                  </button>
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    title="Anexar foto"
                  >
                    <Image size={18} />
                  </button>
                  <button
                    onClick={() => setShowLinkInput(true)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    title="Adicionar link"
                  >
                    <Link2 size={18} />
                  </button>
                  <button
                    onClick={toggleRecording}
                    disabled={isTranscribing || isGenerating}
                    className={`p-2 rounded-lg transition-colors ${
                      isRecording
                        ? 'text-destructive bg-destructive/10 animate-pulse'
                        : isTranscribing
                        ? 'text-muted-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                    title={isRecording ? 'Parar gravação' : isTranscribing ? 'Transcrevendo...' : 'Gravar áudio'}
                  >
                    {isTranscribing ? <Loader2 size={18} className="animate-spin" /> : isRecording ? <Square size={18} /> : <Mic size={18} />}
                  </button>
                </div>

                <button
                  onClick={sendMessage}
                  disabled={(!inputText.trim() && attachments.length === 0) || isGenerating || isUploading}
                  className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
            </div>

            <p className="text-center text-xs text-muted-foreground/50 mt-3">
              {isRecording ? '🔴 Gravando... clique no botão para parar' : isTranscribing ? '⏳ Transcrevendo áudio...' : `${currentStep + 1} de ${totalSteps} · Enter para enviar · 🎙 ou use o microfone`}
            </p>
          </motion.div>
        )}
      </div>

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept=".pdf,.docx,.xlsx,.doc,.xls,.csv,.txt" multiple onChange={e => handleFileSelect(e, 'file')} className="hidden" />
      <input ref={imageInputRef} type="file" accept="image/*" multiple onChange={e => handleFileSelect(e, 'image')} className="hidden" />
    </div>
  );
}
