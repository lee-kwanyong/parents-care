create extension if not exists pgcrypto;

create table if not exists public.ops_no_response_followup_runs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  status text default 'recorded',
  summary text,
  family_code text,
  metrics jsonb default '{}'::jsonb,
  results jsonb default '[]'::jsonb,
  affected_ids jsonb default '[]'::jsonb,
  payload jsonb default '{}'::jsonb,
  created_by text default '운영실',
  created_at timestamptz default now()
);

alter table public.ops_no_response_followup_runs add column if not exists action text;
alter table public.ops_no_response_followup_runs add column if not exists status text default 'recorded';
alter table public.ops_no_response_followup_runs add column if not exists summary text;
alter table public.ops_no_response_followup_runs add column if not exists family_code text;
alter table public.ops_no_response_followup_runs add column if not exists metrics jsonb default '{}'::jsonb;
alter table public.ops_no_response_followup_runs add column if not exists results jsonb default '[]'::jsonb;
alter table public.ops_no_response_followup_runs add column if not exists affected_ids jsonb default '[]'::jsonb;
alter table public.ops_no_response_followup_runs add column if not exists payload jsonb default '{}'::jsonb;
alter table public.ops_no_response_followup_runs add column if not exists created_by text default '운영실';
alter table public.ops_no_response_followup_runs add column if not exists created_at timestamptz default now();

create index if not exists idx_ops_no_response_followup_runs_created
  on public.ops_no_response_followup_runs(created_at desc);

create index if not exists idx_ops_no_response_followup_runs_family
  on public.ops_no_response_followup_runs(family_code, created_at desc);

grant usage on schema public to service_role;
grant select, insert, update, delete on public.ops_no_response_followup_runs to service_role;

alter table public.ops_no_response_followup_runs enable row level security;

drop policy if exists "ops_no_response_followup_runs_no_frontend_select" on public.ops_no_response_followup_runs;
drop policy if exists "ops_no_response_followup_runs_no_frontend_insert" on public.ops_no_response_followup_runs;
drop policy if exists "ops_no_response_followup_runs_no_frontend_update" on public.ops_no_response_followup_runs;
drop policy if exists "ops_no_response_followup_runs_no_frontend_delete" on public.ops_no_response_followup_runs;

create policy "ops_no_response_followup_runs_no_frontend_select"
  on public.ops_no_response_followup_runs
  for select
  to anon, authenticated
  using (false);

create policy "ops_no_response_followup_runs_no_frontend_insert"
  on public.ops_no_response_followup_runs
  for insert
  to anon, authenticated
  with check (false);

create policy "ops_no_response_followup_runs_no_frontend_update"
  on public.ops_no_response_followup_runs
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "ops_no_response_followup_runs_no_frontend_delete"
  on public.ops_no_response_followup_runs
  for delete
  to anon, authenticated
  using (false);

insert into public.ops_no_response_followup_runs (
  action,
  status,
  summary,
  payload,
  created_by
)
values (
  'schema_applied',
  'ok',
  '미응답 자동 처리센터 로그 테이블을 생성했습니다.',
  jsonb_build_object(
    'purpose', '오늘 안부 신호가 없는 가구를 찾아 보호자 확인 문자와 대리입력을 유도'
  ),
  'Supabase SQL Editor'
);

notify pgrst, 'reload schema';
