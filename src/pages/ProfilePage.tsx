import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Save, Loader2, Camera, ZoomIn, ZoomOut, RotateCw, Upload } from 'lucide-react';
import { toast } from 'sonner';
import Cropper, { Area } from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';

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

async function getCroppedImg(imageSrc: string, crop: Area, rotation: number): Promise<Blob> {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
    image.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  const outputSize = 512;
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d')!;

  // Handle rotation
  const radians = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));
  const rotW = image.width * cos + image.height * sin;
  const rotH = image.width * sin + image.height * cos;

  const rotCanvas = document.createElement('canvas');
  rotCanvas.width = rotW;
  rotCanvas.height = rotH;
  const rotCtx = rotCanvas.getContext('2d')!;
  rotCtx.translate(rotW / 2, rotH / 2);
  rotCtx.rotate(radians);
  rotCtx.drawImage(image, -image.width / 2, -image.height / 2);

  ctx.drawImage(rotCanvas, crop.x, crop.y, crop.width, crop.height, 0, 0, outputSize, outputSize);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.92);
  });
}

export default function ProfilePage() {
  const { profile, updateProfile, user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const [form, setForm] = useState({
    name: '',
    brand_name: '',
    whatsapp: '',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        brand_name: profile.brand_name || '',
        whatsapp: profile.whatsapp || '',
      });
    }
  }, [profile]);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCropConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels || !user) return;

    setUploading(true);
    setCropDialogOpen(false);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      const filePath = `${user.id}/avatar.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, { upsert: true, contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = `${publicUrl}?t=${Date.now()}`;
      await updateProfile({ avatar: avatarUrl });
      toast.success('Foto atualizada com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao enviar foto: ' + err.message);
    } finally {
      setUploading(false);
      setImageSrc(null);
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
        onChange={handleFileSelect}
      />

      {/* Crop Dialog */}
      <Dialog open={cropDialogOpen} onOpenChange={setCropDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajustar foto</DialogTitle>
          </DialogHeader>
          <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-black">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
              />
            )}
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <ZoomOut size={16} className="text-muted-foreground shrink-0" />
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.05}
                onValueChange={([v]) => setZoom(v)}
                className="flex-1"
              />
              <ZoomIn size={16} className="text-muted-foreground shrink-0" />
            </div>
            <div className="flex items-center gap-3">
              <RotateCw size={16} className="text-muted-foreground shrink-0" />
              <Slider
                value={[rotation]}
                min={0}
                max={360}
                step={1}
                onValueChange={([v]) => setRotation(v)}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-8 text-right">{rotation}°</span>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setCropDialogOpen(false)} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cancelar
            </button>
            <button onClick={handleCropConfirm} className="px-5 py-2 rounded-lg bg-gradient-brand text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
              Salvar foto
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
