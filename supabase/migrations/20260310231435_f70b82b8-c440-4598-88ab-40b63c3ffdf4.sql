
-- ai_agent_config: stores AI agent configuration per user
CREATE TABLE public.ai_agent_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt text NOT NULL DEFAULT '',
  voice_tone text NOT NULL DEFAULT 'Profissional e empático',
  energy text NOT NULL DEFAULT 'Moderada',
  prohibited_words text NOT NULL DEFAULT '',
  fallback_message text NOT NULL DEFAULT 'Desculpe, não entendi bem. Posso te ajudar de outra forma?',
  opening_message text NOT NULL DEFAULT 'Olá! 👋 Que bom ter você aqui. Como posso ajudar?',
  out_of_scope text NOT NULL DEFAULT 'Vou encaminhar sua dúvida para nossa equipe. Em breve retornamos!',
  faq text NOT NULL DEFAULT '',
  knowledge_base text NOT NULL DEFAULT '',
  pitch text NOT NULL DEFAULT '',
  objections text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.ai_agent_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ai config" ON public.ai_agent_config FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ai config" ON public.ai_agent_config FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ai config" ON public.ai_agent_config FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_ai_agent_config_updated_at BEFORE UPDATE ON public.ai_agent_config FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- contact_memory: stores conversation memory per contact per user
CREATE TABLE public.contact_memory (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_phone text NOT NULL DEFAULT '',
  contact_name text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  preferences text NOT NULL DEFAULT '',
  last_topics text NOT NULL DEFAULT '',
  sentiment text NOT NULL DEFAULT 'neutral',
  interaction_count integer NOT NULL DEFAULT 0,
  last_interaction_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, contact_phone)
);

ALTER TABLE public.contact_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contact memory" ON public.contact_memory FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own contact memory" ON public.contact_memory FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contact memory" ON public.contact_memory FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own contact memory" ON public.contact_memory FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_contact_memory_updated_at BEFORE UPDATE ON public.contact_memory FOR EACH ROW EXECUTE FUNCTION update_updated_at();
