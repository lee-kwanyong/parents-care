-- 안부웍스 케어파트너 업무 리포트 / 운영 상태 추적 SQL

create extension if not exists pgcrypto;

create table if not exists public.anbu_partner_task_reports (
  id uuid primary key default gen_random_uuid(),
  match_id uuid,
  request_id uuid,
  partner_application_id uuid,
  report_status text default 'submitted',
  performed_at timestamptz default now(),
  service_summary text,
  parent_condition text,
  meal_status text,
  medication_status text,
  hospital_result text,
  next_action text,
  photo_note text,
  guardian_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.anbu_partner_task_reports
  add column if not exists match_id uuid;

alter table public.anbu_partner_task_reports
  add column if not exists request_id uuid;

alter table public.anbu_partner_task_reports
  add column if not exists partner_application_id uuid;

alter table public.anbu_partner_task_reports
  add column if not exists report_status text default 'submitted';

alter table public.anbu_partner_task_reports
  add column if not exists performed_at timestamptz default now();

alter table public.anbu_partner_task_reports
  add column if not exists service_summary text;

alter table public.anbu_partner_task_reports
  add column if not exists parent_condition text;

alter table public.anbu_partner_task_reports
  add column if not exists meal_status text;

alter table public.anbu_partner_task_reports
  add column if not exists medication_status text;

alter table public.anbu_partner_task_reports
  add column if not exists hospital_result text;

alter table public.anbu_partner_task_reports
  add column if not exists next_action text;

alter table public.anbu_partner_task_reports
  add column if not exists photo_note text;

alter table public.anbu_partner_task_reports
  add column if not exists guardian_message text;

alter table public.anbu_partner_task_reports
  add column if not exists created_at timestamptz default now();

alter table public.anbu_partner_task_reports
  add column if not exists updated_at timestamptz default now();

create table if not exists public.anbu_partner_matches (
  id uuid primary key default gen_random_uuid(),
  request_id uuid,
  partner_application_id uuid,
  match_status text default 'assigned',
  memo text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.anbu_partner_matches
  add column if not exists assigned_at timestamptz default now();

alter table public.anbu_partner_matches
  add column if not exists completed_at timestamptz;

alter table public.anbu_partner_matches
  add column if not exists updated_at timestamptz default now();

create table if not exists public.anbu_care_requests (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  guardian_name text,
  guardian_phone text,
  parent_name text,
  region text,
  request_type text,
  preferred_date date,
  preferred_time text,
  details text,
  status text default 'requested',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.anbu_care_requests
  add column if not exists updated_at timestamptz default now();

create index if not exists idx_anbu_partner_task_reports_match_id
  on public.anbu_partner_task_reports(match_id);

create index if not exists idx_anbu_partner_task_reports_request_id
  on public.anbu_partner_task_reports(request_id);

create index if not exists idx_anbu_partner_task_reports_partner_id
  on public.anbu_partner_task_reports(partner_application_id);

create index if not exists idx_anbu_partner_task_reports_status
  on public.anbu_partner_task_reports(report_status);

create index if not exists idx_anbu_partner_matches_status
  on public.anbu_partner_matches(match_status);

notify pgrst, 'reload schema';
