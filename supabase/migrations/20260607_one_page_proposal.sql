create extension if not exists pgcrypto;

create table if not exists public.ops_one_page_proposals (
  id uuid primary key default gen_random_uuid(),
  proposal_type text default 'gov_pilot',
  municipality_name text,
  title text,
  status text default 'draft',
  version_label text,
  content jsonb default '{}'::jsonb,
  metrics jsonb default '{}'::jsonb,
  payload jsonb default '{}'::jsonb,
  created_by text default '운영실',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.ops_one_page_proposals add column if not exists proposal_type text default 'gov_pilot';
alter table public.ops_one_page_proposals add column if not exists municipality_name text;
alter table public.ops_one_page_proposals add column if not exists title text;
alter table public.ops_one_page_proposals add column if not exists status text default 'draft';
alter table public.ops_one_page_proposals add column if not exists version_label text;
alter table public.ops_one_page_proposals add column if not exists content jsonb default '{}'::jsonb;
alter table public.ops_one_page_proposals add column if not exists metrics jsonb default '{}'::jsonb;
alter table public.ops_one_page_proposals add column if not exists payload jsonb default '{}'::jsonb;
alter table public.ops_one_page_proposals add column if not exists created_by text default '운영실';
alter table public.ops_one_page_proposals add column if not exists created_at timestamptz default now();
alter table public.ops_one_page_proposals add column if not exists updated_at timestamptz default now();

create index if not exists idx_ops_one_page_proposals_created
  on public.ops_one_page_proposals(created_at desc);

create index if not exists idx_ops_one_page_proposals_municipality
  on public.ops_one_page_proposals(municipality_name, created_at desc);

grant usage on schema public to service_role;
grant select, insert, update, delete on public.ops_one_page_proposals to service_role;

alter table public.ops_one_page_proposals enable row level security;

drop policy if exists "ops_one_page_proposals_no_frontend_select" on public.ops_one_page_proposals;
drop policy if exists "ops_one_page_proposals_no_frontend_insert" on public.ops_one_page_proposals;
drop policy if exists "ops_one_page_proposals_no_frontend_update" on public.ops_one_page_proposals;
drop policy if exists "ops_one_page_proposals_no_frontend_delete" on public.ops_one_page_proposals;

create policy "ops_one_page_proposals_no_frontend_select"
  on public.ops_one_page_proposals
  for select
  to anon, authenticated
  using (false);

create policy "ops_one_page_proposals_no_frontend_insert"
  on public.ops_one_page_proposals
  for insert
  to anon, authenticated
  with check (false);

create policy "ops_one_page_proposals_no_frontend_update"
  on public.ops_one_page_proposals
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "ops_one_page_proposals_no_frontend_delete"
  on public.ops_one_page_proposals
  for delete
  to anon, authenticated
  using (false);

insert into public.ops_one_page_proposals (
  proposal_type,
  municipality_name,
  title,
  status,
  version_label,
  content,
  created_by
)
values (
  'gov_pilot',
  '예비 지자체',
  '안부웍스 고령자 AIP 돌봄 관제 실증 협업 1페이지 제안서',
  'template',
  'v1',
  jsonb_build_object(
    'tagline', '바이오헬스 데이터 기반 고령자 AIP 돌봄 관제 플랫폼',
    'pilotScale', '10~30가구 예비 실증 후 500가구 표준 실증 확장',
    'period', '4~8주 예비 실증',
    'contact', 'contact@parents-care.net'
  ),
  'Supabase SQL Editor'
);

notify pgrst, 'reload schema';
select pg_sleep(1);
notify pgrst, 'reload schema';
