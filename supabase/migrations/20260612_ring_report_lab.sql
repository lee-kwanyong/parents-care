create extension if not exists pgcrypto;

create table if not exists public.ring_daily_reports (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  parent_name text,
  guardian_name text,
  guardian_phone text,
  guardian_phone_last4 text,
  parent_phone text,
  parent_phone_last4 text,
  report_date date default ((now() at time zone 'Asia/Seoul')::date),
  overall_status text default 'normal',
  anbu_score integer default 100,
  summary_text text,
  recommended_action text,
  data_quality_score integer default 0,
  metrics jsonb default '{}'::jsonb,
  cards jsonb default '[]'::jsonb,
  timeline jsonb default '[]'::jsonb,
  share_message text,
  source text default 'manual',
  created_by text default '운영실',
  viewed_count integer default 0,
  last_viewed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.ring_daily_reports add column if not exists family_code text;
alter table public.ring_daily_reports add column if not exists parent_name text;
alter table public.ring_daily_reports add column if not exists guardian_name text;
alter table public.ring_daily_reports add column if not exists guardian_phone text;
alter table public.ring_daily_reports add column if not exists guardian_phone_last4 text;
alter table public.ring_daily_reports add column if not exists parent_phone text;
alter table public.ring_daily_reports add column if not exists parent_phone_last4 text;
alter table public.ring_daily_reports add column if not exists report_date date default ((now() at time zone 'Asia/Seoul')::date);
alter table public.ring_daily_reports add column if not exists overall_status text default 'normal';
alter table public.ring_daily_reports add column if not exists anbu_score integer default 100;
alter table public.ring_daily_reports add column if not exists summary_text text;
alter table public.ring_daily_reports add column if not exists recommended_action text;
alter table public.ring_daily_reports add column if not exists data_quality_score integer default 0;
alter table public.ring_daily_reports add column if not exists metrics jsonb default '{}'::jsonb;
alter table public.ring_daily_reports add column if not exists cards jsonb default '[]'::jsonb;
alter table public.ring_daily_reports add column if not exists timeline jsonb default '[]'::jsonb;
alter table public.ring_daily_reports add column if not exists share_message text;
alter table public.ring_daily_reports add column if not exists source text default 'manual';
alter table public.ring_daily_reports add column if not exists created_by text default '운영실';
alter table public.ring_daily_reports add column if not exists viewed_count integer default 0;
alter table public.ring_daily_reports add column if not exists last_viewed_at timestamptz;
alter table public.ring_daily_reports add column if not exists created_at timestamptz default now();
alter table public.ring_daily_reports add column if not exists updated_at timestamptz default now();

create index if not exists idx_ring_daily_reports_family
  on public.ring_daily_reports(family_code, report_date desc, created_at desc);

create index if not exists idx_ring_daily_reports_created
  on public.ring_daily_reports(created_at desc);

create index if not exists idx_ring_daily_reports_status
  on public.ring_daily_reports(overall_status, report_date desc);

create table if not exists public.ring_report_lab_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null default 'created',
  report_id uuid,
  family_code text,
  payload jsonb default '{}'::jsonb,
  created_by text default '운영실',
  created_at timestamptz default now()
);

alter table public.ring_report_lab_events add column if not exists event_type text default 'created';
alter table public.ring_report_lab_events add column if not exists report_id uuid;
alter table public.ring_report_lab_events add column if not exists family_code text;
alter table public.ring_report_lab_events add column if not exists payload jsonb default '{}'::jsonb;
alter table public.ring_report_lab_events add column if not exists created_by text default '운영실';
alter table public.ring_report_lab_events add column if not exists created_at timestamptz default now();

create index if not exists idx_ring_report_lab_events_created
  on public.ring_report_lab_events(created_at desc);

create index if not exists idx_ring_report_lab_events_family
  on public.ring_report_lab_events(family_code, created_at desc);

grant usage on schema public to service_role;
grant select, insert, update, delete on public.ring_daily_reports to service_role;
grant select, insert, update, delete on public.ring_report_lab_events to service_role;

alter table public.ring_daily_reports enable row level security;
alter table public.ring_report_lab_events enable row level security;

drop policy if exists "ring_daily_reports_no_frontend_select" on public.ring_daily_reports;
drop policy if exists "ring_daily_reports_no_frontend_insert" on public.ring_daily_reports;
drop policy if exists "ring_daily_reports_no_frontend_update" on public.ring_daily_reports;
drop policy if exists "ring_daily_reports_no_frontend_delete" on public.ring_daily_reports;

create policy "ring_daily_reports_no_frontend_select"
  on public.ring_daily_reports
  for select
  to anon, authenticated
  using (false);

create policy "ring_daily_reports_no_frontend_insert"
  on public.ring_daily_reports
  for insert
  to anon, authenticated
  with check (false);

create policy "ring_daily_reports_no_frontend_update"
  on public.ring_daily_reports
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "ring_daily_reports_no_frontend_delete"
  on public.ring_daily_reports
  for delete
  to anon, authenticated
  using (false);

drop policy if exists "ring_report_lab_events_no_frontend_select" on public.ring_report_lab_events;
drop policy if exists "ring_report_lab_events_no_frontend_insert" on public.ring_report_lab_events;
drop policy if exists "ring_report_lab_events_no_frontend_update" on public.ring_report_lab_events;
drop policy if exists "ring_report_lab_events_no_frontend_delete" on public.ring_report_lab_events;

create policy "ring_report_lab_events_no_frontend_select"
  on public.ring_report_lab_events
  for select
  to anon, authenticated
  using (false);

create policy "ring_report_lab_events_no_frontend_insert"
  on public.ring_report_lab_events
  for insert
  to anon, authenticated
  with check (false);

create policy "ring_report_lab_events_no_frontend_update"
  on public.ring_report_lab_events
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "ring_report_lab_events_no_frontend_delete"
  on public.ring_report_lab_events
  for delete
  to anon, authenticated
  using (false);

insert into public.ring_report_lab_events (
  event_type,
  family_code,
  payload,
  created_by
)
values (
  'schema_applied',
  'template',
  jsonb_build_object(
    'purpose', '스마트링 수면·활동·심박·HRV·체온·착용·배터리 데이터를 보호자 안부리듬 리포트로 변환'
  ),
  'Supabase SQL Editor'
);

notify pgrst, 'reload schema';
