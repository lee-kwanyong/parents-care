create extension if not exists pgcrypto;

create table if not exists public.anbu_family_links (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  parent_name text,
  guardian_name text,
  parent_phone text,
  guardian_phone text,
  parent_joined_at timestamptz,
  guardian_joined_at timestamptz,
  parent_verified_at timestamptz,
  guardian_verified_at timestamptz,
  source text default 'onboarding',
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.anbu_family_links add column if not exists family_code text;
alter table public.anbu_family_links add column if not exists parent_name text;
alter table public.anbu_family_links add column if not exists guardian_name text;
alter table public.anbu_family_links add column if not exists parent_phone text;
alter table public.anbu_family_links add column if not exists guardian_phone text;
alter table public.anbu_family_links add column if not exists parent_joined_at timestamptz;
alter table public.anbu_family_links add column if not exists guardian_joined_at timestamptz;
alter table public.anbu_family_links add column if not exists parent_verified_at timestamptz;
alter table public.anbu_family_links add column if not exists guardian_verified_at timestamptz;
alter table public.anbu_family_links add column if not exists source text default 'onboarding';
alter table public.anbu_family_links add column if not exists payload jsonb default '{}'::jsonb;
alter table public.anbu_family_links add column if not exists created_at timestamptz default now();
alter table public.anbu_family_links add column if not exists updated_at timestamptz default now();

create index if not exists idx_anbu_family_links_family_code
  on public.anbu_family_links(family_code);

create table if not exists public.anbu_family_consents (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  role text,
  agreed boolean default false,
  consent_items jsonb default '{}'::jsonb,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.anbu_family_consents add column if not exists family_code text;
alter table public.anbu_family_consents add column if not exists role text;
alter table public.anbu_family_consents add column if not exists agreed boolean default false;
alter table public.anbu_family_consents add column if not exists consent_items jsonb default '{}'::jsonb;
alter table public.anbu_family_consents add column if not exists payload jsonb default '{}'::jsonb;
alter table public.anbu_family_consents add column if not exists created_at timestamptz default now();

create index if not exists idx_anbu_family_consents_family_code
  on public.anbu_family_consents(family_code, created_at desc);

grant usage on schema public to service_role;
grant select, insert, update, delete on public.anbu_family_links to service_role;
grant select, insert, update, delete on public.anbu_family_consents to service_role;

alter table public.anbu_family_links enable row level security;
alter table public.anbu_family_consents enable row level security;

drop policy if exists "anbu_family_links_no_frontend_select" on public.anbu_family_links;
drop policy if exists "anbu_family_links_no_frontend_insert" on public.anbu_family_links;
drop policy if exists "anbu_family_links_no_frontend_update" on public.anbu_family_links;
drop policy if exists "anbu_family_links_no_frontend_delete" on public.anbu_family_links;

create policy "anbu_family_links_no_frontend_select"
  on public.anbu_family_links
  for select
  to anon, authenticated
  using (false);

create policy "anbu_family_links_no_frontend_insert"
  on public.anbu_family_links
  for insert
  to anon, authenticated
  with check (false);

create policy "anbu_family_links_no_frontend_update"
  on public.anbu_family_links
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "anbu_family_links_no_frontend_delete"
  on public.anbu_family_links
  for delete
  to anon, authenticated
  using (false);

drop policy if exists "anbu_family_consents_no_frontend_select" on public.anbu_family_consents;
drop policy if exists "anbu_family_consents_no_frontend_insert" on public.anbu_family_consents;
drop policy if exists "anbu_family_consents_no_frontend_update" on public.anbu_family_consents;
drop policy if exists "anbu_family_consents_no_frontend_delete" on public.anbu_family_consents;

create policy "anbu_family_consents_no_frontend_select"
  on public.anbu_family_consents
  for select
  to anon, authenticated
  using (false);

create policy "anbu_family_consents_no_frontend_insert"
  on public.anbu_family_consents
  for insert
  to anon, authenticated
  with check (false);

create policy "anbu_family_consents_no_frontend_update"
  on public.anbu_family_consents
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "anbu_family_consents_no_frontend_delete"
  on public.anbu_family_consents
  for delete
  to anon, authenticated
  using (false);

notify pgrst, 'reload schema';
