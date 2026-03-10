import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FollowUpFlow {
  id: string;
  user_id: string;
  name: string;
  trigger_description: string;
  lead_status: string;
  no_response_time: string;
  attempts: number;
  interval_time: string;
  objective: string;
  message_prompt: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export function useFollowUpFlows() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['follow_up_flows', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('follow_up_flows').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as FollowUpFlow[];
    },
    enabled: !!user,
  });
}

export function useCreateFollowUpFlow() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (flow: Partial<Omit<FollowUpFlow, 'id' | 'created_at' | 'updated_at'>>) => {
      const { data, error } = await supabase.from('follow_up_flows').insert({ ...flow, user_id: user!.id } as any).select().single();
      if (error) throw error;
      return data as unknown as FollowUpFlow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['follow_up_flows'] }),
  });
}

export function useUpdateFollowUpFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FollowUpFlow> & { id: string }) => {
      const { data, error } = await supabase.from('follow_up_flows').update(updates as any).eq('id', id).select().single();
      if (error) throw error;
      return data as unknown as FollowUpFlow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['follow_up_flows'] }),
  });
}

export function useDeleteFollowUpFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('follow_up_flows').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['follow_up_flows'] }),
  });
}
