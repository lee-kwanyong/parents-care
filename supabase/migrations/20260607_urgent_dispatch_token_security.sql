create extension if not exists pgcrypto;

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

alter table public.care_response_matches add column if not exists request_id uuid;
alter table public.care_response_matches add column if not exists provider_id uuid;
alter table public.care_response_matches add column if not exists match_status text default 'notified';
alter table public.care_response_matches add column if not exists notified_at timestamptz default now();
alter table public.care_response_matches add column if not exists accepted_at timestamptz;
alter table public.care_response_matches add column if not exists declined_at timestamptz;
alter table public.care_response_matches add column if not exists completed_at timestamptz;
alter table public.care_response_matches add column if not exists note text;
alter table public.care_response_matches add column if not exists payload jsonb default '{}'::jsonb;
alter table public.care_response_matches add column if not exists created_at timestamptz default now();
alter table public.care_response_matches add column if not exists updated_at timestamptz;

alter table public.care_response_matches add column if not exists accept_token_hash text;
alter table public.care_response_matches add column if not exists accept_token_expires_at timestamptz;
alter table public.care_response_matches add column if not exists detail_unlocked_at timestamptz;
alter table public.care_response_matches add column if not exists token_used_at timestamptz;

create index if not exists idx_care_response_matches_accept_token_hash
  on public.care_response_matches(accept_token_hash);

create index if not exists idx_care_response_matches_token_status
  on public.care_response_matches(match_status, accept_token_expires_at, created_at desc);

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

alter table public.care_response_requests add column if not exists fast_dispatch_requested_at timestamptz;
alter table public.care_response_requests add column if not exists fast_dispatch_status text default 'none';

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

create table if not exists public.ops_autopilot_logs (
  id uuid primary key default gen_random_uuid(),
  request_id uuid,
  action_type text not null,
  actor_name text default '안부웍스 오토파일럿',
  message text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.care_response_matches to anon, authenticated;
grant select, insert, update, delete on public.care_response_requests to anon, authenticated;
grant select, insert, update, delete on public.care_response_updates to anon, authenticated;
grant select, insert, update, delete on public.ops_autopilot_logs to anon, authenticated;

notify pgrst, 'reload schema';
select pg_sleep(1);
notify pgrst, 'reload schema';
