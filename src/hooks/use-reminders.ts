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

export interface ScheduledReminder {
  id: string;
  user_id: string;
  appointment_id: string | null;
  contact_name: string;
  contact_phone: string;
  service_name: string;
  appointment_at: string | null;
  send_at: string;
  sent_at: string | null;
  message_text: string;
  status: string;
  created_at: string;
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

export function useScheduledReminders() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['scheduled_reminders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduled_reminders')
        .select('*')
        .eq('user_id', user!.id)
        .order('send_at', { ascending: true })
        .limit(50);
      if (error) throw error;
      return (data || []) as unknown as ScheduledReminder[];
    },
    enabled: !!user,
    refetchInterval: 30000,
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

export function useDeleteReminder() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (reminderId: string) => {
      const { error } = await supabase.from('scheduled_reminders').delete().eq('id', reminderId).eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scheduled_reminders'] }),
  });
}
