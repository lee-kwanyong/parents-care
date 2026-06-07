create extension if not exists pgcrypto;

create table if not exists public.ops_private_pilots (
  id uuid primary key default gen_random_uuid(),
  pilot_key text not null unique,
  title text not null,
  status text default 'draft',
  start_date date,
  end_date date,
  target_households integer default 10,
  target_providers integer default 2,
  owner_name text default '운영실',
  notes text,
  payload jsonb default '{}'::jsonb,
  created_by text default '운영실',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.ops_private_pilots add column if not exists pilot_key text;
alter table public.ops_private_pilots add column if not exists title text;
alter table public.ops_private_pilots add column if not exists status text default 'draft';
alter table public.ops_private_pilots add column if not exists start_date date;
alter table public.ops_private_pilots add column if not exists end_date date;
alter table public.ops_private_pilots add column if not exists target_households integer default 10;
alter table public.ops_private_pilots add column if not exists target_providers integer default 2;
alter table public.ops_private_pilots add column if not exists owner_name text default '운영실';
alter table public.ops_private_pilots add column if not exists notes text;
alter table public.ops_private_pilots add column if not exists payload jsonb default '{}'::jsonb;
alter table public.ops_private_pilots add column if not exists created_by text default '운영실';
alter table public.ops_private_pilots add column if not exists created_at timestamptz default now();
alter table public.ops_private_pilots add column if not exists updated_at timestamptz default now();

create unique index if not exists idx_ops_private_pilots_key
  on public.ops_private_pilots(pilot_key);

create index if not exists idx_ops_private_pilots_status
  on public.ops_private_pilots(status, start_date desc);

create table if not exists public.ops_private_pilot_households (
  id uuid primary key default gen_random_uuid(),
  pilot_id uuid,
  pilot_key text,
  family_code text not null,
  parent_name text,
  parent_phone text,
  guardian_name text,
  guardian_phone text,
  guardian_email text,
  service_area text,
  address_hint text,
  group_label text default 'mini',
  status text default 'onboarding',
  onboarding_url text,
  notes text,
  payload jsonb default '{}'::jsonb,
  created_by text default '운영실',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.ops_private_pilot_households add column if not exists pilot_id uuid;
alter table public.ops_private_pilot_households add column if not exists pilot_key text;
alter table public.ops_private_pilot_households add column if not exists family_code text;
alter table public.ops_private_pilot_households add column if not exists parent_name text;
alter table public.ops_private_pilot_households add column if not exists parent_phone text;
alter table public.ops_private_pilot_households add column if not exists guardian_name text;
alter table public.ops_private_pilot_households add column if not exists guardian_phone text;
alter table public.ops_private_pilot_households add column if not exists guardian_email text;
alter table public.ops_private_pilot_households add column if not exists service_area text;
alter table public.ops_private_pilot_households add column if not exists address_hint text;
alter table public.ops_private_pilot_households add column if not exists group_label text default 'mini';
alter table public.ops_private_pilot_households add column if not exists status text default 'onboarding';
alter table public.ops_private_pilot_households add column if not exists onboarding_url text;
alter table public.ops_private_pilot_households add column if not exists notes text;
alter table public.ops_private_pilot_households add column if not exists payload jsonb default '{}'::jsonb;
alter table public.ops_private_pilot_households add column if not exists created_by text default '운영실';
alter table public.ops_private_pilot_households add column if not exists created_at timestamptz default now();
alter table public.ops_private_pilot_households add column if not exists updated_at timestamptz default now();

create unique index if not exists idx_ops_private_pilot_households_unique
  on public.ops_private_pilot_households(pilot_key, family_code);

create index if not exists idx_ops_private_pilot_households_status
  on public.ops_private_pilot_households(pilot_key, status, created_at desc);

create table if not exists public.ops_private_pilot_reports (
  id uuid primary key default gen_random_uuid(),
  pilot_id uuid,
  pilot_key text,
  report_type text default 'mini_report',
  status text default 'recorded',
  title text,
  summary text,
  metrics jsonb default '{}'::jsonb,
  households jsonb default '[]'::jsonb,
  requests jsonb default '[]'::jsonb,
  messages jsonb default '[]'::jsonb,
  payload jsonb default '{}'::jsonb,
  created_by text default '운영실',
  created_at timestamptz default now()
);

alter table public.ops_private_pilot_reports add column if not exists pilot_id uuid;
alter table public.ops_private_pilot_reports add column if not exists pilot_key text;
alter table public.ops_private_pilot_reports add column if not exists report_type text default 'mini_report';
alter table public.ops_private_pilot_reports add column if not exists status text default 'recorded';
alter table public.ops_private_pilot_reports add column if not exists title text;
alter table public.ops_private_pilot_reports add column if not exists summary text;
alter table public.ops_private_pilot_reports add column if not exists metrics jsonb default '{}'::jsonb;
alter table public.ops_private_pilot_reports add column if not exists households jsonb default '[]'::jsonb;
alter table public.ops_private_pilot_reports add column if not exists requests jsonb default '[]'::jsonb;
alter table public.ops_private_pilot_reports add column if not exists messages jsonb default '[]'::jsonb;
alter table public.ops_private_pilot_reports add column if not exists payload jsonb default '{}'::jsonb;
alter table public.ops_private_pilot_reports add column if not exists created_by text default '운영실';
alter table public.ops_private_pilot_reports add column if not exists created_at timestamptz default now();

create index if not exists idx_ops_private_pilot_reports_created
  on public.ops_private_pilot_reports(pilot_key, created_at desc);

grant usage on schema public to service_role;
grant select, insert, update, delete on public.ops_private_pilots to service_role;
grant select, insert, update, delete on public.ops_private_pilot_households to service_role;
grant select, insert, update, delete on public.ops_private_pilot_reports to service_role;

alter table public.ops_private_pilots enable row level security;
alter table public.ops_private_pilot_households enable row level security;
alter table public.ops_private_pilot_reports enable row level security;

drop policy if exists "ops_private_pilots_no_frontend_select" on public.ops_private_pilots;
drop policy if exists "ops_private_pilots_no_frontend_insert" on public.ops_private_pilots;
drop policy if exists "ops_private_pilots_no_frontend_update" on public.ops_private_pilots;
drop policy if exists "ops_private_pilots_no_frontend_delete" on public.ops_private_pilots;

create policy "ops_private_pilots_no_frontend_select"
  on public.ops_private_pilots
  for select
  to anon, authenticated
  using (false);

create policy "ops_private_pilots_no_frontend_insert"
  on public.ops_private_pilots
  for insert
  to anon, authenticated
  with check (false);

create policy "ops_private_pilots_no_frontend_update"
  on public.ops_private_pilots
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "ops_private_pilots_no_frontend_delete"
  on public.ops_private_pilots
  for delete
  to anon, authenticated
  using (false);

drop policy if exists "ops_private_pilot_households_no_frontend_select" on public.ops_private_pilot_households;
drop policy if exists "ops_private_pilot_households_no_frontend_insert" on public.ops_private_pilot_households;
drop policy if exists "ops_private_pilot_households_no_frontend_update" on public.ops_private_pilot_households;
drop policy if exists "ops_private_pilot_households_no_frontend_delete" on public.ops_private_pilot_households;

create policy "ops_private_pilot_households_no_frontend_select"
  on public.ops_private_pilot_households
  for select
  to anon, authenticated
  using (false);

create policy "ops_private_pilot_households_no_frontend_insert"
  on public.ops_private_pilot_households
  for insert
  to anon, authenticated
  with check (false);

create policy "ops_private_pilot_households_no_frontend_update"
  on public.ops_private_pilot_households
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "ops_private_pilot_households_no_frontend_delete"
  on public.ops_private_pilot_households
  for delete
  to anon, authenticated
  using (false);

drop policy if exists "ops_private_pilot_reports_no_frontend_select" on public.ops_private_pilot_reports;
drop policy if exists "ops_private_pilot_reports_no_frontend_insert" on public.ops_private_pilot_reports;
drop policy if exists "ops_private_pilot_reports_no_frontend_update" on public.ops_private_pilot_reports;
drop policy if exists "ops_private_pilot_reports_no_frontend_delete" on public.ops_private_pilot_reports;

create policy "ops_private_pilot_reports_no_frontend_select"
  on public.ops_private_pilot_reports
  for select
  to anon, authenticated
  using (false);

create policy "ops_private_pilot_reports_no_frontend_insert"
  on public.ops_private_pilot_reports
  for insert
  to anon, authenticated
  with check (false);

create policy "ops_private_pilot_reports_no_frontend_update"
  on public.ops_private_pilot_reports
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "ops_private_pilot_reports_no_frontend_delete"
  on public.ops_private_pilot_reports
  for delete
  to anon, authenticated
  using (false);

insert into public.ops_private_pilot_reports (
  pilot_key,
  report_type,
  status,
  title,
  summary,
  payload,
  created_by
)
values (
  'template',
  'private_pilot_sql',
  'applied',
  '자체 예비 실증 관리센터 초기화',
  '5~10가구 자체 예비 실증 관리, 모바일 앱 링크, 안부 신호, 긴급 요청, 문자 대기열, 미니 리포트 생성을 위한 테이블을 생성했습니다.',
  jsonb_build_object('purpose', '지자체 제안 전 자체 실증 증거 확보'),
  'Supabase SQL Editor'
);

notify pgrst, 'reload schema';
select pg_sleep(1);
notify pgrst, 'reload schema';
