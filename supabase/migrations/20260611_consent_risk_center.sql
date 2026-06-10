create extension if not exists pgcrypto;

create table if not exists public.pilot_consent_records (
  id uuid primary key default gen_random_uuid(),
  role text,
  family_code text,
  name text,
  phone text,
  guardian_name text,
  guardian_phone text,
  consent_status text default 'agreed',
  consent_version text default '2026-06-11-v1',
  agreed_items jsonb default '[]'::jsonb,
  source text default 'consent_page',
  path text,
  ip_hash text,
  user_agent text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.pilot_consent_records add column if not exists role text;
alter table public.pilot_consent_records add column if not exists family_code text;
alter table public.pilot_consent_records add column if not exists name text;
alter table public.pilot_consent_records add column if not exists phone text;
alter table public.pilot_consent_records add column if not exists guardian_name text;
alter table public.pilot_consent_records add column if not exists guardian_phone text;
alter table public.pilot_consent_records add column if not exists consent_status text default 'agreed';
alter table public.pilot_consent_records add column if not exists consent_version text default '2026-06-11-v1';
alter table public.pilot_consent_records add column if not exists agreed_items jsonb default '[]'::jsonb;
alter table public.pilot_consent_records add column if not exists source text default 'consent_page';
alter table public.pilot_consent_records add column if not exists path text;
alter table public.pilot_consent_records add column if not exists ip_hash text;
alter table public.pilot_consent_records add column if not exists user_agent text;
alter table public.pilot_consent_records add column if not exists payload jsonb default '{}'::jsonb;
alter table public.pilot_consent_records add column if not exists created_at timestamptz default now();

create index if not exists idx_pilot_consent_records_created
  on public.pilot_consent_records(created_at desc);

create index if not exists idx_pilot_consent_records_family
  on public.pilot_consent_records(family_code, created_at desc);

create table if not exists public.ops_consent_risk_snapshots (
  id uuid primary key default gen_random_uuid(),
  title text not null default '개인정보·동의·책임범위 점검',
  status text default 'saved',
  consent_version text default '2026-06-11-v1',
  consent_blocks jsonb default '{}'::jsonb,
  risk_items jsonb default '[]'::jsonb,
  checklist jsonb default '[]'::jsonb,
  copy_blocks jsonb default '{}'::jsonb,
  payload jsonb default '{}'::jsonb,
  created_by text default '운영실',
  created_at timestamptz default now()
);

alter table public.ops_consent_risk_snapshots add column if not exists title text default '개인정보·동의·책임범위 점검';
alter table public.ops_consent_risk_snapshots add column if not exists status text default 'saved';
alter table public.ops_consent_risk_snapshots add column if not exists consent_version text default '2026-06-11-v1';
alter table public.ops_consent_risk_snapshots add column if not exists consent_blocks jsonb default '{}'::jsonb;
alter table public.ops_consent_risk_snapshots add column if not exists risk_items jsonb default '[]'::jsonb;
alter table public.ops_consent_risk_snapshots add column if not exists checklist jsonb default '[]'::jsonb;
alter table public.ops_consent_risk_snapshots add column if not exists copy_blocks jsonb default '{}'::jsonb;
alter table public.ops_consent_risk_snapshots add column if not exists payload jsonb default '{}'::jsonb;
alter table public.ops_consent_risk_snapshots add column if not exists created_by text default '운영실';
alter table public.ops_consent_risk_snapshots add column if not exists created_at timestamptz default now();

create index if not exists idx_ops_consent_risk_snapshots_created
  on public.ops_consent_risk_snapshots(created_at desc);

grant usage on schema public to service_role;
grant select, insert, update, delete on public.pilot_consent_records to service_role;
grant select, insert, update, delete on public.ops_consent_risk_snapshots to service_role;

alter table public.pilot_consent_records enable row level security;
alter table public.ops_consent_risk_snapshots enable row level security;

drop policy if exists "pilot_consent_records_no_frontend_select" on public.pilot_consent_records;
drop policy if exists "pilot_consent_records_no_frontend_insert" on public.pilot_consent_records;
drop policy if exists "pilot_consent_records_no_frontend_update" on public.pilot_consent_records;
drop policy if exists "pilot_consent_records_no_frontend_delete" on public.pilot_consent_records;

create policy "pilot_consent_records_no_frontend_select"
  on public.pilot_consent_records
  for select
  to anon, authenticated
  using (false);

create policy "pilot_consent_records_no_frontend_insert"
  on public.pilot_consent_records
  for insert
  to anon, authenticated
  with check (false);

create policy "pilot_consent_records_no_frontend_update"
  on public.pilot_consent_records
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "pilot_consent_records_no_frontend_delete"
  on public.pilot_consent_records
  for delete
  to anon, authenticated
  using (false);

drop policy if exists "ops_consent_risk_snapshots_no_frontend_select" on public.ops_consent_risk_snapshots;
drop policy if exists "ops_consent_risk_snapshots_no_frontend_insert" on public.ops_consent_risk_snapshots;
drop policy if exists "ops_consent_risk_snapshots_no_frontend_update" on public.ops_consent_risk_snapshots;
drop policy if exists "ops_consent_risk_snapshots_no_frontend_delete" on public.ops_consent_risk_snapshots;

create policy "ops_consent_risk_snapshots_no_frontend_select"
  on public.ops_consent_risk_snapshots
  for select
  to anon, authenticated
  using (false);

create policy "ops_consent_risk_snapshots_no_frontend_insert"
  on public.ops_consent_risk_snapshots
  for insert
  to anon, authenticated
  with check (false);

create policy "ops_consent_risk_snapshots_no_frontend_update"
  on public.ops_consent_risk_snapshots
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "ops_consent_risk_snapshots_no_frontend_delete"
  on public.ops_consent_risk_snapshots
  for delete
  to anon, authenticated
  using (false);

insert into public.ops_consent_risk_snapshots (
  title,
  status,
  payload,
  created_by
)
values (
  '개인정보·동의·책임범위 센터 생성',
  'ok',
  jsonb_build_object(
    'purpose', '실증 참여 동의, 비의료 고지, 개인정보 수집 범위, 생활확인 책임범위 정리'
  ),
  'Supabase SQL Editor'
);

notify pgrst, 'reload schema';
