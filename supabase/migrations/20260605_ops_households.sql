create extension if not exists pgcrypto;

create table if not exists public.care_households (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  parent_name text not null,
  parent_phone text,
  guardian_name text,
  guardian_phone text,
  service_area text,
  address_hint text,
  risk_group text default 'B',
  risk_level text default 'medium',
  household_status text default 'active',
  pilot_group text default 'B',
  consent_status text default 'pending',
  consent_at timestamptz,
  start_date date default current_date,
  care_flags jsonb default '{}'::jsonb,
  notes text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.care_households add column if not exists family_code text;
alter table public.care_households add column if not exists parent_name text;
alter table public.care_households add column if not exists parent_phone text;
alter table public.care_households add column if not exists guardian_name text;
alter table public.care_households add column if not exists guardian_phone text;
alter table public.care_households add column if not exists service_area text;
alter table public.care_households add column if not exists address_hint text;
alter table public.care_households add column if not exists risk_group text default 'B';
alter table public.care_households add column if not exists risk_level text default 'medium';
alter table public.care_households add column if not exists household_status text default 'active';
alter table public.care_households add column if not exists pilot_group text default 'B';
alter table public.care_households add column if not exists consent_status text default 'pending';
alter table public.care_households add column if not exists consent_at timestamptz;
alter table public.care_households add column if not exists start_date date default current_date;
alter table public.care_households add column if not exists care_flags jsonb default '{}'::jsonb;
alter table public.care_households add column if not exists notes text;
alter table public.care_households add column if not exists payload jsonb default '{}'::jsonb;
alter table public.care_households add column if not exists created_at timestamptz default now();
alter table public.care_households add column if not exists updated_at timestamptz default now();

create index if not exists idx_care_households_family_code
  on public.care_households(family_code);

create index if not exists idx_care_households_ops
  on public.care_households(household_status, risk_group, consent_status, service_area);

create table if not exists public.care_household_logs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid,
  family_code text,
  action_type text not null,
  actor_name text default '운영실',
  message text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.care_household_logs add column if not exists household_id uuid;
alter table public.care_household_logs add column if not exists family_code text;
alter table public.care_household_logs add column if not exists action_type text;
alter table public.care_household_logs add column if not exists actor_name text default '운영실';
alter table public.care_household_logs add column if not exists message text;
alter table public.care_household_logs add column if not exists payload jsonb default '{}'::jsonb;
alter table public.care_household_logs add column if not exists created_at timestamptz default now();

create index if not exists idx_care_household_logs_household
  on public.care_household_logs(household_id, created_at desc);

create index if not exists idx_care_household_logs_family
  on public.care_household_logs(family_code, created_at desc);

create table if not exists public.care_response_requests (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  parent_name text,
  parent_phone text,
  guardian_name text,
  guardian_phone text,
  signal_type text not null,
  signal_label text,
  request_type text not null,
  risk_level text default 'medium',
  status text default 'open',
  service_area text,
  address_hint text,
  requested_action text,
  dispatch_scope text default 'family_first',
  accepted_by_provider_id uuid,
  accepted_by_name text,
  accepted_at timestamptz,
  completed_at timestamptz,
  completed_note text,
  source text default 'manual',
  source_key text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.care_response_requests add column if not exists family_code text;
alter table public.care_response_requests add column if not exists parent_name text;
alter table public.care_response_requests add column if not exists parent_phone text;
alter table public.care_response_requests add column if not exists guardian_name text;
alter table public.care_response_requests add column if not exists guardian_phone text;
alter table public.care_response_requests add column if not exists signal_type text;
alter table public.care_response_requests add column if not exists signal_label text;
alter table public.care_response_requests add column if not exists request_type text;
alter table public.care_response_requests add column if not exists risk_level text default 'medium';
alter table public.care_response_requests add column if not exists status text default 'open';
alter table public.care_response_requests add column if not exists service_area text;
alter table public.care_response_requests add column if not exists address_hint text;
alter table public.care_response_requests add column if not exists requested_action text;
alter table public.care_response_requests add column if not exists dispatch_scope text default 'family_first';
alter table public.care_response_requests add column if not exists source text default 'manual';
alter table public.care_response_requests add column if not exists source_key text;
alter table public.care_response_requests add column if not exists payload jsonb default '{}'::jsonb;
alter table public.care_response_requests add column if not exists created_at timestamptz default now();
alter table public.care_response_requests add column if not exists updated_at timestamptz default now();

create index if not exists idx_care_response_requests_household
  on public.care_response_requests(family_code, status, created_at desc);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.care_households to anon, authenticated;
grant select, insert, update, delete on public.care_household_logs to anon, authenticated;
grant select, insert, update, delete on public.care_response_requests to anon, authenticated;

alter table public.care_households enable row level security;
alter table public.care_household_logs enable row level security;
alter table public.care_response_requests enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'care_households',
    'care_household_logs',
    'care_response_requests'
  ]
  loop
    execute format('drop policy if exists "%s_select_all" on public.%I', t, t);
    execute format('drop policy if exists "%s_insert_all" on public.%I', t, t);
    execute format('drop policy if exists "%s_update_all" on public.%I', t, t);
    execute format('drop policy if exists "%s_delete_all" on public.%I', t, t);

    execute format('create policy "%s_select_all" on public.%I for select to anon, authenticated using (true)', t, t);
    execute format('create policy "%s_insert_all" on public.%I for insert to anon, authenticated with check (true)', t, t);
    execute format('create policy "%s_update_all" on public.%I for update to anon, authenticated using (true) with check (true)', t, t);
    execute format('create policy "%s_delete_all" on public.%I for delete to anon, authenticated using (true)', t, t);
  end loop;
end $$;

notify pgrst, 'reload schema';
select pg_sleep(1);
notify pgrst, 'reload schema';
