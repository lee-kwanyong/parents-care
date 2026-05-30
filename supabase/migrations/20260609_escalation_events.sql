-- 안부웍스 무응답 에스컬레이션 이벤트 SQL

create extension if not exists pgcrypto;

create table if not exists public.anbu_escalation_events (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  stage text,
  action_type text,
  action_label text,
  actor_role text,
  actor_name text,
  status text default 'recorded',
  memo text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.anbu_escalation_events add column if not exists family_code text;
alter table public.anbu_escalation_events add column if not exists stage text;
alter table public.anbu_escalation_events add column if not exists action_type text;
alter table public.anbu_escalation_events add column if not exists action_label text;
alter table public.anbu_escalation_events add column if not exists actor_role text;
alter table public.anbu_escalation_events add column if not exists actor_name text;
alter table public.anbu_escalation_events add column if not exists status text default 'recorded';
alter table public.anbu_escalation_events add column if not exists memo text;
alter table public.anbu_escalation_events add column if not exists payload jsonb default '{}'::jsonb;
alter table public.anbu_escalation_events add column if not exists created_at timestamptz default now();
alter table public.anbu_escalation_events add column if not exists updated_at timestamptz default now();

create index if not exists idx_anbu_escalation_events_family_code
  on public.anbu_escalation_events(family_code);

create index if not exists idx_anbu_escalation_events_stage
  on public.anbu_escalation_events(stage);

create index if not exists idx_anbu_escalation_events_action_type
  on public.anbu_escalation_events(action_type);

create index if not exists idx_anbu_escalation_events_status
  on public.anbu_escalation_events(status);

create index if not exists idx_anbu_escalation_events_created_at
  on public.anbu_escalation_events(created_at desc);

notify pgrst, 'reload schema';
