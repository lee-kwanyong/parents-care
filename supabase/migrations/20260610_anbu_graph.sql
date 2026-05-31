-- 안부웍스 AnbuGraph 스냅샷 SQL

create extension if not exists pgcrypto;

create table if not exists public.anbu_graph_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_type text default 'ops-anbu-graph',
  graph_summary jsonb default '{}'::jsonb,
  graph_payload jsonb default '{}'::jsonb,
  created_by text,
  created_at timestamptz default now()
);

alter table public.anbu_graph_snapshots add column if not exists snapshot_type text default 'ops-anbu-graph';
alter table public.anbu_graph_snapshots add column if not exists graph_summary jsonb default '{}'::jsonb;
alter table public.anbu_graph_snapshots add column if not exists graph_payload jsonb default '{}'::jsonb;
alter table public.anbu_graph_snapshots add column if not exists created_by text;
alter table public.anbu_graph_snapshots add column if not exists created_at timestamptz default now();

create index if not exists idx_anbu_graph_snapshots_type
  on public.anbu_graph_snapshots(snapshot_type);

create index if not exists idx_anbu_graph_snapshots_created_at
  on public.anbu_graph_snapshots(created_at desc);

notify pgrst, 'reload schema';
