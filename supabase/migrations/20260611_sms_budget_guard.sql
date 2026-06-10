create extension if not exists pgcrypto;

create table if not exists public.ops_sms_budget_guard_settings (
  id uuid primary key default gen_random_uuid(),
  daily_limit integer default 30,
  per_family_daily_limit integer default 3,
  point_per_sms integer default 18,
  point_budget integer default 500,
  test_mode boolean default true,
  auto_dispatch_allowed boolean default false,
  allowed_test_phones jsonb default '[]'::jsonb,
  notification_phone text,
  notes text,
  created_by text default '운영실',
  created_at timestamptz default now()
);

alter table public.ops_sms_budget_guard_settings add column if not exists daily_limit integer default 30;
alter table public.ops_sms_budget_guard_settings add column if not exists per_family_daily_limit integer default 3;
alter table public.ops_sms_budget_guard_settings add column if not exists point_per_sms integer default 18;
alter table public.ops_sms_budget_guard_settings add column if not exists point_budget integer default 500;
alter table public.ops_sms_budget_guard_settings add column if not exists test_mode boolean default true;
alter table public.ops_sms_budget_guard_settings add column if not exists auto_dispatch_allowed boolean default false;
alter table public.ops_sms_budget_guard_settings add column if not exists allowed_test_phones jsonb default '[]'::jsonb;
alter table public.ops_sms_budget_guard_settings add column if not exists notification_phone text;
alter table public.ops_sms_budget_guard_settings add column if not exists notes text;
alter table public.ops_sms_budget_guard_settings add column if not exists created_by text default '운영실';
alter table public.ops_sms_budget_guard_settings add column if not exists created_at timestamptz default now();

create index if not exists idx_ops_sms_budget_guard_settings_created
  on public.ops_sms_budget_guard_settings(created_at desc);

create table if not exists public.ops_sms_budget_guard_runs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  status text default 'recorded',
  summary text,
  metrics jsonb default '{}'::jsonb,
  affected_ids jsonb default '[]'::jsonb,
  results jsonb default '[]'::jsonb,
  payload jsonb default '{}'::jsonb,
  created_by text default '운영실',
  created_at timestamptz default now()
);

alter table public.ops_sms_budget_guard_runs add column if not exists action text;
alter table public.ops_sms_budget_guard_runs add column if not exists status text default 'recorded';
alter table public.ops_sms_budget_guard_runs add column if not exists summary text;
alter table public.ops_sms_budget_guard_runs add column if not exists metrics jsonb default '{}'::jsonb;
alter table public.ops_sms_budget_guard_runs add column if not exists affected_ids jsonb default '[]'::jsonb;
alter table public.ops_sms_budget_guard_runs add column if not exists results jsonb default '[]'::jsonb;
alter table public.ops_sms_budget_guard_runs add column if not exists payload jsonb default '{}'::jsonb;
alter table public.ops_sms_budget_guard_runs add column if not exists created_by text default '운영실';
alter table public.ops_sms_budget_guard_runs add column if not exists created_at timestamptz default now();

create index if not exists idx_ops_sms_budget_guard_runs_created
  on public.ops_sms_budget_guard_runs(created_at desc);

grant usage on schema public to service_role;
grant select, insert, update, delete on public.ops_sms_budget_guard_settings to service_role;
grant select, insert, update, delete on public.ops_sms_budget_guard_runs to service_role;

alter table public.ops_sms_budget_guard_settings enable row level security;
alter table public.ops_sms_budget_guard_runs enable row level security;

drop policy if exists "ops_sms_budget_guard_settings_no_frontend_select" on public.ops_sms_budget_guard_settings;
drop policy if exists "ops_sms_budget_guard_settings_no_frontend_insert" on public.ops_sms_budget_guard_settings;
drop policy if exists "ops_sms_budget_guard_settings_no_frontend_update" on public.ops_sms_budget_guard_settings;
drop policy if exists "ops_sms_budget_guard_settings_no_frontend_delete" on public.ops_sms_budget_guard_settings;

create policy "ops_sms_budget_guard_settings_no_frontend_select"
  on public.ops_sms_budget_guard_settings
  for select
  to anon, authenticated
  using (false);

create policy "ops_sms_budget_guard_settings_no_frontend_insert"
  on public.ops_sms_budget_guard_settings
  for insert
  to anon, authenticated
  with check (false);

create policy "ops_sms_budget_guard_settings_no_frontend_update"
  on public.ops_sms_budget_guard_settings
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "ops_sms_budget_guard_settings_no_frontend_delete"
  on public.ops_sms_budget_guard_settings
  for delete
  to anon, authenticated
  using (false);

drop policy if exists "ops_sms_budget_guard_runs_no_frontend_select" on public.ops_sms_budget_guard_runs;
drop policy if exists "ops_sms_budget_guard_runs_no_frontend_insert" on public.ops_sms_budget_guard_runs;
drop policy if exists "ops_sms_budget_guard_runs_no_frontend_update" on public.ops_sms_budget_guard_runs;
drop policy if exists "ops_sms_budget_guard_runs_no_frontend_delete" on public.ops_sms_budget_guard_runs;

create policy "ops_sms_budget_guard_runs_no_frontend_select"
  on public.ops_sms_budget_guard_runs
  for select
  to anon, authenticated
  using (false);

create policy "ops_sms_budget_guard_runs_no_frontend_insert"
  on public.ops_sms_budget_guard_runs
  for insert
  to anon, authenticated
  with check (false);

create policy "ops_sms_budget_guard_runs_no_frontend_update"
  on public.ops_sms_budget_guard_runs
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "ops_sms_budget_guard_runs_no_frontend_delete"
  on public.ops_sms_budget_guard_runs
  for delete
  to anon, authenticated
  using (false);

insert into public.ops_sms_budget_guard_settings (
  daily_limit,
  per_family_daily_limit,
  point_per_sms,
  point_budget,
  test_mode,
  auto_dispatch_allowed,
  allowed_test_phones,
  notification_phone,
  notes,
  created_by
)
select
  30,
  3,
  18,
  500,
  true,
  false,
  jsonb_build_array('01046390336'),
  '01046390336',
  '실증 초기 기본값: 테스트 번호만 허용, 자동발송 OFF',
  'Supabase SQL Editor'
where not exists (
  select 1 from public.ops_sms_budget_guard_settings
);

insert into public.ops_sms_budget_guard_runs (
  action,
  status,
  summary,
  payload,
  created_by
)
values (
  'schema_applied',
  'ok',
  '문자 비용·자동발송 보호센터 테이블을 생성했습니다.',
  jsonb_build_object(
    'purpose', '하루 문자 한도, 가구당 문자 한도, 테스트 번호 모드, 위험 대기열 취소'
  ),
  'Supabase SQL Editor'
);

notify pgrst, 'reload schema';
