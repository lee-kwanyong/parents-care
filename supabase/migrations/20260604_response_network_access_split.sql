create extension if not exists pgcrypto;

create table if not exists public.care_providers (
  id uuid primary key default gen_random_uuid(),
  provider_type text not null,
  provider_name text not null,
  phone text,
  email text,
  service_area text,
  address_hint text,
  available_status text default 'available',
  verified_status text default 'pending',
  qualification text,
  available_hours text,
  response_time_min integer default 30,
  notes text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.care_providers add column if not exists provider_type text;
alter table public.care_providers add column if not exists provider_name text;
alter table public.care_providers add column if not exists phone text;
alter table public.care_providers add column if not exists email text;
alter table public.care_providers add column if not exists service_area text;
alter table public.care_providers add column if not exists address_hint text;
alter table public.care_providers add column if not exists available_status text default 'available';
alter table public.care_providers add column if not exists verified_status text default 'pending';
alter table public.care_providers add column if not exists qualification text;
alter table public.care_providers add column if not exists available_hours text;
alter table public.care_providers add column if not exists response_time_min integer default 30;
alter table public.care_providers add column if not exists notes text;
alter table public.care_providers add column if not exists payload jsonb default '{}'::jsonb;
alter table public.care_providers add column if not exists created_at timestamptz default now();
alter table public.care_providers add column if not exists updated_at timestamptz default now();

create index if not exists idx_care_providers_type_area
  on public.care_providers(provider_type, service_area);

create index if not exists idx_care_providers_status
  on public.care_providers(available_status, verified_status);

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
  source text default 'manual',
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
alter table public.care_response_requests add column if not exists source text default 'manual';
alter table public.care_response_requests add column if not exists source_key text;
alter table public.care_response_requests add column if not exists payload jsonb default '{}'::jsonb;
alter table public.care_response_requests add column if not exists created_at timestamptz default now();
alter table public.care_response_requests add column if not exists updated_at timestamptz default now();

create unique index if not exists idx_care_response_requests_source_key
  on public.care_response_requests(source_key)
  where source_key is not null;

create index if not exists idx_care_response_requests_status
  on public.care_response_requests(status, risk_level, created_at desc);

create index if not exists idx_care_response_requests_family
  on public.care_response_requests(family_code, status);

create table if not exists public.care_response_matches (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null,
  provider_id uuid not null,
  match_status text default 'notified',
  notified_at timestamptz default now(),
  accepted_at timestamptz,
  declined_at timestamptz,
  completed_at timestamptz,
  note text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.care_response_matches add column if not exists request_id uuid;
alter table public.care_response_matches add column if not exists provider_id uuid;
alter table public.care_response_matches add column if not exists match_status text default 'notified';
alter table public.care_response_matches add column if not exists notified_at timestamptz default now();
alter table public.care_response_matches add column if not exists accepted_at timestamptz;
alter table public.care_response_matches add column if not exists declined_at timestamptz;
alter table public.care_response_matches add column if not exists completed_at timestamptz;
alter table public.care_response_matches add column if not exists note text;
alter table public.care_response_matches add column if not exists payload jsonb default '{}'::jsonb;
alter table public.care_response_matches add column if not exists created_at timestamptz default now();
alter table public.care_response_matches add column if not exists updated_at timestamptz default now();

create index if not exists idx_care_response_matches_request
  on public.care_response_matches(request_id, match_status);

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

create index if not exists idx_care_response_updates_request
  on public.care_response_updates(request_id, created_at desc);

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

create index if not exists idx_notification_outbox_status
  on public.notification_outbox(status, created_at desc);

create index if not exists idx_notification_outbox_source
  on public.notification_outbox(source_key);

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on public.care_providers to anon, authenticated;
grant select, insert, update, delete on public.care_response_requests to anon, authenticated;
grant select, insert, update, delete on public.care_response_matches to anon, authenticated;
grant select, insert, update, delete on public.care_response_updates to anon, authenticated;
grant select, insert, update, delete on public.notification_outbox to anon, authenticated;

alter table public.care_providers enable row level security;
alter table public.care_response_requests enable row level security;
alter table public.care_response_matches enable row level security;
alter table public.care_response_updates enable row level security;
alter table public.notification_outbox enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'care_providers',
    'care_response_requests',
    'care_response_matches',
    'care_response_updates',
    'notification_outbox'
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
