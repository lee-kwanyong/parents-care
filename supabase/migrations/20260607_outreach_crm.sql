create extension if not exists pgcrypto;

create table if not exists public.ops_outreach_targets (
  id uuid primary key default gen_random_uuid(),
  target_key text not null unique,
  municipality_name text not null,
  priority integer default 99,
  region text,
  department_name text,
  contact_name text,
  role_title text,
  contact_phone text,
  contact_email text,
  status text default 'not_started',
  call_status text default 'not_called',
  email_status text default 'needs_confirm',
  meeting_status text default 'none',
  next_action text,
  next_action_at timestamptz,
  last_contacted_at timestamptz,
  meeting_at timestamptz,
  notes text,
  tags jsonb default '[]'::jsonb,
  payload jsonb default '{}'::jsonb,
  created_by text default '운영실',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.ops_outreach_targets add column if not exists target_key text;
alter table public.ops_outreach_targets add column if not exists municipality_name text;
alter table public.ops_outreach_targets add column if not exists priority integer default 99;
alter table public.ops_outreach_targets add column if not exists region text;
alter table public.ops_outreach_targets add column if not exists department_name text;
alter table public.ops_outreach_targets add column if not exists contact_name text;
alter table public.ops_outreach_targets add column if not exists role_title text;
alter table public.ops_outreach_targets add column if not exists contact_phone text;
alter table public.ops_outreach_targets add column if not exists contact_email text;
alter table public.ops_outreach_targets add column if not exists status text default 'not_started';
alter table public.ops_outreach_targets add column if not exists call_status text default 'not_called';
alter table public.ops_outreach_targets add column if not exists email_status text default 'needs_confirm';
alter table public.ops_outreach_targets add column if not exists meeting_status text default 'none';
alter table public.ops_outreach_targets add column if not exists next_action text;
alter table public.ops_outreach_targets add column if not exists next_action_at timestamptz;
alter table public.ops_outreach_targets add column if not exists last_contacted_at timestamptz;
alter table public.ops_outreach_targets add column if not exists meeting_at timestamptz;
alter table public.ops_outreach_targets add column if not exists notes text;
alter table public.ops_outreach_targets add column if not exists tags jsonb default '[]'::jsonb;
alter table public.ops_outreach_targets add column if not exists payload jsonb default '{}'::jsonb;
alter table public.ops_outreach_targets add column if not exists created_by text default '운영실';
alter table public.ops_outreach_targets add column if not exists created_at timestamptz default now();
alter table public.ops_outreach_targets add column if not exists updated_at timestamptz default now();

create unique index if not exists idx_ops_outreach_targets_key
  on public.ops_outreach_targets(target_key);

create index if not exists idx_ops_outreach_targets_status
  on public.ops_outreach_targets(status, priority, updated_at desc);

create table if not exists public.ops_outreach_logs (
  id uuid primary key default gen_random_uuid(),
  target_id uuid,
  target_key text,
  municipality_name text,
  action_type text default 'note',
  channel text default 'internal',
  status text default 'recorded',
  subject text,
  body text,
  note text,
  next_status text,
  payload jsonb default '{}'::jsonb,
  created_by text default '운영실',
  created_at timestamptz default now()
);

alter table public.ops_outreach_logs add column if not exists target_id uuid;
alter table public.ops_outreach_logs add column if not exists target_key text;
alter table public.ops_outreach_logs add column if not exists municipality_name text;
alter table public.ops_outreach_logs add column if not exists action_type text default 'note';
alter table public.ops_outreach_logs add column if not exists channel text default 'internal';
alter table public.ops_outreach_logs add column if not exists status text default 'recorded';
alter table public.ops_outreach_logs add column if not exists subject text;
alter table public.ops_outreach_logs add column if not exists body text;
alter table public.ops_outreach_logs add column if not exists note text;
alter table public.ops_outreach_logs add column if not exists next_status text;
alter table public.ops_outreach_logs add column if not exists payload jsonb default '{}'::jsonb;
alter table public.ops_outreach_logs add column if not exists created_by text default '운영실';
alter table public.ops_outreach_logs add column if not exists created_at timestamptz default now();

create index if not exists idx_ops_outreach_logs_target
  on public.ops_outreach_logs(target_key, created_at desc);

create table if not exists public.ops_outreach_runs (
  id uuid primary key default gen_random_uuid(),
  run_type text default 'snapshot',
  status text default 'recorded',
  summary text,
  metrics jsonb default '{}'::jsonb,
  targets jsonb default '[]'::jsonb,
  logs jsonb default '[]'::jsonb,
  payload jsonb default '{}'::jsonb,
  created_by text default '운영실',
  created_at timestamptz default now()
);

alter table public.ops_outreach_runs add column if not exists run_type text default 'snapshot';
alter table public.ops_outreach_runs add column if not exists status text default 'recorded';
alter table public.ops_outreach_runs add column if not exists summary text;
alter table public.ops_outreach_runs add column if not exists metrics jsonb default '{}'::jsonb;
alter table public.ops_outreach_runs add column if not exists targets jsonb default '[]'::jsonb;
alter table public.ops_outreach_runs add column if not exists logs jsonb default '[]'::jsonb;
alter table public.ops_outreach_runs add column if not exists payload jsonb default '{}'::jsonb;
alter table public.ops_outreach_runs add column if not exists created_by text default '운영실';
alter table public.ops_outreach_runs add column if not exists created_at timestamptz default now();

create index if not exists idx_ops_outreach_runs_created
  on public.ops_outreach_runs(created_at desc);

grant usage on schema public to service_role;
grant select, insert, update, delete on public.ops_outreach_targets to service_role;
grant select, insert, update, delete on public.ops_outreach_logs to service_role;
grant select, insert, update, delete on public.ops_outreach_runs to service_role;

alter table public.ops_outreach_targets enable row level security;
alter table public.ops_outreach_logs enable row level security;
alter table public.ops_outreach_runs enable row level security;

drop policy if exists "ops_outreach_targets_no_frontend_select" on public.ops_outreach_targets;
drop policy if exists "ops_outreach_targets_no_frontend_insert" on public.ops_outreach_targets;
drop policy if exists "ops_outreach_targets_no_frontend_update" on public.ops_outreach_targets;
drop policy if exists "ops_outreach_targets_no_frontend_delete" on public.ops_outreach_targets;

create policy "ops_outreach_targets_no_frontend_select"
  on public.ops_outreach_targets
  for select
  to anon, authenticated
  using (false);

create policy "ops_outreach_targets_no_frontend_insert"
  on public.ops_outreach_targets
  for insert
  to anon, authenticated
  with check (false);

create policy "ops_outreach_targets_no_frontend_update"
  on public.ops_outreach_targets
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "ops_outreach_targets_no_frontend_delete"
  on public.ops_outreach_targets
  for delete
  to anon, authenticated
  using (false);

drop policy if exists "ops_outreach_logs_no_frontend_select" on public.ops_outreach_logs;
drop policy if exists "ops_outreach_logs_no_frontend_insert" on public.ops_outreach_logs;
drop policy if exists "ops_outreach_logs_no_frontend_update" on public.ops_outreach_logs;
drop policy if exists "ops_outreach_logs_no_frontend_delete" on public.ops_outreach_logs;

create policy "ops_outreach_logs_no_frontend_select"
  on public.ops_outreach_logs
  for select
  to anon, authenticated
  using (false);

create policy "ops_outreach_logs_no_frontend_insert"
  on public.ops_outreach_logs
  for insert
  to anon, authenticated
  with check (false);

create policy "ops_outreach_logs_no_frontend_update"
  on public.ops_outreach_logs
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "ops_outreach_logs_no_frontend_delete"
  on public.ops_outreach_logs
  for delete
  to anon, authenticated
  using (false);

drop policy if exists "ops_outreach_runs_no_frontend_select" on public.ops_outreach_runs;
drop policy if exists "ops_outreach_runs_no_frontend_insert" on public.ops_outreach_runs;
drop policy if exists "ops_outreach_runs_no_frontend_update" on public.ops_outreach_runs;
drop policy if exists "ops_outreach_runs_no_frontend_delete" on public.ops_outreach_runs;

create policy "ops_outreach_runs_no_frontend_select"
  on public.ops_outreach_runs
  for select
  to anon, authenticated
  using (false);

create policy "ops_outreach_runs_no_frontend_insert"
  on public.ops_outreach_runs
  for insert
  to anon, authenticated
  with check (false);

create policy "ops_outreach_runs_no_frontend_update"
  on public.ops_outreach_runs
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "ops_outreach_runs_no_frontend_delete"
  on public.ops_outreach_runs
  for delete
  to anon, authenticated
  using (false);

insert into public.ops_outreach_runs (
  run_type,
  status,
  summary,
  payload,
  created_by
)
values (
  'outreach_crm_sql',
  'applied',
  '지자체 실증 제안 CRM 테이블을 생성했습니다.',
  jsonb_build_object(
    'targets', jsonb_build_array('청양군', '의령군', '서천군', '구례군', '횡성군', '남해군', '예산군', '부여군', '고성군', '태백시')
  ),
  'Supabase SQL Editor'
);

notify pgrst, 'reload schema';
select pg_sleep(1);
notify pgrst, 'reload schema';
