create extension if not exists pgcrypto;

create table if not exists public.care_response_access_tokens (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  request_id uuid not null,
  provider_id uuid not null,
  match_id uuid,
  purpose text default 'provider_request',
  expires_at timestamptz default (now() + interval '7 days'),
  used_at timestamptz,
  revoked_at timestamptz,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.care_response_access_tokens add column if not exists token_hash text;
alter table public.care_response_access_tokens add column if not exists request_id uuid;
alter table public.care_response_access_tokens add column if not exists provider_id uuid;
alter table public.care_response_access_tokens add column if not exists match_id uuid;
alter table public.care_response_access_tokens add column if not exists purpose text default 'provider_request';
alter table public.care_response_access_tokens add column if not exists expires_at timestamptz default (now() + interval '7 days');
alter table public.care_response_access_tokens add column if not exists used_at timestamptz;
alter table public.care_response_access_tokens add column if not exists revoked_at timestamptz;
alter table public.care_response_access_tokens add column if not exists payload jsonb default '{}'::jsonb;
alter table public.care_response_access_tokens add column if not exists created_at timestamptz default now();

create unique index if not exists idx_care_response_access_tokens_hash
  on public.care_response_access_tokens(token_hash);

create index if not exists idx_care_response_access_tokens_request
  on public.care_response_access_tokens(request_id, provider_id, expires_at desc);

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

create table if not exists public.care_response_matches (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null,
  provider_id uuid not null,
  match_status text default 'notified',
  notified_at timestamptz default now(),
  accepted_at timestamptz,
  declined_at timestamptz,
  completed_at timestamptz,
  note text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.care_response_updates (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null,
  actor_type text default 'system',
  actor_name text,
  update_type text,
  message text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.care_response_access_tokens to anon, authenticated;
grant select, insert, update, delete on public.care_providers to anon, authenticated;
grant select, insert, update, delete on public.care_response_requests to anon, authenticated;
grant select, insert, update, delete on public.care_response_matches to anon, authenticated;
grant select, insert, update, delete on public.care_response_updates to anon, authenticated;

alter table public.care_response_access_tokens enable row level security;
alter table public.care_providers enable row level security;
alter table public.care_response_requests enable row level security;
alter table public.care_response_matches enable row level security;
alter table public.care_response_updates enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'care_response_access_tokens',
    'care_providers',
    'care_response_requests',
    'care_response_matches',
    'care_response_updates'
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
