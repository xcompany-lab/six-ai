import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, Calendar, MessageSquare, BarChart3, Users, Zap, 
  ArrowRight, CheckCircle2, Sparkles, TrendingUp, Clock,
  Shield, Star, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PLAN_FEATURES } from '@/types';

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

export default function HomePage() {
  const navigate = useNavigate();
  const trialUrl = PLAN_FEATURES.trial.checkoutUrl;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* NAV */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold tracking-tight">SIX <span className="text-primary">AI</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#como-funciona" className="hover:text-foreground transition-colors">Como Funciona</a>
            <a href="#beneficios" className="hover:text-foreground transition-colors">Benefícios</a>
            <a href="#planos" className="hover:text-foreground transition-colors">Planos</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>Login</Button>
            <Button size="sm" className="bg-gradient-brand text-primary-foreground" asChild>
              <a href={trialUrl} target="_blank" rel="noopener noreferrer">Teste Grátis</a>
            </Button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-32 px-4 sm:px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium mb-8">
              <Zap className="h-4 w-4" /> Smart Interaction eXperience
            </motion.div>

            <motion.h1 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] mb-6">
              Transforme seu WhatsApp em um{' '}
              <span className="text-gradient-brand">sistema automático de vendas</span>{' '}
              com IA
            </motion.h1>

            <motion.p variants={fadeUp} custom={2} className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Atenda leads automaticamente, agende consultas, recupere contatos perdidos e aumente seu faturamento com o SIX AI.
            </motion.p>

            {/* Bullet points */}
            <motion.div variants={fadeUp} custom={3} className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground mb-10">
              {[
                'Atendente com Inteligência Artificial',
                'Agendamentos automáticos',
                'Follow-up inteligente',
                'CRM visual integrado',
                'Insights para aumentar vendas'
              ].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-accent" /> {item}
                </span>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div variants={fadeUp} custom={4} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="bg-gradient-brand text-primary-foreground px-8 h-12 text-base glow-blue" asChild>
                <a href={trialUrl} target="_blank" rel="noopener noreferrer">
                  Começar Teste Gratuito de 5 Dias <ArrowRight className="ml-1 h-5 w-5" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="h-12 text-base" asChild>
                <a href="#como-funciona">Ver como funciona</a>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="py-20 lg:py-28 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={stagger} className="text-center">
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold mb-8">
              A maioria dos negócios <span className="text-destructive">perde dinheiro</span> no WhatsApp todos os dias
            </motion.h2>
            <motion.div variants={fadeUp} custom={1} className="space-y-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              <p>Leads que param de responder.<br />Agendamentos esquecidos.<br />Follow-ups que nunca acontecem.</p>
              <p>Enquanto isso, oportunidades de venda simplesmente <strong className="text-foreground">desaparecem</strong>.</p>
              <p>Sem um sistema organizado, o WhatsApp vira apenas uma caixa de mensagens caótica.</p>
              <p className="text-foreground font-medium">E cada conversa perdida pode significar uma venda que nunca aconteceu.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* SOLUTION */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 bg-gradient-surface">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-center mb-6">
              O SIX AI transforma conversas em{' '}
              <span className="text-gradient-brand">processos automáticos de venda</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-lg text-muted-foreground text-center max-w-3xl mx-auto mb-12">
              O SIX AI é uma plataforma que conecta seu WhatsApp a uma inteligência artificial capaz de:
            </motion.p>
            <motion.div variants={fadeUp} custom={2} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {[
                { icon: Bot, label: 'Atender leads automaticamente' },
                { icon: Calendar, label: 'Agendar consultas' },
                { icon: MessageSquare, label: 'Fazer follow-ups inteligentes' },
                { icon: Users, label: 'Organizar contatos em CRM visual' },
                { icon: BarChart3, label: 'Gerar insights para vender mais' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3 p-4 rounded-xl glass">
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="como-funciona" className="py-20 lg:py-28 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-center mb-16">
              Configure em <span className="text-gradient-brand">minutos</span>
            </motion.h2>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: '01', title: 'Conecte seu WhatsApp', desc: 'Escaneie o QR Code e conecte seu número ao sistema.', icon: MessageSquare },
                { step: '02', title: 'Treine seu Atendente IA', desc: 'Defina seu pitch, suas respostas e o tom da conversa.', icon: Bot },
                { step: '03', title: 'Deixe a IA trabalhar', desc: 'Ela responde leads, agenda horários e faz follow-ups automaticamente.', icon: Zap },
              ].map(({ step, title, desc, icon: Icon }, i) => (
                <motion.div key={step} variants={fadeUp} custom={i} className="relative text-center">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-brand mb-6">
                    <Icon className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <div className="absolute -top-2 -right-2 md:right-auto md:-left-2 text-xs font-mono font-bold text-primary bg-primary/10 rounded-full h-8 w-8 flex items-center justify-center">
                    {step}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{title}</h3>
                  <p className="text-muted-foreground">{desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* BENEFITS */}
      <section id="beneficios" className="py-20 lg:py-28 px-4 sm:px-6 bg-gradient-surface">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-center mb-16">
              Automação inteligente para <span className="text-gradient-brand">vender mais</span>
            </motion.h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Bot, title: 'Atendente IA 24h', desc: 'Responda leads automaticamente mesmo quando você estiver offline.' },
                { icon: Calendar, title: 'Agendamentos automáticos', desc: 'A IA propõe horários e confirma compromissos automaticamente.' },
                { icon: MessageSquare, title: 'Follow-up inteligente', desc: 'Recupere leads que pararam de responder.' },
                { icon: Users, title: 'CRM visual', desc: 'Organize todos os seus contatos em um funil de vendas simples.' },
                { icon: TrendingUp, title: 'Insights de vendas', desc: 'A IA analisa suas conversas e sugere melhorias para aumentar conversão.' },
                { icon: Clock, title: 'Economia de tempo', desc: 'Automatize tarefas repetitivas e foque no que realmente importa.' },
              ].map(({ icon: Icon, title, desc }, i) => (
                <motion.div key={title} variants={fadeUp} custom={i} className="p-6 rounded-2xl glass hover:border-primary/30 transition-colors group">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* INSIGHT SALES SYSTEM */}
      <section className="py-20 lg:py-28 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={stagger} className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/5 text-accent text-xs font-medium mb-6">
                <Sparkles className="h-3.5 w-3.5" /> Exclusivo do Plano Pro
              </motion.div>
              <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold mb-6">
                Uma IA estratégica <span className="text-gradient-brand">analisando seu negócio</span>
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="text-muted-foreground mb-6">
                O Insight Sales System monitora todas as interações e identifica:
              </motion.p>
              <motion.ul variants={fadeUp} custom={3} className="space-y-3">
                {[
                  'Leads que precisam de follow-up',
                  'Gargalos no processo de vendas',
                  'Conversas com alta probabilidade de fechamento',
                  'Oportunidades de reativação de clientes',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <ChevronRight className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </motion.ul>
              <motion.p variants={fadeUp} custom={4} className="text-foreground font-medium mt-6">
                Em vez de apenas atender mensagens, o SIX AI ajuda você a <span className="text-gradient-brand">vender mais</span>.
              </motion.p>
            </div>
            <motion.div variants={fadeUp} custom={2} className="relative">
              <div className="rounded-2xl glass-strong p-6 space-y-4">
                {[
                  { label: 'Leads aguardando follow-up', value: '12', color: 'text-warning' },
                  { label: 'Probabilidade de fechamento alta', value: '8', color: 'text-accent' },
                  { label: 'Oportunidades de reativação', value: '23', color: 'text-primary' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between p-4 rounded-xl bg-background/50">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className={`text-2xl font-bold ${color}`}>{value}</span>
                  </div>
                ))}
              </div>
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/20 to-accent/20 blur-xl -z-10" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* PLANS */}
      <section id="planos" className="py-20 lg:py-28 px-4 sm:px-6 bg-gradient-surface">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-center mb-4">
              Escolha o plano ideal para seu negócio
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground text-center mb-16">
              Comece gratuitamente e escale conforme sua necessidade
            </motion.p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {([
                {
                  key: 'trial' as const,
                  name: 'Trial',
                  price: 'Grátis',
                  period: '5 dias',
                  desc: 'Teste todas as funcionalidades da plataforma.',
                  features: ['Atendente IA', 'Automação de atendimento', 'CRM', 'Integrações completas'],
                  cta: 'Teste gratuito por 5 dias',
                  highlighted: false,
                  badge: null,
                },
                {
                  key: 'start' as const,
                  name: 'Start',
                  price: 'R$49',
                  period: '/mês',
                  desc: 'Ideal para quem está começando.',
                  features: ['Atendente IA', 'Conexão WhatsApp', 'Agenda integrada', 'Organização básica de leads'],
                  cta: 'Assinar Start',
                  highlighted: false,
                  badge: null,
                },
                {
                  key: 'plus' as const,
                  name: 'Plus',
                  price: 'R$97',
                  period: '/mês',
                  desc: 'Automação completa de atendimento.',
                  features: ['Tudo do Start', 'Agendamentos automáticos', 'Google Agenda', 'Lembretes e confirmações'],
                  cta: 'Assinar Plus',
                  highlighted: false,
                  badge: null,
                },
                {
                  key: 'pro' as const,
                  name: 'Pro',
                  price: 'R$197',
                  period: '/mês',
                  desc: 'Sistema completo de automação de vendas.',
                  features: ['Tudo do Plus', 'Follow-up automático', 'Ativação de base de leads', 'CRM Kanban completo', 'Insight Sales System'],
                  cta: 'Assinar Pro',
                  highlighted: true,
                  badge: 'Mais escolhido',
                },
              ]).map((plan, i) => (
                <motion.div
                  key={plan.key}
                  variants={fadeUp}
                  custom={i}
                  className={`relative flex flex-col rounded-2xl p-6 ${
                    plan.highlighted
                      ? 'border-2 border-primary bg-primary/5 shadow-glow-md'
                      : 'glass'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-brand text-primary-foreground text-xs font-bold">
                      {plan.badge}
                    </div>
                  )}
                  <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">{plan.desc}</p>
                  <ul className="space-y-2 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                        <span className="text-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={plan.highlighted ? 'bg-gradient-brand text-primary-foreground w-full' : 'w-full'}
                    variant={plan.highlighted ? 'default' : 'outline'}
                    asChild
                  >
                    <a href={PLAN_FEATURES[plan.key].checkoutUrl} target="_blank" rel="noopener noreferrer">
                      {plan.cta}
                    </a>
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-20 lg:py-28 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold mb-8">
              Profissionais já estão <span className="text-gradient-brand">automatizando</span> seu atendimento
            </motion.h2>
            <motion.div variants={fadeUp} custom={1} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {[
                { icon: Zap, label: 'Responder mais rápido' },
                { icon: Users, label: 'Organizar seus leads' },
                { icon: Calendar, label: 'Reduzir faltas' },
                { icon: MessageSquare, label: 'Recuperar contatos' },
              ].map(({ icon: Icon, label }, i) => (
                <motion.div key={label} variants={fadeUp} custom={i} className="p-5 rounded-xl glass text-center">
                  <Icon className="h-6 w-6 text-primary mx-auto mb-3" />
                  <span className="text-sm font-medium">{label}</span>
                </motion.div>
              ))}
            </motion.div>
            <motion.p variants={fadeUp} custom={2} className="text-muted-foreground">
              Tudo com muito menos esforço manual.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 bg-gradient-surface">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold mb-6">
              Comece a automatizar seu atendimento <span className="text-gradient-brand">hoje</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-lg text-muted-foreground mb-10">
              Teste o SIX AI gratuitamente por 5 dias e veja como a inteligência artificial pode transformar seu WhatsApp em um sistema automático de vendas.
            </motion.p>
            <motion.div variants={fadeUp} custom={2}>
              <Button size="lg" className="bg-gradient-brand text-primary-foreground px-10 h-14 text-lg glow-blue" asChild>
                <a href={trialUrl} target="_blank" rel="noopener noreferrer">
                  Começar Teste Gratuito <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border py-10 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-bold">SIX <span className="text-primary">AI</span></span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> Sem taxa de implementação</span>
            <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> Sem fidelidade</span>
            <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> Cancele quando quiser</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Desenvolvido por <span className="text-foreground font-medium">X-Company Tech AI</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
