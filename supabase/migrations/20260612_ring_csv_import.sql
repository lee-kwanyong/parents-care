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

create table if not exists public.ring_csv_import_batches (
  id uuid primary key default gen_random_uuid(),
  source_name text default 'csv',
  file_name text,
  row_count integer default 0,
  success_count integer default 0,
  failed_count integer default 0,
  report_ids jsonb default '[]'::jsonb,
  errors jsonb default '[]'::jsonb,
  raw_preview text,
  payload jsonb default '{}'::jsonb,
  created_by text default '운영실',
  created_at timestamptz default now()
);

alter table public.ring_csv_import_batches add column if not exists source_name text default 'csv';
alter table public.ring_csv_import_batches add column if not exists file_name text;
alter table public.ring_csv_import_batches add column if not exists row_count integer default 0;
alter table public.ring_csv_import_batches add column if not exists success_count integer default 0;
alter table public.ring_csv_import_batches add column if not exists failed_count integer default 0;
alter table public.ring_csv_import_batches add column if not exists report_ids jsonb default '[]'::jsonb;
alter table public.ring_csv_import_batches add column if not exists errors jsonb default '[]'::jsonb;
alter table public.ring_csv_import_batches add column if not exists raw_preview text;
alter table public.ring_csv_import_batches add column if not exists payload jsonb default '{}'::jsonb;
alter table public.ring_csv_import_batches add column if not exists created_by text default '운영실';
alter table public.ring_csv_import_batches add column if not exists created_at timestamptz default now();

create index if not exists idx_ring_csv_import_batches_created
  on public.ring_csv_import_batches(created_at desc);

create table if not exists public.ring_device_readings (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid,
  report_id uuid,
  family_code text,
  parent_name text,
  device_id text,
  device_model text,
  vendor text,
  measured_date date,
  measured_at timestamptz,
  metric_type text,
  value numeric,
  unit text,
  raw_payload jsonb default '{}'::jsonb,
  created_by text default '운영실',
  created_at timestamptz default now()
);

alter table public.ring_device_readings add column if not exists batch_id uuid;
alter table public.ring_device_readings add column if not exists report_id uuid;
alter table public.ring_device_readings add column if not exists family_code text;
alter table public.ring_device_readings add column if not exists parent_name text;
alter table public.ring_device_readings add column if not exists device_id text;
alter table public.ring_device_readings add column if not exists device_model text;
alter table public.ring_device_readings add column if not exists vendor text;
alter table public.ring_device_readings add column if not exists measured_date date;
alter table public.ring_device_readings add column if not exists measured_at timestamptz;
alter table public.ring_device_readings add column if not exists metric_type text;
alter table public.ring_device_readings add column if not exists value numeric;
alter table public.ring_device_readings add column if not exists unit text;
alter table public.ring_device_readings add column if not exists raw_payload jsonb default '{}'::jsonb;
alter table public.ring_device_readings add column if not exists created_by text default '운영실';
alter table public.ring_device_readings add column if not exists created_at timestamptz default now();

create index if not exists idx_ring_device_readings_family
  on public.ring_device_readings(family_code, measured_date desc, metric_type);

create index if not exists idx_ring_device_readings_batch
  on public.ring_device_readings(batch_id, created_at desc);

grant usage on schema public to service_role;
grant select, insert, update, delete on public.ring_daily_reports to service_role;
grant select, insert, update, delete on public.ring_csv_import_batches to service_role;
grant select, insert, update, delete on public.ring_device_readings to service_role;

alter table public.ring_daily_reports enable row level security;
alter table public.ring_csv_import_batches enable row level security;
alter table public.ring_device_readings enable row level security;

drop policy if exists "ring_csv_import_batches_no_frontend_select" on public.ring_csv_import_batches;
drop policy if exists "ring_csv_import_batches_no_frontend_insert" on public.ring_csv_import_batches;
drop policy if exists "ring_csv_import_batches_no_frontend_update" on public.ring_csv_import_batches;
drop policy if exists "ring_csv_import_batches_no_frontend_delete" on public.ring_csv_import_batches;

create policy "ring_csv_import_batches_no_frontend_select"
  on public.ring_csv_import_batches
  for select
  to anon, authenticated
  using (false);

create policy "ring_csv_import_batches_no_frontend_insert"
  on public.ring_csv_import_batches
  for insert
  to anon, authenticated
  with check (false);

create policy "ring_csv_import_batches_no_frontend_update"
  on public.ring_csv_import_batches
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "ring_csv_import_batches_no_frontend_delete"
  on public.ring_csv_import_batches
  for delete
  to anon, authenticated
  using (false);

drop policy if exists "ring_device_readings_no_frontend_select" on public.ring_device_readings;
drop policy if exists "ring_device_readings_no_frontend_insert" on public.ring_device_readings;
drop policy if exists "ring_device_readings_no_frontend_update" on public.ring_device_readings;
drop policy if exists "ring_device_readings_no_frontend_delete" on public.ring_device_readings;

create policy "ring_device_readings_no_frontend_select"
  on public.ring_device_readings
  for select
  to anon, authenticated
  using (false);

create policy "ring_device_readings_no_frontend_insert"
  on public.ring_device_readings
  for insert
  to anon, authenticated
  with check (false);

create policy "ring_device_readings_no_frontend_update"
  on public.ring_device_readings
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "ring_device_readings_no_frontend_delete"
  on public.ring_device_readings
  for delete
  to anon, authenticated
  using (false);

insert into public.ring_csv_import_batches (
  source_name,
  file_name,
  row_count,
  success_count,
  raw_preview,
  payload,
  created_by
)
values (
  'schema',
  '20260612_ring_csv_import.sql',
  0,
  0,
  '스마트링 CSV 업로드 센터 테이블을 생성했습니다.',
  jsonb_build_object(
    'purpose', 'CSV 또는 앱 Export 데이터를 스마트링 안부리듬 리포트로 일괄 변환'
  ),
  'Supabase SQL Editor'
);

notify pgrst, 'reload schema';
