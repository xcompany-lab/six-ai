
-- Message queue for debouncing incoming WhatsApp messages
CREATE TABLE public.message_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  contact_phone text NOT NULL DEFAULT '',
  contact_name text NOT NULL DEFAULT '',
  instance_name text NOT NULL DEFAULT '',
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending',
  is_audio boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.message_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on message_queue" ON public.message_queue FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Unique constraint per lead to allow upsert
CREATE UNIQUE INDEX idx_message_queue_lead ON public.message_queue (lead_id) WHERE status = 'pending';

-- Index for processor queries
CREATE INDEX idx_message_queue_pending ON public.message_queue (status, last_message_at) WHERE status = 'pending';

-- Conversation messages for history
CREATE TABLE public.conversation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user',
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on conversation_messages" ON public.conversation_messages FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can view own conversation messages" ON public.conversation_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_conversation_messages_lead ON public.conversation_messages (lead_id, created_at DESC);
