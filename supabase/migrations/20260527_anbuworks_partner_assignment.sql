-- 안부웍스 케어파트너 모집/승인/배정 스키마
-- Supabase SQL Editor에서 실행하세요.

create extension if not exists pgcrypto;

create table if not exists public.anbu_partner_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_name text,
  phone text,
  email text,
  region text,
  available_time text,
  has_caregiver_license boolean not null default false,
  can_hospital_accompany boolean not null default false,
  can_medication_check boolean not null default false,
  can_meal_check boolean not null default false,
  can_drive boolean not null default false,
  verification_status text not null default 'pending',
  verification_memo text,
  memo text,
  approved_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.anbu_partner_applications
  add column if not exists applicant_name text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists region text,
  add column if not exists available_time text,
  add column if not exists has_caregiver_license boolean default false,
  add column if not exists can_hospital_accompany boolean default false,
  add column if not exists can_medication_check boolean default false,
  add column if not exists can_meal_check boolean default false,
  add column if not exists can_drive boolean default false,
  add column if not exists verification_status text default 'pending',
  add column if not exists verification_memo text,
  add column if not exists memo text,
  add column if not exists approved_at timestamptz,
  add column if not exists rejected_at timestamptz,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create table if not exists public.anbu_care_assignments (
  id uuid primary key default gen_random_uuid(),
  family_code text not null,
  partner_application_id uuid,
  partner_name text,
  partner_phone text,
  partner_region text,
  task_type text not null default '생활확인',
  task_title text not null,
  task_description text,
  scheduled_at timestamptz,
  assignment_status text not null default 'assigned',
  ops_memo text,
  report_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.anbu_care_assignments
  add column if not exists family_code text,
  add column if not exists partner_application_id uuid,
  add column if not exists partner_name text,
  add column if not exists partner_phone text,
  add column if not exists partner_region text,
  add column if not exists task_type text default '생활확인',
  add column if not exists task_title text,
  add column if not exists task_description text,
  add column if not exists scheduled_at timestamptz,
  add column if not exists assignment_status text default 'assigned',
  add column if not exists ops_memo text,
  add column if not exists report_summary text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create index if not exists idx_anbu_partner_applications_status
  on public.anbu_partner_applications(verification_status);

create index if not exists idx_anbu_partner_applications_region
  on public.anbu_partner_applications(region);

create index if not exists idx_anbu_care_assignments_family_code
  on public.anbu_care_assignments(family_code);

create index if not exists idx_anbu_care_assignments_status
  on public.anbu_care_assignments(assignment_status);

create index if not exists idx_anbu_care_assignments_scheduled_at
  on public.anbu_care_assignments(scheduled_at);
