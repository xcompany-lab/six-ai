import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface BillingUsage {
  plan: string;
  trialEndsAt: string | null;
  contactsUsed: number;
  contactsLimit: number;
  aiUsagePercent: number;
  trialDaysLeft: number;
  isTrialExpired: boolean;
  contactsPercent: number;
}

export function useBillingUsage(): BillingUsage {
  const { profile } = useAuth();

  const trialDaysLeft = profile?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(profile.trial_ends_at).getTime() - Date.now()) / 86400000))
    : 0;

  return {
    plan: profile?.plan || 'trial',
    trialEndsAt: profile?.trial_ends_at || null,
    contactsUsed: profile?.contacts_used || 0,
    contactsLimit: profile?.contacts_limit || 5000,
    aiUsagePercent: Number(profile?.ai_usage_percent) || 0,
    trialDaysLeft,
    isTrialExpired: profile?.plan === 'trial' && trialDaysLeft <= 0,
    contactsPercent: profile?.contacts_limit ? Math.round(((profile?.contacts_used || 0) / profile.contacts_limit) * 100) : 0,
  };
}

export interface InsightData {
  totalLeads: number;
  newLeadsThisWeek: number;
  conversionRate: number;
  avgResponseTime: string;
  noShowRate: number;
  topOrigin: string;
  topService: string;
  scheduledThisWeek: number;
  pendingFollowUps: number;
  reactivationPool: number;
  monthlyGrowth: number;
  leadsByStatus: Record<string, number>;
  leadsByOrigin: Record<string, number>;
}

export function useInsightsData() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['insights-data', user?.id],
    queryFn: async () => {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 86400000);
      const monthAgo = new Date(now.getTime() - 30 * 86400000);
      const twoMonthsAgo = new Date(now.getTime() - 60 * 86400000);

      // Fetch all leads
      const { data: leads = [] } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user!.id);

      // Fetch appointments this week
      const { data: appointments = [] } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user!.id)
        .gte('date', weekAgo.toISOString().split('T')[0])
        .lte('date', now.toISOString().split('T')[0]);

      // Calculations
      const totalLeads = leads.length;
      const newLeadsThisWeek = leads.filter(l => new Date(l.created_at) >= weekAgo).length;
      const clients = leads.filter(l => l.status === 'client').length;
      const conversionRate = totalLeads > 0 ? Math.round((clients / totalLeads) * 100) : 0;
      const noShows = leads.filter(l => l.status === 'no_show').length;
      const noShowRate = totalLeads > 0 ? Math.round((noShows / totalLeads) * 100) : 0;

      // Leads by status
      const leadsByStatus: Record<string, number> = {};
      leads.forEach(l => { leadsByStatus[l.status] = (leadsByStatus[l.status] || 0) + 1; });

      // Leads by origin
      const leadsByOrigin: Record<string, number> = {};
      leads.forEach(l => { if (l.origin) leadsByOrigin[l.origin] = (leadsByOrigin[l.origin] || 0) + 1; });

      // Top origin
      const topOrigin = Object.entries(leadsByOrigin).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

      // Top service from appointments
      const serviceCount: Record<string, number> = {};
      appointments.forEach(a => { if (a.service) serviceCount[a.service] = (serviceCount[a.service] || 0) + 1; });
      const topService = Object.entries(serviceCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

      // Scheduled this week
      const scheduledThisWeek = appointments.filter(a => a.status === 'confirmed' || a.status === 'pending').length;

      // Reactivation pool: leads not contacted in 30+ days, not clients
      const reactivationPool = leads.filter(l => 
        l.status !== 'client' && new Date(l.last_contact) < monthAgo
      ).length;

      // Monthly growth: leads created this month vs last month
      const thisMonthLeads = leads.filter(l => new Date(l.created_at) >= monthAgo).length;
      const lastMonthLeads = leads.filter(l => {
        const d = new Date(l.created_at);
        return d >= twoMonthsAgo && d < monthAgo;
      }).length;
      const monthlyGrowth = lastMonthLeads > 0 ? Math.round(((thisMonthLeads - lastMonthLeads) / lastMonthLeads) * 100) : (thisMonthLeads > 0 ? 100 : 0);

      // Pending follow-ups: leads in_progress or interested without recent contact
      const pendingFollowUps = leads.filter(l => 
        ['in_progress', 'interested', 'awaiting_schedule'].includes(l.status) &&
        new Date(l.last_contact) < weekAgo
      ).length;

      return {
        totalLeads,
        newLeadsThisWeek,
        conversionRate,
        avgResponseTime: '—',
        noShowRate,
        topOrigin,
        topService,
        scheduledThisWeek,
        pendingFollowUps,
        reactivationPool,
        monthlyGrowth,
        leadsByStatus,
        leadsByOrigin,
      } as InsightData;
    },
    enabled: !!user,
  });
}
