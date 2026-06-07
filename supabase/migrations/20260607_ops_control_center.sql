create extension if not exists pgcrypto;

create table if not exists public.ops_control_center_snapshots (
  id uuid primary key default gen_random_uuid(),
  overall_status text default 'unknown',
  metrics jsonb default '{}'::jsonb,
  health jsonb default '[]'::jsonb,
  warnings jsonb default '[]'::jsonb,
  payload jsonb default '{}'::jsonb,
  created_by text default '운영실',
  created_at timestamptz default now()
);

alter table public.ops_control_center_snapshots add column if not exists overall_status text default 'unknown';
alter table public.ops_control_center_snapshots add column if not exists metrics jsonb default '{}'::jsonb;
alter table public.ops_control_center_snapshots add column if not exists health jsonb default '[]'::jsonb;
alter table public.ops_control_center_snapshots add column if not exists warnings jsonb default '[]'::jsonb;
alter table public.ops_control_center_snapshots add column if not exists payload jsonb default '{}'::jsonb;
alter table public.ops_control_center_snapshots add column if not exists created_by text default '운영실';
alter table public.ops_control_center_snapshots add column if not exists created_at timestamptz default now();

create index if not exists idx_ops_control_center_snapshots_created
  on public.ops_control_center_snapshots(created_at desc);

grant usage on schema public to service_role;
grant select, insert, update, delete on public.ops_control_center_snapshots to service_role;

alter table public.ops_control_center_snapshots enable row level security;

drop policy if exists "ops_control_center_snapshots_deny_frontend_select" on public.ops_control_center_snapshots;
drop policy if exists "ops_control_center_snapshots_deny_frontend_insert" on public.ops_control_center_snapshots;
drop policy if exists "ops_control_center_snapshots_deny_frontend_update" on public.ops_control_center_snapshots;
drop policy if exists "ops_control_center_snapshots_deny_frontend_delete" on public.ops_control_center_snapshots;

create policy "ops_control_center_snapshots_deny_frontend_select"
  on public.ops_control_center_snapshots
  for select
  to anon, authenticated
  using (false);

create policy "ops_control_center_snapshots_deny_frontend_insert"
  on public.ops_control_center_snapshots
  for insert
  to anon, authenticated
  with check (false);

create policy "ops_control_center_snapshots_deny_frontend_update"
  on public.ops_control_center_snapshots
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "ops_control_center_snapshots_deny_frontend_delete"
  on public.ops_control_center_snapshots
  for delete
  to anon, authenticated
  using (false);

notify pgrst, 'reload schema';
select pg_sleep(1);
notify pgrst, 'reload schema';
