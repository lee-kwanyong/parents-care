create extension if not exists pgcrypto;

create table if not exists public.ops_proposal_reality_snapshots (
  id uuid primary key default gen_random_uuid(),
  title text not null default '제안서 표현 현실화 점검',
  status text default 'saved',
  safe_claims jsonb default '[]'::jsonb,
  pilot_claims jsonb default '[]'::jsonb,
  vision_claims jsonb default '[]'::jsonb,
  risky_claims jsonb default '[]'::jsonb,
  copy_blocks jsonb default '{}'::jsonb,
  checklist jsonb default '[]'::jsonb,
  payload jsonb default '{}'::jsonb,
  created_by text default '운영실',
  created_at timestamptz default now()
);

alter table public.ops_proposal_reality_snapshots add column if not exists title text default '제안서 표현 현실화 점검';
alter table public.ops_proposal_reality_snapshots add column if not exists status text default 'saved';
alter table public.ops_proposal_reality_snapshots add column if not exists safe_claims jsonb default '[]'::jsonb;
alter table public.ops_proposal_reality_snapshots add column if not exists pilot_claims jsonb default '[]'::jsonb;
alter table public.ops_proposal_reality_snapshots add column if not exists vision_claims jsonb default '[]'::jsonb;
alter table public.ops_proposal_reality_snapshots add column if not exists risky_claims jsonb default '[]'::jsonb;
alter table public.ops_proposal_reality_snapshots add column if not exists copy_blocks jsonb default '{}'::jsonb;
alter table public.ops_proposal_reality_snapshots add column if not exists checklist jsonb default '[]'::jsonb;
alter table public.ops_proposal_reality_snapshots add column if not exists payload jsonb default '{}'::jsonb;
alter table public.ops_proposal_reality_snapshots add column if not exists created_by text default '운영실';
alter table public.ops_proposal_reality_snapshots add column if not exists created_at timestamptz default now();

create index if not exists idx_ops_proposal_reality_snapshots_created
  on public.ops_proposal_reality_snapshots(created_at desc);

grant usage on schema public to service_role;
grant select, insert, update, delete on public.ops_proposal_reality_snapshots to service_role;

alter table public.ops_proposal_reality_snapshots enable row level security;

drop policy if exists "ops_proposal_reality_snapshots_no_frontend_select" on public.ops_proposal_reality_snapshots;
drop policy if exists "ops_proposal_reality_snapshots_no_frontend_insert" on public.ops_proposal_reality_snapshots;
drop policy if exists "ops_proposal_reality_snapshots_no_frontend_update" on public.ops_proposal_reality_snapshots;
drop policy if exists "ops_proposal_reality_snapshots_no_frontend_delete" on public.ops_proposal_reality_snapshots;

create policy "ops_proposal_reality_snapshots_no_frontend_select"
  on public.ops_proposal_reality_snapshots
  for select
  to anon, authenticated
  using (false);

create policy "ops_proposal_reality_snapshots_no_frontend_insert"
  on public.ops_proposal_reality_snapshots
  for insert
  to anon, authenticated
  with check (false);

create policy "ops_proposal_reality_snapshots_no_frontend_update"
  on public.ops_proposal_reality_snapshots
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "ops_proposal_reality_snapshots_no_frontend_delete"
  on public.ops_proposal_reality_snapshots
  for delete
  to anon, authenticated
  using (false);

insert into public.ops_proposal_reality_snapshots (
  title,
  status,
  payload,
  created_by
)
values (
  '제안서 표현 현실화 센터 생성',
  'ok',
  jsonb_build_object(
    'purpose', '현재 기능, 예비실증, 기관실증, 장기 B2G/IoT 비전을 구분해 외부 제안 표현 리스크를 낮춤'
  ),
  'Supabase SQL Editor'
);

notify pgrst, 'reload schema';
