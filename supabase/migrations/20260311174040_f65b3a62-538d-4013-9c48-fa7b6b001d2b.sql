
create table public.whatsapp_instances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  instance_name text not null,
  instance_id text,
  status text not null default 'disconnected',
  phone text,
  qr_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.whatsapp_instances enable row level security;

create policy "Users manage own instance"
  on public.whatsapp_instances
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Service role policy for webhook function
create policy "Service role full access"
  on public.whatsapp_instances
  for select
  to service_role
  using (true);

create trigger update_whatsapp_instances_updated_at
  before update on public.whatsapp_instances
  for each row execute function public.update_updated_at();
