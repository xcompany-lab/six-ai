import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';
import { MessageSquare, QrCode, Wifi, WifiOff, RefreshCw, Power, Settings, Key, Globe, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function WhatsAppPage() {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'scanning'>('disconnected');
  const [phone, setPhone] = useState('');
  const [evolutionConfig, setEvolutionConfig] = useState({
    apiUrl: '',
    instanceName: '',
    apiKey: '',
    webhookUrl: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook`,
  });
  const [showConfig, setShowConfig] = useState(false);

  const handleConnect = () => {
    if (!evolutionConfig.apiUrl || !evolutionConfig.apiKey || !evolutionConfig.instanceName) {
      toast.error('Configure a Evolution API antes de conectar');
      setShowConfig(true);
      return;
    }
    setStatus('scanning');
    toast.info('Gerando QR Code... (integração pendente com Evolution API)');
  };

  const handleDisconnect = () => {
    setStatus('disconnected');
    toast.success('WhatsApp desconectado');
  };

  const handleSaveConfig = () => {
    toast.success('Configurações da Evolution API salvas!');
    setShowConfig(false);
  };

  return (
    <div>
      <PageHeader title="WhatsApp" subtitle="Gerencie sua conexão com o WhatsApp via Evolution API">
        <button onClick={() => setShowConfig(!showConfig)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground text-sm hover:bg-secondary transition-colors">
          <Settings size={16} /> Configurar API
        </button>
      </PageHeader>

      {/* Evolution API Config Modal */}
      {showConfig && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6 mb-6 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Key size={18} className="text-primary" /> Configuração da Evolution API
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure sua instância da Evolution API para conectar o WhatsApp ao agente IA.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">URL da API</label>
              <input value={evolutionConfig.apiUrl} onChange={e => setEvolutionConfig(c => ({ ...c, apiUrl: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm"
                placeholder="https://evolution.seudominio.com" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Nome da Instância</label>
              <input value={evolutionConfig.instanceName} onChange={e => setEvolutionConfig(c => ({ ...c, instanceName: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="minha-clinica" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">API Key</label>
              <input value={evolutionConfig.apiKey} onChange={e => setEvolutionConfig(c => ({ ...c, apiKey: e.target.value }))}
                type="password"
                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm"
                placeholder="sua-api-key" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Webhook URL (auto)</label>
              <input value={evolutionConfig.webhookUrl} readOnly
                className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-muted-foreground font-mono text-sm cursor-not-allowed" />
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <AlertCircle size={16} className="text-primary flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              As credenciais da Evolution API serão armazenadas como secrets seguros no Supabase. 
              O webhook será configurado para receber mensagens e encaminhar ao agente IA.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSaveConfig}
              className="px-5 py-2.5 rounded-lg bg-gradient-brand text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
              Salvar Configuração
            </button>
            <button onClick={() => setShowConfig(false)}
              className="px-4 py-2 rounded-lg border border-border text-foreground text-sm hover:bg-secondary transition-colors">
              Cancelar
            </button>
          </div>
        </motion.div>
      )}

      {/* Connection Status */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className={`glass rounded-xl p-6 mb-6 ${status === 'connected' ? 'border-accent/20' : 'border-destructive/20'}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${status === 'connected' ? 'bg-accent/10' : 'bg-destructive/10'}`}>
              {status === 'connected' ? <Wifi size={24} className="text-accent" /> : <WifiOff size={24} className="text-destructive" />}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {status === 'connected' ? 'WhatsApp Conectado' : status === 'scanning' ? 'Aguardando QR Code' : 'Desconectado'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {status === 'connected' ? `Número: ${phone}` : 'Conecte seu WhatsApp para iniciar'}
              </p>
            </div>
          </div>
          <button onClick={() => status === 'connected' ? handleDisconnect() : handleConnect()}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              status === 'connected' 
                ? 'border border-destructive/30 text-destructive hover:bg-destructive/10' 
                : 'bg-gradient-brand text-primary-foreground hover:opacity-90'
            }`}>
            {status === 'connected' ? <><Power size={14} /> Desconectar</> : <><RefreshCw size={14} /> Conectar</>}
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Code / Connection */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <QrCode size={18} className="text-primary" /> Conexão
          </h3>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Número com DDI + DDD</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono mb-4"
              placeholder="+55 11 99999-9999" />
          </div>
          {status === 'scanning' && (
            <div className="w-48 h-48 mx-auto rounded-xl bg-secondary border border-border flex items-center justify-center">
              <div className="text-center">
                <QrCode size={64} className="text-muted-foreground mx-auto mb-2 animate-pulse" />
                <p className="text-xs text-muted-foreground">Escaneie com WhatsApp</p>
              </div>
            </div>
          )}
          {status === 'connected' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                <MessageSquare size={28} className="text-accent" />
              </div>
              <p className="text-sm text-muted-foreground">Instância ativa e recebendo mensagens</p>
            </div>
          )}
          {status === 'disconnected' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <WifiOff size={28} className="text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Configure a API e conecte para começar</p>
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
              { label: 'Agente IA configurado', done: true, desc: 'Prompt, tom de voz e base de conhecimento' },
              { label: 'Evolution API configurada', done: !!evolutionConfig.apiUrl && !!evolutionConfig.apiKey, desc: 'URL, instância e API key' },
              { label: 'Webhook registrado', done: false, desc: 'Receber mensagens automaticamente' },
              { label: 'WhatsApp conectado', done: status === 'connected', desc: 'QR Code escaneado e ativo' },
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

        {/* Logs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-xl p-6 lg:col-span-2">
          <h3 className="font-semibold text-foreground mb-4">Logs Recentes</h3>
          <div className="text-center py-8">
            <MessageSquare size={48} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">Nenhum log ainda</p>
            <p className="text-xs text-muted-foreground mt-1">Os logs aparecerão quando o webhook estiver ativo</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
