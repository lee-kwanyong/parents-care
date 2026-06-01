-- 안부웍스 Outcome Labeling Engine SQL

create extension if not exists pgcrypto;

create table if not exists public.anbu_outcome_labels (
  id uuid primary key default gen_random_uuid(),
  source_type text,
  source_id text,
  family_code text,
  outcome_category text,
  outcome_label text,
  outcome_status text default 'labeled',
  confidence_score numeric,
  impact_score numeric,
  follow_up_required boolean default false,
  follow_up_note text,
  actor_role text,
  actor_name text,
  memo text,
  source_payload jsonb default '{}'::jsonb,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.anbu_outcome_labels add column if not exists source_type text;
alter table public.anbu_outcome_labels add column if not exists source_id text;
alter table public.anbu_outcome_labels add column if not exists family_code text;
alter table public.anbu_outcome_labels add column if not exists outcome_category text;
alter table public.anbu_outcome_labels add column if not exists outcome_label text;
alter table public.anbu_outcome_labels add column if not exists outcome_status text default 'labeled';
alter table public.anbu_outcome_labels add column if not exists confidence_score numeric;
alter table public.anbu_outcome_labels add column if not exists impact_score numeric;
alter table public.anbu_outcome_labels add column if not exists follow_up_required boolean default false;
alter table public.anbu_outcome_labels add column if not exists follow_up_note text;
alter table public.anbu_outcome_labels add column if not exists actor_role text;
alter table public.anbu_outcome_labels add column if not exists actor_name text;
alter table public.anbu_outcome_labels add column if not exists memo text;
alter table public.anbu_outcome_labels add column if not exists source_payload jsonb default '{}'::jsonb;
alter table public.anbu_outcome_labels add column if not exists payload jsonb default '{}'::jsonb;
alter table public.anbu_outcome_labels add column if not exists created_at timestamptz default now();
alter table public.anbu_outcome_labels add column if not exists updated_at timestamptz default now();

create unique index if not exists idx_anbu_outcome_labels_source_unique
  on public.anbu_outcome_labels(source_type, source_id);

create index if not exists idx_anbu_outcome_labels_family_code
  on public.anbu_outcome_labels(family_code);

create index if not exists idx_anbu_outcome_labels_category
  on public.anbu_outcome_labels(outcome_category);

create index if not exists idx_anbu_outcome_labels_status
  on public.anbu_outcome_labels(outcome_status);

create index if not exists idx_anbu_outcome_labels_follow_up
  on public.anbu_outcome_labels(follow_up_required);

create index if not exists idx_anbu_outcome_labels_created_at
  on public.anbu_outcome_labels(created_at desc);

notify pgrst, 'reload schema';
