create extension if not exists pgcrypto;

create table if not exists public.ops_security_hardening_runs (
  id uuid primary key default gen_random_uuid(),
  action_type text default 'security_audit',
  status text default 'recorded',
  summary text,
  metrics jsonb default '{}'::jsonb,
  probe_results jsonb default '[]'::jsonb,
  policy_rows jsonb default '[]'::jsonb,
  payload jsonb default '{}'::jsonb,
  created_by text default '운영실',
  created_at timestamptz default now()
);

alter table public.ops_security_hardening_runs add column if not exists action_type text default 'security_audit';
alter table public.ops_security_hardening_runs add column if not exists status text default 'recorded';
alter table public.ops_security_hardening_runs add column if not exists summary text;
alter table public.ops_security_hardening_runs add column if not exists metrics jsonb default '{}'::jsonb;
alter table public.ops_security_hardening_runs add column if not exists probe_results jsonb default '[]'::jsonb;
alter table public.ops_security_hardening_runs add column if not exists policy_rows jsonb default '[]'::jsonb;
alter table public.ops_security_hardening_runs add column if not exists payload jsonb default '{}'::jsonb;
alter table public.ops_security_hardening_runs add column if not exists created_by text default '운영실';
alter table public.ops_security_hardening_runs add column if not exists created_at timestamptz default now();

create index if not exists idx_ops_security_hardening_runs_created
  on public.ops_security_hardening_runs(created_at desc);

create or replace view public.ops_rls_policy_status as
with target(table_name) as (
  values
    ('care_households'),
    ('care_providers'),
    ('care_response_requests'),
    ('care_response_matches'),
    ('care_response_updates'),
    ('notification_outbox'),
    ('ops_autopilot_logs'),
    ('privacy_access_logs'),
    ('privacy_consent_records'),
    ('gov_submission_packages'),
    ('gov_report_snapshots'),
    ('gov_proposal_leads'),
    ('gov_demo_runs'),
    ('gov_pilot_manual_progress'),
    ('gov_pilot_training_logs'),
    ('ops_notification_cleanup_runs'),
    ('ops_control_center_snapshots'),
    ('ops_security_hardening_runs')
),
rel as (
  select
    c.relname as table_name,
    c.relrowsecurity as rls_enabled,
    c.relforcerowsecurity as force_rls
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind in ('r', 'p')
)
select
  target.table_name,
  coalesce(rel.rls_enabled, false) as rls_enabled,
  coalesce(rel.force_rls, false) as force_rls,

  exists (
    select 1
    from information_schema.role_table_grants g
    where g.table_schema = 'public'
      and g.table_name = target.table_name
      and g.grantee = 'anon'
      and g.privilege_type = 'SELECT'
  ) as anon_select,

  exists (
    select 1
    from information_schema.role_table_grants g
    where g.table_schema = 'public'
      and g.table_name = target.table_name
      and g.grantee = 'anon'
      and g.privilege_type = 'INSERT'
  ) as anon_insert,

  exists (
    select 1
    from information_schema.role_table_grants g
    where g.table_schema = 'public'
      and g.table_name = target.table_name
      and g.grantee = 'anon'
      and g.privilege_type = 'UPDATE'
  ) as anon_update,

  exists (
    select 1
    from information_schema.role_table_grants g
    where g.table_schema = 'public'
      and g.table_name = target.table_name
      and g.grantee = 'anon'
      and g.privilege_type = 'DELETE'
  ) as anon_delete,

  exists (
    select 1
    from information_schema.role_table_grants g
    where g.table_schema = 'public'
      and g.table_name = target.table_name
      and g.grantee = 'authenticated'
      and g.privilege_type = 'SELECT'
  ) as authenticated_select,

  exists (
    select 1
    from information_schema.role_table_grants g
    where g.table_schema = 'public'
      and g.table_name = target.table_name
      and g.grantee = 'authenticated'
      and g.privilege_type = 'INSERT'
  ) as authenticated_insert,

  exists (
    select 1
    from information_schema.role_table_grants g
    where g.table_schema = 'public'
      and g.table_name = target.table_name
      and g.grantee = 'authenticated'
      and g.privilege_type = 'UPDATE'
  ) as authenticated_update,

  exists (
    select 1
    from information_schema.role_table_grants g
    where g.table_schema = 'public'
      and g.table_name = target.table_name
      and g.grantee = 'authenticated'
      and g.privilege_type = 'DELETE'
  ) as authenticated_delete,

  coalesce((
    select count(*)
    from pg_policies p
    where p.schemaname = 'public'
      and p.tablename = target.table_name
      and (
        p.policyname ilike '%select_all%'
        or p.policyname ilike '%insert_all%'
        or p.policyname ilike '%update_all%'
        or p.policyname ilike '%delete_all%'
        or p.qual = 'true'
        or p.with_check = 'true'
      )
  ), 0) as permissive_policy_count,

  coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'policyname', p.policyname,
        'cmd', p.cmd,
        'roles', p.roles,
        'qual', p.qual,
        'with_check', p.with_check
      )
      order by p.policyname
    )
    from pg_policies p
    where p.schemaname = 'public'
      and p.tablename = target.table_name
  ), '[]'::jsonb) as policies

