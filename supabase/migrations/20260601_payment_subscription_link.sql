-- 안부웍스 결제 성공 → 구독 활성화 연결용 SQL

create extension if not exists pgcrypto;

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
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.anbu_payment_intents add column if not exists family_code text;
alter table public.anbu_payment_intents add column if not exists plan_id text;
alter table public.anbu_payment_intents add column if not exists plan_name text;
alter table public.anbu_payment_intents add column if not exists amount integer default 0;
alter table public.anbu_payment_intents add column if not exists currency text default 'KRW';
alter table public.anbu_payment_intents add column if not exists provider text default 'toss';
alter table public.anbu_payment_intents add column if not exists status text default 'ready';
alter table public.anbu_payment_intents add column if not exists payload jsonb default '{}'::jsonb;
alter table public.anbu_payment_intents add column if not exists paid_at timestamptz;

alter table public.anbu_subscriptions add column if not exists family_code text;
alter table public.anbu_subscriptions add column if not exists plan_name text;
alter table public.anbu_subscriptions add column if not exists status text default 'trial';
alter table public.anbu_subscriptions add column if not exists started_at timestamptz default now();
alter table public.anbu_subscriptions add column if not exists ended_at timestamptz;
alter table public.anbu_subscriptions add column if not exists payload jsonb default '{}'::jsonb;

create index if not exists idx_anbu_payment_intents_order_id on public.anbu_payment_intents(order_id);
create index if not exists idx_anbu_payment_intents_family_code on public.anbu_payment_intents(family_code);
create index if not exists idx_anbu_payment_intents_status on public.anbu_payment_intents(status);
create index if not exists idx_anbu_subscriptions_family_code on public.anbu_subscriptions(family_code);
create index if not exists idx_anbu_subscriptions_status on public.anbu_subscriptions(status);

notify pgrst, 'reload schema';
