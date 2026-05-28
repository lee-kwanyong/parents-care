-- 안부웍스 운영실 감사 로그 SQL

create extension if not exists pgcrypto;

create table if not exists public.anbu_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_role text,
  actor_name text,
  action text,
  target_type text,
  target_id text,
  status text default 'ok',
  severity text default 'info',
  ip_address text,
  user_agent text,
  memo text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.anbu_audit_logs add column if not exists actor_role text;
alter table public.anbu_audit_logs add column if not exists actor_name text;
alter table public.anbu_audit_logs add column if not exists action text;
alter table public.anbu_audit_logs add column if not exists target_type text;
alter table public.anbu_audit_logs add column if not exists target_id text;
alter table public.anbu_audit_logs add column if not exists status text default 'ok';
alter table public.anbu_audit_logs add column if not exists severity text default 'info';
alter table public.anbu_audit_logs add column if not exists ip_address text;
alter table public.anbu_audit_logs add column if not exists user_agent text;
alter table public.anbu_audit_logs add column if not exists memo text;
alter table public.anbu_audit_logs add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.anbu_audit_logs add column if not exists created_at timestamptz default now();

create index if not exists idx_anbu_audit_logs_action
  on public.anbu_audit_logs(action);

create index if not exists idx_anbu_audit_logs_severity
  on public.anbu_audit_logs(severity);

create index if not exists idx_anbu_audit_logs_status
  on public.anbu_audit_logs(status);

create index if not exists idx_anbu_audit_logs_created_at
  on public.anbu_audit_logs(created_at desc);

create index if not exists idx_anbu_audit_logs_target
  on public.anbu_audit_logs(target_type, target_id);

notify pgrst, 'reload schema';
