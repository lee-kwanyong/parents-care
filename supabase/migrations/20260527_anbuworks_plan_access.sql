-- 안부웍스 플랜/구독 상태 및 사용량 보조 스키마
-- Supabase SQL Editor에서 실행하세요.

create extension if not exists pgcrypto;

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

create table if not exists public.anbu_plan_usage (
  id uuid primary key default gen_random_uuid(),
  family_code text not null,
  plan_id text,
  usage_key text not null,
  usage_count integer not null default 0,
  period_start timestamptz not null default now(),
  period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_anbu_subscriptions_family_code
  on public.anbu_subscriptions(family_code);

create index if not exists idx_anbu_subscriptions_status
  on public.anbu_subscriptions(subscription_status);

create index if not exists idx_anbu_plan_usage_family_key
  on public.anbu_plan_usage(family_code, usage_key);

create index if not exists idx_anbu_plan_usage_period
  on public.anbu_plan_usage(period_start, period_end);
