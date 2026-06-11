create extension if not exists pgcrypto;

create table if not exists public.ops_invite_center_events (
  id uuid primary key default gen_random_uuid(),
  action text not null default 'copy',
  family_code text,
  target_role text,
  channel text,
  template_key text,
  target_url text,
  copied_text text,
  payload jsonb default '{}'::jsonb,
  created_by text default '운영실',
  created_at timestamptz default now()
);

alter table public.ops_invite_center_events add column if not exists action text default 'copy';
alter table public.ops_invite_center_events add column if not exists family_code text;
alter table public.ops_invite_center_events add column if not exists target_role text;
alter table public.ops_invite_center_events add column if not exists channel text;
alter table public.ops_invite_center_events add column if not exists template_key text;
alter table public.ops_invite_center_events add column if not exists target_url text;
alter table public.ops_invite_center_events add column if not exists copied_text text;
alter table public.ops_invite_center_events add column if not exists payload jsonb default '{}'::jsonb;
alter table public.ops_invite_center_events add column if not exists created_by text default '운영실';
alter table public.ops_invite_center_events add column if not exists created_at timestamptz default now();

create index if not exists idx_ops_invite_center_events_created
  on public.ops_invite_center_events(created_at desc);

create index if not exists idx_ops_invite_center_events_family
  on public.ops_invite_center_events(family_code, created_at desc);

create index if not exists idx_ops_invite_center_events_template
  on public.ops_invite_center_events(template_key, created_at desc);

grant usage on schema public to service_role;
grant select, insert, update, delete on public.ops_invite_center_events to service_role;

alter table public.ops_invite_center_events enable row level security;

drop policy if exists "ops_invite_center_events_no_frontend_select" on public.ops_invite_center_events;
drop policy if exists "ops_invite_center_events_no_frontend_insert" on public.ops_invite_center_events;
drop policy if exists "ops_invite_center_events_no_frontend_update" on public.ops_invite_center_events;
drop policy if exists "ops_invite_center_events_no_frontend_delete" on public.ops_invite_center_events;

create policy "ops_invite_center_events_no_frontend_select"
  on public.ops_invite_center_events
  for select
  to anon, authenticated
  using (false);

create policy "ops_invite_center_events_no_frontend_insert"
  on public.ops_invite_center_events
  for insert
  to anon, authenticated
  with check (false);

create policy "ops_invite_center_events_no_frontend_update"
  on public.ops_invite_center_events
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "ops_invite_center_events_no_frontend_delete"
  on public.ops_invite_center_events
  for delete
  to anon, authenticated
  using (false);

insert into public.ops_invite_center_events (
  action,
  family_code,
  target_role,
  channel,
  template_key,
  copied_text,
  payload,
  created_by
)
values (
  'schema_applied',
  'template',
  'ops',
  'system',
  'schema',
  '실증 참여자 초대 링크 관리센터 테이블을 생성했습니다.',
  jsonb_build_object(
    'purpose', '보호자·부모님·파트너·방문요양센터 초대 링크와 문구 복사 기록'
  ),
  'Supabase SQL Editor'
);

notify pgrst, 'reload schema';
