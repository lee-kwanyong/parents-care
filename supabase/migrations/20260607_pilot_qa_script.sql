create extension if not exists pgcrypto;

create table if not exists public.ops_pilot_qa_checks (
  id uuid primary key default gen_random_uuid(),
  item_key text not null unique,
  category text,
  title text,
  status text default 'pending',
  critical boolean default false,
  note text,
  completed_by text,
  completed_at timestamptz,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.ops_pilot_qa_checks add column if not exists item_key text;
alter table public.ops_pilot_qa_checks add column if not exists category text;
alter table public.ops_pilot_qa_checks add column if not exists title text;
alter table public.ops_pilot_qa_checks add column if not exists status text default 'pending';
alter table public.ops_pilot_qa_checks add column if not exists critical boolean default false;
alter table public.ops_pilot_qa_checks add column if not exists note text;
alter table public.ops_pilot_qa_checks add column if not exists completed_by text;
alter table public.ops_pilot_qa_checks add column if not exists completed_at timestamptz;
alter table public.ops_pilot_qa_checks add column if not exists payload jsonb default '{}'::jsonb;
alter table public.ops_pilot_qa_checks add column if not exists created_at timestamptz default now();
alter table public.ops_pilot_qa_checks add column if not exists updated_at timestamptz default now();

create unique index if not exists idx_ops_pilot_qa_checks_item_key
  on public.ops_pilot_qa_checks(item_key);

create index if not exists idx_ops_pilot_qa_checks_status
  on public.ops_pilot_qa_checks(status, critical, updated_at desc);

create table if not exists public.ops_pilot_qa_runs (
  id uuid primary key default gen_random_uuid(),
  run_type text default 'qa_snapshot',
  status text default 'recorded',
  score integer default 0,
  summary text,
  metrics jsonb default '{}'::jsonb,
  checklist jsonb default '[]'::jsonb,
  demo_script jsonb default '[]'::jsonb,
  payload jsonb default '{}'::jsonb,
  created_by text default '운영실',
  created_at timestamptz default now()
);

alter table public.ops_pilot_qa_runs add column if not exists run_type text default 'qa_snapshot';
alter table public.ops_pilot_qa_runs add column if not exists status text default 'recorded';
alter table public.ops_pilot_qa_runs add column if not exists score integer default 0;
alter table public.ops_pilot_qa_runs add column if not exists summary text;
alter table public.ops_pilot_qa_runs add column if not exists metrics jsonb default '{}'::jsonb;
alter table public.ops_pilot_qa_runs add column if not exists checklist jsonb default '[]'::jsonb;
alter table public.ops_pilot_qa_runs add column if not exists demo_script jsonb default '[]'::jsonb;
alter table public.ops_pilot_qa_runs add column if not exists payload jsonb default '{}'::jsonb;
alter table public.ops_pilot_qa_runs add column if not exists created_by text default '운영실';
alter table public.ops_pilot_qa_runs add column if not exists created_at timestamptz default now();

create index if not exists idx_ops_pilot_qa_runs_created
  on public.ops_pilot_qa_runs(created_at desc);

grant usage on schema public to service_role;
grant select, insert, update, delete on public.ops_pilot_qa_checks to service_role;
grant select, insert, update, delete on public.ops_pilot_qa_runs to service_role;

alter table public.ops_pilot_qa_checks enable row level security;
alter table public.ops_pilot_qa_runs enable row level security;

drop policy if exists "ops_pilot_qa_checks_no_frontend_select" on public.ops_pilot_qa_checks;
drop policy if exists "ops_pilot_qa_checks_no_frontend_insert" on public.ops_pilot_qa_checks;
drop policy if exists "ops_pilot_qa_checks_no_frontend_update" on public.ops_pilot_qa_checks;
drop policy if exists "ops_pilot_qa_checks_no_frontend_delete" on public.ops_pilot_qa_checks;

create policy "ops_pilot_qa_checks_no_frontend_select"
  on public.ops_pilot_qa_checks
  for select
  to anon, authenticated
  using (false);

create policy "ops_pilot_qa_checks_no_frontend_insert"
  on public.ops_pilot_qa_checks
  for insert
  to anon, authenticated
  with check (false);

create policy "ops_pilot_qa_checks_no_frontend_update"
  on public.ops_pilot_qa_checks
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "ops_pilot_qa_checks_no_frontend_delete"
  on public.ops_pilot_qa_checks
  for delete
  to anon, authenticated
  using (false);

drop policy if exists "ops_pilot_qa_runs_no_frontend_select" on public.ops_pilot_qa_runs;
drop policy if exists "ops_pilot_qa_runs_no_frontend_insert" on public.ops_pilot_qa_runs;
drop policy if exists "ops_pilot_qa_runs_no_frontend_update" on public.ops_pilot_qa_runs;
drop policy if exists "ops_pilot_qa_runs_no_frontend_delete" on public.ops_pilot_qa_runs;

create policy "ops_pilot_qa_runs_no_frontend_select"
  on public.ops_pilot_qa_runs
  for select
  to anon, authenticated
  using (false);

create policy "ops_pilot_qa_runs_no_frontend_insert"
  on public.ops_pilot_qa_runs
  for insert
  to anon, authenticated
  with check (false);

create policy "ops_pilot_qa_runs_no_frontend_update"
  on public.ops_pilot_qa_runs
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "ops_pilot_qa_runs_no_frontend_delete"
  on public.ops_pilot_qa_runs
  for delete
  to anon, authenticated
  using (false);

insert into public.ops_pilot_qa_runs (
  run_type,
  status,
  score,
  summary,
  payload,
  created_by
)
values (
  'pilot_qa_sql',
  'applied',
  0,
  '실증 QA 체크리스트와 시연 스크립트 테이블을 생성했습니다.',
  jsonb_build_object(
    'purpose', '지자체 실증 전 필수 QA와 발표 스크립트 관리'
  ),
  'Supabase SQL Editor'
);

notify pgrst, 'reload schema';
select pg_sleep(1);
notify pgrst, 'reload schema';
