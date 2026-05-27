-- 안부웍스 구독 게이트 / 무료 체험 보강 SQL

create extension if not exists pgcrypto;

create table if not exists public.anbu_subscriptions (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  plan_name text,
  status text default 'trial',
  started_at timestamptz default now(),
  ended_at timestamptz,
  created_at timestamptz default now()
);

alter table public.anbu_subscriptions
  add column if not exists family_code text;

alter table public.anbu_subscriptions
  add column if not exists plan_name text;

alter table public.anbu_subscriptions
  add column if not exists status text default 'trial';

alter table public.anbu_subscriptions
  add column if not exists started_at timestamptz default now();

alter table public.anbu_subscriptions
  add column if not exists ended_at timestamptz;

alter table public.anbu_subscriptions
  add column if not exists created_at timestamptz default now();

create index if not exists idx_anbu_subscriptions_family_code
  on public.anbu_subscriptions(family_code);

create index if not exists idx_anbu_subscriptions_status
  on public.anbu_subscriptions(status);
