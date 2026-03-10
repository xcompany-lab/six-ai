
-- Follow-up flows table
CREATE TABLE public.follow_up_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  trigger_description TEXT NOT NULL DEFAULT '',
  lead_status TEXT NOT NULL DEFAULT '',
  no_response_time TEXT NOT NULL DEFAULT '24h',
  attempts INTEGER NOT NULL DEFAULT 3,
  interval_time TEXT NOT NULL DEFAULT '24h',
  objective TEXT NOT NULL DEFAULT '',
  message_prompt TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.follow_up_flows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own flows" ON public.follow_up_flows FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own flows" ON public.follow_up_flows FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own flows" ON public.follow_up_flows FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own flows" ON public.follow_up_flows FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER follow_up_flows_updated_at BEFORE UPDATE ON public.follow_up_flows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Reminders config table
CREATE TABLE public.reminders_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  first_reminder TEXT NOT NULL DEFAULT '24h',
  second_reminder TEXT NOT NULL DEFAULT '2h',
  message_template TEXT NOT NULL DEFAULT '',
  confirmation_expected TEXT NOT NULL DEFAULT 'Sim/Confirmo',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reminders_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reminders config" ON public.reminders_config FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reminders config" ON public.reminders_config FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reminders config" ON public.reminders_config FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER reminders_config_updated_at BEFORE UPDATE ON public.reminders_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Activation campaigns table
CREATE TABLE public.activation_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  filter_type TEXT NOT NULL DEFAULT '',
  filter_status TEXT NOT NULL DEFAULT '',
  filter_days_since INTEGER NOT NULL DEFAULT 30,
  message_prompt TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  contacts_count INTEGER NOT NULL DEFAULT 0,
  responses_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activation_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own campaigns" ON public.activation_campaigns FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own campaigns" ON public.activation_campaigns FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own campaigns" ON public.activation_campaigns FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own campaigns" ON public.activation_campaigns FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER activation_campaigns_updated_at BEFORE UPDATE ON public.activation_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
