import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface RemindersConfig {
  id: string;
  user_id: string;
  first_reminder: string;
  second_reminder: string;
  message_template: string;
  confirmation_expected: string;
  active: boolean;
}

export function useRemindersConfig() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['reminders_config', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('reminders_config').select('*').eq('user_id', user!.id).maybeSingle();
      if (error) throw error;
      return data as unknown as RemindersConfig | null;
    },
    enabled: !!user,
  });
}

export function useUpsertRemindersConfig() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (config: Partial<Omit<RemindersConfig, 'id' | 'user_id'>>) => {
      const { data: existing } = await supabase.from('reminders_config').select('id').eq('user_id', user!.id).maybeSingle();
      if (existing) {
        const { data, error } = await supabase.from('reminders_config').update(config as any).eq('user_id', user!.id).select().single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from('reminders_config').insert({ ...config, user_id: user!.id } as any).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reminders_config'] }),
  });
}
