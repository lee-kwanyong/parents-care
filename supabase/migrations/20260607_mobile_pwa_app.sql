create extension if not exists pgcrypto;

create table if not exists public.care_response_requests (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  parent_name text,
  parent_phone text,
  guardian_name text,
  guardian_phone text,
  signal_type text not null,
  signal_label text,
  request_type text not null,
  risk_level text default 'medium',
  status text default 'open',
  service_area text,
  address_hint text,
  requested_action text,
  dispatch_scope text default 'family_first',
  accepted_by_provider_id uuid,
  accepted_by_name text,
  accepted_at timestamptz,
  completed_at timestamptz,
  completed_note text,
  source text default 'mobile_app',
  source_key text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.care_response_requests add column if not exists family_code text;
alter table public.care_response_requests add column if not exists parent_name text;
alter table public.care_response_requests add column if not exists parent_phone text;
alter table public.care_response_requests add column if not exists guardian_name text;
alter table public.care_response_requests add column if not exists guardian_phone text;
alter table public.care_response_requests add column if not exists signal_type text;
alter table public.care_response_requests add column if not exists signal_label text;
alter table public.care_response_requests add column if not exists request_type text;
alter table public.care_response_requests add column if not exists risk_level text default 'medium';
alter table public.care_response_requests add column if not exists status text default 'open';
alter table public.care_response_requests add column if not exists service_area text;
alter table public.care_response_requests add column if not exists address_hint text;
alter table public.care_response_requests add column if not exists requested_action text;
alter table public.care_response_requests add column if not exists dispatch_scope text default 'family_first';
alter table public.care_response_requests add column if not exists accepted_by_provider_id uuid;
alter table public.care_response_requests add column if not exists accepted_by_name text;
alter table public.care_response_requests add column if not exists accepted_at timestamptz;
alter table public.care_response_requests add column if not exists completed_at timestamptz;
alter table public.care_response_requests add column if not exists completed_note text;
alter table public.care_response_requests add column if not exists source text default 'mobile_app';
alter table public.care_response_requests add column if not exists source_key text;
alter table public.care_response_requests add column if not exists payload jsonb default '{}'::jsonb;
alter table public.care_response_requests add column if not exists created_at timestamptz default now();
alter table public.care_response_requests add column if not exists updated_at timestamptz default now();
alter table public.care_response_requests add column if not exists fast_dispatch_requested_at timestamptz;
alter table public.care_response_requests add column if not exists fast_dispatch_status text default 'none';
alter table public.care_response_requests add column if not exists state_reason text;
alter table public.care_response_requests add column if not exists last_transition_at timestamptz;

create index if not exists idx_care_response_requests_mobile
  on public.care_response_requests(source, family_code, created_at desc);

create table if not exists public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  channel text default 'sms',
  to_name text,
  to_phone text,
  to_email text,
  title text,
  body text,
  template_code text default '',
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
alter table public.notification_outbox add column if not exists template_code text default '';
alter table public.notification_outbox add column if not exists reason text;
alter table public.notification_outbox add column if not exists target_url text;
alter table public.notification_outbox add column if not exists status text default 'queued';
alter table public.notification_outbox add column if not exists provider text;
alter table public.notification_outbox add column if not exists provider_message_id text;
alter table public.notification_outbox add column if not exists source_key text;
alter table public.notification_outbox add column if not exists payload jsonb default '{}'::jsonb;
alter table public.notification_outbox add column if not exists created_at timestamptz default now();
alter table public.notification_outbox add column if not exists sent_at timestamptz;

alter table public.notification_outbox alter column template_code drop not null;
alter table public.notification_outbox alter column template_code set default '';

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

create table if not exists public.ops_autopilot_logs (
  id uuid primary key default gen_random_uuid(),
  request_id uuid,
  action_type text not null,
  actor_name text default '안부웍스 오토파일럿',
  message text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.ops_autopilot_logs add column if not exists request_id uuid;
alter table public.ops_autopilot_logs add column if not exists action_type text;
alter table public.ops_autopilot_logs add column if not exists actor_name text default '안부웍스 오토파일럿';
alter table public.ops_autopilot_logs add column if not exists message text;
alter table public.ops_autopilot_logs add column if not exists payload jsonb default '{}'::jsonb;
alter table public.ops_autopilot_logs add column if not exists created_at timestamptz default now();

grant usage on schema public to service_role;
grant select, insert, update, delete on public.care_response_requests to service_role;
grant select, insert, update, delete on public.notification_outbox to service_role;
grant select, insert, update, delete on public.care_response_updates to service_role;
grant select, insert, update, delete on public.ops_autopilot_logs to service_role;

alter table public.care_response_requests enable row level security;
alter table public.notification_outbox enable row level security;
alter table public.care_response_updates enable row level security;
alter table public.ops_autopilot_logs enable row level security;

notify pgrst, 'reload schema';
select pg_sleep(1);
notify pgrst, 'reload schema';
