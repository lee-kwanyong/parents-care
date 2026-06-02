create extension if not exists pgcrypto;

create table if not exists public.iot_devices (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  recipient_name text,
  device_type text not null,
  serial_no text,
  install_group text,
  install_status text default 'planned',
  installed_at timestamptz,
  assigned_org_name text,
  assigned_staff_name text,
  privacy_mode text default 'no_camera_no_voice',
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.iot_devices add column if not exists family_code text;
alter table public.iot_devices add column if not exists recipient_name text;
alter table public.iot_devices add column if not exists device_type text;
alter table public.iot_devices add column if not exists serial_no text;
alter table public.iot_devices add column if not exists install_group text;
alter table public.iot_devices add column if not exists install_status text default 'planned';
alter table public.iot_devices add column if not exists installed_at timestamptz;
alter table public.iot_devices add column if not exists assigned_org_name text;
alter table public.iot_devices add column if not exists assigned_staff_name text;
alter table public.iot_devices add column if not exists privacy_mode text default 'no_camera_no_voice';
alter table public.iot_devices add column if not exists payload jsonb default '{}'::jsonb;
alter table public.iot_devices add column if not exists created_at timestamptz default now();
alter table public.iot_devices add column if not exists updated_at timestamptz default now();

create index if not exists idx_iot_devices_family_code
  on public.iot_devices(family_code);

create index if not exists idx_iot_devices_type_status
  on public.iot_devices(device_type, install_status);

create table if not exists public.iot_device_events (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  device_id uuid,
  device_type text,
  event_type text not null,
  event_label text,
  event_status text default 'normal',
  risk_level text default 'normal',
  event_value numeric,
  unit text,
  occurred_at timestamptz default now(),
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.iot_device_events add column if not exists family_code text;
alter table public.iot_device_events add column if not exists device_id uuid;
alter table public.iot_device_events add column if not exists device_type text;
alter table public.iot_device_events add column if not exists event_type text;
alter table public.iot_device_events add column if not exists event_label text;
alter table public.iot_device_events add column if not exists event_status text default 'normal';
alter table public.iot_device_events add column if not exists risk_level text default 'normal';
alter table public.iot_device_events add column if not exists event_value numeric;
alter table public.iot_device_events add column if not exists unit text;
alter table public.iot_device_events add column if not exists occurred_at timestamptz default now();
alter table public.iot_device_events add column if not exists payload jsonb default '{}'::jsonb;
alter table public.iot_device_events add column if not exists created_at timestamptz default now();

create index if not exists idx_iot_device_events_family_code
  on public.iot_device_events(family_code);

create index if not exists idx_iot_device_events_risk
  on public.iot_device_events(risk_level, occurred_at desc);

create index if not exists idx_iot_device_events_type
  on public.iot_device_events(device_type, event_type, occurred_at desc);

create table if not exists public.gov_pilot_sites (
  id uuid primary key default gen_random_uuid(),
  site_name text not null,
  sido text,
  sigungu text,
  target_households integer default 100,
  high_risk_households integer default 30,
  general_households integer default 70,
  pilot_phase text default 'planning',
  budget_estimate_krw integer default 0,
  partner_org_name text,
  start_date date,
  end_date date,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.gov_pilot_sites add column if not exists site_name text;
alter table public.gov_pilot_sites add column if not exists sido text;
alter table public.gov_pilot_sites add column if not exists sigungu text;
alter table public.gov_pilot_sites add column if not exists target_households integer default 100;
alter table public.gov_pilot_sites add column if not exists high_risk_households integer default 30;
alter table public.gov_pilot_sites add column if not exists general_households integer default 70;
alter table public.gov_pilot_sites add column if not exists pilot_phase text default 'planning';
alter table public.gov_pilot_sites add column if not exists budget_estimate_krw integer default 0;
alter table public.gov_pilot_sites add column if not exists partner_org_name text;
alter table public.gov_pilot_sites add column if not exists start_date date;
alter table public.gov_pilot_sites add column if not exists end_date date;
alter table public.gov_pilot_sites add column if not exists payload jsonb default '{}'::jsonb;
alter table public.gov_pilot_sites add column if not exists created_at timestamptz default now();
alter table public.gov_pilot_sites add column if not exists updated_at timestamptz default now();

create index if not exists idx_gov_pilot_sites_phase
  on public.gov_pilot_sites(pilot_phase);

create table if not exists public.gov_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_name text,
  actor_role text,
  action_type text,
  target_type text,
  target_id text,
  family_code text,
  description text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.gov_audit_logs add column if not exists actor_name text;
alter table public.gov_audit_logs add column if not exists actor_role text;
alter table public.gov_audit_logs add column if not exists action_type text;
alter table public.gov_audit_logs add column if not exists target_type text;
alter table public.gov_audit_logs add column if not exists target_id text;
alter table public.gov_audit_logs add column if not exists family_code text;
alter table public.gov_audit_logs add column if not exists description text;
alter table public.gov_audit_logs add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.gov_audit_logs add column if not exists created_at timestamptz default now();

alter table public.iot_devices enable row level security;
alter table public.iot_device_events enable row level security;
alter table public.gov_pilot_sites enable row level security;
alter table public.gov_audit_logs enable row level security;

drop policy if exists "iot_devices_select_all" on public.iot_devices;
drop policy if exists "iot_devices_insert_all" on public.iot_devices;
drop policy if exists "iot_devices_update_all" on public.iot_devices;

drop policy if exists "iot_device_events_select_all" on public.iot_device_events;
drop policy if exists "iot_device_events_insert_all" on public.iot_device_events;
drop policy if exists "iot_device_events_update_all" on public.iot_device_events;

drop policy if exists "gov_pilot_sites_select_all" on public.gov_pilot_sites;
drop policy if exists "gov_pilot_sites_insert_all" on public.gov_pilot_sites;
drop policy if exists "gov_pilot_sites_update_all" on public.gov_pilot_sites;

drop policy if exists "gov_audit_logs_select_all" on public.gov_audit_logs;
drop policy if exists "gov_audit_logs_insert_all" on public.gov_audit_logs;

create policy "iot_devices_select_all" on public.iot_devices for select to anon, authenticated using (true);
create policy "iot_devices_insert_all" on public.iot_devices for insert to anon, authenticated with check (true);
create policy "iot_devices_update_all" on public.iot_devices for update to anon, authenticated using (true) with check (true);

create policy "iot_device_events_select_all" on public.iot_device_events for select to anon, authenticated using (true);
create policy "iot_device_events_insert_all" on public.iot_device_events for insert to anon, authenticated with check (true);
create policy "iot_device_events_update_all" on public.iot_device_events for update to anon, authenticated using (true) with check (true);

create policy "gov_pilot_sites_select_all" on public.gov_pilot_sites for select to anon, authenticated using (true);
create policy "gov_pilot_sites_insert_all" on public.gov_pilot_sites for insert to anon, authenticated with check (true);
create policy "gov_pilot_sites_update_all" on public.gov_pilot_sites for update to anon, authenticated using (true) with check (true);

create policy "gov_audit_logs_select_all" on public.gov_audit_logs for select to anon, authenticated using (true);
create policy "gov_audit_logs_insert_all" on public.gov_audit_logs for insert to anon, authenticated with check (true);

notify pgrst, 'reload schema';
