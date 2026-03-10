import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ActivationCampaign {
  id: string;
  user_id: string;
  name: string;
  filter_type: string;
  filter_status: string;
  filter_days_since: number;
  message_prompt: string;
  status: string;
  contacts_count: number;
  responses_count: number;
  created_at: string;
  updated_at: string;
}

export function useActivationCampaigns() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['activation_campaigns', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('activation_campaigns').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ActivationCampaign[];
    },
    enabled: !!user,
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (campaign: Partial<Omit<ActivationCampaign, 'id' | 'created_at' | 'updated_at'>>) => {
      const { data, error } = await supabase.from('activation_campaigns').insert({ ...campaign, user_id: user!.id } as any).select().single();
      if (error) throw error;
      return data as unknown as ActivationCampaign;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activation_campaigns'] }),
  });
}

export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ActivationCampaign> & { id: string }) => {
      const { data, error } = await supabase.from('activation_campaigns').update(updates as any).eq('id', id).select().single();
      if (error) throw error;
      return data as unknown as ActivationCampaign;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activation_campaigns'] }),
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('activation_campaigns').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activation_campaigns'] }),
  });
}
