import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/contexts/AuthContext';
import { Save, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    brandName: user?.brandName || '',
    niche: user?.niche || '',
    whatsapp: user?.whatsapp || '',
    voiceTone: user?.voiceTone || 'Profissional e acolhedor',
    services: user?.services?.join(', ') || '',
    address: user?.address || '',
    businessHours: user?.businessHours || '08:00 - 18:00',
    businessDescription: user?.businessDescription || '',
    objective: user?.objective || '',
  });

  const handleSave = () => {
    updateProfile({
      ...form,
      services: form.services.split(',').map(s => s.trim()),
    });
    toast.success('Perfil atualizado com sucesso!');
  };

  const Field = ({ label, field, placeholder, textarea }: { label: string; field: string; placeholder?: string; textarea?: boolean }) => {
    const Component = textarea ? 'textarea' : 'input';
    return (
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">{label}</label>
        <Component
          value={(form as any)[field]}
          onChange={(e: any) => setForm(f => ({ ...f, [field]: e.target.value }))}
          className={`w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${textarea ? 'min-h-[100px] resize-none' : ''}`}
          placeholder={placeholder}
        />
      </div>
    );
  };

  return (
    <div>
      <PageHeader title="Perfil do Usuário" subtitle="Gerencie seus dados e configure o contexto da IA">
        <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-brand text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
          <Save size={16} /> Salvar
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-gradient-brand flex items-center justify-center text-3xl font-bold text-primary-foreground mb-4">
            {form.name.charAt(0) || 'U'}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all">
            <Upload size={14} /> Alterar foto
          </button>
          <div className="mt-6 w-full text-center">
            <p className="text-sm text-muted-foreground">Plano atual</p>
            <p className="text-lg font-bold text-gradient-brand capitalize">{user?.plan}</p>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 glass rounded-xl p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Nome completo" field="name" placeholder="Seu nome" />
            <Field label="Nome da marca" field="brandName" placeholder="Nome da empresa" />
            <Field label="Nicho" field="niche" placeholder="Ex: Estética" />
            <Field label="WhatsApp" field="whatsapp" placeholder="+55 11 99999-9999" />
            <Field label="Tom de voz da marca" field="voiceTone" placeholder="Profissional e acolhedor" />
            <Field label="Horário de atendimento" field="businessHours" placeholder="08:00 - 18:00" />
          </div>
          <Field label="Serviços (separados por vírgula)" field="services" placeholder="Botox, Limpeza de Pele..." />
          <Field label="Endereço" field="address" placeholder="Endereço completo" />
          <Field label="Objetivo principal" field="objective" placeholder="O que deseja alcançar" />
          <Field label="Descrição do negócio" field="businessDescription" placeholder="Descreva seu negócio para alimentar a IA..." textarea />
        </motion.div>
      </div>
    </div>
  );
}
