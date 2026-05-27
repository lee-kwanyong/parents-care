-- 안부웍스 개인정보/데이터 요청 저장용 스키마
-- Supabase SQL Editor에서 실행하세요.

create extension if not exists pgcrypto;

create table if not exists public.anbu_data_requests (
  id uuid primary key default gen_random_uuid(),
  request_type text not null,
  requester_name text,
  phone text,
  email text,
  family_code text,
  details text,
  request_status text not null default 'received',
  ops_memo text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

alter table public.anbu_data_requests
  add column if not exists request_type text,
  add column if not exists requester_name text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists family_code text,
  add column if not exists details text,
  add column if not exists request_status text default 'received',
  add column if not exists ops_memo text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists processed_at timestamptz;

create index if not exists idx_anbu_data_requests_type
  on public.anbu_data_requests(request_type);

create index if not exists idx_anbu_data_requests_status
  on public.anbu_data_requests(request_status);

create index if not exists idx_anbu_data_requests_created_at
  on public.anbu_data_requests(created_at desc);
