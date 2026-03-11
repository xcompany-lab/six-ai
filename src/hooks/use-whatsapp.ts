import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface WhatsAppInstance {
  id: string;
  user_id: string;
  instance_name: string;
  instance_id: string | null;
  status: string;
  phone: string | null;
  qr_code: string | null;
  created_at: string;
  updated_at: string;
}

export function useWhatsAppInstance() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['whatsapp-instance', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as WhatsAppInstance | null;
    },
    enabled: !!user,
  });
}

async function callEvolutionApi(body: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Não autenticado');

  const resp = await supabase.functions.invoke('evolution-api', { body });
  if (resp.error) throw resp.error;
  return resp.data;
}

export function useCreateInstance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; phone: string }) =>
      callEvolutionApi({ action: 'create', name: params.name, phone: params.phone }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-instance'] });
    },
  });
}

export function useRefreshQR() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => callEvolutionApi({ action: 'connect' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-instance'] });
    },
  });
}

export function useCheckStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => callEvolutionApi({ action: 'status' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-instance'] });
    },
  });
}

export function useDisconnectInstance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => callEvolutionApi({ action: 'disconnect' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-instance'] });
    },
  });
}
