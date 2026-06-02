create extension if not exists pgcrypto;

create table if not exists public.gov_submission_packages (
  id uuid primary key default gen_random_uuid(),
  package_type text default 'gov_rnd_submission_v1',
  project_title text,
  target_track text,
  target_region text,
  target_households integer default 100,
  pilot_months integer default 6,
  requested_budget_krw integer default 100000000,
  summary text,
  proposal_md text,
  pilot_plan_md text,
  kpi_md text,
  security_md text,
  email_md text,
  status text default 'draft',
  created_by_name text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.gov_submission_packages add column if not exists package_type text default 'gov_rnd_submission_v1';
alter table public.gov_submission_packages add column if not exists project_title text;
alter table public.gov_submission_packages add column if not exists target_track text;
alter table public.gov_submission_packages add column if not exists target_region text;
alter table public.gov_submission_packages add column if not exists target_households integer default 100;
alter table public.gov_submission_packages add column if not exists pilot_months integer default 6;
alter table public.gov_submission_packages add column if not exists requested_budget_krw integer default 100000000;
alter table public.gov_submission_packages add column if not exists summary text;
alter table public.gov_submission_packages add column if not exists proposal_md text;
alter table public.gov_submission_packages add column if not exists pilot_plan_md text;
alter table public.gov_submission_packages add column if not exists kpi_md text;
alter table public.gov_submission_packages add column if not exists security_md text;
alter table public.gov_submission_packages add column if not exists email_md text;
alter table public.gov_submission_packages add column if not exists status text default 'draft';
alter table public.gov_submission_packages add column if not exists created_by_name text;
alter table public.gov_submission_packages add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.gov_submission_packages add column if not exists created_at timestamptz default now();
alter table public.gov_submission_packages add column if not exists updated_at timestamptz default now();

create index if not exists idx_gov_submission_packages_type
  on public.gov_submission_packages(package_type);

create index if not exists idx_gov_submission_packages_status
  on public.gov_submission_packages(status);

create index if not exists idx_gov_submission_packages_created
  on public.gov_submission_packages(created_at desc);

create table if not exists public.gov_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_name text,
  actor_role text,
  action_type text,
  target_type text,
  target_id text,
  family_code text,
  description text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.gov_audit_logs add column if not exists actor_name text;
alter table public.gov_audit_logs add column if not exists actor_role text;
alter table public.gov_audit_logs add column if not exists action_type text;
alter table public.gov_audit_logs add column if not exists target_type text;
alter table public.gov_audit_logs add column if not exists target_id text;
alter table public.gov_audit_logs add column if not exists family_code text;
alter table public.gov_audit_logs add column if not exists description text;
alter table public.gov_audit_logs add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.gov_audit_logs add column if not exists created_at timestamptz default now();

alter table public.gov_submission_packages enable row level security;
alter table public.gov_audit_logs enable row level security;

drop policy if exists "gov_submission_packages_select_all" on public.gov_submission_packages;
drop policy if exists "gov_submission_packages_insert_all" on public.gov_submission_packages;
drop policy if exists "gov_submission_packages_update_all" on public.gov_submission_packages;

create policy "gov_submission_packages_select_all"
  on public.gov_submission_packages
  for select
  to anon, authenticated
  using (true);

create policy "gov_submission_packages_insert_all"
  on public.gov_submission_packages
  for insert
  to anon, authenticated
  with check (true);

create policy "gov_submission_packages_update_all"
  on public.gov_submission_packages
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "gov_audit_logs_select_all" on public.gov_audit_logs;
drop policy if exists "gov_audit_logs_insert_all" on public.gov_audit_logs;

create policy "gov_audit_logs_select_all"
  on public.gov_audit_logs
  for select
  to anon, authenticated
  using (true);

create policy "gov_audit_logs_insert_all"
  on public.gov_audit_logs
  for insert
  to anon, authenticated
  with check (true);

notify pgrst, 'reload schema';
