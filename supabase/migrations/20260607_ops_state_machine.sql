create extension if not exists pgcrypto;

create table if not exists public.care_state_transition_logs (
  id uuid primary key default gen_random_uuid(),
  request_id uuid,
  match_id uuid,
  actor_type text default 'ops',
  actor_name text default '운영실',
  transition_type text default 'request_status',
  from_status text,
  to_status text,
  reason text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.care_state_transition_logs add column if not exists request_id uuid;
alter table public.care_state_transition_logs add column if not exists match_id uuid;
alter table public.care_state_transition_logs add column if not exists actor_type text default 'ops';
alter table public.care_state_transition_logs add column if not exists actor_name text default '운영실';
alter table public.care_state_transition_logs add column if not exists transition_type text default 'request_status';
alter table public.care_state_transition_logs add column if not exists from_status text;
alter table public.care_state_transition_logs add column if not exists to_status text;
alter table public.care_state_transition_logs add column if not exists reason text;
alter table public.care_state_transition_logs add column if not exists payload jsonb default '{}'::jsonb;
alter table public.care_state_transition_logs add column if not exists created_at timestamptz default now();

create index if not exists idx_care_state_transition_logs_request
  on public.care_state_transition_logs(request_id, created_at desc);

create index if not exists idx_care_state_transition_logs_match
  on public.care_state_transition_logs(match_id, created_at desc);

create table if not exists public.ops_state_machine_runs (
  id uuid primary key default gen_random_uuid(),
  action_type text default 'audit',
  status text default 'recorded',
  summary text,
  metrics jsonb default '{}'::jsonb,
  violations jsonb default '[]'::jsonb,
  fix_results jsonb default '[]'::jsonb,
  payload jsonb default '{}'::jsonb,
  created_by text default '운영실',
  created_at timestamptz default now()
);

alter table public.ops_state_machine_runs add column if not exists action_type text default 'audit';
alter table public.ops_state_machine_runs add column if not exists status text default 'recorded';
alter table public.ops_state_machine_runs add column if not exists summary text;
alter table public.ops_state_machine_runs add column if not exists metrics jsonb default '{}'::jsonb;
alter table public.ops_state_machine_runs add column if not exists violations jsonb default '[]'::jsonb;
alter table public.ops_state_machine_runs add column if not exists fix_results jsonb default '[]'::jsonb;
alter table public.ops_state_machine_runs add column if not exists payload jsonb default '{}'::jsonb;
alter table public.ops_state_machine_runs add column if not exists created_by text default '운영실';
alter table public.ops_state_machine_runs add column if not exists created_at timestamptz default now();

create index if not exists idx_ops_state_machine_runs_created
  on public.ops_state_machine_runs(created_at desc);

alter table public.care_response_requests add column if not exists state_reason text;
alter table public.care_response_requests add column if not exists last_transition_at timestamptz;
alter table public.care_response_requests add column if not exists expired_at timestamptz;
alter table public.care_response_requests add column if not exists cancelled_at timestamptz;

alter table public.care_response_matches add column if not exists declined_at timestamptz;
alter table public.care_response_matches add column if not exists accept_token_expires_at timestamptz;
alter table public.care_response_matches add column if not exists detail_unlocked_at timestamptz;
alter table public.care_response_matches add column if not exists token_used_at timestamptz;

grant usage on schema public to service_role;
grant select, insert, update, delete on public.care_state_transition_logs to service_role;
grant select, insert, update, delete on public.ops_state_machine_runs to service_role;
grant select, insert, update, delete on public.care_response_requests to service_role;
grant select, insert, update, delete on public.care_response_matches to service_role;
grant select, insert, update, delete on public.care_response_updates to service_role;
grant select, insert, update, delete on public.ops_autopilot_logs to service_role;

alter table public.care_state_transition_logs enable row level security;
alter table public.ops_state_machine_runs enable row level security;

drop policy if exists "care_state_transition_logs_no_frontend_select" on public.care_state_transition_logs;
drop policy if exists "care_state_transition_logs_no_frontend_insert" on public.care_state_transition_logs;
drop policy if exists "care_state_transition_logs_no_frontend_update" on public.care_state_transition_logs;
drop policy if exists "care_state_transition_logs_no_frontend_delete" on public.care_state_transition_logs;

create policy "care_state_transition_logs_no_frontend_select"
  on public.care_state_transition_logs
  for select
  to anon, authenticated
  using (false);

create policy "care_state_transition_logs_no_frontend_insert"
  on public.care_state_transition_logs
  for insert
  to anon, authenticated
  with check (false);

create policy "care_state_transition_logs_no_frontend_update"
  on public.care_state_transition_logs
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "care_state_transition_logs_no_frontend_delete"
  on public.care_state_transition_logs
  for delete
  to anon, authenticated
  using (false);

drop policy if exists "ops_state_machine_runs_no_frontend_select" on public.ops_state_machine_runs;
drop policy if exists "ops_state_machine_runs_no_frontend_insert" on public.ops_state_machine_runs;
drop policy if exists "ops_state_machine_runs_no_frontend_update" on public.ops_state_machine_runs;
drop policy if exists "ops_state_machine_runs_no_frontend_delete" on public.ops_state_machine_runs;

create policy "ops_state_machine_runs_no_frontend_select"
  on public.ops_state_machine_runs
  for select
  to anon, authenticated
  using (false);

create policy "ops_state_machine_runs_no_frontend_insert"
  on public.ops_state_machine_runs
  for insert
  to anon, authenticated
  with check (false);

create policy "ops_state_machine_runs_no_frontend_update"
  on public.ops_state_machine_runs
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "ops_state_machine_runs_no_frontend_delete"
  on public.ops_state_machine_runs
  for delete
  to anon, authenticated
  using (false);

insert into public.ops_state_machine_runs (
  action_type,
  status,
  summary,
  payload,
  created_by
)
values (
  'state_machine_sql',
  'applied',
  '긴급 사건 상태 머신 로그와 점검 테이블을 생성했습니다.',
  jsonb_build_object(
    'request_statuses', jsonb_build_array('open', 'dispatched', 'accepted', 'in_progress', 'completed', 'cancelled', 'manual_needed', 'expired'),
    'match_statuses', jsonb_build_array('notified', 'accepted', 'in_progress', 'completed', 'declined', 'expired')
  ),
  'Supabase SQL Editor'
);

notify pgrst, 'reload schema';
select pg_sleep(1);
notify pgrst, 'reload schema';
