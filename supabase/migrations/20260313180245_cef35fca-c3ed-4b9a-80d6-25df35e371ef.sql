
-- =============================================
-- SIX AI v1.0 — Todas as migrações
-- =============================================

-- 1. Tabela business_profiles (Fase 1 — Orquestrador)
CREATE TABLE public.business_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_name text NOT NULL DEFAULT '',
  segment text NOT NULL DEFAULT '',
  services jsonb NOT NULL DEFAULT '[]'::jsonb,
  tone text NOT NULL DEFAULT 'Profissional e empático',
  faq jsonb NOT NULL DEFAULT '[]'::jsonb,
  objections jsonb NOT NULL DEFAULT '[]'::jsonb,
  funnel_stages jsonb NOT NULL DEFAULT '["Novo","Em andamento","Interessado","Agendado","Cliente"]'::jsonb,
  qualified_lead_criteria text NOT NULL DEFAULT '',
  working_hours jsonb NOT NULL DEFAULT '{}'::jsonb,
  follow_up_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business profile" ON public.business_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own business profile" ON public.business_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own business profile" ON public.business_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_business_profiles_updated_at
  BEFORE UPDATE ON public.business_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 2. Tabela agent_configs (Fase 1 — Multi-agente)
CREATE TABLE public.agent_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  agent_type text NOT NULL, -- 'attendant' | 'scheduler' | 'followup' | 'crm'
  system_prompt text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, agent_type)
);

ALTER TABLE public.agent_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own agent configs" ON public.agent_configs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own agent configs" ON public.agent_configs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own agent configs" ON public.agent_configs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access on agent_configs" ON public.agent_configs FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER update_agent_configs_updated_at
  BEFORE UPDATE ON public.agent_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 3. Coluna current_agent na tabela leads (Fase 1 — Handoff)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS current_agent text NOT NULL DEFAULT 'attendant';

-- 4. Tabela user_settings (Fase 3/4 — Google Calendar + Lembretes)
CREATE TABLE public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  google_calendar_connected boolean NOT NULL DEFAULT false,
  google_refresh_token text,
  google_access_token text,
  reminder_1_offset interval,
  reminder_2_offset interval,
  reminder_3_offset interval,
  reminder_1_message text,
  reminder_2_message text,
  reminder_3_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access on user_settings" ON public.user_settings FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 5. Coluna google_event_id na tabela appointments (Fase 3)
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS google_event_id text;

-- 6. Tabela scheduled_reminders (Fase 4)
CREATE TABLE public.scheduled_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  contact_phone text NOT NULL,
  contact_name text NOT NULL DEFAULT '',
  service_name text NOT NULL DEFAULT '',
  appointment_at timestamptz,
  message_text text NOT NULL DEFAULT '',
  send_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending | processing | sent | cancelled
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reminders" ON public.scheduled_reminders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reminders" ON public.scheduled_reminders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reminders" ON public.scheduled_reminders FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access on scheduled_reminders" ON public.scheduled_reminders FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_scheduled_reminders_send_at_status ON public.scheduled_reminders (send_at, status);

-- 7. Tabela campaigns (Fase 5 — Ativação de Base v2)
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT '',
  segment text NOT NULL DEFAULT 'custom', -- no_reply | pre_schedule | scheduled | recurrent | custom
  status text NOT NULL DEFAULT 'draft', -- draft | scheduled | running | paused | done
  message_text text,
  scheduled_at timestamptz,
  total_contacts int NOT NULL DEFAULT 0,
  sent_count int NOT NULL DEFAULT 0,
  failed_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own campaigns v2" ON public.campaigns FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own campaigns v2" ON public.campaigns FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own campaigns v2" ON public.campaigns FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own campaigns v2" ON public.campaigns FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role full access on campaigns" ON public.campaigns FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 8. Tabela campaign_messages (Fase 5)
CREATE TABLE public.campaign_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  contact_phone text NOT NULL,
  contact_name text NOT NULL DEFAULT '',
  message_text text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending | processing | sent | failed
  send_at timestamptz NOT NULL,
  sent_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.campaign_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own campaign messages" ON public.campaign_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own campaign messages" ON public.campaign_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own campaign messages" ON public.campaign_messages FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access on campaign_messages" ON public.campaign_messages FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_campaign_messages_send_at_status ON public.campaign_messages (send_at, status);

-- 9. Função RPC para incrementar contadores de campanha
CREATE OR REPLACE FUNCTION public.increment_campaign_counter(p_campaign_id uuid, p_field text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_field = 'sent_count' THEN
    UPDATE campaigns SET sent_count = sent_count + 1 WHERE id = p_campaign_id;
  ELSIF p_field = 'failed_count' THEN
    UPDATE campaigns SET failed_count = failed_count + 1 WHERE id = p_campaign_id;
  END IF;
END;
$$;
