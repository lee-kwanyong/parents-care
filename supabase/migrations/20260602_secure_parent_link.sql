create extension if not exists pgcrypto;

create table if not exists public.anbu_family_links (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  guardian_id text,
  guardian_email text,
  guardian_name text,
  guardian_phone text,
  parent_name text,
  parent_phone text,
  parent_phone_last4 text,
  link_status text default 'pending',
  code_expires_at timestamptz default (now() + interval '14 days'),
  parent_verified_at timestamptz,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.anbu_family_links add column if not exists family_code text;
alter table public.anbu_family_links add column if not exists guardian_id text;
alter table public.anbu_family_links add column if not exists guardian_email text;
alter table public.anbu_family_links add column if not exists guardian_name text;
alter table public.anbu_family_links add column if not exists guardian_phone text;
alter table public.anbu_family_links add column if not exists parent_name text;
alter table public.anbu_family_links add column if not exists parent_phone text;
alter table public.anbu_family_links add column if not exists parent_phone_last4 text;
alter table public.anbu_family_links add column if not exists link_status text default 'pending';
alter table public.anbu_family_links add column if not exists code_expires_at timestamptz default (now() + interval '14 days');
alter table public.anbu_family_links add column if not exists parent_verified_at timestamptz;
alter table public.anbu_family_links add column if not exists payload jsonb default '{}'::jsonb;
alter table public.anbu_family_links add column if not exists created_at timestamptz default now();
alter table public.anbu_family_links add column if not exists updated_at timestamptz default now();

update public.anbu_family_links
set parent_phone_last4 = right(regexp_replace(coalesce(parent_phone, ''), '[^0-9]', '', 'g'), 4)
where parent_phone_last4 is null
  and parent_phone is not null;

create unique index if not exists idx_anbu_family_links_family_code_unique
  on public.anbu_family_links(family_code);

create index if not exists idx_anbu_family_links_parent_phone
  on public.anbu_family_links(parent_phone);

create index if not exists idx_anbu_family_links_guardian_phone
  on public.anbu_family_links(guardian_phone);

alter table public.anbu_family_links enable row level security;

drop policy if exists "anbu_family_links_select_all" on public.anbu_family_links;
drop policy if exists "anbu_family_links_insert_all" on public.anbu_family_links;
drop policy if exists "anbu_family_links_update_all" on public.anbu_family_links;

create policy "anbu_family_links_select_all"
  on public.anbu_family_links
  for select
  to anon, authenticated
  using (true);

create policy "anbu_family_links_insert_all"
  on public.anbu_family_links
  for insert
  to anon, authenticated
  with check (true);

create policy "anbu_family_links_update_all"
  on public.anbu_family_links
  for update
  to anon, authenticated
  using (true)
  with check (true);

notify pgrst, 'reload schema';
