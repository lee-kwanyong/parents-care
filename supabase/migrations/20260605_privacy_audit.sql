create extension if not exists pgcrypto;

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

alter table public.privacy_access_logs add column if not exists actor_type text default 'ops';
alter table public.privacy_access_logs add column if not exists actor_name text;
alter table public.privacy_access_logs add column if not exists action_type text default 'view';
alter table public.privacy_access_logs add column if not exists target_type text default 'household';
alter table public.privacy_access_logs add column if not exists target_id uuid;
alter table public.privacy_access_logs add column if not exists family_code text;
alter table public.privacy_access_logs add column if not exists target_name text;
alter table public.privacy_access_logs add column if not exists purpose text;
alter table public.privacy_access_logs add column if not exists legal_basis text default 'service_operation';
alter table public.privacy_access_logs add column if not exists fields_accessed text[] default '{}'::text[];
alter table public.privacy_access_logs add column if not exists route_path text;
alter table public.privacy_access_logs add column if not exists ip_hash text;
alter table public.privacy_access_logs add column if not exists user_agent text;
alter table public.privacy_access_logs add column if not exists result_status text default 'recorded';
alter table public.privacy_access_logs add column if not exists payload jsonb default '{}'::jsonb;
alter table public.privacy_access_logs add column if not exists created_at timestamptz default now();

create index if not exists idx_privacy_access_logs_created
  on public.privacy_access_logs(created_at desc);

create index if not exists idx_privacy_access_logs_family
  on public.privacy_access_logs(family_code, created_at desc);

create index if not exists idx_privacy_access_logs_target
  on public.privacy_access_logs(target_type, target_id, created_at desc);

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

alter table public.privacy_consent_records add column if not exists family_code text;
alter table public.privacy_consent_records add column if not exists target_id uuid;
alter table public.privacy_consent_records add column if not exists subject_type text default 'parent';
alter table public.privacy_consent_records add column if not exists subject_name text;
alter table public.privacy_consent_records add column if not exists subject_phone text;
alter table public.privacy_consent_records add column if not exists consent_type text default 'care_service';
alter table public.privacy_consent_records add column if not exists consent_status text default 'pending';
alter table public.privacy_consent_records add column if not exists consent_version text default '2026-06-v1';
alter table public.privacy_consent_records add column if not exists collected_by text default '운영실';
alter table public.privacy_consent_records add column if not exists collected_via text default 'ops';
alter table public.privacy_consent_records add column if not exists evidence_note text;
alter table public.privacy_consent_records add column if not exists consented_at timestamptz;
alter table public.privacy_consent_records add column if not exists revoked_at timestamptz;
alter table public.privacy_consent_records add column if not exists expires_at timestamptz;
alter table public.privacy_consent_records add column if not exists payload jsonb default '{}'::jsonb;
alter table public.privacy_consent_records add column if not exists created_at timestamptz default now();
alter table public.privacy_consent_records add column if not exists updated_at timestamptz default now();

create index if not exists idx_privacy_consent_records_family
  on public.privacy_consent_records(family_code, created_at desc);

create index if not exists idx_privacy_consent_records_status
  on public.privacy_consent_records(consent_status, created_at desc);

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

create index if not exists idx_care_households_privacy
  on public.care_households(consent_status, household_status, family_code);

grant usage on schema public to service_role;
grant select, insert, update, delete on public.privacy_access_logs to service_role;
grant select, insert, update, delete on public.privacy_consent_records to service_role;
grant select, insert, update, delete on public.care_households to service_role;

alter table public.privacy_access_logs enable row level security;
alter table public.privacy_consent_records enable row level security;

drop policy if exists "privacy_access_logs_deny_frontend_select" on public.privacy_access_logs;
drop policy if exists "privacy_access_logs_deny_frontend_insert" on public.privacy_access_logs;
drop policy if exists "privacy_access_logs_deny_frontend_update" on public.privacy_access_logs;
drop policy if exists "privacy_access_logs_deny_frontend_delete" on public.privacy_access_logs;

create policy "privacy_access_logs_deny_frontend_select"
  on public.privacy_access_logs
  for select
  to anon, authenticated
  using (false);

create policy "privacy_access_logs_deny_frontend_insert"
  on public.privacy_access_logs
  for insert
  to anon, authenticated
  with check (false);

create policy "privacy_access_logs_deny_frontend_update"
  on public.privacy_access_logs
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "privacy_access_logs_deny_frontend_delete"
  on public.privacy_access_logs
  for delete
  to anon, authenticated
  using (false);

drop policy if exists "privacy_consent_records_deny_frontend_select" on public.privacy_consent_records;
drop policy if exists "privacy_consent_records_deny_frontend_insert" on public.privacy_consent_records;
drop policy if exists "privacy_consent_records_deny_frontend_update" on public.privacy_consent_records;
drop policy if exists "privacy_consent_records_deny_frontend_delete" on public.privacy_consent_records;

create policy "privacy_consent_records_deny_frontend_select"
  on public.privacy_consent_records
  for select
  to anon, authenticated
  using (false);

create policy "privacy_consent_records_deny_frontend_insert"
  on public.privacy_consent_records
  for insert
  to anon, authenticated
  with check (false);

create policy "privacy_consent_records_deny_frontend_update"
  on public.privacy_consent_records
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "privacy_consent_records_deny_frontend_delete"
  on public.privacy_consent_records
  for delete
  to anon, authenticated
  using (false);

notify pgrst, 'reload schema';
select pg_sleep(1);
notify pgrst, 'reload schema';
