create extension if not exists pgcrypto;

create table if not exists public.user_proxy_checkin_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid,
  family_code text,
  actor_type text,
  actor_name text,
  actor_phone text,
  signal_key text,
  signal_type text,
  signal_label text,
  note text,
  notify_guardian boolean default false,
  source text default 'proxy_checkin',
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.user_proxy_checkin_events add column if not exists request_id uuid;
alter table public.user_proxy_checkin_events add column if not exists family_code text;
alter table public.user_proxy_checkin_events add column if not exists actor_type text;
alter table public.user_proxy_checkin_events add column if not exists actor_name text;
alter table public.user_proxy_checkin_events add column if not exists actor_phone text;
alter table public.user_proxy_checkin_events add column if not exists signal_key text;
alter table public.user_proxy_checkin_events add column if not exists signal_type text;
alter table public.user_proxy_checkin_events add column if not exists signal_label text;
alter table public.user_proxy_checkin_events add column if not exists note text;
alter table public.user_proxy_checkin_events add column if not exists notify_guardian boolean default false;
alter table public.user_proxy_checkin_events add column if not exists source text default 'proxy_checkin';
alter table public.user_proxy_checkin_events add column if not exists payload jsonb default '{}'::jsonb;
alter table public.user_proxy_checkin_events add column if not exists created_at timestamptz default now();

create index if not exists idx_user_proxy_checkin_events_created
  on public.user_proxy_checkin_events(created_at desc);

create index if not exists idx_user_proxy_checkin_events_family
  on public.user_proxy_checkin_events(family_code, created_at desc);

grant usage on schema public to service_role;
grant select, insert, update, delete on public.user_proxy_checkin_events to service_role;

alter table public.user_proxy_checkin_events enable row level security;

drop policy if exists "user_proxy_checkin_events_no_frontend_select" on public.user_proxy_checkin_events;
drop policy if exists "user_proxy_checkin_events_no_frontend_insert" on public.user_proxy_checkin_events;
drop policy if exists "user_proxy_checkin_events_no_frontend_update" on public.user_proxy_checkin_events;
drop policy if exists "user_proxy_checkin_events_no_frontend_delete" on public.user_proxy_checkin_events;

create policy "user_proxy_checkin_events_no_frontend_select"
  on public.user_proxy_checkin_events
  for select
  to anon, authenticated
  using (false);

create policy "user_proxy_checkin_events_no_frontend_insert"
  on public.user_proxy_checkin_events
  for insert
  to anon, authenticated
  with check (false);

create policy "user_proxy_checkin_events_no_frontend_update"
  on public.user_proxy_checkin_events
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "user_proxy_checkin_events_no_frontend_delete"
  on public.user_proxy_checkin_events
  for delete
  to anon, authenticated
  using (false);

insert into public.user_proxy_checkin_events (
  family_code,
  actor_type,
  actor_name,
  signal_key,
  signal_type,
  signal_label,
  note,
  source,
  payload
)
values (
  'template',
  'ops',
  'Supabase SQL Editor',
  'schema_applied',
  'schema_applied',
  '대리입력 로그 테이블 생성',
  '보호자 또는 운영실이 전화 확인 후 부모님 안부를 대신 기록할 수 있도록 준비했습니다.',
  'sql',
  jsonb_build_object('purpose', '부모님 직접 입력 실패 보완')
);

notify pgrst, 'reload schema';
