-- 안부웍스 결제/구독 저장용 스키마
-- Supabase SQL Editor에서 실행하세요.

create extension if not exists pgcrypto;

create table if not exists public.anbu_payment_orders (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  order_id text unique not null,
  order_name text not null,
  plan_id text not null,
  plan_name text not null,
  amount integer not null default 0,
  billing_cycle text not null default 'one_time',
  plan_type text not null default 'care_fee',
  buyer_name text,
  buyer_phone text,
  buyer_email text,
  customer_key text,
  payment_provider text not null default 'toss',
  payment_key text,
  payment_status text not null default 'ready',
  requested_at timestamptz not null default now(),
  paid_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  raw_response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.anbu_payment_orders
  add column if not exists family_code text,
  add column if not exists order_id text,
  add column if not exists order_name text,
  add column if not exists plan_id text,
  add column if not exists plan_name text,
  add column if not exists amount integer default 0,
  add column if not exists billing_cycle text default 'one_time',
  add column if not exists plan_type text default 'care_fee',
  add column if not exists buyer_name text,
  add column if not exists buyer_phone text,
  add column if not exists buyer_email text,
  add column if not exists customer_key text,
  add column if not exists payment_provider text default 'toss',
  add column if not exists payment_key text,
  add column if not exists payment_status text default 'ready',
  add column if not exists requested_at timestamptz default now(),
  add column if not exists paid_at timestamptz,
  add column if not exists failed_at timestamptz,
  add column if not exists failure_reason text,
  add column if not exists raw_response jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create table if not exists public.anbu_subscriptions (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  plan_id text not null,
  plan_name text not null,
  subscription_status text not null default 'active',
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz,
  last_order_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.anbu_subscriptions
  add column if not exists family_code text,
  add column if not exists plan_id text,
  add column if not exists plan_name text,
  add column if not exists subscription_status text default 'active',
  add column if not exists current_period_start timestamptz default now(),
  add column if not exists current_period_end timestamptz,
  add column if not exists last_order_id text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create unique index if not exists idx_anbu_payment_orders_order_id
  on public.anbu_payment_orders(order_id);

create index if not exists idx_anbu_payment_orders_family_code
  on public.anbu_payment_orders(family_code);

create index if not exists idx_anbu_payment_orders_status
  on public.anbu_payment_orders(payment_status);

create index if not exists idx_anbu_subscriptions_family_code
  on public.anbu_subscriptions(family_code);

create index if not exists idx_anbu_subscriptions_status
  on public.anbu_subscriptions(subscription_status);
