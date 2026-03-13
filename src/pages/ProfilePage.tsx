import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Save, Upload, Loader2, Camera } from 'lucide-react';
import { toast } from 'sonner';

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  textarea?: boolean;
}

const Field = ({ label, value, onChange, placeholder, textarea }: FieldProps) => {
  const Component = textarea ? 'textarea' : 'input';
  return (
    <div>
      <label className="text-sm font-medium text-foreground mb-1.5 block">{label}</label>
      <Component
        value={value}
        onChange={(e: any) => onChange(e.target.value)}
        className={`w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${textarea ? 'min-h-[100px] resize-none' : ''}`}
        placeholder={placeholder}
      />
    </div>
  );
};

export default function ProfilePage() {
  const { profile, updateProfile, user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: '',
    brand_name: '',
    niche: '',
    whatsapp: '',
    voice_tone: 'Profissional e acolhedor',
    services: '',
    address: '',
    business_hours: '08:00 - 18:00',
    business_description: '',
    objective: '',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        brand_name: profile.brand_name || '',
        niche: profile.niche || '',
        whatsapp: profile.whatsapp || '',
        voice_tone: profile.voice_tone || 'Profissional e acolhedor',
        services: profile.services?.join(', ') || '',
        address: profile.address || '',
        business_hours: profile.business_hours || '08:00 - 18:00',
        business_description: profile.business_description || '',
        objective: profile.objective || '',
      });
    }
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB.');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Add cache buster to force refresh
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;
      await updateProfile({ avatar: avatarUrl });
      toast.success('Foto atualizada com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao enviar foto: ' + err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await updateProfile({
      ...form,
      services: form.services.split(',').map(s => s.trim()).filter(Boolean),
    });
    setSaving(false);
    toast.success('Perfil atualizado com sucesso!');
  };

  const update = (field: string) => (value: string) => setForm(f => ({ ...f, [field]: value }));

  return (
    <div>
      <PageHeader title="Perfil do Usuário" subtitle="Gerencie seus dados e configure o contexto da IA">
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-brand text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar
        </button>
      </PageHeader>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarUpload}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6 flex flex-col items-center">
          <div className="relative group">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profile?.avatar || undefined} alt={form.name} />
              <AvatarFallback className="bg-gradient-brand text-3xl font-bold text-primary-foreground">
                {form.name.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60">
                <Loader2 size={24} className="animate-spin text-primary" />
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 transition-opacity"
            >
              <Camera size={14} />
            </button>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all disabled:opacity-50"
          >
            <Upload size={14} /> {uploading ? 'Enviando...' : 'Alterar foto'}
          </button>
          <div className="mt-6 w-full text-center">
            <p className="text-sm text-muted-foreground">Plano atual</p>
            <p className="text-lg font-bold text-gradient-brand capitalize">{profile?.plan}</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 glass rounded-xl p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Nome completo" value={form.name} onChange={update('name')} placeholder="Seu nome" />
            <Field label="Nome da marca" value={form.brand_name} onChange={update('brand_name')} placeholder="Nome da empresa" />
            <Field label="Nicho" value={form.niche} onChange={update('niche')} placeholder="Ex: Estética" />
            <Field label="WhatsApp" value={form.whatsapp} onChange={update('whatsapp')} placeholder="+55 11 99999-9999" />
            <Field label="Tom de voz da marca" value={form.voice_tone} onChange={update('voice_tone')} placeholder="Profissional e acolhedor" />
            <Field label="Horário de atendimento" value={form.business_hours} onChange={update('business_hours')} placeholder="08:00 - 18:00" />
          </div>
          <Field label="Serviços (separados por vírgula)" value={form.services} onChange={update('services')} placeholder="Botox, Limpeza de Pele..." />
          <Field label="Endereço" value={form.address} onChange={update('address')} placeholder="Endereço completo" />
          <Field label="Objetivo principal" value={form.objective} onChange={update('objective')} placeholder="O que deseja alcançar" />
          <Field label="Descrição do negócio" value={form.business_description} onChange={update('business_description')} placeholder="Descreva seu negócio para alimentar a IA..." textarea />
        </motion.div>
      </div>
    </div>
  );
}
