-- 안부웍스 케어파트너 모집 / 승인 / 매칭용 SQL

create extension if not exists pgcrypto;

create table if not exists public.anbu_care_partner_applications (
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
  verification_status text default 'new',
  memo text,
  created_at timestamptz default now()
);

alter table public.anbu_care_partner_applications
  add column if not exists applicant_name text;

alter table public.anbu_care_partner_applications
  add column if not exists phone text;

alter table public.anbu_care_partner_applications
  add column if not exists region text;

alter table public.anbu_care_partner_applications
  add column if not exists available_time text;

alter table public.anbu_care_partner_applications
  add column if not exists has_caregiver_license boolean default false;

alter table public.anbu_care_partner_applications
  add column if not exists can_hospital_accompany boolean default false;

alter table public.anbu_care_partner_applications
  add column if not exists can_medication_check boolean default false;

alter table public.anbu_care_partner_applications
  add column if not exists can_meal_check boolean default false;

alter table public.anbu_care_partner_applications
  add column if not exists can_drive boolean default false;

alter table public.anbu_care_partner_applications
  add column if not exists verification_status text default 'new';

alter table public.anbu_care_partner_applications
  add column if not exists memo text;

alter table public.anbu_care_partner_applications
  add column if not exists created_at timestamptz default now();

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

create table if not exists public.anbu_partner_matches (
  id uuid primary key default gen_random_uuid(),
  request_id uuid,
  partner_application_id uuid,
  match_status text default 'assigned',
  memo text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_anbu_care_partner_applications_status
  on public.anbu_care_partner_applications(verification_status);

create index if not exists idx_anbu_care_partner_applications_region
  on public.anbu_care_partner_applications(region);

create index if not exists idx_anbu_care_requests_family_code
  on public.anbu_care_requests(family_code);

create index if not exists idx_anbu_care_requests_status
  on public.anbu_care_requests(status);

create index if not exists idx_anbu_partner_matches_request_id
  on public.anbu_partner_matches(request_id);

create index if not exists idx_anbu_partner_matches_partner_id
  on public.anbu_partner_matches(partner_application_id);

notify pgrst, 'reload schema';
