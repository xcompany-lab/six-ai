import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  CheckCircle2, MessageSquare, Bot, Calendar, Users,
  BarChart3, AlertTriangle, ArrowRight, Sparkles, Clock,
  Send, UserCheck, CalendarCheck, Database
} from 'lucide-react';
import { CyberIcon } from '@/components/ui/cyber-icon';
import { Input } from '@/components/ui/input';
import sixLogo from '@/assets/six-logo-hero.png';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
  })
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } }
};

const heroBullets = [
  'Atendimento automático no WhatsApp',
  'Agendamentos inteligentes sem secretária',
  'Follow-ups que recuperam pacientes esquecidos',
  'Organização total dos leads e consultas',
];

const learnings = [
  { icon: MessageSquare, color: 'cyber-cyan' as const, title: 'Transformar o WhatsApp em um sistema inteligente', desc: 'Sem precisar trocar de número ou aprender ferramentas complicadas.' },
  { icon: Clock, color: 'cyber-green' as const, title: 'Automatizar follow-ups', desc: 'Recuperando pacientes que normalmente seriam esquecidos.' },
  { icon: UserCheck, color: 'cyber-yellow' as const, title: 'Qualificar pacientes automaticamente', desc: 'Antes mesmo de você responder.' },
  { icon: BarChart3, color: 'cyber-magenta' as const, title: 'Organizar contatos em um CRM visual', desc: 'Sem planilhas e sem bagunça nas conversas.' },
  { icon: Sparkles, color: 'cyber-cyan' as const, title: 'Reduzir o tempo gasto com atendimento', desc: 'E focar apenas nos pacientes realmente interessados.' },
];

const specialties = [
  'Nutrição', 'Psicologia', 'Odontologia', 'Estética',
  'Harmonização facial', 'Clínicas médicas', 'Profissionais da saúde ou beleza',
];

const resultSteps = [
  { icon: Send, label: 'Paciente envia mensagem' },
  { icon: Bot, label: 'IA responde imediatamente' },
  { icon: UserCheck, label: 'Qualifica o interesse' },
  { icon: CalendarCheck, label: 'Sugere horários disponíveis' },
  { icon: Database, label: 'Registra tudo no CRM' },
];

function scrollToForm() {
  document.getElementById('formulario')?.scrollIntoView({ behavior: 'smooth' });
}

