import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCallback } from 'react';

export interface Appointment {
  id: string;
  user_id: string;
  lead_id: string | null;
  lead_name: string;
  service: string;
  date: string;
  time: string;
  duration_minutes: number;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface SchedulingConfig {
  id: string;
  user_id: string;
  default_duration: number;
  buffer_minutes: number;
  lunch_start: string | null;
  lunch_end: string | null;
  work_start: string;
  work_end: string;
  work_days: number[];
  blocked_dates: string[];
}

export function useAppointments(dateFilter?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['appointments', user?.id, dateFilter],
    queryFn: async () => {
      let query = supabase.from('appointments').select('*').order('date', { ascending: true }).order('time', { ascending: true });
      if (dateFilter) {
        query = query.eq('date', dateFilter);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as Appointment[];
    },
    enabled: !!user,
  });
}

export function useAppointmentsByDateRange(startDate: string, endDate: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['appointments', user?.id, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })
        .order('time', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as Appointment[];
    },
    enabled: !!user && !!startDate && !!endDate,
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (appt: Partial<Omit<Appointment, 'id' | 'created_at' | 'updated_at'>>) => {
      const { data, error } = await supabase
        .from('appointments')
        .insert({ ...appt, user_id: user!.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Appointment;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Appointment> & { id: string }) => {
      const { data, error } = await supabase
        .from('appointments')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Appointment;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
}

export function useDeleteAppointment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
}

export function useSchedulingConfig() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['scheduling_config', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduling_config')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as SchedulingConfig | null;
    },
    enabled: !!user,
  });
}

export function useUpsertSchedulingConfig() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (config: Partial<Omit<SchedulingConfig, 'id' | 'user_id'>>) => {
      const { data: existing } = await supabase
        .from('scheduling_config')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('scheduling_config')
          .update(config as any)
          .eq('user_id', user!.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('scheduling_config')
          .insert({ ...config, user_id: user!.id } as any)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scheduling_config'] }),
  });
}

export function useSyncGoogleCalendar() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const syncMutation = useMutation({
    mutationFn: async (params?: { time_min?: string; time_max?: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('sync-google-calendar', {
        body: params || {},
      });

      if (error) throw error;
      return data as { status: string; synced: number; updated: number; total_events: number };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  return syncMutation;
}
