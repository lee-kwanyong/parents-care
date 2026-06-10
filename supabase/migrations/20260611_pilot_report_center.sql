create extension if not exists pgcrypto;

create table if not exists public.ops_pilot_report_snapshots (
  id uuid primary key default gen_random_uuid(),
  title text not null default '안부웍스 실증 리포트',
  report_type text default 'pilot_report',
  status text default 'saved',
  metrics jsonb default '{}'::jsonb,
  survey jsonb default '{}'::jsonb,
  recommendations jsonb default '[]'::jsonb,
  report_markdown text,
  payload jsonb default '{}'::jsonb,
  created_by text default '운영실',
  created_at timestamptz default now()
);

alter table public.ops_pilot_report_snapshots add column if not exists title text default '안부웍스 실증 리포트';
alter table public.ops_pilot_report_snapshots add column if not exists report_type text default 'pilot_report';
alter table public.ops_pilot_report_snapshots add column if not exists status text default 'saved';
alter table public.ops_pilot_report_snapshots add column if not exists metrics jsonb default '{}'::jsonb;
alter table public.ops_pilot_report_snapshots add column if not exists survey jsonb default '{}'::jsonb;
alter table public.ops_pilot_report_snapshots add column if not exists recommendations jsonb default '[]'::jsonb;
alter table public.ops_pilot_report_snapshots add column if not exists report_markdown text;
alter table public.ops_pilot_report_snapshots add column if not exists payload jsonb default '{}'::jsonb;
alter table public.ops_pilot_report_snapshots add column if not exists created_by text default '운영실';
alter table public.ops_pilot_report_snapshots add column if not exists created_at timestamptz default now();

create index if not exists idx_ops_pilot_report_snapshots_created
  on public.ops_pilot_report_snapshots(created_at desc);

grant usage on schema public to service_role;
grant select, insert, update, delete on public.ops_pilot_report_snapshots to service_role;

alter table public.ops_pilot_report_snapshots enable row level security;

drop policy if exists "ops_pilot_report_snapshots_no_frontend_select" on public.ops_pilot_report_snapshots;
drop policy if exists "ops_pilot_report_snapshots_no_frontend_insert" on public.ops_pilot_report_snapshots;
drop policy if exists "ops_pilot_report_snapshots_no_frontend_update" on public.ops_pilot_report_snapshots;
drop policy if exists "ops_pilot_report_snapshots_no_frontend_delete" on public.ops_pilot_report_snapshots;

create policy "ops_pilot_report_snapshots_no_frontend_select"
  on public.ops_pilot_report_snapshots
  for select
  to anon, authenticated
  using (false);

create policy "ops_pilot_report_snapshots_no_frontend_insert"
  on public.ops_pilot_report_snapshots
  for insert
  to anon, authenticated
  with check (false);

create policy "ops_pilot_report_snapshots_no_frontend_update"
  on public.ops_pilot_report_snapshots
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "ops_pilot_report_snapshots_no_frontend_delete"
  on public.ops_pilot_report_snapshots
  for delete
  to anon, authenticated
  using (false);

insert into public.ops_pilot_report_snapshots (
  title,
  report_type,
  status,
  report_markdown,
  payload,
  created_by
)
values (
  '안부웍스 실증 리포트 센터 생성',
  'schema_applied',
  'ok',
  '실증 지표, 유저스푼 결과, 개선 우선순위를 외부 미팅용 리포트로 저장할 수 있도록 준비했습니다.',
  jsonb_build_object(
    'purpose', '가입자·실증가구·안부신호·문자·리포트조회·미응답·대리입력 지표를 통합'
  ),
  'Supabase SQL Editor'
);

notify pgrst, 'reload schema';
