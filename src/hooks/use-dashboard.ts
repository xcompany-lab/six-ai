import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, startOfMonth, endOfMonth, isToday, parseISO } from 'date-fns';

export function useDashboardStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async () => {
      const now = new Date();
      const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');
      const today = format(now, 'yyyy-MM-dd');

      // Parallel queries
      const [leadsRes, appointmentsRes, followUpsRes, contactsRes, appointmentsTodayRes] = await Promise.all([
        supabase.from('leads').select('id, status, origin, interest, created_at, last_contact'),
        supabase.from('appointments').select('id, status, date, time, lead_name, service').gte('date', monthStart).lte('date', monthEnd),
        supabase.from('follow_up_flows').select('id, active, name'),
        supabase.from('contact_memory').select('id, interaction_count, last_interaction_at, sentiment'),
        supabase.from('appointments').select('id, status, time, lead_name, service').eq('date', today).order('time', { ascending: true }),
      ]);

      const leads = leadsRes.data || [];
      const appointments = appointmentsRes.data || [];
      const followUps = followUpsRes.data || [];
      const contacts = contactsRes.data || [];
      const todayAppointments = appointmentsTodayRes.data || [];

      // Lead stats
      const totalLeads = leads.length;
      const clients = leads.filter(l => l.status === 'client').length;
      const scheduled = leads.filter(l => l.status === 'scheduled').length;
      const newLeads = leads.filter(l => l.status === 'new').length;
      const inProgress = leads.filter(l => l.status === 'in_progress').length;
      const noShow = leads.filter(l => l.status === 'no_show').length;
      const conversionRate = totalLeads > 0 ? ((clients / totalLeads) * 100).toFixed(1) : '0';

      // Leads this month
      const leadsThisMonth = leads.filter(l => {
        const d = l.created_at?.slice(0, 10);
        return d && d >= monthStart && d <= monthEnd;
      }).length;

      // Appointment stats
      const totalAppointmentsMonth = appointments.length;
      const confirmedAppointments = appointments.filter(a => a.status === 'confirmed').length;
      const completedAppointments = appointments.filter(a => a.status === 'completed').length;
      const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length;
      const noShowAppointments = appointments.filter(a => a.status === 'no_show').length;
      const appointmentRate = totalAppointmentsMonth > 0
        ? (((confirmedAppointments + completedAppointments) / totalAppointmentsMonth) * 100).toFixed(1)
        : '0';

      // Follow-up stats
      const activeFollowUps = followUps.filter(f => f.active).length;
      const recoveryRate = noShow > 0 && inProgress > 0
        ? ((inProgress / (noShow + inProgress)) * 100).toFixed(0)
        : activeFollowUps > 0 ? '—' : '—';

      // Contact memory stats
      const totalContacts = contacts.length;
      const totalInteractions = contacts.reduce((sum, c) => sum + (c.interaction_count || 0), 0);
      const positiveContacts = contacts.filter(c => c.sentiment === 'positive').length;

      // Origin breakdown
      const originCounts: Record<string, number> = {};
      leads.forEach(l => {
        const origin = l.origin || 'Desconhecido';
        originCounts[origin] = (originCounts[origin] || 0) + 1;
      });
      const topOrigins = Object.entries(originCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([origin, count]) => ({ origin, count }));

      // Status breakdown for funnel
      const statusCounts: Record<string, number> = {};
      leads.forEach(l => {
        statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
      });

      return {
        // Lead metrics
        totalLeads,
        clients,
        scheduled,
        newLeads,
        inProgress,
        noShow,
        conversionRate,
        leadsThisMonth,
        statusCounts,
        topOrigins,

        // Appointment metrics
        totalAppointmentsMonth,
        confirmedAppointments,
        completedAppointments,
        cancelledAppointments,
        noShowAppointments,
        appointmentRate,
        todayAppointments,

        // Follow-up metrics
        activeFollowUps,
        totalFollowUps: followUps.length,
        recoveryRate,

        // Contact metrics
        totalContacts,
        totalInteractions,
        positiveContacts,
      };
    },
    enabled: !!user,
    refetchInterval: 60_000, // refresh every minute
  });
}
