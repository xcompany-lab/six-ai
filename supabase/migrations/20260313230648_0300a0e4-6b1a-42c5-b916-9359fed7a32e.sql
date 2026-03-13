
-- Enable pg_cron and pg_net if not already
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule process-message-queue every 10 seconds
SELECT cron.schedule(
  'process-message-queue',
  '*/10 * * * * *',
  $$
  SELECT net.http_post(
    url := 'https://tzcstwlnflhiqzkmouqd.supabase.co/functions/v1/process-message-queue',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6Y3N0d2xuZmxoaXF6a21vdXFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNzE3NjAsImV4cCI6MjA4ODc0Nzc2MH0.O-wjVFhNJWM1ZZlhJD_IgAN8CQFDWZ0UZ4vLQv7s0vI"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
