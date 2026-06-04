create extension if not exists pgcrypto;

create table if not exists public.care_response_escalation_logs (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null,
  escalation_type text not null,
  level text default 'warning',
  status text default 'created',
  message text,
  source_key text not null unique,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.care_response_escalation_logs add column if not exists request_id uuid;
alter table public.care_response_escalation_logs add column if not exists escalation_type text;
alter table public.care_response_escalation_logs add column if not exists level text default 'warning';
alter table public.care_response_escalation_logs add column if not exists status text default 'created';
alter table public.care_response_escalation_logs add column if not exists message text;
alter table public.care_response_escalation_logs add column if not exists source_key text;
alter table public.care_response_escalation_logs add column if not exists payload jsonb default '{}'::jsonb;
alter table public.care_response_escalation_logs add column if not exists created_at timestamptz default now();

create unique index if not exists idx_care_response_escalation_logs_source_key
  on public.care_response_escalation_logs(source_key);

create index if not exists idx_care_response_escalation_logs_request
  on public.care_response_escalation_logs(request_id, created_at desc);

create table if not exists public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  channel text default 'sms',
  to_name text,
  to_phone text,
  to_email text,
  title text,
  body text,
  template_code text,
  reason text,
  target_url text,
  status text default 'queued',
  provider text,
  provider_message_id text,
  source_key text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  sent_at timestamptz
);

alter table public.notification_outbox add column if not exists family_code text;
alter table public.notification_outbox add column if not exists channel text default 'sms';
alter table public.notification_outbox add column if not exists to_name text;
alter table public.notification_outbox add column if not exists to_phone text;
alter table public.notification_outbox add column if not exists to_email text;
alter table public.notification_outbox add column if not exists title text;
alter table public.notification_outbox add column if not exists body text;
alter table public.notification_outbox add column if not exists template_code text;
alter table public.notification_outbox add column if not exists reason text;
alter table public.notification_outbox add column if not exists target_url text;
alter table public.notification_outbox add column if not exists status text default 'queued';
alter table public.notification_outbox add column if not exists provider text;
alter table public.notification_outbox add column if not exists provider_message_id text;
alter table public.notification_outbox add column if not exists source_key text;
alter table public.notification_outbox add column if not exists payload jsonb default '{}'::jsonb;
alter table public.notification_outbox add column if not exists created_at timestamptz default now();
alter table public.notification_outbox add column if not exists sent_at timestamptz;

create index if not exists idx_notification_outbox_escalation
  on public.notification_outbox(reason, status, created_at desc);

create table if not exists public.care_response_updates (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null,
  actor_type text default 'system',
  actor_name text,
  update_type text,
  message text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.care_response_updates add column if not exists request_id uuid;
alter table public.care_response_updates add column if not exists actor_type text default 'system';
alter table public.care_response_updates add column if not exists actor_name text;
alter table public.care_response_updates add column if not exists update_type text;
alter table public.care_response_updates add column if not exists message text;
alter table public.care_response_updates add column if not exists payload jsonb default '{}'::jsonb;
alter table public.care_response_updates add column if not exists created_at timestamptz default now();

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.care_response_escalation_logs to anon, authenticated;
grant select, insert, update, delete on public.notification_outbox to anon, authenticated;
grant select, insert, update, delete on public.care_response_updates to anon, authenticated;

alter table public.care_response_escalation_logs enable row level security;
alter table public.notification_outbox enable row level security;
alter table public.care_response_updates enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'care_response_escalation_logs',
    'notification_outbox',
    'care_response_updates'
  ]
  loop
    execute format('drop policy if exists "%s_select_all" on public.%I', t, t);
    execute format('drop policy if exists "%s_insert_all" on public.%I', t, t);
    execute format('drop policy if exists "%s_update_all" on public.%I', t, t);
    execute format('drop policy if exists "%s_delete_all" on public.%I', t, t);

    execute format('create policy "%s_select_all" on public.%I for select to anon, authenticated using (true)', t, t);
    execute format('create policy "%s_insert_all" on public.%I for insert to anon, authenticated with check (true)', t, t);
    execute format('create policy "%s_update_all" on public.%I for update to anon, authenticated using (true) with check (true)', t, t);
    execute format('create policy "%s_delete_all" on public.%I for delete to anon, authenticated using (true)', t, t);
  end loop;
end $$;

notify pgrst, 'reload schema';
select pg_sleep(1);
notify pgrst, 'reload schema';
