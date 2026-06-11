create extension if not exists pgcrypto;

create table if not exists public.ops_daily_runbook_runs (
  id uuid primary key default gen_random_uuid(),
  run_date text not null,
  action text not null default 'mark_step',
  step_key text,
  step_title text,
  status text default 'completed',
  note text,
  metrics jsonb default '{}'::jsonb,
  checklist jsonb default '[]'::jsonb,
  payload jsonb default '{}'::jsonb,
  created_by text default '운영실',
  created_at timestamptz default now()
);

alter table public.ops_daily_runbook_runs add column if not exists run_date text;
alter table public.ops_daily_runbook_runs add column if not exists action text default 'mark_step';
alter table public.ops_daily_runbook_runs add column if not exists step_key text;
alter table public.ops_daily_runbook_runs add column if not exists step_title text;
alter table public.ops_daily_runbook_runs add column if not exists status text default 'completed';
alter table public.ops_daily_runbook_runs add column if not exists note text;
alter table public.ops_daily_runbook_runs add column if not exists metrics jsonb default '{}'::jsonb;
alter table public.ops_daily_runbook_runs add column if not exists checklist jsonb default '[]'::jsonb;
alter table public.ops_daily_runbook_runs add column if not exists payload jsonb default '{}'::jsonb;
alter table public.ops_daily_runbook_runs add column if not exists created_by text default '운영실';
alter table public.ops_daily_runbook_runs add column if not exists created_at timestamptz default now();

create index if not exists idx_ops_daily_runbook_runs_created
  on public.ops_daily_runbook_runs(created_at desc);

create index if not exists idx_ops_daily_runbook_runs_date
  on public.ops_daily_runbook_runs(run_date, created_at desc);

create index if not exists idx_ops_daily_runbook_runs_step
  on public.ops_daily_runbook_runs(step_key, created_at desc);

grant usage on schema public to service_role;
grant select, insert, update, delete on public.ops_daily_runbook_runs to service_role;

alter table public.ops_daily_runbook_runs enable row level security;

drop policy if exists "ops_daily_runbook_runs_no_frontend_select" on public.ops_daily_runbook_runs;
drop policy if exists "ops_daily_runbook_runs_no_frontend_insert" on public.ops_daily_runbook_runs;
drop policy if exists "ops_daily_runbook_runs_no_frontend_update" on public.ops_daily_runbook_runs;
drop policy if exists "ops_daily_runbook_runs_no_frontend_delete" on public.ops_daily_runbook_runs;

create policy "ops_daily_runbook_runs_no_frontend_select"
  on public.ops_daily_runbook_runs
  for select
  to anon, authenticated
  using (false);

create policy "ops_daily_runbook_runs_no_frontend_insert"
  on public.ops_daily_runbook_runs
  for insert
  to anon, authenticated
  with check (false);

create policy "ops_daily_runbook_runs_no_frontend_update"
  on public.ops_daily_runbook_runs
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "ops_daily_runbook_runs_no_frontend_delete"
  on public.ops_daily_runbook_runs
  for delete
  to anon, authenticated
  using (false);

insert into public.ops_daily_runbook_runs (
  run_date,
  action,
  step_key,
  step_title,
  status,
  note,
  payload,
  created_by
)
values (
  to_char(now() at time zone 'Asia/Seoul', 'YYYY-MM-DD'),
  'schema_applied',
  'schema',
  '오늘 실증 운영센터 생성',
  'ok',
  '가입, 동의, 실증가구, 안부신호, 문자, 리포트, 미응답 상태를 매일 같은 순서로 점검합니다.',
  jsonb_build_object(
    'purpose', '실증 운영 루틴 표준화와 일일 증거 기록'
  ),
  'Supabase SQL Editor'
);

notify pgrst, 'reload schema';
