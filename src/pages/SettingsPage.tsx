import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';
import { Settings, Globe, Bell, Shield, Palette, Plug, Server, ChevronRight, ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type Section = 'menu' | 'branding' | 'notifications' | 'integrations' | 'permissions' | 'status';

const sections = [
  { id: 'branding' as Section, label: 'Branding', icon: Palette, description: 'Logo, cores e identidade visual da conta' },
  { id: 'notifications' as Section, label: 'Notificações', icon: Bell, description: 'E-mail, push e alertas do sistema' },
  { id: 'integrations' as Section, label: 'Integrações', icon: Plug, description: 'Evolution API, Google Agenda, Ticto' },
  { id: 'permissions' as Section, label: 'Permissões', icon: Shield, description: 'Controle de acesso e segurança' },
  { id: 'status' as Section, label: 'Status Técnico', icon: Server, description: 'Saúde dos serviços e conexões' },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>('menu');
  const { profile, updateProfile } = useAuth();

  // Branding state
  const [brandName, setBrandName] = useState(profile?.brand_name || '');
  const [businessDesc, setBusinessDesc] = useState(profile?.business_description || '');
  const [voiceTone, setVoiceTone] = useState(profile?.voice_tone || '');

  // Notification state
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [leadAlerts, setLeadAlerts] = useState(true);
  const [appointmentReminders, setAppointmentReminders] = useState(true);

  const saveBranding = async () => {
    await updateProfile({ brand_name: brandName, business_description: businessDesc, voice_tone: voiceTone });
    toast.success('Branding atualizado!');
  };

  if (activeSection !== 'menu') {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => setActiveSection('menu')}>
            <ArrowLeft size={18} />
          </Button>
          <h2 className="text-lg font-semibold text-foreground">
            {sections.find(s => s.id === activeSection)?.label}
          </h2>
        </div>

        {activeSection === 'branding' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6 space-y-5">
            <div className="space-y-2">
              <Label>Nome da Marca</Label>
              <Input value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="Ex: Minha Clínica" />
            </div>
            <div className="space-y-2">
              <Label>Descrição do Negócio</Label>
              <Input value={businessDesc} onChange={e => setBusinessDesc(e.target.value)} placeholder="Breve descrição da sua empresa" />
            </div>
            <div className="space-y-2">
              <Label>Tom de Voz da Marca</Label>
              <Input value={voiceTone} onChange={e => setVoiceTone(e.target.value)} placeholder="Ex: Profissional e empático" />
            </div>
            <Button onClick={saveBranding} className="gap-2"><Save size={16} /> Salvar</Button>
          </motion.div>
        )}

        {activeSection === 'notifications' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6 space-y-5">
            {[
              { label: 'Notificações por e-mail', desc: 'Receba resumos e alertas por e-mail', value: emailNotif, set: setEmailNotif },
              { label: 'Notificações push', desc: 'Alertas em tempo real no navegador', value: pushNotif, set: setPushNotif },
              { label: 'Alertas de novos leads', desc: 'Notificação quando um novo lead chegar', value: leadAlerts, set: setLeadAlerts },
              { label: 'Lembretes de agendamento', desc: 'Aviso antes de cada consulta', value: appointmentReminders, set: setAppointmentReminders },
            ].map(n => (
              <div key={n.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{n.label}</p>
                  <p className="text-xs text-muted-foreground">{n.desc}</p>
                </div>
                <Switch checked={n.value} onCheckedChange={n.set} />
              </div>
            ))}
            <Button onClick={() => toast.success('Preferências salvas!')} className="gap-2"><Save size={16} /> Salvar</Button>
          </motion.div>
        )}

        {activeSection === 'integrations' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6 space-y-4">
            {[
              { name: 'Evolution API (WhatsApp)', status: 'Não configurado', connected: false },
              { name: 'Google Agenda', status: 'Não conectado', connected: false },
              { name: 'Ticto (Pagamentos)', status: 'Webhook configurado', connected: true },
            ].map(int => (
              <div key={int.name} className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div>
                  <p className="text-sm font-medium text-foreground">{int.name}</p>
                  <p className="text-xs text-muted-foreground">{int.status}</p>
                </div>
                <div className={`w-2.5 h-2.5 rounded-full ${int.connected ? 'bg-accent' : 'bg-muted-foreground'}`} />
              </div>
            ))}

            <div className="mt-4 p-4 rounded-lg bg-secondary/50">
              <p className="text-sm font-medium text-foreground mb-1">URL do Webhook Kiwify</p>
              <p className="text-xs text-muted-foreground mb-2">Cole esta URL no painel da Kiwify → Configurações → Webhooks</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-background p-2 rounded border border-border break-all">
                  https://tzcstwlnflhiqzkmouqd.supabase.co/functions/v1/kiwify-webhook
                </code>
                <Button size="sm" variant="outline" onClick={() => {
                  navigator.clipboard.writeText('https://tzcstwlnflhiqzkmouqd.supabase.co/functions/v1/kiwify-webhook');
                  toast.success('URL copiada!');
                }}>Copiar</Button>
              </div>
            </div>
          </motion.div>
        )}

        {activeSection === 'permissions' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6">
            <p className="text-sm text-muted-foreground">Seu papel atual: <span className="text-foreground font-medium">Proprietário</span></p>
            <p className="text-sm text-muted-foreground mt-3">Controle multi-usuário estará disponível na Sprint 9.</p>
          </motion.div>
        )}

        {activeSection === 'status' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6 space-y-3">
            {[
              { service: 'Supabase (Banco de Dados)', ok: true },
              { service: 'Edge Functions', ok: true },
              { service: 'Auth (Autenticação)', ok: true },
              { service: 'Evolution API', ok: false },
              { service: 'Google Calendar', ok: false },
            ].map(s => (
              <div key={s.service} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <span className="text-sm text-foreground">{s.service}</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${s.ok ? 'bg-accent' : 'bg-muted-foreground'}`} />
                  <span className={`text-xs ${s.ok ? 'text-accent' : 'text-muted-foreground'}`}>
                    {s.ok ? 'Operacional' : 'Não configurado'}
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Configurações" subtitle="Gerencie as preferências do sistema" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((s, i) => (
          <motion.button
            key={s.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setActiveSection(s.id)}
            className="glass rounded-xl p-5 flex items-center gap-4 text-left hover:border-primary/30 transition-all w-full"
          >
            <div className="p-2.5 rounded-xl bg-primary/10 flex-shrink-0">
              <s.icon size={22} className="text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{s.label}</h3>
              <p className="text-sm text-muted-foreground">{s.description}</p>
            </div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
