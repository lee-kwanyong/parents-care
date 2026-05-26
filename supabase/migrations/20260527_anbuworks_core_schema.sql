-- 안부웍스 / 안부온 실제 서버 저장용 핵심 스키마
-- Supabase SQL Editor에서 이 전체 내용을 실행하세요.

create extension if not exists pgcrypto;

create table if not exists public.anbu_family_links (
  id uuid primary key default gen_random_uuid(),
  family_code text unique not null,
  guardian_name text,
  guardian_phone text,
  parent_name text,
  parent_phone text,
  consent_status text not null default 'pending',
  link_status text not null default 'active',
  parent_joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_care_checkins (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  elder_name text not null default '부모님',
  check_type text not null,
  care_label text not null,
  status text not null,
  actor_role text default 'parent',
  source text,
  memo text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.anbu_routines (
  id uuid primary key default gen_random_uuid(),
  family_code text not null,
  routine_label text not null,
  routine_time text not null,
  message text,
  channel text not null default 'app',
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.anbu_weekly_reports (
  id uuid primary key default gen_random_uuid(),
  family_code text not null,
  report_period text,
  summary text,
  score integer not null default 0,
  stats jsonb not null default '[]'::jsonb,
  next_actions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.anbu_partner_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_name text,
  phone text,
  region text,
  available_time text,
  has_caregiver_license boolean not null default false,
  can_hospital_accompany boolean not null default false,
  can_medication_check boolean not null default false,
  can_meal_check boolean not null default false,
  can_drive boolean not null default false,
  verification_status text not null default 'pending',
  memo text,
  created_at timestamptz not null default now()
);

create table if not exists public.anbu_privacy_consents (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  subject_role text,
  consent_item text not null,
  agreed boolean not null default false,
  agreed_at timestamptz not null default now()
);

create index if not exists idx_anbu_family_links_code on public.anbu_family_links(family_code);
create index if not exists idx_daily_care_checkins_family_code on public.daily_care_checkins(family_code);
create index if not exists idx_daily_care_checkins_occurred_at on public.daily_care_checkins(occurred_at desc);
create index if not exists idx_anbu_routines_family_code on public.anbu_routines(family_code);
create index if not exists idx_anbu_weekly_reports_family_code on public.anbu_weekly_reports(family_code);
create index if not exists idx_anbu_partner_applications_status on public.anbu_partner_applications(verification_status);

-- 서버 API는 SUPABASE_SERVICE_ROLE_KEY로 접근하는 것을 권장합니다.
-- 민감한 부모님 안부 데이터를 다루므로 클라이언트에서 직접 테이블에 접근하지 않는 구조가 안전합니다.
