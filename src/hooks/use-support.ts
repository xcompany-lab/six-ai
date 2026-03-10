import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

export function useSupportTickets() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['support_tickets', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as SupportTicket[];
    },
  });
}

export function useCreateTicket() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (ticket: { subject: string; description: string; category: string; priority: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('support_tickets')
        .insert({ ...ticket, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['support_tickets'] });
      toast.success('Chamado criado com sucesso!');
    },
    onError: () => toast.error('Erro ao criar chamado'),
  });
}
