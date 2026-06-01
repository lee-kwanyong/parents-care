-- 안부웍스 Pilot Evidence OS SQL

create extension if not exists pgcrypto;

create table if not exists public.anbu_pilot_participants (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  parent_name text,
  guardian_name text,
  guardian_phone text,
  participant_status text default 'active',
  cohort_name text default '기본 실증',
  target_days int default 14,
  start_date date default current_date,
  end_date date,
  notes text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.anbu_pilot_participants add column if not exists family_code text;
alter table public.anbu_pilot_participants add column if not exists parent_name text;
alter table public.anbu_pilot_participants add column if not exists guardian_name text;
alter table public.anbu_pilot_participants add column if not exists guardian_phone text;
alter table public.anbu_pilot_participants add column if not exists participant_status text default 'active';
alter table public.anbu_pilot_participants add column if not exists cohort_name text default '기본 실증';
alter table public.anbu_pilot_participants add column if not exists target_days int default 14;
alter table public.anbu_pilot_participants add column if not exists start_date date default current_date;
alter table public.anbu_pilot_participants add column if not exists end_date date;
alter table public.anbu_pilot_participants add column if not exists notes text;
alter table public.anbu_pilot_participants add column if not exists payload jsonb default '{}'::jsonb;
alter table public.anbu_pilot_participants add column if not exists created_at timestamptz default now();
alter table public.anbu_pilot_participants add column if not exists updated_at timestamptz default now();

create unique index if not exists idx_anbu_pilot_participants_family_code_unique
  on public.anbu_pilot_participants(family_code);

create index if not exists idx_anbu_pilot_participants_status
  on public.anbu_pilot_participants(participant_status);

create index if not exists idx_anbu_pilot_participants_cohort
  on public.anbu_pilot_participants(cohort_name);

create table if not exists public.anbu_pilot_feedback (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  respondent_role text,
  respondent_name text,
  rating int,
  burden_rating int,
  trust_rating int,
  comment text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.anbu_pilot_feedback add column if not exists family_code text;
alter table public.anbu_pilot_feedback add column if not exists respondent_role text;
alter table public.anbu_pilot_feedback add column if not exists respondent_name text;
alter table public.anbu_pilot_feedback add column if not exists rating int;
alter table public.anbu_pilot_feedback add column if not exists burden_rating int;
alter table public.anbu_pilot_feedback add column if not exists trust_rating int;
alter table public.anbu_pilot_feedback add column if not exists comment text;
alter table public.anbu_pilot_feedback add column if not exists payload jsonb default '{}'::jsonb;
alter table public.anbu_pilot_feedback add column if not exists created_at timestamptz default now();

create index if not exists idx_anbu_pilot_feedback_family_code
  on public.anbu_pilot_feedback(family_code);

create index if not exists idx_anbu_pilot_feedback_created_at
  on public.anbu_pilot_feedback(created_at desc);

create table if not exists public.anbu_pilot_events (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  event_type text,
  event_label text,
  actor_role text,
  actor_name text,
  status text default 'recorded',
  memo text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.anbu_pilot_events add column if not exists family_code text;
alter table public.anbu_pilot_events add column if not exists event_type text;
alter table public.anbu_pilot_events add column if not exists event_label text;
alter table public.anbu_pilot_events add column if not exists actor_role text;
alter table public.anbu_pilot_events add column if not exists actor_name text;
alter table public.anbu_pilot_events add column if not exists status text default 'recorded';
alter table public.anbu_pilot_events add column if not exists memo text;
alter table public.anbu_pilot_events add column if not exists payload jsonb default '{}'::jsonb;
alter table public.anbu_pilot_events add column if not exists created_at timestamptz default now();

create index if not exists idx_anbu_pilot_events_family_code
  on public.anbu_pilot_events(family_code);

create index if not exists idx_anbu_pilot_events_event_type
  on public.anbu_pilot_events(event_type);

create index if not exists idx_anbu_pilot_events_created_at
  on public.anbu_pilot_events(created_at desc);

notify pgrst, 'reload schema';
