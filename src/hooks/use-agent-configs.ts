import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

export function useRefineAgentPrompt() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      agentConfigId,
      currentPrompt,
      userInstruction,
      agentType,
    }: {
      agentConfigId: string;
      currentPrompt: string;
      userInstruction: string;
      agentType: string;
    }) => {
      // Call edge function to refine prompt
      const { data: fnData, error: fnError } = await supabase.functions.invoke('refine-agent-prompt', {
        body: {
          current_prompt: currentPrompt,
          user_instruction: userInstruction,
          agent_type: agentType,
        },
      });

      if (fnError) throw fnError;
      if (fnData?.error) throw new Error(fnData.error);

      const refinedPrompt = fnData.refined_prompt;
      if (!refinedPrompt) throw new Error('No refined prompt returned');

      // Save to DB
      const { error: updateError } = await supabase
        .from('agent_configs')
        .update({ system_prompt: refinedPrompt })
        .eq('id', agentConfigId);

      if (updateError) throw updateError;

      return refinedPrompt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-configs', user?.id] });
    },
  });
}
