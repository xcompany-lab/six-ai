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

async function callEvolutionApi(action: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Não autenticado');

  const resp = await supabase.functions.invoke('evolution-api', {
    body: { action },
  });

  if (resp.error) throw resp.error;
  return resp.data;
}

export function useCreateInstance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => callEvolutionApi('create'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-instance'] });
    },
  });
}

export function useRefreshQR() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => callEvolutionApi('connect'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-instance'] });
    },
  });
}

export function useCheckStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => callEvolutionApi('status'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-instance'] });
    },
  });
}

export function useDisconnectInstance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => callEvolutionApi('disconnect'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-instance'] });
    },
  });
}
