create extension if not exists pgcrypto;

create table if not exists public.user_onboarding_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null default 'view',
  role text,
  source text,
  path text,
  email text,
  phone text,
  family_code text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.user_onboarding_events add column if not exists event_type text default 'view';
alter table public.user_onboarding_events add column if not exists role text;
alter table public.user_onboarding_events add column if not exists source text;
alter table public.user_onboarding_events add column if not exists path text;
alter table public.user_onboarding_events add column if not exists email text;
alter table public.user_onboarding_events add column if not exists phone text;
alter table public.user_onboarding_events add column if not exists family_code text;
alter table public.user_onboarding_events add column if not exists payload jsonb default '{}'::jsonb;
alter table public.user_onboarding_events add column if not exists created_at timestamptz default now();

create index if not exists idx_user_onboarding_events_created
  on public.user_onboarding_events(created_at desc);

create index if not exists idx_user_onboarding_events_role
  on public.user_onboarding_events(role, created_at desc);

grant usage on schema public to service_role;
grant select, insert, update, delete on public.user_onboarding_events to service_role;

alter table public.user_onboarding_events enable row level security;

drop policy if exists "user_onboarding_events_no_frontend_select" on public.user_onboarding_events;
drop policy if exists "user_onboarding_events_no_frontend_insert" on public.user_onboarding_events;
drop policy if exists "user_onboarding_events_no_frontend_update" on public.user_onboarding_events;
drop policy if exists "user_onboarding_events_no_frontend_delete" on public.user_onboarding_events;

create policy "user_onboarding_events_no_frontend_select"
  on public.user_onboarding_events
  for select
  to anon, authenticated
  using (false);

create policy "user_onboarding_events_no_frontend_insert"
  on public.user_onboarding_events
  for insert
  to anon, authenticated
  with check (false);

create policy "user_onboarding_events_no_frontend_update"
  on public.user_onboarding_events
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "user_onboarding_events_no_frontend_delete"
  on public.user_onboarding_events
  for delete
  to anon, authenticated
  using (false);

insert into public.user_onboarding_events (
  event_type,
  role,
  source,
  path,
  payload
)
values (
  'schema_applied',
  'ops',
  'sql',
  '/onboarding',
  jsonb_build_object(
    'purpose', '가입 후 역할별 다음 행동 안내와 전환 추적'
  )
);

notify pgrst, 'reload schema';
