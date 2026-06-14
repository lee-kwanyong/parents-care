create extension if not exists pgcrypto;

create table if not exists public.ops_runbook_logs (
  id uuid primary key default gen_random_uuid(),
  run_date date default ((now() at time zone 'Asia/Seoul')::date),
  task_id text not null,
  task_title text,
  task_group text,
  checked boolean default false,
  note text,
  payload jsonb default '{}'::jsonb,
  created_by text default '운영실',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.ops_runbook_logs add column if not exists run_date date default ((now() at time zone 'Asia/Seoul')::date);
alter table public.ops_runbook_logs add column if not exists task_id text;
alter table public.ops_runbook_logs add column if not exists task_title text;
alter table public.ops_runbook_logs add column if not exists task_group text;
alter table public.ops_runbook_logs add column if not exists checked boolean default false;
alter table public.ops_runbook_logs add column if not exists note text;
alter table public.ops_runbook_logs add column if not exists payload jsonb default '{}'::jsonb;
alter table public.ops_runbook_logs add column if not exists created_by text default '운영실';
alter table public.ops_runbook_logs add column if not exists created_at timestamptz default now();
alter table public.ops_runbook_logs add column if not exists updated_at timestamptz default now();

create index if not exists idx_ops_runbook_logs_run_date
  on public.ops_runbook_logs(run_date desc, created_at desc);

create index if not exists idx_ops_runbook_logs_task
  on public.ops_runbook_logs(run_date desc, task_id);

grant usage on schema public to service_role;
grant select, insert, update, delete on public.ops_runbook_logs to service_role;

alter table public.ops_runbook_logs enable row level security;

drop policy if exists "ops_runbook_logs_no_frontend_select" on public.ops_runbook_logs;
drop policy if exists "ops_runbook_logs_no_frontend_insert" on public.ops_runbook_logs;
drop policy if exists "ops_runbook_logs_no_frontend_update" on public.ops_runbook_logs;
drop policy if exists "ops_runbook_logs_no_frontend_delete" on public.ops_runbook_logs;

create policy "ops_runbook_logs_no_frontend_select"
  on public.ops_runbook_logs
  for select
  to anon, authenticated
  using (false);

create policy "ops_runbook_logs_no_frontend_insert"
  on public.ops_runbook_logs
  for insert
  to anon, authenticated
  with check (false);

create policy "ops_runbook_logs_no_frontend_update"
  on public.ops_runbook_logs
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "ops_runbook_logs_no_frontend_delete"
  on public.ops_runbook_logs
  for delete
  to anon, authenticated
  using (false);

notify pgrst, 'reload schema';
