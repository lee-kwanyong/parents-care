create extension if not exists pgcrypto;

create table if not exists public.ops_preflight_test_runs (
  id uuid primary key default gen_random_uuid(),
  run_type text default 'full_preflight',
  status text default 'recorded',
  score integer default 0,
  summary text,
  metrics jsonb default '{}'::jsonb,
  results jsonb default '[]'::jsonb,
  cleanup_results jsonb default '[]'::jsonb,
  payload jsonb default '{}'::jsonb,
  created_by text default '운영실',
  created_at timestamptz default now()
);

alter table public.ops_preflight_test_runs add column if not exists run_type text default 'full_preflight';
alter table public.ops_preflight_test_runs add column if not exists status text default 'recorded';
alter table public.ops_preflight_test_runs add column if not exists score integer default 0;
alter table public.ops_preflight_test_runs add column if not exists summary text;
alter table public.ops_preflight_test_runs add column if not exists metrics jsonb default '{}'::jsonb;
alter table public.ops_preflight_test_runs add column if not exists results jsonb default '[]'::jsonb;
alter table public.ops_preflight_test_runs add column if not exists cleanup_results jsonb default '[]'::jsonb;
alter table public.ops_preflight_test_runs add column if not exists payload jsonb default '{}'::jsonb;
alter table public.ops_preflight_test_runs add column if not exists created_by text default '운영실';
alter table public.ops_preflight_test_runs add column if not exists created_at timestamptz default now();

create index if not exists idx_ops_preflight_test_runs_created
  on public.ops_preflight_test_runs(created_at desc);

grant usage on schema public to service_role;
grant select, insert, update, delete on public.ops_preflight_test_runs to service_role;

alter table public.ops_preflight_test_runs enable row level security;

drop policy if exists "ops_preflight_test_runs_no_frontend_select" on public.ops_preflight_test_runs;
drop policy if exists "ops_preflight_test_runs_no_frontend_insert" on public.ops_preflight_test_runs;
drop policy if exists "ops_preflight_test_runs_no_frontend_update" on public.ops_preflight_test_runs;
drop policy if exists "ops_preflight_test_runs_no_frontend_delete" on public.ops_preflight_test_runs;

create policy "ops_preflight_test_runs_no_frontend_select"
  on public.ops_preflight_test_runs
  for select
  to anon, authenticated
  using (false);

create policy "ops_preflight_test_runs_no_frontend_insert"
  on public.ops_preflight_test_runs
  for insert
  to anon, authenticated
  with check (false);

create policy "ops_preflight_test_runs_no_frontend_update"
  on public.ops_preflight_test_runs
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "ops_preflight_test_runs_no_frontend_delete"
  on public.ops_preflight_test_runs
  for delete
  to anon, authenticated
  using (false);

insert into public.ops_preflight_test_runs (
  run_type,
  status,
  score,
  summary,
  payload,
  created_by
)
values (
  'preflight_sql',
  'applied',
  0,
  '실증 전 전체 기능 테스트 테이블을 생성했습니다.',
  jsonb_build_object(
    'purpose', '실증 전 앱·운영실·API·DB·PWA·요양보호사 토큰 흐름 자동 검증'
  ),
  'Supabase SQL Editor'
);

notify pgrst, 'reload schema';
select pg_sleep(1);
notify pgrst, 'reload schema';
