create extension if not exists pgcrypto;

create table if not exists public.daily_care_checkins (
  id uuid primary key default gen_random_uuid(),
  family_code text not null,
  elder_name text,
  check_type text not null,
  check_slot text default 'day',
  care_date date default ((now() at time zone 'Asia/Seoul')::date),
  care_label text,
  status text default 'done',
  memo text,
  occurred_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.daily_care_checkins add column if not exists family_code text;
alter table public.daily_care_checkins add column if not exists elder_name text;
alter table public.daily_care_checkins add column if not exists check_type text;
alter table public.daily_care_checkins add column if not exists check_slot text default 'day';
alter table public.daily_care_checkins add column if not exists care_date date default ((now() at time zone 'Asia/Seoul')::date);
alter table public.daily_care_checkins add column if not exists care_label text;
alter table public.daily_care_checkins add column if not exists status text default 'done';
alter table public.daily_care_checkins add column if not exists memo text;
alter table public.daily_care_checkins add column if not exists occurred_at timestamptz default now();
alter table public.daily_care_checkins add column if not exists created_at timestamptz default now();

update public.daily_care_checkins
set check_slot = 'day'
where check_slot is null;

update public.daily_care_checkins
set care_date = ((coalesce(occurred_at, created_at, now()) at time zone 'Asia/Seoul')::date)
where care_date is null;

create index if not exists idx_daily_care_checkins_family_code
  on public.daily_care_checkins(family_code);

create index if not exists idx_daily_care_checkins_family_date
  on public.daily_care_checkins(family_code, care_date desc);

create index if not exists idx_daily_care_checkins_family_type_slot_date
  on public.daily_care_checkins(family_code, check_type, check_slot, care_date desc);

create index if not exists idx_daily_care_checkins_occurred_at
  on public.daily_care_checkins(occurred_at desc);

alter table public.daily_care_checkins enable row level security;

drop policy if exists "daily_care_checkins_select_all" on public.daily_care_checkins;
drop policy if exists "daily_care_checkins_insert_all" on public.daily_care_checkins;
drop policy if exists "daily_care_checkins_update_all" on public.daily_care_checkins;

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

create policy "daily_care_checkins_update_all"
  on public.daily_care_checkins
  for update
  to anon, authenticated
  using (true)
  with check (true);

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

create index if not exists idx_anbu_family_links_family_code
  on public.anbu_family_links(family_code);

notify pgrst, 'reload schema';
