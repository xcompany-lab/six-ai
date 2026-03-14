import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface BusinessProfile {
  id: string;
  user_id: string;
  business_name: string;
  segment: string;
  services: string[];
  tone: string;
  faq: { q: string; a: string }[];
  objections: { objection: string; response: string }[];
  funnel_stages: string[];
  qualified_lead_criteria: string;
  working_hours: Record<string, unknown>;
  follow_up_config: Record<string, unknown>;
  service_prices: ServicePriceItem[];
  created_at: string;
  updated_at: string;
}

export interface ServicePriceItem {
  name: string;
  price: string;
  notes?: string;
  payment_methods?: string[];
  plans?: string;
  installments?: string;
  installment_value?: string;
}

export function useBusinessProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['business-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as BusinessProfile | null;
    },
    enabled: !!user,
  });
}

export function useSaveBusinessProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: Partial<BusinessProfile>) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('business_profiles')
        .upsert(
          { user_id: user.id, ...profile } as any,
          { onConflict: 'user_id' }
        );
      if (error) throw error;

      // Trigger agent config generation
      const { error: genError } = await supabase.functions.invoke('generate-agent-configs');
      if (genError) console.error('Error generating agent configs:', genError);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-profile'] });
    },
  });
}
