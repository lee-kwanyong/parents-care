create extension if not exists pgcrypto;

create table if not exists public.daily_care_checkins (
  id uuid primary key default gen_random_uuid(),
  family_code text not null,
  elder_name text,
  check_type text not null,
  care_label text,
  status text default 'done',
  memo text,
  occurred_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.daily_care_checkins add column if not exists family_code text;
alter table public.daily_care_checkins add column if not exists elder_name text;
alter table public.daily_care_checkins add column if not exists check_type text;
alter table public.daily_care_checkins add column if not exists care_label text;
alter table public.daily_care_checkins add column if not exists status text default 'done';
alter table public.daily_care_checkins add column if not exists memo text;
alter table public.daily_care_checkins add column if not exists occurred_at timestamptz default now();
alter table public.daily_care_checkins add column if not exists created_at timestamptz default now();

create index if not exists idx_daily_care_checkins_family_code
  on public.daily_care_checkins(family_code);

create index if not exists idx_daily_care_checkins_family_type_time
  on public.daily_care_checkins(family_code, check_type, occurred_at desc);

create index if not exists idx_daily_care_checkins_occurred_at
  on public.daily_care_checkins(occurred_at desc);

create table if not exists public.anbu_family_links (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  guardian_name text,
  guardian_phone text,
  parent_name text,
  parent_phone text,
  link_status text default 'active',
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.anbu_family_links add column if not exists family_code text;
alter table public.anbu_family_links add column if not exists guardian_name text;
alter table public.anbu_family_links add column if not exists guardian_phone text;
alter table public.anbu_family_links add column if not exists parent_name text;
alter table public.anbu_family_links add column if not exists parent_phone text;
alter table public.anbu_family_links add column if not exists link_status text default 'active';
alter table public.anbu_family_links add column if not exists payload jsonb default '{}'::jsonb;
alter table public.anbu_family_links add column if not exists created_at timestamptz default now();
alter table public.anbu_family_links add column if not exists updated_at timestamptz default now();

create index if not exists idx_anbu_family_links_family_code
  on public.anbu_family_links(family_code);

alter table public.daily_care_checkins enable row level security;
alter table public.anbu_family_links enable row level security;

drop policy if exists "daily_care_checkins_select_all" on public.daily_care_checkins;
drop policy if exists "daily_care_checkins_insert_all" on public.daily_care_checkins;
drop policy if exists "anbu_family_links_select_all" on public.anbu_family_links;
drop policy if exists "anbu_family_links_insert_all" on public.anbu_family_links;

create policy "daily_care_checkins_select_all"
  on public.daily_care_checkins
  for select
  to anon, authenticated
  using (true);

create policy "daily_care_checkins_insert_all"
  on public.daily_care_checkins
  for insert
  to anon, authenticated
  with check (true);

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

notify pgrst, 'reload schema';
