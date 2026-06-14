create extension if not exists pgcrypto;

create table if not exists public.ops_ring_pilot_devices (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  parent_name text,
  guardian_name text,
  supplier text default 'eIoT',
  model text,
  color text,
  ring_size text,
  serial_number text,
  sample_type text default 'sample',
  stage text default '샘플대기',
  status text default 'active',
  unit_cost_usd numeric default 0,
  accessory_cost_usd numeric default 0,
  sample_count integer default 1,
  battery_pct integer default 0,
  wear_minutes_avg integer default 0,
  data_quality_score integer default 0,
  report_count integer default 0,
  guardian_view_count integer default 0,
  last_sync_at timestamptz,
  issue text,
  memo text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.ops_ring_pilot_devices add column if not exists family_code text;
alter table public.ops_ring_pilot_devices add column if not exists parent_name text;
alter table public.ops_ring_pilot_devices add column if not exists guardian_name text;
alter table public.ops_ring_pilot_devices add column if not exists supplier text default 'eIoT';
alter table public.ops_ring_pilot_devices add column if not exists model text;
alter table public.ops_ring_pilot_devices add column if not exists color text;
alter table public.ops_ring_pilot_devices add column if not exists ring_size text;
alter table public.ops_ring_pilot_devices add column if not exists serial_number text;
alter table public.ops_ring_pilot_devices add column if not exists sample_type text default 'sample';
alter table public.ops_ring_pilot_devices add column if not exists stage text default '샘플대기';
alter table public.ops_ring_pilot_devices add column if not exists status text default 'active';
alter table public.ops_ring_pilot_devices add column if not exists unit_cost_usd numeric default 0;
alter table public.ops_ring_pilot_devices add column if not exists accessory_cost_usd numeric default 0;
alter table public.ops_ring_pilot_devices add column if not exists sample_count integer default 1;
alter table public.ops_ring_pilot_devices add column if not exists battery_pct integer default 0;
alter table public.ops_ring_pilot_devices add column if not exists wear_minutes_avg integer default 0;
alter table public.ops_ring_pilot_devices add column if not exists data_quality_score integer default 0;
alter table public.ops_ring_pilot_devices add column if not exists report_count integer default 0;
alter table public.ops_ring_pilot_devices add column if not exists guardian_view_count integer default 0;
alter table public.ops_ring_pilot_devices add column if not exists last_sync_at timestamptz;
alter table public.ops_ring_pilot_devices add column if not exists issue text;
alter table public.ops_ring_pilot_devices add column if not exists memo text;
alter table public.ops_ring_pilot_devices add column if not exists payload jsonb default '{}'::jsonb;
alter table public.ops_ring_pilot_devices add column if not exists created_at timestamptz default now();
alter table public.ops_ring_pilot_devices add column if not exists updated_at timestamptz default now();

create index if not exists idx_ops_ring_pilot_devices_family_code
  on public.ops_ring_pilot_devices(family_code);

create index if not exists idx_ops_ring_pilot_devices_stage
  on public.ops_ring_pilot_devices(stage, updated_at desc);

create index if not exists idx_ops_ring_pilot_devices_model
  on public.ops_ring_pilot_devices(model, updated_at desc);

grant usage on schema public to service_role;
grant select, insert, update, delete on public.ops_ring_pilot_devices to service_role;

alter table public.ops_ring_pilot_devices enable row level security;

drop policy if exists "ops_ring_pilot_devices_no_frontend_select" on public.ops_ring_pilot_devices;
drop policy if exists "ops_ring_pilot_devices_no_frontend_insert" on public.ops_ring_pilot_devices;
drop policy if exists "ops_ring_pilot_devices_no_frontend_update" on public.ops_ring_pilot_devices;
drop policy if exists "ops_ring_pilot_devices_no_frontend_delete" on public.ops_ring_pilot_devices;

create policy "ops_ring_pilot_devices_no_frontend_select"
  on public.ops_ring_pilot_devices
  for select
  to anon, authenticated
  using (false);

create policy "ops_ring_pilot_devices_no_frontend_insert"
  on public.ops_ring_pilot_devices
  for insert
  to anon, authenticated
  with check (false);

create policy "ops_ring_pilot_devices_no_frontend_update"
  on public.ops_ring_pilot_devices
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "ops_ring_pilot_devices_no_frontend_delete"
  on public.ops_ring_pilot_devices
  for delete
  to anon, authenticated
  using (false);

notify pgrst, 'reload schema';
