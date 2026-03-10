import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AIAgentConfig {
  id: string;
  user_id: string;
  prompt: string;
  voice_tone: string;
  energy: string;
  prohibited_words: string;
  fallback_message: string;
  opening_message: string;
  out_of_scope: string;
  faq: string;
  knowledge_base: string;
  pitch: string;
  objections: string;
  active: boolean;
}

export function useAIAgentConfig() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['ai-agent-config', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_agent_config')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as AIAgentConfig | null;
    },
    enabled: !!user,
  });
}

export function useSaveAIAgentConfig() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: Partial<AIAgentConfig>) => {
      // Try upsert
      const { data, error } = await supabase
        .from('ai_agent_config')
        .upsert({ ...config, user_id: user!.id }, { onConflict: 'user_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-agent-config'] });
    },
  });
}

export interface ContactMemory {
  id: string;
  user_id: string;
  contact_phone: string;
  contact_name: string;
  summary: string;
  preferences: string;
  last_topics: string;
  sentiment: string;
  interaction_count: number;
  last_interaction_at: string;
}

export function useContactMemories() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['contact-memories', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_memory')
        .select('*')
        .eq('user_id', user!.id)
        .order('last_interaction_at', { ascending: false });
      if (error) throw error;
      return data as ContactMemory[];
    },
    enabled: !!user,
  });
}
