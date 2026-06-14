create extension if not exists pgcrypto;

create table if not exists public.ops_gov_rnd_leads (
  id uuid primary key default gen_random_uuid(),
  lead_type text default 'municipality',
  organization_name text,
  department text,
  contact_name text,
  email text,
  phone text,
  channel text,
  stage text default '발굴',
  priority text default 'medium',
  focus_area text,
  region text,
  expected_units integer default 0,
  monthly_fee numeric default 0,
  hardware_model text,
  sample_count integer default 0,
  next_action text,
  next_action_date date,
  memo text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.ops_gov_rnd_leads add column if not exists lead_type text default 'municipality';
alter table public.ops_gov_rnd_leads add column if not exists organization_name text;
alter table public.ops_gov_rnd_leads add column if not exists department text;
alter table public.ops_gov_rnd_leads add column if not exists contact_name text;
alter table public.ops_gov_rnd_leads add column if not exists email text;
alter table public.ops_gov_rnd_leads add column if not exists phone text;
alter table public.ops_gov_rnd_leads add column if not exists channel text;
alter table public.ops_gov_rnd_leads add column if not exists stage text default '발굴';
alter table public.ops_gov_rnd_leads add column if not exists priority text default 'medium';
alter table public.ops_gov_rnd_leads add column if not exists focus_area text;
alter table public.ops_gov_rnd_leads add column if not exists region text;
alter table public.ops_gov_rnd_leads add column if not exists expected_units integer default 0;
alter table public.ops_gov_rnd_leads add column if not exists monthly_fee numeric default 0;
alter table public.ops_gov_rnd_leads add column if not exists hardware_model text;
alter table public.ops_gov_rnd_leads add column if not exists sample_count integer default 0;
alter table public.ops_gov_rnd_leads add column if not exists next_action text;
alter table public.ops_gov_rnd_leads add column if not exists next_action_date date;
alter table public.ops_gov_rnd_leads add column if not exists memo text;
alter table public.ops_gov_rnd_leads add column if not exists payload jsonb default '{}'::jsonb;
alter table public.ops_gov_rnd_leads add column if not exists created_at timestamptz default now();
alter table public.ops_gov_rnd_leads add column if not exists updated_at timestamptz default now();

create index if not exists idx_ops_gov_rnd_leads_stage
  on public.ops_gov_rnd_leads(stage, updated_at desc);

create index if not exists idx_ops_gov_rnd_leads_type
  on public.ops_gov_rnd_leads(lead_type, updated_at desc);

create index if not exists idx_ops_gov_rnd_leads_next_action_date
  on public.ops_gov_rnd_leads(next_action_date);

grant usage on schema public to service_role;
grant select, insert, update, delete on public.ops_gov_rnd_leads to service_role;

alter table public.ops_gov_rnd_leads enable row level security;

drop policy if exists "ops_gov_rnd_leads_no_frontend_select" on public.ops_gov_rnd_leads;
drop policy if exists "ops_gov_rnd_leads_no_frontend_insert" on public.ops_gov_rnd_leads;
drop policy if exists "ops_gov_rnd_leads_no_frontend_update" on public.ops_gov_rnd_leads;
drop policy if exists "ops_gov_rnd_leads_no_frontend_delete" on public.ops_gov_rnd_leads;

create policy "ops_gov_rnd_leads_no_frontend_select"
  on public.ops_gov_rnd_leads
  for select
  to anon, authenticated
  using (false);

create policy "ops_gov_rnd_leads_no_frontend_insert"
  on public.ops_gov_rnd_leads
  for insert
  to anon, authenticated
  with check (false);

create policy "ops_gov_rnd_leads_no_frontend_update"
  on public.ops_gov_rnd_leads
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "ops_gov_rnd_leads_no_frontend_delete"
  on public.ops_gov_rnd_leads
  for delete
  to anon, authenticated
  using (false);

notify pgrst, 'reload schema';
