-- 안부웍스 케어 리포트 운영실 검수 / 보호자 공개 제어 SQL

create extension if not exists pgcrypto;

create table if not exists public.anbu_partner_task_reports (
  id uuid primary key default gen_random_uuid(),
  match_id uuid,
  request_id uuid,
  partner_application_id uuid,
  report_status text default 'submitted',
  guardian_visible boolean default false,
  performed_at timestamptz default now(),
  service_summary text,
  parent_condition text,
  meal_status text,
  medication_status text,
  hospital_result text,
  next_action text,
  photo_note text,
  guardian_message text,
  review_memo text,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.anbu_partner_task_reports
  add column if not exists report_status text default 'submitted';

alter table public.anbu_partner_task_reports
  add column if not exists guardian_visible boolean default false;

alter table public.anbu_partner_task_reports
  add column if not exists review_memo text;

alter table public.anbu_partner_task_reports
  add column if not exists reviewed_by text;

alter table public.anbu_partner_task_reports
  add column if not exists reviewed_at timestamptz;

alter table public.anbu_partner_task_reports
  add column if not exists updated_at timestamptz default now();

create table if not exists public.anbu_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_role text,
  actor_name text,
  action text,
  target_type text,
  target_id text,
  memo text,
  created_at timestamptz default now()
);

create index if not exists idx_anbu_partner_task_reports_status
  on public.anbu_partner_task_reports(report_status);

create index if not exists idx_anbu_partner_task_reports_visible
  on public.anbu_partner_task_reports(guardian_visible);

create index if not exists idx_anbu_partner_task_reports_reviewed_at
  on public.anbu_partner_task_reports(reviewed_at);

create index if not exists idx_anbu_audit_logs_target
  on public.anbu_audit_logs(target_type, target_id);

notify pgrst, 'reload schema';
