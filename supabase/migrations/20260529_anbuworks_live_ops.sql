-- 안부웍스 실운영 알림 / 결제 / Cron 보강 SQL
-- Supabase SQL Editor에서 실행하세요.

create extension if not exists pgcrypto;

create table if not exists public.anbu_notification_outbox (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  channel text not null default 'app',
  to_name text,
  to_phone text,
  to_email text,
  title text not null,
  body text not null,
  template_code text,
  reason text,
  target_url text,
  status text default 'queued',
  provider text,
  provider_message_id text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  sent_at timestamptz
);

create table if not exists public.anbu_integration_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  provider text,
  status text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.anbu_payment_intents (
  id uuid primary key default gen_random_uuid(),
  order_id text unique not null,
  family_code text,
  plan_id text,
  plan_name text,
  amount integer default 0,
  currency text default 'KRW',
  provider text default 'toss',
  status text default 'ready',
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  paid_at timestamptz
);

create table if not exists public.anbu_payment_events (
  id uuid primary key default gen_random_uuid(),
  order_id text,
  provider text,
  event_type text,
  status text,
  payload jsonb default '{}'::jsonb,
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

create index if not exists idx_anbu_notification_outbox_status on public.anbu_notification_outbox(status);
create index if not exists idx_anbu_notification_outbox_family_code on public.anbu_notification_outbox(family_code);
create index if not exists idx_anbu_payment_intents_order_id on public.anbu_payment_intents(order_id);
create index if not exists idx_anbu_payment_intents_status on public.anbu_payment_intents(status);
create index if not exists idx_anbu_integration_events_type on public.anbu_integration_events(event_type);
create index if not exists idx_anbu_family_links_code on public.anbu_family_links(family_code);
create index if not exists idx_anbu_schedules_family_code on public.anbu_schedules(family_code);
