create extension if not exists pgcrypto;

create table if not exists public.care_providers (
  id uuid primary key default gen_random_uuid(),
  provider_type text not null,
  provider_name text not null,
  phone text,
  email text,
  service_area text,
  address_hint text,
  available_status text default 'available',
  verified_status text default 'pending',
  qualification text,
  available_hours text,
  response_time_min integer default 30,
  notes text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.care_providers add column if not exists provider_type text;
alter table public.care_providers add column if not exists provider_name text;
alter table public.care_providers add column if not exists phone text;
alter table public.care_providers add column if not exists email text;
alter table public.care_providers add column if not exists service_area text;
alter table public.care_providers add column if not exists address_hint text;
alter table public.care_providers add column if not exists available_status text default 'available';
alter table public.care_providers add column if not exists verified_status text default 'pending';
alter table public.care_providers add column if not exists qualification text;
alter table public.care_providers add column if not exists available_hours text;
alter table public.care_providers add column if not exists response_time_min integer default 30;
alter table public.care_providers add column if not exists notes text;
alter table public.care_providers add column if not exists payload jsonb default '{}'::jsonb;
alter table public.care_providers add column if not exists created_at timestamptz default now();
alter table public.care_providers add column if not exists updated_at timestamptz default now();

create index if not exists idx_care_providers_ops_network
  on public.care_providers(provider_type, available_status, verified_status, service_area);

create index if not exists idx_care_providers_phone
  on public.care_providers(phone);

create table if not exists public.ops_network_logs (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid,
  action_type text not null,
  actor_name text default '운영실',
  message text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.ops_network_logs add column if not exists provider_id uuid;
alter table public.ops_network_logs add column if not exists action_type text;
alter table public.ops_network_logs add column if not exists actor_name text default '운영실';
alter table public.ops_network_logs add column if not exists message text;
alter table public.ops_network_logs add column if not exists payload jsonb default '{}'::jsonb;
alter table public.ops_network_logs add column if not exists created_at timestamptz default now();

create index if not exists idx_ops_network_logs_provider
  on public.ops_network_logs(provider_id, created_at desc);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.care_providers to anon, authenticated;
grant select, insert, update, delete on public.ops_network_logs to anon, authenticated;

alter table public.care_providers enable row level security;
alter table public.ops_network_logs enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'care_providers',
    'ops_network_logs'
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
