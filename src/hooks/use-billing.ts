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
  // Campaign analytics
  campaignStats: Array<{ name: string; sent: number; responded: number; rate: number; status: string }>;
  totalCampaignsSent: number;
  totalCampaignResponses: number;
  avgCampaignResponseRate: number;
  // AI performance
  aiConversations: number;
  aiPositiveSentiment: number;
  aiNeutralSentiment: number;
  aiNegativeSentiment: number;
  // Funnel data
  funnelData: Array<{ stage: string; count: number; percent: number }>;
  // Lead trend (last 7 days)
  leadTrend: Array<{ date: string; leads: number }>;
  // Appointment trend
  appointmentTrend: Array<{ date: string; total: number; confirmed: number; noshow: number }>;
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

      const [leadsRes, appointmentsRes, contactsRes, campaignsRes, campaignMsgsRes, appointmentsMonthRes] = await Promise.all([
        supabase.from('leads').select('*').eq('user_id', user!.id),
        supabase.from('appointments').select('*').eq('user_id', user!.id).gte('date', weekAgo.toISOString().split('T')[0]).lte('date', now.toISOString().split('T')[0]),
        supabase.from('contact_memory').select('*').eq('user_id', user!.id),
        supabase.from('activation_campaigns').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('campaign_messages').select('*').eq('user_id', user!.id),
        supabase.from('appointments').select('*').eq('user_id', user!.id).gte('date', monthAgo.toISOString().split('T')[0]),
      ]);

      const leads = leadsRes.data || [];
      const appointments = appointmentsRes.data || [];
      const contacts = contactsRes.data || [];
      const campaigns = campaignsRes.data || [];
      const campaignMsgs = campaignMsgsRes.data || [];
      const appointmentsMonth = appointmentsMonthRes.data || [];

      // Base metrics
      const totalLeads = leads.length;
      const newLeadsThisWeek = leads.filter(l => new Date(l.created_at) >= weekAgo).length;
      const clients = leads.filter(l => l.status === 'client').length;
      const conversionRate = totalLeads > 0 ? Math.round((clients / totalLeads) * 100) : 0;
      const noShows = leads.filter(l => l.status === 'no_show').length;
      const noShowRate = totalLeads > 0 ? Math.round((noShows / totalLeads) * 100) : 0;

      const leadsByStatus: Record<string, number> = {};
      leads.forEach(l => { leadsByStatus[l.status] = (leadsByStatus[l.status] || 0) + 1; });

      const leadsByOrigin: Record<string, number> = {};
      leads.forEach(l => { if (l.origin) leadsByOrigin[l.origin] = (leadsByOrigin[l.origin] || 0) + 1; });

      const topOrigin = Object.entries(leadsByOrigin).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

      const serviceCount: Record<string, number> = {};
      appointments.forEach(a => { if (a.service) serviceCount[a.service] = (serviceCount[a.service] || 0) + 1; });
      const topService = Object.entries(serviceCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

      const scheduledThisWeek = appointments.filter(a => a.status === 'confirmed' || a.status === 'pending').length;
      const reactivationPool = leads.filter(l => l.status !== 'client' && new Date(l.last_contact) < monthAgo).length;

      const thisMonthLeads = leads.filter(l => new Date(l.created_at) >= monthAgo).length;
      const lastMonthLeads = leads.filter(l => { const d = new Date(l.created_at); return d >= twoMonthsAgo && d < monthAgo; }).length;
      const monthlyGrowth = lastMonthLeads > 0 ? Math.round(((thisMonthLeads - lastMonthLeads) / lastMonthLeads) * 100) : (thisMonthLeads > 0 ? 100 : 0);

      const pendingFollowUps = leads.filter(l =>
        ['in_progress', 'interested', 'awaiting_schedule'].includes(l.status) && new Date(l.last_contact) < weekAgo
      ).length;

      // Campaign analytics
      const campaignStats = campaigns.map(c => {
        const msgs = campaignMsgs.filter(m => m.campaign_id === c.id);
        const sent = msgs.filter(m => m.status === 'sent').length;
        const responded = c.responses_count || 0;
        return { name: c.name, sent, responded, rate: sent > 0 ? Math.round((responded / sent) * 100) : 0, status: c.status };
      });
      const totalCampaignsSent = campaignMsgs.filter(m => m.status === 'sent').length;
      const totalCampaignResponses = campaigns.reduce((sum, c) => sum + (c.responses_count || 0), 0);
      const avgCampaignResponseRate = totalCampaignsSent > 0 ? Math.round((totalCampaignResponses / totalCampaignsSent) * 100) : 0;

      // AI performance (from contact_memory sentiments)
      const aiConversations = contacts.length;
      const aiPositiveSentiment = contacts.filter(c => c.sentiment === 'positive').length;
      const aiNeutralSentiment = contacts.filter(c => c.sentiment === 'neutral').length;
      const aiNegativeSentiment = contacts.filter(c => c.sentiment === 'negative').length;

      // Funnel data
      const funnelStages = [
        { stage: 'Novo', key: 'new' },
        { stage: 'Em andamento', key: 'in_progress' },
        { stage: 'Interessado', key: 'interested' },
        { stage: 'Agendado', key: 'scheduled' },
        { stage: 'Cliente', key: 'client' },
      ];
      const funnelData = funnelStages.map(f => ({
        stage: f.stage,
        count: leadsByStatus[f.key] || 0,
        percent: totalLeads > 0 ? Math.round(((leadsByStatus[f.key] || 0) / totalLeads) * 100) : 0,
      }));

      // Lead trend (last 7 days)
      const leadTrend: Array<{ date: string; leads: number }> = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const dateStr = d.toISOString().split('T')[0];
        const count = leads.filter(l => l.created_at?.startsWith(dateStr)).length;
        leadTrend.push({ date: dateStr.slice(5), leads: count });
      }

      // Appointment trend (last 30 days, grouped by week)
      const appointmentTrend: Array<{ date: string; total: number; confirmed: number; noshow: number }> = [];
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now.getTime() - (i + 1) * 7 * 86400000);
        const weekEnd = new Date(now.getTime() - i * 7 * 86400000);
        const weekLabel = `Sem ${4 - i}`;
        const weekAppts = appointmentsMonth.filter(a => {
          const d = new Date(a.date);
          return d >= weekStart && d < weekEnd;
        });
        appointmentTrend.push({
          date: weekLabel,
          total: weekAppts.length,
          confirmed: weekAppts.filter(a => a.status === 'confirmed' || a.status === 'completed').length,
          noshow: weekAppts.filter(a => a.status === 'no_show' || a.status === 'cancelled').length,
        });
      }

      return {
        totalLeads, newLeadsThisWeek, conversionRate, avgResponseTime: '—',
        noShowRate, topOrigin, topService, scheduledThisWeek, pendingFollowUps,
        reactivationPool, monthlyGrowth, leadsByStatus, leadsByOrigin,
        campaignStats, totalCampaignsSent, totalCampaignResponses, avgCampaignResponseRate,
        aiConversations, aiPositiveSentiment, aiNeutralSentiment, aiNegativeSentiment,
        funnelData, leadTrend, appointmentTrend,
      } as InsightData;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}
