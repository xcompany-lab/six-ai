import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/page-header';
import { MessageSquare, QrCode, Wifi, WifiOff, RefreshCw, Power } from 'lucide-react';

export default function WhatsAppPage() {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'scanning'>('connected');
  const [phone, setPhone] = useState('+55 11 99999-9999');

  return (
    <div>
      <PageHeader title="WhatsApp Conectado" subtitle="Gerencie sua conexão com o WhatsApp via Evolution API" />

      {/* Connection Status */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className={`glass rounded-xl p-6 mb-6 ${status === 'connected' ? 'border-accent/20' : 'border-destructive/20'}`}>
        <div className="flex items-center justify-between">
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
          <div className="flex gap-2">
            <button onClick={() => setStatus(status === 'connected' ? 'disconnected' : 'scanning')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                status === 'connected' 
                  ? 'border border-destructive/30 text-destructive hover:bg-destructive/10' 
                  : 'bg-gradient-brand text-primary-foreground hover:opacity-90'
              }`}>
              {status === 'connected' ? <><Power size={14} /> Desconectar</> : <><RefreshCw size={14} /> Conectar</>}
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Code */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <QrCode size={18} className="text-primary" /> Conexão
          </h3>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Número com DDI + DDD</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono mb-4"
              placeholder="+55 11 99999-9999"
            />
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
        </motion.div>

        {/* Logs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-4">Logs Recentes</h3>
          <div className="space-y-2 font-mono text-xs">
            {[
              { time: '10:32:15', msg: 'Webhook recebido: message.upsert', type: 'info' },
              { time: '10:32:14', msg: 'Mensagem enviada: +5511987654321', type: 'success' },
              { time: '10:31:58', msg: 'Mensagem recebida: +5511912345678', type: 'info' },
              { time: '10:30:00', msg: 'Heartbeat: conexão estável', type: 'success' },
              { time: '10:28:44', msg: 'Áudio recebido: transcrevendo...', type: 'info' },
              { time: '10:28:46', msg: 'Transcrição concluída. Respondendo...', type: 'success' },
            ].map((log, i) => (
              <div key={i} className="flex gap-3 p-2 rounded bg-secondary/50">
                <span className="text-muted-foreground">{log.time}</span>
                <span className={log.type === 'success' ? 'text-accent' : 'text-foreground'}>{log.msg}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">Última conexão: 10 Mar 2026, 10:30</p>
        </motion.div>
      </div>
    </div>
  );
}
