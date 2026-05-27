-- 안부웍스 실제 운영 빌드업용 SQL
-- Supabase SQL Editor에서 실행하세요.

create extension if not exists pgcrypto;

create table if not exists public.anbu_guardians (
  id uuid primary key default gen_random_uuid(),
  name text,
  phone text,
  email text,
  role text default 'guardian',
  created_at timestamptz default now()
);

create table if not exists public.anbu_parents (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid,
  name text,
  phone text,
  relation text,
  consent_status text default 'pending',
  created_at timestamptz default now()
);

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

create table if not exists public.anbu_schedules (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  schedule_type text,
  title text,
  schedule_date date,
  schedule_time text,
  memo text,
  enabled boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.anbu_notifications (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  recipient_role text,
  channel text,
  title text,
  body text,
  status text default 'pending',
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.anbu_weekly_reports (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  report_period text,
  summary text,
  score integer default 0,
  stats jsonb default '{}'::jsonb,
  next_actions jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.anbu_care_partner_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_name text,
  phone text,
  email text,
  region text,
  available_time text,
  caregiver_license text,
  hospital_accompany text,
  medication_check text,
  meal_check text,
  drive_available text,
  expected_fee text,
  intro text,
  privacy_agreed text,
  verification_status text default 'new',
  created_at timestamptz default now()
);

create table if not exists public.anbu_partner_verifications (
  id uuid primary key default gen_random_uuid(),
  partner_application_id uuid,
  step text,
  status text default 'pending',
  memo text,
  checked_by text,
  checked_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.anbu_ops_cases (
  id uuid primary key default gen_random_uuid(),
  customer_name text,
  family_code text,
  status text default '신규 접수',
  owner text,
  priority text,
  memo text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.anbu_outreach_organizations (
  id uuid primary key default gen_random_uuid(),
  org_name text,
  org_type text,
  email text,
  phone text,
  region text,
  status text default '발송전',
  memo text,
  sent_at timestamptz,
  replied_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.anbu_data_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  phone text,
  request_type text,
  memo text,
  status text default 'received',
  created_at timestamptz default now()
);

create table if not exists public.anbu_contacts (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  phone text,
  contact_type text,
  memo text,
  status text default 'received',
  created_at timestamptz default now()
);

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

create table if not exists public.anbu_subscriptions (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  plan_name text,
  status text default 'trial',
  started_at timestamptz default now(),
  ended_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.daily_care_checkins (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  elder_name text,
  check_type text,
  care_label text,
  status text,
  actor_role text,
  source text,
  memo text,
  occurred_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.daily_care_checkins
  add column if not exists family_code text;

create index if not exists idx_anbu_family_links_code on public.anbu_family_links(family_code);
create index if not exists idx_daily_care_checkins_family_code on public.daily_care_checkins(family_code);
create index if not exists idx_anbu_schedules_family_code on public.anbu_schedules(family_code);
create index if not exists idx_anbu_notifications_family_code on public.anbu_notifications(family_code);
create index if not exists idx_anbu_weekly_reports_family_code on public.anbu_weekly_reports(family_code);
create index if not exists idx_anbu_ops_cases_status on public.anbu_ops_cases(status);
create index if not exists idx_anbu_outreach_status on public.anbu_outreach_organizations(status);
create index if not exists idx_anbu_partner_applications_status on public.anbu_care_partner_applications(verification_status);
