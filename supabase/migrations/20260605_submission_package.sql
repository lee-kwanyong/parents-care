create extension if not exists pgcrypto;

create table if not exists public.gov_submission_packages (
  id uuid primary key default gen_random_uuid(),
  package_type text default 'gov_submission',
  period_key text,
  period_start date,
  period_end date,
  title text,
  summary text,
  status text default 'created',
  ready_score integer default 0,
  checklist jsonb default '[]'::jsonb,
  metrics jsonb default '{}'::jsonb,
  files_manifest jsonb default '[]'::jsonb,
  payload jsonb default '{}'::jsonb,
  created_by text default '운영실',
  created_at timestamptz default now()
);

alter table public.gov_submission_packages add column if not exists package_type text default 'gov_submission';
alter table public.gov_submission_packages add column if not exists period_key text;
alter table public.gov_submission_packages add column if not exists period_start date;
alter table public.gov_submission_packages add column if not exists period_end date;
alter table public.gov_submission_packages add column if not exists title text;
alter table public.gov_submission_packages add column if not exists summary text;
alter table public.gov_submission_packages add column if not exists status text default 'created';
alter table public.gov_submission_packages add column if not exists ready_score integer default 0;
alter table public.gov_submission_packages add column if not exists checklist jsonb default '[]'::jsonb;
alter table public.gov_submission_packages add column if not exists metrics jsonb default '{}'::jsonb;
alter table public.gov_submission_packages add column if not exists files_manifest jsonb default '[]'::jsonb;
alter table public.gov_submission_packages add column if not exists payload jsonb default '{}'::jsonb;
alter table public.gov_submission_packages add column if not exists created_by text default '운영실';
alter table public.gov_submission_packages add column if not exists created_at timestamptz default now();

create index if not exists idx_gov_submission_packages_created
  on public.gov_submission_packages(created_at desc);

create index if not exists idx_gov_submission_packages_period
  on public.gov_submission_packages(period_start, period_end, created_at desc);

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
alter table public.care_response_requests add column if not exists guardian_name text;
alter table public.care_response_requests add column if not exists request_type text;
alter table public.care_response_requests add column if not exists risk_level text default 'medium';
alter table public.care_response_requests add column if not exists status text default 'open';
alter table public.care_response_requests add column if not exists completed_at timestamptz;
alter table public.care_response_requests add column if not exists created_at timestamptz default now();

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

alter table public.notification_outbox add column if not exists archived_at timestamptz;
alter table public.notification_outbox add column if not exists archived_by text;
alter table public.notification_outbox add column if not exists archived_reason text;
alter table public.notification_outbox alter column template_code drop not null;
alter table public.notification_outbox alter column template_code set default '';

create table if not exists public.privacy_access_logs (
  id uuid primary key default gen_random_uuid(),
  actor_type text default 'ops',
  actor_name text,
  action_type text default 'view',
  target_type text default 'household',
  target_id uuid,
  family_code text,
  target_name text,
  purpose text,
  legal_basis text default 'service_operation',
  fields_accessed text[] default '{}'::text[],
  route_path text,
  ip_hash text,
  user_agent text,
  result_status text default 'recorded',
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.privacy_consent_records (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  target_id uuid,
  subject_type text default 'parent',
  subject_name text,
  subject_phone text,
  consent_type text default 'care_service',
  consent_status text default 'pending',
  consent_version text default '2026-06-v1',
  collected_by text default '운영실',
  collected_via text default 'ops',
  evidence_note text,
  consented_at timestamptz,
  revoked_at timestamptz,
  expires_at timestamptz,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

grant usage on schema public to service_role;
grant select, insert, update, delete on public.gov_submission_packages to service_role;
grant select, insert, update, delete on public.gov_report_snapshots to service_role;
grant select, insert, update, delete on public.care_households to service_role;
grant select, insert, update, delete on public.care_response_requests to service_role;
grant select, insert, update, delete on public.care_response_matches to service_role;
grant select, insert, update, delete on public.care_providers to service_role;
grant select, insert, update, delete on public.notification_outbox to service_role;
grant select, insert, update, delete on public.privacy_access_logs to service_role;
grant select, insert, update, delete on public.privacy_consent_records to service_role;

alter table public.gov_submission_packages enable row level security;

drop policy if exists "gov_submission_packages_deny_frontend_select" on public.gov_submission_packages;
drop policy if exists "gov_submission_packages_deny_frontend_insert" on public.gov_submission_packages;
drop policy if exists "gov_submission_packages_deny_frontend_update" on public.gov_submission_packages;
drop policy if exists "gov_submission_packages_deny_frontend_delete" on public.gov_submission_packages;

create policy "gov_submission_packages_deny_frontend_select"
  on public.gov_submission_packages
  for select
  to anon, authenticated
  using (false);

create policy "gov_submission_packages_deny_frontend_insert"
  on public.gov_submission_packages
  for insert
  to anon, authenticated
  with check (false);

create policy "gov_submission_packages_deny_frontend_update"
  on public.gov_submission_packages
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "gov_submission_packages_deny_frontend_delete"
  on public.gov_submission_packages
  for delete
  to anon, authenticated
  using (false);

notify pgrst, 'reload schema';
select pg_sleep(1);
notify pgrst, 'reload schema';
