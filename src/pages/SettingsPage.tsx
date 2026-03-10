import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';
import { Settings, Globe, Bell, Shield, Palette, Plug, Server } from 'lucide-react';

const sections = [
  { label: 'Branding', icon: Palette, description: 'Logo, cores e identidade visual da conta' },
  { label: 'Idioma', icon: Globe, description: 'Português-BR (padrão)' },
  { label: 'Notificações', icon: Bell, description: 'E-mail, push e alertas do sistema' },
  { label: 'Integrações', icon: Plug, description: 'Evolution API, Google Agenda, Kiwify' },
  { label: 'Permissões', icon: Shield, description: 'Controle de acesso e segurança' },
  { label: 'Status Técnico', icon: Server, description: 'Saúde dos serviços e conexões' },
];

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Configurações" subtitle="Gerencie as preferências do sistema" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((s, i) => (
          <motion.button
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-xl p-5 flex items-center gap-4 text-left hover:border-primary/30 transition-all w-full"
          >
            <div className="p-2.5 rounded-xl bg-primary/10 flex-shrink-0">
              <s.icon size={22} className="text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{s.label}</h3>
              <p className="text-sm text-muted-foreground">{s.description}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
