export type PlanType = 'trial' | 'start' | 'plus' | 'pro';

export interface UserProfile {
  id: string;
  name: string;
  brandName: string;
  email: string;
  niche: string;
  whatsapp: string;
  services: string[];
  objective: string;
  plan: PlanType;
  trialEndsAt?: string;
  aiUsagePercent: number;
  contactsUsed: number;
  contactsLimit: number;
  avatar?: string;
  address?: string;
  businessHours?: string;
  voiceTone?: string;
  businessDescription?: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  status: KanbanColumn;
  origin: string;
  interest: string;
  lastContact: string;
  nextStep: string;
  summary: string;
  createdAt: string;
}

export type KanbanColumn = 
  | 'new' 
  | 'in_progress' 
  | 'interested' 
  | 'awaiting_schedule' 
  | 'scheduled' 
  | 'no_show' 
  | 'client';

export interface Appointment {
  id: string;
  leadName: string;
  service: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'no_show';
}

export interface Insight {
  id: string;
  type: 'warning' | 'opportunity' | 'action' | 'info';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionLabel?: string;
  createdAt: string;
}

export interface FollowUpFlow {
  id: string;
  name: string;
  trigger: string;
  status: string;
  noResponseTime: string;
  attempts: number;
  interval: string;
  objective: string;
  active: boolean;
}

export const PLAN_FEATURES: Record<PlanType, { name: string; price: string; contactsLimit: number; features: string[] }> = {
  trial: {
    name: 'Trial Free',
    price: 'Grátis por 5 dias',
    contactsLimit: 5000,
    features: ['Acesso completo por 5 dias', 'Todos os recursos Pro', 'Converte automaticamente para Pro'],
  },
  start: {
    name: 'Start',
    price: 'R$ 49/mês',
    contactsLimit: 1000,
    features: ['Atendente IA', 'Treinamento do agente', 'Visualização da agenda', 'Conexão WhatsApp', 'Até 1.000 contatos'],
  },
  plus: {
    name: 'Plus',
    price: 'R$ 97/mês',
    contactsLimit: 3000,
    features: ['Tudo do Start', 'Agendamentos com IA', 'Google Agenda', 'Lembretes com IA', 'Até 3.000 contatos'],
  },
  pro: {
    name: 'Pro',
    price: 'R$ 197/mês',
    contactsLimit: 5000,
    features: ['Tudo do Plus', 'Follow-up com IA', 'Ativação de base', 'Kanban / CRM', 'Insight Sales System', 'Até 5.000 contatos'],
  },
};