from target
left join rel on rel.table_name = target.table_name
order by target.table_name;

grant usage on schema public to service_role;
grant select, insert, update, delete on public.ops_security_hardening_runs to service_role;
grant select on public.ops_rls_policy_status to service_role;

alter table public.ops_security_hardening_runs enable row level security;

drop policy if exists "ops_security_hardening_runs_no_frontend_select" on public.ops_security_hardening_runs;
drop policy if exists "ops_security_hardening_runs_no_frontend_insert" on public.ops_security_hardening_runs;
drop policy if exists "ops_security_hardening_runs_no_frontend_update" on public.ops_security_hardening_runs;
drop policy if exists "ops_security_hardening_runs_no_frontend_delete" on public.ops_security_hardening_runs;

create policy "ops_security_hardening_runs_no_frontend_select"
  on public.ops_security_hardening_runs
  for select
  to anon, authenticated
  using (false);

create policy "ops_security_hardening_runs_no_frontend_insert"
  on public.ops_security_hardening_runs
  for insert
  to anon, authenticated
  with check (false);

create policy "ops_security_hardening_runs_no_frontend_update"
  on public.ops_security_hardening_runs
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "ops_security_hardening_runs_no_frontend_delete"
  on public.ops_security_hardening_runs
  for delete
  to anon, authenticated
  using (false);

do $$
declare
  t text;
begin
  foreach t in array array[
    'care_households',
    'care_providers',
    'care_response_requests',
    'care_response_matches',
    'care_response_updates',
    'notification_outbox',
    'ops_autopilot_logs',
    'privacy_access_logs',
    'privacy_consent_records',
    'gov_submission_packages',
    'gov_report_snapshots',
    'gov_proposal_leads',
    'gov_demo_runs',
    'gov_pilot_manual_progress',
    'gov_pilot_training_logs',
    'ops_notification_cleanup_runs',
    'ops_control_center_snapshots',
    'ops_security_hardening_runs'
  ]
  loop
    if to_regclass('public.' || t) is not null then
      execute format('grant select, insert, update, delete on public.%I to service_role', t);
      execute format('revoke all on public.%I from anon, authenticated', t);
      execute format('alter table public.%I enable row level security', t);

      execute format('drop policy if exists "%s_select_all" on public.%I', t, t);
      execute format('drop policy if exists "%s_insert_all" on public.%I', t, t);
      execute format('drop policy if exists "%s_update_all" on public.%I', t, t);
      execute format('drop policy if exists "%s_delete_all" on public.%I', t, t);

      execute format('drop policy if exists "%s_no_frontend_select" on public.%I', t, t);
      execute format('drop policy if exists "%s_no_frontend_insert" on public.%I', t, t);
      execute format('drop policy if exists "%s_no_frontend_update" on public.%I', t, t);
      execute format('drop policy if exists "%s_no_frontend_delete" on public.%I', t, t);

      execute format('create policy "%s_no_frontend_select" on public.%I for select to anon, authenticated using (false)', t, t);
      execute format('create policy "%s_no_frontend_insert" on public.%I for insert to anon, authenticated with check (false)', t, t);
      execute format('create policy "%s_no_frontend_update" on public.%I for update to anon, authenticated using (false) with check (false)', t, t);
      execute format('create policy "%s_no_frontend_delete" on public.%I for delete to anon, authenticated using (false)', t, t);
    end if;
  end loop;
end $$;

insert into public.ops_security_hardening_runs (
  action_type,
  status,
  summary,
  payload,
  created_by
)
values (
  'rls_hardening_sql',
  'applied',
  '운영실·개인정보·문자·사건·요양보호사 배치 관련 테이블의 anon/authenticated 직접 접근을 차단했습니다.',
  jsonb_build_object(
    'target_tables', jsonb_build_array(
      'care_households',
      'care_providers',
      'care_response_requests',
      'care_response_matches',
      'care_response_updates',
      'notification_outbox',
      'ops_autopilot_logs',
      'privacy_access_logs',
      'privacy_consent_records',
      'gov_submission_packages',
      'gov_report_snapshots',
      'gov_proposal_leads',
      'gov_demo_runs',
      'gov_pilot_manual_progress',
      'gov_pilot_training_logs',
      'ops_notification_cleanup_runs',
      'ops_control_center_snapshots',
      'ops_security_hardening_runs'
    )
  ),
  'Supabase SQL Editor'
);

notify pgrst, 'reload schema';
select pg_sleep(1);
notify pgrst, 'reload schema';
