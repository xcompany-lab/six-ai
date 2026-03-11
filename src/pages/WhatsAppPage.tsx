import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';
import { MessageSquare, QrCode, Wifi, WifiOff, RefreshCw, Power, Globe, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useWhatsAppInstance, useCreateInstance, useCheckStatus, useDisconnectInstance, useRefreshQR } from '@/hooks/use-whatsapp';
import { useAIAgentConfig } from '@/hooks/use-ai-agent';

export default function WhatsAppPage() {
  const { data: instance, isLoading } = useWhatsAppInstance();
  const { data: agentConfig } = useAIAgentConfig();
  const createInstance = useCreateInstance();
  const checkStatus = useCheckStatus();
  const disconnectInstance = useDisconnectInstance();
  const refreshQR = useRefreshQR();

  const status = instance?.status || 'disconnected';
  const qrCode = instance?.qr_code;

  // Poll status while scanning
  useEffect(() => {
    if (status !== 'scanning' && status !== 'connecting') return;
    const interval = setInterval(() => {
      checkStatus.mutate();
    }, 5000);
    return () => clearInterval(interval);
  }, [status]);

  const handleConnect = () => {
    createInstance.mutate(undefined, {
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
      onSuccess: () => toast.success('WhatsApp desconectado'),
      onError: () => toast.error('Erro ao desconectar'),
    });
  };

  const handleRefreshQR = () => {
    refreshQR.mutate(undefined, {
      onSuccess: () => toast.info('QR Code atualizado'),
      onError: () => toast.error('Erro ao atualizar QR Code'),
    });
  };

  const isConnecting = createInstance.isPending || status === 'connecting';
  const isScanning = status === 'scanning';
  const isConnected = status === 'connected';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="WhatsApp" subtitle="Conecte seu WhatsApp ao agente IA em um clique" />

      {/* Connection Status */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className={`glass rounded-xl p-6 mb-6 ${isConnected ? 'border-accent/20' : 'border-destructive/20'}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${isConnected ? 'bg-accent/10' : 'bg-destructive/10'}`}>
              {isConnected ? <Wifi size={24} className="text-accent" /> : <WifiOff size={24} className="text-destructive" />}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {isConnected ? 'WhatsApp Conectado' : isScanning ? 'Aguardando leitura do QR Code' : isConnecting ? 'Criando instância...' : 'Desconectado'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isConnected ? `Instância: ${instance?.instance_name}` : isScanning ? 'Escaneie o QR Code abaixo' : 'Conecte para o agente IA atender via WhatsApp'}
              </p>
            </div>
          </div>
          <button
            onClick={() => isConnected ? handleDisconnect() : handleConnect()}
            disabled={isConnecting || disconnectInstance.isPending}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${
              isConnected
                ? 'border border-destructive/30 text-destructive hover:bg-destructive/10'
                : 'bg-gradient-brand text-primary-foreground hover:opacity-90'
            }`}>
            {isConnecting ? <><Loader2 size={14} className="animate-spin" /> Conectando...</>
              : isConnected ? <><Power size={14} /> Desconectar</>
              : <><RefreshCw size={14} /> Conectar</>}
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Code */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <QrCode size={18} className="text-primary" /> Conexão
          </h3>

          {isScanning && qrCode ? (
            <div className="text-center space-y-4">
              <img
                src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                alt="QR Code WhatsApp"
                className="w-64 h-64 mx-auto rounded-xl border border-border"
              />
              <p className="text-sm text-muted-foreground">Abra o WhatsApp → Aparelhos conectados → Conectar</p>
              <button onClick={handleRefreshQR} disabled={refreshQR.isPending}
                className="text-xs text-primary hover:underline flex items-center gap-1 mx-auto">
                <RefreshCw size={12} className={refreshQR.isPending ? 'animate-spin' : ''} /> Atualizar QR Code
              </button>
            </div>
          ) : isScanning && !qrCode ? (
            <div className="text-center py-8">
              <Loader2 size={48} className="mx-auto text-primary animate-spin mb-3" />
              <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
            </div>
          ) : isConnected ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                <MessageSquare size={28} className="text-accent" />
              </div>
              <p className="text-sm text-muted-foreground">Instância ativa e recebendo mensagens</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <WifiOff size={28} className="text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Clique em "Conectar" para começar</p>
            </div>
          )}
        </motion.div>

        {/* Integration Checklist */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Globe size={18} className="text-primary" /> Checklist de Integração
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Agente IA configurado', done: !!agentConfig?.active, desc: 'Prompt, tom de voz e base de conhecimento' },
              { label: 'Servidor Evolution API', done: true, desc: 'Conectado ao servidor compartilhado' },
              { label: 'Instância criada', done: !!instance, desc: instance ? `Nome: ${instance.instance_name}` : 'Criada ao clicar Conectar' },
              { label: 'WhatsApp conectado', done: isConnected, desc: 'QR Code escaneado e ativo' },
              { label: 'Memória de contatos ativa', done: true, desc: 'Contexto persistente por contato' },
            ].map((item, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${item.done ? 'bg-accent/5' : 'bg-secondary/50'}`}>
                <CheckCircle2 size={18} className={item.done ? 'text-accent' : 'text-muted-foreground/30'} />
                <div>
                  <p className={`text-sm font-medium ${item.done ? 'text-foreground' : 'text-muted-foreground'}`}>{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
