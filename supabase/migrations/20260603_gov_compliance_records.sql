create extension if not exists pgcrypto;

create table if not exists public.gov_compliance_records (
  id uuid primary key default gen_random_uuid(),
  record_type text not null,
  status text default 'done',
  title text,
  content text,
  evidence_count integer default 0,
  checked_by_name text,
  target_route text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.gov_compliance_records add column if not exists record_type text;
alter table public.gov_compliance_records add column if not exists status text default 'done';
alter table public.gov_compliance_records add column if not exists title text;
alter table public.gov_compliance_records add column if not exists content text;
alter table public.gov_compliance_records add column if not exists evidence_count integer default 0;
alter table public.gov_compliance_records add column if not exists checked_by_name text;
alter table public.gov_compliance_records add column if not exists target_route text;
alter table public.gov_compliance_records add column if not exists payload jsonb default '{}'::jsonb;
alter table public.gov_compliance_records add column if not exists created_at timestamptz default now();
alter table public.gov_compliance_records add column if not exists updated_at timestamptz default now();

create index if not exists idx_gov_compliance_records_type
  on public.gov_compliance_records(record_type);

create index if not exists idx_gov_compliance_records_created
  on public.gov_compliance_records(created_at desc);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.gov_compliance_records to anon, authenticated;

alter table public.gov_compliance_records enable row level security;

drop policy if exists "gov_compliance_records_select_all" on public.gov_compliance_records;
drop policy if exists "gov_compliance_records_insert_all" on public.gov_compliance_records;
drop policy if exists "gov_compliance_records_update_all" on public.gov_compliance_records;
drop policy if exists "gov_compliance_records_delete_all" on public.gov_compliance_records;

create policy "gov_compliance_records_select_all"
  on public.gov_compliance_records
  for select
  to anon, authenticated
  using (true);

create policy "gov_compliance_records_insert_all"
  on public.gov_compliance_records
  for insert
  to anon, authenticated
  with check (true);

create policy "gov_compliance_records_update_all"
  on public.gov_compliance_records
  for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "gov_compliance_records_delete_all"
  on public.gov_compliance_records
  for delete
  to anon, authenticated
  using (true);

create table if not exists public.gov_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_name text,
  actor_role text,
  action_type text,
  target_type text,
  target_id text,
  family_code text,
  description text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.gov_audit_logs add column if not exists actor_name text;
alter table public.gov_audit_logs add column if not exists actor_role text;
alter table public.gov_audit_logs add column if not exists action_type text;
alter table public.gov_audit_logs add column if not exists target_type text;
alter table public.gov_audit_logs add column if not exists target_id text;
alter table public.gov_audit_logs add column if not exists family_code text;
alter table public.gov_audit_logs add column if not exists description text;
alter table public.gov_audit_logs add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.gov_audit_logs add column if not exists created_at timestamptz default now();

grant select, insert, update, delete on public.gov_audit_logs to anon, authenticated;

alter table public.gov_audit_logs enable row level security;

drop policy if exists "gov_audit_logs_select_all" on public.gov_audit_logs;
drop policy if exists "gov_audit_logs_insert_all" on public.gov_audit_logs;

create policy "gov_audit_logs_select_all"
  on public.gov_audit_logs
  for select
  to anon, authenticated
  using (true);

create policy "gov_audit_logs_insert_all"
  on public.gov_audit_logs
  for insert
  to anon, authenticated
  with check (true);

notify pgrst, 'reload schema';
select pg_sleep(1);
notify pgrst, 'reload schema';
