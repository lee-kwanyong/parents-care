-- 안부웍스 / 안부온 1차 빌드업용 SQL
-- Supabase SQL Editor에서 실행하면 부모님-자녀 연결, 루틴, 리포트, 케어파트너 신청을 서버에 저장할 수 있습니다.

create table if not exists public.anbu_family_links (
  id uuid primary key default gen_random_uuid(),
  family_code text unique not null,
  guardian_name text,
  guardian_phone text,
  parent_name text,
  parent_phone text,
  consent_status text default 'pending',
  link_status text default 'active',
  parent_joined_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.anbu_routines (
  id uuid primary key default gen_random_uuid(),
  family_code text not null,
  routine_label text not null,
  routine_time text not null,
  message text,
  channel text default 'app',
  enabled boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.anbu_weekly_reports (
  id uuid primary key default gen_random_uuid(),
  family_code text not null,
  report_period text,
  summary text,
  score integer default 0,
  next_actions jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.anbu_partner_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_name text,
  phone text,
  region text,
  available_time text,
  has_caregiver_license boolean default false,
  can_hospital_accompany boolean default false,
  can_medication_check boolean default false,
  can_meal_check boolean default false,
  can_drive boolean default false,
  verification_status text default 'pending',
  memo text,
  created_at timestamptz default now()
);

create table if not exists public.anbu_privacy_consents (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  subject_role text,
  consent_item text,
  agreed boolean default false,
  agreed_at timestamptz default now()
);

alter table public.daily_care_checkins
  add column if not exists family_code text;

create index if not exists idx_anbu_family_links_code on public.anbu_family_links(family_code);
create index if not exists idx_daily_care_checkins_family_code on public.daily_care_checkins(family_code);
create index if not exists idx_anbu_routines_family_code on public.anbu_routines(family_code);
create index if not exists idx_anbu_weekly_reports_family_code on public.anbu_weekly_reports(family_code);
