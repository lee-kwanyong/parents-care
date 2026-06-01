-- 안부웍스 Risk-to-Action AI 이벤트 SQL

create extension if not exists pgcrypto;

create table if not exists public.anbu_risk_action_events (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  action_type text,
  action_label text,
  risk_level text,
  risk_score numeric,
  actor_role text,
  actor_name text,
  status text default 'recorded',
  memo text,
  guide_payload jsonb default '{}'::jsonb,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.anbu_risk_action_events add column if not exists family_code text;
alter table public.anbu_risk_action_events add column if not exists action_type text;
alter table public.anbu_risk_action_events add column if not exists action_label text;
alter table public.anbu_risk_action_events add column if not exists risk_level text;
alter table public.anbu_risk_action_events add column if not exists risk_score numeric;
alter table public.anbu_risk_action_events add column if not exists actor_role text;
alter table public.anbu_risk_action_events add column if not exists actor_name text;
alter table public.anbu_risk_action_events add column if not exists status text default 'recorded';
alter table public.anbu_risk_action_events add column if not exists memo text;
alter table public.anbu_risk_action_events add column if not exists guide_payload jsonb default '{}'::jsonb;
alter table public.anbu_risk_action_events add column if not exists payload jsonb default '{}'::jsonb;
alter table public.anbu_risk_action_events add column if not exists created_at timestamptz default now();
alter table public.anbu_risk_action_events add column if not exists updated_at timestamptz default now();

create index if not exists idx_anbu_risk_action_events_family_code
  on public.anbu_risk_action_events(family_code);

create index if not exists idx_anbu_risk_action_events_action_type
  on public.anbu_risk_action_events(action_type);

create index if not exists idx_anbu_risk_action_events_risk_level
  on public.anbu_risk_action_events(risk_level);

create index if not exists idx_anbu_risk_action_events_status
  on public.anbu_risk_action_events(status);

create index if not exists idx_anbu_risk_action_events_created_at
  on public.anbu_risk_action_events(created_at desc);

notify pgrst, 'reload schema';
