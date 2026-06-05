create extension if not exists pgcrypto;

create table if not exists public.gov_report_snapshots (
  id uuid primary key default gen_random_uuid(),
  report_type text default 'ops_weekly',
  period_key text,
  period_start date,
  period_end date,
  title text,
  summary text,
  metrics jsonb default '{}'::jsonb,
  payload jsonb default '{}'::jsonb,
  created_by text default '운영실',
  created_at timestamptz default now()
);

alter table public.gov_report_snapshots add column if not exists report_type text default 'ops_weekly';
alter table public.gov_report_snapshots add column if not exists period_key text;
alter table public.gov_report_snapshots add column if not exists period_start date;
alter table public.gov_report_snapshots add column if not exists period_end date;
alter table public.gov_report_snapshots add column if not exists title text;
alter table public.gov_report_snapshots add column if not exists summary text;
alter table public.gov_report_snapshots add column if not exists metrics jsonb default '{}'::jsonb;
alter table public.gov_report_snapshots add column if not exists payload jsonb default '{}'::jsonb;
alter table public.gov_report_snapshots add column if not exists created_by text default '운영실';
alter table public.gov_report_snapshots add column if not exists created_at timestamptz default now();

create index if not exists idx_gov_report_snapshots_period
  on public.gov_report_snapshots(period_start, period_end, created_at desc);

create index if not exists idx_gov_report_snapshots_type
  on public.gov_report_snapshots(report_type, created_at desc);

create table if not exists public.care_households (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  parent_name text not null,
  parent_phone text,
  guardian_name text,
  guardian_phone text,
  service_area text,
  address_hint text,
  risk_group text default 'B',
  risk_level text default 'medium',
  household_status text default 'active',
  pilot_group text default 'B',
  consent_status text default 'pending',
  consent_at timestamptz,
  start_date date default current_date,
  care_flags jsonb default '{}'::jsonb,
  notes text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.care_households add column if not exists family_code text;
alter table public.care_households add column if not exists parent_name text;
alter table public.care_households add column if not exists parent_phone text;
alter table public.care_households add column if not exists guardian_name text;
alter table public.care_households add column if not exists guardian_phone text;
alter table public.care_households add column if not exists service_area text;
alter table public.care_households add column if not exists address_hint text;
alter table public.care_households add column if not exists risk_group text default 'B';
alter table public.care_households add column if not exists risk_level text default 'medium';
alter table public.care_households add column if not exists household_status text default 'active';
alter table public.care_households add column if not exists pilot_group text default 'B';
alter table public.care_households add column if not exists consent_status text default 'pending';
alter table public.care_households add column if not exists consent_at timestamptz;
alter table public.care_households add column if not exists start_date date default current_date;
alter table public.care_households add column if not exists care_flags jsonb default '{}'::jsonb;
alter table public.care_households add column if not exists notes text;
alter table public.care_households add column if not exists payload jsonb default '{}'::jsonb;
alter table public.care_households add column if not exists created_at timestamptz default now();
alter table public.care_households add column if not exists updated_at timestamptz default now();

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

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.gov_report_snapshots to anon, authenticated;
grant select, insert, update, delete on public.care_households to anon, authenticated;
grant select, insert, update, delete on public.care_response_requests to anon, authenticated;
grant select, insert, update, delete on public.care_response_matches to anon, authenticated;
grant select, insert, update, delete on public.notification_outbox to anon, authenticated;

alter table public.gov_report_snapshots enable row level security;
alter table public.care_households enable row level security;
alter table public.care_response_requests enable row level security;
alter table public.care_response_matches enable row level security;
alter table public.notification_outbox enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'gov_report_snapshots',
    'care_households',
    'care_response_requests',
    'care_response_matches',
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
