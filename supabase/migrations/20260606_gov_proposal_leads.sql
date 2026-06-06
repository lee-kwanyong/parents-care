create extension if not exists pgcrypto;

create table if not exists public.gov_proposal_leads (
  id uuid primary key default gen_random_uuid(),
  lead_type text default 'gov_proposal',
  organization_name text not null,
  region text,
  department_name text,
  contact_name text not null,
  role_title text,
  phone text,
  email text,
  households_count integer,
  interest_area text default 'pilot',
  message text,
  privacy_agreed boolean default false,
  consent_at timestamptz,
  status text default 'new',
  followup_note text,
  assigned_to text,
  ip_hash text,
  user_agent text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.gov_proposal_leads add column if not exists lead_type text default 'gov_proposal';
alter table public.gov_proposal_leads add column if not exists organization_name text;
alter table public.gov_proposal_leads add column if not exists region text;
alter table public.gov_proposal_leads add column if not exists department_name text;
alter table public.gov_proposal_leads add column if not exists contact_name text;
alter table public.gov_proposal_leads add column if not exists role_title text;
alter table public.gov_proposal_leads add column if not exists phone text;
alter table public.gov_proposal_leads add column if not exists email text;
alter table public.gov_proposal_leads add column if not exists households_count integer;
alter table public.gov_proposal_leads add column if not exists interest_area text default 'pilot';
alter table public.gov_proposal_leads add column if not exists message text;
alter table public.gov_proposal_leads add column if not exists privacy_agreed boolean default false;
alter table public.gov_proposal_leads add column if not exists consent_at timestamptz;
alter table public.gov_proposal_leads add column if not exists status text default 'new';
alter table public.gov_proposal_leads add column if not exists followup_note text;
alter table public.gov_proposal_leads add column if not exists assigned_to text;
alter table public.gov_proposal_leads add column if not exists ip_hash text;
alter table public.gov_proposal_leads add column if not exists user_agent text;
alter table public.gov_proposal_leads add column if not exists payload jsonb default '{}'::jsonb;
alter table public.gov_proposal_leads add column if not exists created_at timestamptz default now();
alter table public.gov_proposal_leads add column if not exists updated_at timestamptz default now();

create index if not exists idx_gov_proposal_leads_status
  on public.gov_proposal_leads(status, created_at desc);

create index if not exists idx_gov_proposal_leads_region
  on public.gov_proposal_leads(region, created_at desc);

grant usage on schema public to service_role;
grant select, insert, update, delete on public.gov_proposal_leads to service_role;

alter table public.gov_proposal_leads enable row level security;

drop policy if exists "gov_proposal_leads_deny_frontend_select" on public.gov_proposal_leads;
drop policy if exists "gov_proposal_leads_deny_frontend_insert" on public.gov_proposal_leads;
drop policy if exists "gov_proposal_leads_deny_frontend_update" on public.gov_proposal_leads;
drop policy if exists "gov_proposal_leads_deny_frontend_delete" on public.gov_proposal_leads;

create policy "gov_proposal_leads_deny_frontend_select"
  on public.gov_proposal_leads
  for select
  to anon, authenticated
  using (false);

create policy "gov_proposal_leads_deny_frontend_insert"
  on public.gov_proposal_leads
  for insert
  to anon, authenticated
  with check (false);

create policy "gov_proposal_leads_deny_frontend_update"
  on public.gov_proposal_leads
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "gov_proposal_leads_deny_frontend_delete"
  on public.gov_proposal_leads
  for delete
  to anon, authenticated
  using (false);

notify pgrst, 'reload schema';
select pg_sleep(1);
notify pgrst, 'reload schema';
