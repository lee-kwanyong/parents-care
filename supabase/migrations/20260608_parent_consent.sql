-- 안부웍스 부모님 안심동의 카드 SQL

create extension if not exists pgcrypto;

create table if not exists public.anbu_parent_consents (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  parent_name text,
  consent_status text default 'active',
  consent_settings jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.anbu_parent_consents add column if not exists family_code text;
alter table public.anbu_parent_consents add column if not exists parent_name text;
alter table public.anbu_parent_consents add column if not exists consent_status text default 'active';
alter table public.anbu_parent_consents add column if not exists consent_settings jsonb default '{}'::jsonb;
alter table public.anbu_parent_consents add column if not exists created_at timestamptz default now();
alter table public.anbu_parent_consents add column if not exists updated_at timestamptz default now();

create unique index if not exists idx_anbu_parent_consents_family_code_unique
  on public.anbu_parent_consents(family_code);

create index if not exists idx_anbu_parent_consents_status
  on public.anbu_parent_consents(consent_status);

create table if not exists public.anbu_parent_consent_actions (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  parent_name text,
  action_type text,
  action_label text,
  risk_level text default 'low',
  memo text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.anbu_parent_consent_actions add column if not exists family_code text;
alter table public.anbu_parent_consent_actions add column if not exists parent_name text;
alter table public.anbu_parent_consent_actions add column if not exists action_type text;
alter table public.anbu_parent_consent_actions add column if not exists action_label text;
alter table public.anbu_parent_consent_actions add column if not exists risk_level text default 'low';
alter table public.anbu_parent_consent_actions add column if not exists memo text;
alter table public.anbu_parent_consent_actions add column if not exists payload jsonb default '{}'::jsonb;
alter table public.anbu_parent_consent_actions add column if not exists created_at timestamptz default now();

create index if not exists idx_anbu_parent_consent_actions_family_code
  on public.anbu_parent_consent_actions(family_code);

create index if not exists idx_anbu_parent_consent_actions_action_type
  on public.anbu_parent_consent_actions(action_type);

create index if not exists idx_anbu_parent_consent_actions_risk_level
  on public.anbu_parent_consent_actions(risk_level);

create index if not exists idx_anbu_parent_consent_actions_created_at
  on public.anbu_parent_consent_actions(created_at desc);

notify pgrst, 'reload schema';
