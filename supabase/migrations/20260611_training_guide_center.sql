create extension if not exists pgcrypto;

create table if not exists public.ops_training_guide_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null default 'view',
  audience text,
  guide_key text,
  source text default 'training_guide',
  path text,
  copied_text text,
  payload jsonb default '{}'::jsonb,
  created_by text default 'system',
  created_at timestamptz default now()
);

alter table public.ops_training_guide_events add column if not exists event_type text default 'view';
alter table public.ops_training_guide_events add column if not exists audience text;
alter table public.ops_training_guide_events add column if not exists guide_key text;
alter table public.ops_training_guide_events add column if not exists source text default 'training_guide';
alter table public.ops_training_guide_events add column if not exists path text;
alter table public.ops_training_guide_events add column if not exists copied_text text;
alter table public.ops_training_guide_events add column if not exists payload jsonb default '{}'::jsonb;
alter table public.ops_training_guide_events add column if not exists created_by text default 'system';
alter table public.ops_training_guide_events add column if not exists created_at timestamptz default now();

create index if not exists idx_ops_training_guide_events_created
  on public.ops_training_guide_events(created_at desc);

create index if not exists idx_ops_training_guide_events_audience
  on public.ops_training_guide_events(audience, created_at desc);

grant usage on schema public to service_role;
grant select, insert, update, delete on public.ops_training_guide_events to service_role;

alter table public.ops_training_guide_events enable row level security;

drop policy if exists "ops_training_guide_events_no_frontend_select" on public.ops_training_guide_events;
drop policy if exists "ops_training_guide_events_no_frontend_insert" on public.ops_training_guide_events;
drop policy if exists "ops_training_guide_events_no_frontend_update" on public.ops_training_guide_events;
drop policy if exists "ops_training_guide_events_no_frontend_delete" on public.ops_training_guide_events;

create policy "ops_training_guide_events_no_frontend_select"
  on public.ops_training_guide_events
  for select
  to anon, authenticated
  using (false);

create policy "ops_training_guide_events_no_frontend_insert"
  on public.ops_training_guide_events
  for insert
  to anon, authenticated
  with check (false);

create policy "ops_training_guide_events_no_frontend_update"
  on public.ops_training_guide_events
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "ops_training_guide_events_no_frontend_delete"
  on public.ops_training_guide_events
  for delete
  to anon, authenticated
  using (false);

insert into public.ops_training_guide_events (
  event_type,
  audience,
  guide_key,
  source,
  path,
  copied_text,
  payload,
  created_by
)
values (
  'schema_applied',
  'ops',
  'schema',
  'sql',
  '/ops/training-center',
  '실증 참여자 교육/가이드 센터 테이블을 생성했습니다.',
  jsonb_build_object(
    'purpose', '보호자·부모님·생활확인 파트너·기관·운영실 가이드 조회와 복사 기록'
  ),
  'Supabase SQL Editor'
);

notify pgrst, 'reload schema';
