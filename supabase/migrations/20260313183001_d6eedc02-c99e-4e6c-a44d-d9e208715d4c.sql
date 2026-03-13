
SELECT cron.schedule(
  'send-reminders-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url:='https://tzcstwlnflhiqzkmouqd.supabase.co/functions/v1/send-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6Y3N0d2xuZmxoaXF6a21vdXFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNzE3NjAsImV4cCI6MjA4ODc0Nzc2MH0.O-wjVFhNJWM1ZZlhJD_IgAN8CQFDWZ0UZ4vLQv7s0vI"}'::jsonb,
    body:=concat('{"time": "', now(), '"}')::jsonb
  ) AS request_id;
  $$
);
