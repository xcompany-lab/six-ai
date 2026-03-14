import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MessageSquare, Wifi, WifiOff, RefreshCw, Power, Loader2, QrCode, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { useWhatsAppInstance, useCreateInstance, useCheckStatus, useDisconnectInstance, useRefreshQR } from '@/hooks/use-whatsapp';

export default function WhatsAppPage() {
  const { data: instance, isLoading } = useWhatsAppInstance();
  const createInstance = useCreateInstance();
  const checkStatus = useCheckStatus();
  const disconnectInstance = useDisconnectInstance();
  const refreshQR = useRefreshQR();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const status = instance?.status || 'disconnected';
  const qrCode = instance?.qr_code;
  const isConnected = status === 'connected';
  const isScanning = status === 'scanning';
  const isConnecting = createInstance.isPending || status === 'connecting';
  const hasInstance = !!instance && status !== 'disconnected';

  // Poll status while scanning
  useEffect(() => {
    if (status !== 'scanning' && status !== 'connecting') return;
    const interval = setInterval(() => {
      checkStatus.mutate();
    }, 4000);
    return () => clearInterval(interval);
  }, [status]);

  const handleConnect = () => {
    if (!name.trim()) {
      toast.error('Informe o nome da conexão');
      return;
    }
    createInstance.mutate({ name: name.trim(), phone }, {
      onSuccess: (data) => {
        if (data?.status === 'already_connected') {
          toast.success('WhatsApp já está conectado!');
        } else {
          toast.info('Escaneie o QR Code com seu WhatsApp');
        }
      },
      onError: () => toast.error('Erro ao conectar. Tente novamente.'),
    });
  };

  const handleDisconnect = () => {
    disconnectInstance.mutate(undefined, {
      onSuccess: () => {
        toast.success('WhatsApp desconectado');
        setName('');
        setPhone('');
      },
      onError: () => toast.error('Erro ao desconectar'),
    });
  };

  const handleRefreshQR = () => {
    refreshQR.mutate(undefined, {
      onSuccess: () => toast.info('QR Code atualizado'),
      onError: () => toast.error('Erro ao atualizar QR Code'),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="WhatsApp" subtitle="Conecte seu WhatsApp ao agente IA" />

      <AnimatePresence mode="wait">
        {/* ── CONNECTED STATE ── */}
        {isConnected && (
          <motion.div
            key="connected"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass rounded-xl p-8 max-w-lg mx-auto"
          >
            <div className="text-center space-y-5">
              {/* Hero success banner */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-accent/20 via-accent/10 to-transparent border border-accent/30 p-6">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent via-accent/80 to-accent animate-pulse" />
                <div className="w-20 h-20 rounded-full bg-accent/20 border-2 border-accent/40 flex items-center justify-center mx-auto mb-3">
                  <Wifi size={36} className="text-accent" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">🎉 SIX AI Ativa!</h3>
                <p className="text-base text-accent font-medium mt-1">
                  Seu número já está com a inteligência artificial pronta para atender
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  A partir de agora, todas as mensagens recebidas serão respondidas automaticamente pelo seu agente IA.
                </p>
              </div>

              <div className="bg-secondary/50 rounded-lg p-4 space-y-2 text-left">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Instância</span>
                  <span className="font-medium text-foreground">{instance?.instance_name}</span>
                </div>
                {instance?.phone && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Telefone</span>
                    <span className="font-medium text-foreground">+{instance.phone}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className="flex items-center gap-1.5 font-medium text-accent">
                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    Conectado
                  </span>
                </div>
              </div>
              <Button
                variant="destructive"
                onClick={handleDisconnect}
                disabled={disconnectInstance.isPending}
                className="w-full"
              >
                {disconnectInstance.isPending ? <Loader2 size={14} className="animate-spin" /> : <Power size={14} />}
                Desconectar
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── SCANNING STATE (QR CODE) ── */}
        {(isScanning || isConnecting) && !isConnected && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass rounded-xl p-8 max-w-md mx-auto"
          >
            <div className="text-center space-y-5">
              <div className="flex items-center justify-center gap-2 text-primary">
                <QrCode size={20} />
                <h3 className="text-lg font-semibold">Escaneie o QR Code</h3>
              </div>

              {qrCode ? (
                <div className="bg-white rounded-xl p-4 inline-block mx-auto">
                  <img
                    src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                    alt="QR Code WhatsApp"
                    className="w-64 h-64"
                  />
                </div>
              ) : (
                <div className="py-12">
                  <Loader2 size={48} className="mx-auto text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground mt-3">Gerando QR Code...</p>
                </div>
              )}

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Abra o WhatsApp → <strong>Aparelhos conectados</strong> → <strong>Conectar</strong>
                </p>
                <p className="text-xs text-muted-foreground/70">A conexão será detectada automaticamente</p>
              </div>

              <button
                onClick={handleRefreshQR}
                disabled={refreshQR.isPending}
                className="text-xs text-primary hover:underline flex items-center gap-1 mx-auto"
              >
                <RefreshCw size={12} className={refreshQR.isPending ? 'animate-spin' : ''} />
                Atualizar QR Code
              </button>
            </div>
          </motion.div>
        )}

        {/* ── NEW CONNECTION FORM ── */}
        {!isConnected && !isScanning && !isConnecting && !hasInstance && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass rounded-xl p-8 max-w-lg mx-auto"
          >
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <MessageSquare size={28} className="text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Nova Conexão WhatsApp</h3>
              <p className="text-sm text-muted-foreground mt-1">Preencha os dados abaixo para conectar</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="instance-name">Nome da conexão</Label>
                <Input
                  id="instance-name"
                  placeholder="Ex: Minha Empresa"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Será usado como identificador da instância</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Número do telefone</Label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 rounded-md border border-input bg-muted text-sm text-muted-foreground">
                    +55
                  </div>
                  <Input
                    id="phone"
                    placeholder="11 99999-9999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    className="flex-1"
                  />
                </div>
              </div>

              <Button
                onClick={handleConnect}
                disabled={isConnecting || !name.trim()}
                className="w-full bg-gradient-brand text-primary-foreground"
              >
                {isConnecting ? (
                  <><Loader2 size={14} className="animate-spin" /> Conectando...</>
                ) : (
                  <><Smartphone size={14} /> Conectar WhatsApp</>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
