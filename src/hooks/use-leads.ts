import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Lead {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  status: string;
  origin: string;
  interest: string;
  last_contact: string;
  next_step: string;
  summary: string;
  notes: string;
  ai_status: string;
  created_at: string;
  updated_at: string;
}

export type LeadInsert = Omit<Lead, 'id' | 'created_at' | 'updated_at'>;

export function useLeads() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['leads', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Lead[];
    },
    enabled: !!user,
  });
}

export function useLeadsByStatus() {
  const { data: leads, ...rest } = useLeads();

  const grouped = (leads || []).reduce<Record<string, Lead[]>>((acc, lead) => {
    if (!acc[lead.status]) acc[lead.status] = [];
    acc[lead.status].push(lead);
    return acc;
  }, {});

  return { grouped, leads, ...rest };
}

export function useLeadStats() {
  const { data: leads } = useLeads();

  const total = leads?.length || 0;
  const clients = leads?.filter(l => l.status === 'client').length || 0;
  const scheduled = leads?.filter(l => l.status === 'scheduled').length || 0;
  const noShow = leads?.filter(l => l.status === 'no_show').length || 0;
  const conversionRate = total > 0 ? ((clients / total) * 100).toFixed(1) : '0';

  return { total, clients, scheduled, noShow, conversionRate };
}

export function useCreateLead() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (lead: Partial<LeadInsert>) => {
      const { data, error } = await supabase
        .from('leads')
        .insert({ ...lead, user_id: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Lead;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Lead> & { id: string }) => {
      const { data, error } = await supabase
        .from('leads')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Lead;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
}