function formatWhatsApp(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function WebinarPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !whatsapp) return;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* NAV */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between h-14 px-4">
          <img src={sixLogo} alt="SIX AI" className="h-7" />
          <button onClick={scrollToForm} className="cyber-btn cyber-btn-primary">
            <span className="cyber-btn-inner !h-9 !px-4 !text-sm">Garantir vaga</span>
          </button>
        </div>
      </nav>

      {/* BG ORBS */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-[hsl(var(--glow-cyan)/0.08)] blur-[120px] animate-float-orb" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-[hsl(var(--glow-green)/0.06)] blur-[120px] animate-float-orb-2" />
      </div>

      {/* ══════ HERO ══════ */}
      <section className="pt-24 pb-16 px-4">
        <motion.div className="max-w-3xl mx-auto text-center" initial="hidden" animate="visible" variants={stagger}>
          <motion.p variants={fadeUp} custom={0} className="badge-gradient-brand mb-4">
            encontro gratuito online
          </motion.p>

          <motion.h1 variants={fadeUp} custom={1} className="text-2xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-5">
            O que está acontecendo com clínicas que usam{' '}
            <span className="text-gradient-brand">IA para atender, agendar e converter</span>{' '}
            pacientes pelo WhatsApp
          </motion.h1>

          <motion.p variants={fadeUp} custom={2} className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto mb-8">
            Veja ao vivo como profissionais estão automatizando atendimento, follow-up e agendamentos —
            sem secretária, sem CRM complicado e sem precisar entender tecnologia.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="flex flex-col items-start gap-2 max-w-xs mx-auto mb-8">
            {heroBullets.map((b) => (
              <div key={b} className="flex items-center gap-2 text-sm text-foreground/90">
                <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                <span>{b}</span>
              </div>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} custom={4} className="flex flex-col items-center gap-2">
            <button onClick={scrollToForm} className="cyber-btn cyber-btn-primary">
              <span className="cyber-btn-inner">Quero participar do encontro gratuito</span>
            </button>
            <span className="text-xs text-muted-foreground">Leva menos de 30 segundos para garantir sua vaga.</span>
          </motion.div>
        </motion.div>
      </section>

      {/* ══════ PROBLEMA ══════ */}
      <section className="py-16 px-4">
        <motion.div className="max-w-2xl mx-auto" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={stagger}>
          <motion.h2 variants={fadeUp} custom={0} className="text-xl sm:text-3xl font-bold text-center mb-6">
            A maioria das clínicas <span className="text-destructive">perde pacientes</span> todos os dias…
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-center text-muted-foreground mb-6">E nem percebe.</motion.p>

          <motion.div variants={fadeUp} custom={2} className="glass rounded-2xl p-6 sm:p-8 space-y-4 text-sm text-muted-foreground">
            <p>Porque acontece no lugar mais comum de todos: <span className="text-foreground font-semibold">o WhatsApp.</span></p>
            <div className="space-y-1">
              <p>Mensagens ficam sem resposta.</p>
              <p>Leads esquecidos.</p>
              <p>Follow-ups que nunca acontecem.</p>
              <p>Agenda com horários vagos.</p>
            </div>
            <div className="border-t border-border/50 pt-4">
              <p className="text-foreground font-medium">Enquanto isso…</p>
              <p>Outras clínicas estão usando <span className="text-gradient-brand font-semibold">IA para transformar conversas em agendamentos</span> automaticamente.</p>
              <p className="mt-2 text-foreground">E é exatamente isso que você vai ver nesse encontro.</p>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ══════ O QUE VOCÊ VAI APRENDER ══════ */}
      <section className="py-16 px-4 bg-gradient-surface">
        <motion.div className="max-w-3xl mx-auto" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={stagger}>
          <motion.h2 variants={fadeUp} custom={0} className="text-xl sm:text-3xl font-bold text-center mb-3">
            O que você verá neste encontro
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-center text-muted-foreground text-sm mb-10">
            Durante esse encontro ao vivo você vai descobrir:
          </motion.p>

          <div className="space-y-6">
            {learnings.map((item, i) => (
              <motion.div key={item.title} variants={fadeUp} custom={i + 2} className="flex gap-4 items-start">
                <CyberIcon icon={item.icon} variant={item.color} size="md" shape="rounded" />
                <div>
                  <h3 className="font-semibold text-sm sm:text-base text-foreground">{`${i + 1}. ${item.title}`}</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ══════ PARA QUEM É ══════ */}
      <section className="py-16 px-4">
        <motion.div className="max-w-2xl mx-auto text-center" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={stagger}>
          <motion.h2 variants={fadeUp} custom={0} className="text-xl sm:text-3xl font-bold mb-3">
            Este encontro é para profissionais que querem{' '}
            <span className="text-gradient-brand">organizar e escalar</span> seu atendimento
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-muted-foreground text-sm mb-8">
            Especialmente se você trabalha com:
          </motion.p>

          <motion.div variants={fadeUp} custom={2} className="flex flex-wrap justify-center gap-2">
            {specialties.map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5 glass rounded-full px-4 py-2 text-sm text-foreground/90">
                <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                {s}
              </span>
            ))}
          </motion.div>

          <motion.p variants={fadeUp} custom={3} className="text-muted-foreground text-xs mt-6">
            Se você usa WhatsApp para atender pacientes, esse encontro foi feito para você.
          </motion.p>
        </motion.div>
      </section>

      {/* ══════ RESULTADO ══════ */}
      <section className="py-16 px-4 bg-gradient-surface">
        <motion.div className="max-w-2xl mx-auto text-center" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={stagger}>
          <motion.h2 variants={fadeUp} custom={0} className="text-xl sm:text-3xl font-bold mb-8">
            Imagine seu WhatsApp funcionando <span className="text-gradient-brand">assim:</span>
          </motion.h2>

          <div className="flex flex-col items-center gap-3">
            {resultSteps.map((step, i) => (
              <motion.div key={step.label} variants={fadeUp} custom={i + 1}>
                <div className="glass rounded-xl px-5 py-3 flex items-center gap-3 min-w-[260px]">
                  <step.icon className="h-5 w-5 text-accent shrink-0" />
                  <span className="text-sm font-medium text-foreground">{step.label}</span>
                </div>
                {i < resultSteps.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground mx-auto mt-2 mb-1 rotate-90" />
                )}
              </motion.div>
            ))}
          </div>

          <motion.div variants={fadeUp} custom={7} className="mt-8 space-y-1 text-sm text-muted-foreground">
            <p>Sem planilhas.</p>
            <p>Sem esquecer ninguém.</p>
            <p className="text-foreground font-semibold">Sem perder pacientes.</p>
          </motion.div>
        </motion.div>
      </section>

      {/* ══════ SOBRE O ENCONTRO ══════ */}
      <section className="py-16 px-4">
        <motion.div className="max-w-2xl mx-auto text-center" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={stagger}>
          <motion.h2 variants={fadeUp} custom={0} className="text-xl sm:text-3xl font-bold mb-6">
            Encontro gratuito online
          </motion.h2>

          <motion.div variants={fadeUp} custom={1} className="glass rounded-2xl p-6 space-y-3 text-left text-sm">
            <p className="text-muted-foreground">Durante esse encontro você verá:</p>
            <div className="space-y-2">
              {['demonstração real da tecnologia', 'exemplos práticos de automação', 'como clínicas estão aplicando isso hoje'].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                  <span className="text-foreground">{item}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border/50 pt-3 space-y-1 text-muted-foreground">
              <p className="font-semibold text-foreground">Sem teoria.</p>
              <p className="font-semibold text-foreground">Sem complicação.</p>
              <p>Apenas como funciona na prática.</p>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ══════ CTA + FORMULÁRIO ══════ */}
      <section id="formulario" className="py-16 px-4 bg-gradient-surface">
        <motion.div className="max-w-md mx-auto text-center" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={stagger}>
          <motion.h2 variants={fadeUp} custom={0} className="text-xl sm:text-3xl font-bold mb-2">
            Garanta sua vaga no encontro
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-muted-foreground text-sm mb-8">
            As vagas são limitadas para manter a qualidade da apresentação.
          </motion.p>

          {submitted ? (
            <motion.div variants={fadeUp} custom={2} className="glass rounded-2xl p-8 text-center space-y-4">
              <div className="h-16 w-16 mx-auto rounded-full bg-accent/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Inscrição confirmada!</h3>
              <p className="text-sm text-muted-foreground">Você receberá o link de acesso e lembretes no seu WhatsApp.</p>
            </motion.div>
          ) : (
            <motion.form variants={fadeUp} custom={2} onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Nome</label>
                <Input placeholder="Seu nome completo" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <Input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">WhatsApp</label>
                <Input
                  placeholder="(11) 99999-9999"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(formatWhatsApp(e.target.value))}
                  required
                />
              </div>
              <button type="submit" className="cyber-btn cyber-btn-primary w-full">
                <span className="cyber-btn-inner w-full">Quero garantir minha vaga</span>
              </button>
              <p className="text-center text-xs text-muted-foreground">Preencha seus dados acima para participar.</p>
            </motion.form>
          )}
        </motion.div>
      </section>

      {/* ══════ URGÊNCIA ══════ */}
      <section className="py-16 px-4">
        <motion.div className="max-w-md mx-auto text-center" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={stagger}>
          <motion.div variants={fadeUp} custom={0} className="glass rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-bold text-sm">Importante</span>
            </div>
            <p className="text-sm text-muted-foreground">Após preencher sua inscrição você receberá:</p>
            <div className="space-y-2 text-left text-sm mx-auto max-w-xs">
              {['Link de acesso ao encontro', 'Lembretes antes da apresentação', 'Materiais exclusivos'].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                  <span className="text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} custom={1} className="mt-8 space-y-2">
            <button onClick={scrollToForm} className="cyber-btn cyber-btn-primary">
              <span className="cyber-btn-inner">Reserve sua vaga agora</span>
            </button>
            <p className="text-xs text-muted-foreground">Leva menos de 30 segundos.</p>
          </motion.div>
        </motion.div>
      </section>

      {/* FOOTER MINIMAL */}
      <footer className="py-6 border-t border-border/30 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} SIX AI — Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
