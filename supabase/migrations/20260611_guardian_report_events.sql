create extension if not exists pgcrypto;

create table if not exists public.guardian_report_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  family_code text,
  source text default 'guardian_report',
  path text,
  status text,
  parent_name text,
  guardian_name text,
  message text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.guardian_report_events add column if not exists event_type text;
alter table public.guardian_report_events add column if not exists family_code text;
alter table public.guardian_report_events add column if not exists source text default 'guardian_report';
alter table public.guardian_report_events add column if not exists path text;
alter table public.guardian_report_events add column if not exists status text;
alter table public.guardian_report_events add column if not exists parent_name text;
alter table public.guardian_report_events add column if not exists guardian_name text;
alter table public.guardian_report_events add column if not exists message text;
alter table public.guardian_report_events add column if not exists payload jsonb default '{}'::jsonb;
alter table public.guardian_report_events add column if not exists created_at timestamptz default now();

create index if not exists idx_guardian_report_events_created
  on public.guardian_report_events(created_at desc);

create index if not exists idx_guardian_report_events_family
  on public.guardian_report_events(family_code, created_at desc);

create index if not exists idx_guardian_report_events_type
  on public.guardian_report_events(event_type, created_at desc);

grant usage on schema public to service_role;
grant select, insert, update, delete on public.guardian_report_events to service_role;

alter table public.guardian_report_events enable row level security;

drop policy if exists "guardian_report_events_no_frontend_select" on public.guardian_report_events;
drop policy if exists "guardian_report_events_no_frontend_insert" on public.guardian_report_events;
drop policy if exists "guardian_report_events_no_frontend_update" on public.guardian_report_events;
drop policy if exists "guardian_report_events_no_frontend_delete" on public.guardian_report_events;

create policy "guardian_report_events_no_frontend_select"
  on public.guardian_report_events
  for select
  to anon, authenticated
  using (false);

create policy "guardian_report_events_no_frontend_insert"
  on public.guardian_report_events
  for insert
  to anon, authenticated
  with check (false);

create policy "guardian_report_events_no_frontend_update"
  on public.guardian_report_events
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "guardian_report_events_no_frontend_delete"
  on public.guardian_report_events
  for delete
  to anon, authenticated
  using (false);

insert into public.guardian_report_events (
  event_type,
  family_code,
  source,
  path,
  status,
  message,
  payload
)
values (
  'schema_applied',
  'template',
  'sql',
  '/ops/report-tracking',
  'ok',
  '보호자 리포트 조회 추적 테이블을 생성했습니다.',
  jsonb_build_object(
    'purpose', '리포트 조회 성공/실패, 가족코드 입력 실패, 부모님 앱 링크 복사 이벤트 추적'
  )
);

notify pgrst, 'reload schema';
