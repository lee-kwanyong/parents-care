-- 안부웍스 AnbuGraph 스냅샷 SQL

create extension if not exists pgcrypto;

create table if not exists public.anbu_graph_snapshots (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  snapshot_type text default 'manual',
  graph_status text,
  risk_score integer default 0,
  burden_score integer default 0,
  closure_score integer default 0,
  payload jsonb default '{}'::jsonb,
  created_by text,
  created_at timestamptz default now()
);

alter table public.anbu_graph_snapshots add column if not exists family_code text;
alter table public.anbu_graph_snapshots add column if not exists snapshot_type text default 'manual';
alter table public.anbu_graph_snapshots add column if not exists graph_status text;
alter table public.anbu_graph_snapshots add column if not exists risk_score integer default 0;
alter table public.anbu_graph_snapshots add column if not exists burden_score integer default 0;
alter table public.anbu_graph_snapshots add column if not exists closure_score integer default 0;
alter table public.anbu_graph_snapshots add column if not exists payload jsonb default '{}'::jsonb;
alter table public.anbu_graph_snapshots add column if not exists created_by text;
alter table public.anbu_graph_snapshots add column if not exists created_at timestamptz default now();

create index if not exists idx_anbu_graph_snapshots_family_code
  on public.anbu_graph_snapshots(family_code);

create index if not exists idx_anbu_graph_snapshots_graph_status
  on public.anbu_graph_snapshots(graph_status);

create index if not exists idx_anbu_graph_snapshots_created_at
  on public.anbu_graph_snapshots(created_at desc);

notify pgrst, 'reload schema';
