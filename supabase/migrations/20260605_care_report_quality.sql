-- 안부웍스 케어 리포트 품질 자동점검 SQL

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
  quality_status text default 'unchecked',
  quality_score integer default 100,
  quality_flags jsonb default '[]'::jsonb,
  ops_checklist jsonb default '[]'::jsonb,
  quality_checked_at timestamptz,
  review_memo text,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.anbu_partner_task_reports add column if not exists quality_status text default 'unchecked';
alter table public.anbu_partner_task_reports add column if not exists quality_score integer default 100;
alter table public.anbu_partner_task_reports add column if not exists quality_flags jsonb default '[]'::jsonb;
alter table public.anbu_partner_task_reports add column if not exists ops_checklist jsonb default '[]'::jsonb;
alter table public.anbu_partner_task_reports add column if not exists quality_checked_at timestamptz;
alter table public.anbu_partner_task_reports add column if not exists guardian_visible boolean default false;
alter table public.anbu_partner_task_reports add column if not exists review_memo text;
alter table public.anbu_partner_task_reports add column if not exists reviewed_by text;
alter table public.anbu_partner_task_reports add column if not exists reviewed_at timestamptz;
alter table public.anbu_partner_task_reports add column if not exists updated_at timestamptz default now();

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

create index if not exists idx_anbu_partner_task_reports_quality_status
  on public.anbu_partner_task_reports(quality_status);

create index if not exists idx_anbu_partner_task_reports_quality_score
  on public.anbu_partner_task_reports(quality_score);

create index if not exists idx_anbu_partner_task_reports_visible
  on public.anbu_partner_task_reports(guardian_visible);

notify pgrst, 'reload schema';
