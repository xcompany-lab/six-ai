import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';
import { HelpCircle, MessageSquare, BookOpen, Play, CheckCircle, Plus, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useSupportTickets, useCreateTicket } from '@/hooks/use-support';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const faqs = [
  { q: 'Como conecto meu WhatsApp?', a: 'Acesse WhatsApp Conectado, insira seu número e escaneie o QR Code.' },
  { q: 'Como funciona o trial?', a: 'Você tem 5 dias com acesso completo. Ao final, converte para o plano Pro.' },
  { q: 'Posso mudar de plano?', a: 'Sim, acesse Plano & Assinatura para fazer upgrade ou downgrade.' },
  { q: 'O que acontece quando meu uso de IA chega a 100%?', a: 'Novas automações são pausadas. Você pode recarregar via Pix.' },
];

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  open: { label: 'Aberto', variant: 'default' },
  in_progress: { label: 'Em andamento', variant: 'secondary' },
  resolved: { label: 'Resolvido', variant: 'outline' },
};

export default function SupportPage() {
  const { data: tickets, isLoading } = useSupportTickets();
  const createTicket = useCreateTicket();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ subject: '', description: '', category: 'general', priority: 'medium' });

  const handleSubmit = async () => {
    if (!form.subject.trim()) return;
    await createTicket.mutateAsync(form);
    setForm({ subject: '', description: '', category: 'general', priority: 'medium' });
    setOpen(false);
  };

  return (
    <div>
      <PageHeader title="Suporte" subtitle="Central de ajuda e contato" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Tutoriais', icon: BookOpen, desc: 'Guias passo a passo' },
          { label: 'Vídeos', icon: Play, desc: 'Aprenda em minutos' },
          { label: 'FAQ', icon: HelpCircle, desc: 'Perguntas frequentes' },
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

      {/* Tickets */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <MessageSquare size={18} className="text-primary" /> Meus Chamados
          </h3>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5"><Plus size={16} /> Novo Chamado</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Abrir Chamado</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Assunto" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
                <Textarea placeholder="Descreva o problema..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} />
                <div className="grid grid-cols-2 gap-3">
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Geral</SelectItem>
                      <SelectItem value="billing">Pagamento</SelectItem>
                      <SelectItem value="technical">Técnico</SelectItem>
                      <SelectItem value="feature">Sugestão</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSubmit} disabled={createTicket.isPending} className="w-full">
                  {createTicket.isPending ? 'Enviando...' : 'Enviar Chamado'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
          </div>
        ) : !tickets?.length ? (
          <div className="text-center py-8">
            <AlertCircle size={32} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum chamado aberto</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map(t => {
              const s = statusMap[t.status] || statusMap.open;
              return (
                <div key={t.id} className="p-4 rounded-lg bg-secondary/50 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{t.subject}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{t.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock size={12} className="text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(t.created_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                  </div>
                  <Badge variant={s.variant}>{s.label}</Badge>
                </div>
              );
            })}
          </div>
        )}
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
