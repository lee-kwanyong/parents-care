create extension if not exists pgcrypto;

create table if not exists public.ops_heartbeat_runs (
  id uuid primary key default gen_random_uuid(),
  run_source text default 'manual',
  status text default 'running',
  auto_send boolean default false,
  autopilot_ok boolean default false,
  escalation_ok boolean default false,
  dispatch_ok boolean default false,
  queued_before integer default 0,
  queued_after integer default 0,
  sent_before integer default 0,
  sent_after integer default 0,
  failed_before integer default 0,
  failed_after integer default 0,
  open_incidents_before integer default 0,
  open_incidents_after integer default 0,
  urgent_before integer default 0,
  urgent_after integer default 0,
  message text,
  payload jsonb default '{}'::jsonb,
  started_at timestamptz default now(),
  finished_at timestamptz,
  duration_ms integer,
  created_at timestamptz default now()
);

alter table public.ops_heartbeat_runs add column if not exists run_source text default 'manual';
alter table public.ops_heartbeat_runs add column if not exists status text default 'running';
alter table public.ops_heartbeat_runs add column if not exists auto_send boolean default false;
alter table public.ops_heartbeat_runs add column if not exists autopilot_ok boolean default false;
alter table public.ops_heartbeat_runs add column if not exists escalation_ok boolean default false;
alter table public.ops_heartbeat_runs add column if not exists dispatch_ok boolean default false;
alter table public.ops_heartbeat_runs add column if not exists queued_before integer default 0;
alter table public.ops_heartbeat_runs add column if not exists queued_after integer default 0;
alter table public.ops_heartbeat_runs add column if not exists sent_before integer default 0;
alter table public.ops_heartbeat_runs add column if not exists sent_after integer default 0;
alter table public.ops_heartbeat_runs add column if not exists failed_before integer default 0;
alter table public.ops_heartbeat_runs add column if not exists failed_after integer default 0;
alter table public.ops_heartbeat_runs add column if not exists open_incidents_before integer default 0;
alter table public.ops_heartbeat_runs add column if not exists open_incidents_after integer default 0;
alter table public.ops_heartbeat_runs add column if not exists urgent_before integer default 0;
alter table public.ops_heartbeat_runs add column if not exists urgent_after integer default 0;
alter table public.ops_heartbeat_runs add column if not exists message text;
alter table public.ops_heartbeat_runs add column if not exists payload jsonb default '{}'::jsonb;
alter table public.ops_heartbeat_runs add column if not exists started_at timestamptz default now();
alter table public.ops_heartbeat_runs add column if not exists finished_at timestamptz;
alter table public.ops_heartbeat_runs add column if not exists duration_ms integer;
alter table public.ops_heartbeat_runs add column if not exists created_at timestamptz default now();

create index if not exists idx_ops_heartbeat_runs_created
  on public.ops_heartbeat_runs(created_at desc);

create index if not exists idx_ops_heartbeat_runs_status
  on public.ops_heartbeat_runs(status, created_at desc);

create table if not exists public.ops_autopilot_logs (
  id uuid primary key default gen_random_uuid(),
  request_id uuid,
  action_type text not null,
  actor_name text default '안부웍스 오토파일럿',
  message text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.ops_autopilot_logs add column if not exists request_id uuid;
alter table public.ops_autopilot_logs add column if not exists action_type text;
alter table public.ops_autopilot_logs add column if not exists actor_name text default '안부웍스 오토파일럿';
alter table public.ops_autopilot_logs add column if not exists message text;
alter table public.ops_autopilot_logs add column if not exists payload jsonb default '{}'::jsonb;
alter table public.ops_autopilot_logs add column if not exists created_at timestamptz default now();

alter table public.notification_outbox
  alter column template_code drop not null;

alter table public.notification_outbox
  alter column template_code set default '';

update public.notification_outbox
   set template_code = ''
 where template_code is null;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.ops_heartbeat_runs to anon, authenticated;
grant select, insert, update, delete on public.ops_autopilot_logs to anon, authenticated;

alter table public.ops_heartbeat_runs enable row level security;
alter table public.ops_autopilot_logs enable row level security;

drop policy if exists "ops_heartbeat_runs_select_all" on public.ops_heartbeat_runs;
drop policy if exists "ops_heartbeat_runs_insert_all" on public.ops_heartbeat_runs;
drop policy if exists "ops_heartbeat_runs_update_all" on public.ops_heartbeat_runs;
drop policy if exists "ops_heartbeat_runs_delete_all" on public.ops_heartbeat_runs;

create policy "ops_heartbeat_runs_select_all"
  on public.ops_heartbeat_runs
  for select
  to anon, authenticated
  using (true);

create policy "ops_heartbeat_runs_insert_all"
  on public.ops_heartbeat_runs
  for insert
  to anon, authenticated
  with check (true);

create policy "ops_heartbeat_runs_update_all"
  on public.ops_heartbeat_runs
  for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "ops_heartbeat_runs_delete_all"
  on public.ops_heartbeat_runs
  for delete
  to anon, authenticated
  using (true);

drop policy if exists "ops_autopilot_logs_select_all" on public.ops_autopilot_logs;
drop policy if exists "ops_autopilot_logs_insert_all" on public.ops_autopilot_logs;
drop policy if exists "ops_autopilot_logs_update_all" on public.ops_autopilot_logs;
drop policy if exists "ops_autopilot_logs_delete_all" on public.ops_autopilot_logs;

create policy "ops_autopilot_logs_select_all"
  on public.ops_autopilot_logs
  for select
  to anon, authenticated
  using (true);

create policy "ops_autopilot_logs_insert_all"
  on public.ops_autopilot_logs
  for insert
  to anon, authenticated
  with check (true);

create policy "ops_autopilot_logs_update_all"
  on public.ops_autopilot_logs
  for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "ops_autopilot_logs_delete_all"
  on public.ops_autopilot_logs
  for delete
  to anon, authenticated
  using (true);

notify pgrst, 'reload schema';
select pg_sleep(1);
notify pgrst, 'reload schema';
