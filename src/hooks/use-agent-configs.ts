import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useAgentConfigs() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['agent-configs', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_configs')
        .select('*')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}
