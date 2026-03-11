import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import sixLogo from '@/assets/six-logo-dark.png';

export default function LoginPage() {
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, signInWithGoogle, resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isForgotPassword) {
      const { error } = await resetPassword(email);
      setLoading(false);
      if (error) {
        toast.error(error);
      } else {
        toast.success('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
        setIsForgotPassword(false);
      }
      return;
    }

    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error(error);
    }
  };

  const handleGoogleLogin = async () => {
    await signInWithGoogle();
  };

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="hidden lg:flex flex-1 items-center justify-center relative">
        <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="text-center max-w-md">
          <img src={sixLogo} alt="SIX AI" className="h-20 mx-auto mb-8" />
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Smart Interaction <span className="text-gradient-brand">eXperience</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Automação inteligente que transforma interações em processos organizados.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6">
            {[
              { value: '10x', label: 'Mais rápido' },
              { value: '98%', label: 'Satisfação' },
              { value: '24/7', label: 'Disponível' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-gradient-brand">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            <img src={sixLogo} alt="SIX AI" className="h-14" />
          </div>

          <div className="glass-strong rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-foreground mb-1">
              {isForgotPassword ? 'Recuperar senha' : 'Bem-vindo de volta'}
            </h2>
            <p className="text-muted-foreground text-sm mb-8">
              {isForgotPassword
                ? 'Informe seu e-mail para receber o link de recuperação'
                : 'Entre na sua conta SIX AI'}
            </p>

            {!isForgotPassword && (
              <>
                <button
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-border hover:bg-secondary transition-colors mb-6"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  <span className="text-foreground font-medium">Continuar com Google</span>
                </button>

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center text-xs"><span className="px-3 bg-card text-muted-foreground">ou continue com e-mail</span></div>
                </div>
              </>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">E-mail</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="seu@email.com" required />
                </div>
              </div>
              {!isForgotPassword && (
                <>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Senha</label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-12 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        placeholder="••••••••" required minLength={6} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <button type="button" onClick={() => setIsForgotPassword(true)} className="text-sm text-primary hover:underline">Esqueceu a senha?</button>
                  </div>
                </>
              )}
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-lg bg-gradient-brand text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                {loading && <Loader2 size={18} className="animate-spin" />}
                {isForgotPassword ? 'Enviar link de recuperação' : 'Entrar'}
              </button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              {isForgotPassword ? (
                <button onClick={() => setIsForgotPassword(false)} className="text-primary hover:underline font-medium">Voltar ao login</button>
              ) : (
                <>
                  Não tem conta?{' '}
                  <button onClick={() => navigate('/')} className="text-primary hover:underline font-medium">
                    Conheça nossos planos
                  </button>
                </>
              )}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
