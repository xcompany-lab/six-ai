import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';
import { HelpCircle, MessageSquare, BookOpen, Play, CheckCircle } from 'lucide-react';

const faqs = [
  { q: 'Como conecto meu WhatsApp?', a: 'Acesse WhatsApp Conectado, insira seu número e escaneie o QR Code.' },
  { q: 'Como funciona o trial?', a: 'Você tem 5 dias com acesso completo. Ao final, converte para o plano Pro.' },
  { q: 'Posso mudar de plano?', a: 'Sim, acesse Plano & Assinatura para fazer upgrade ou downgrade.' },
  { q: 'O que acontece quando meu uso de IA chega a 100%?', a: 'Novas automações são pausadas. Você pode recarregar via Pix.' },
];

export default function SupportPage() {
  return (
    <div>
      <PageHeader title="Suporte" subtitle="Central de ajuda e contato" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Abrir Chamado', icon: MessageSquare, desc: 'Fale com nosso time' },
          { label: 'Tutoriais', icon: BookOpen, desc: 'Guias passo a passo' },
          { label: 'Vídeos', icon: Play, desc: 'Aprenda em minutos' },
        ].map((c, i) => (
          <motion.button key={c.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="glass rounded-xl p-5 flex items-center gap-4 text-left hover:border-primary/30 transition-all w-full">
            <div className="p-2.5 rounded-xl bg-primary/10"><c.icon size={22} className="text-primary" /></div>
            <div>
              <h3 className="font-semibold text-foreground">{c.label}</h3>
              <p className="text-sm text-muted-foreground">{c.desc}</p>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Status */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-xl p-5 mb-8">
        <div className="flex items-center gap-3 mb-1">
          <CheckCircle size={18} className="text-accent" />
          <h3 className="font-semibold text-foreground">Status da Plataforma</h3>
        </div>
        <p className="text-sm text-accent ml-7">Todos os serviços operacionais</p>
      </motion.div>

      {/* FAQ */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-xl p-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <HelpCircle size={18} className="text-primary" /> Perguntas Frequentes
        </h3>
        <div className="space-y-4">
          {faqs.map((f, i) => (
            <div key={i} className="p-4 rounded-lg bg-secondary/50">
              <p className="font-medium text-foreground mb-1">{f.q}</p>
              <p className="text-sm text-muted-foreground">{f.a}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
