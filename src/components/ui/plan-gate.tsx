import { useAuth } from '@/contexts/AuthContext';
import { PlanType, PLAN_FEATURES } from '@/types';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PlanGateProps {
  requiredPlan: PlanType;
  children: React.ReactNode;
}

export function PlanGate({ requiredPlan, children }: PlanGateProps) {
  const { hasPlanAccess } = useAuth();
  const navigate = useNavigate();

  if (hasPlanAccess(requiredPlan)) return <>{children}</>;

  const plan = PLAN_FEATURES[requiredPlan];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="p-4 rounded-full bg-primary/10 mb-6">
        <Lock size={40} className="text-primary" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Recurso do plano {plan.name}</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Este recurso está disponível a partir do plano {plan.name} ({plan.price}).
        Faça upgrade para desbloquear.
      </p>
      <button
        onClick={() => navigate('/app/plano')}
        className="px-6 py-3 rounded-lg bg-gradient-brand text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
      >
        Ver Planos
      </button>
    </div>
  );
}
