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

alter table public.daily_care_checkins enable row level security;

drop policy if exists "daily_care_checkins_select_all" on public.daily_care_checkins;
drop policy if exists "daily_care_checkins_insert_all" on public.daily_care_checkins;

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

create or replace function public.create_daily_care_checkin(
  p_family_code text,
  p_elder_name text,
  p_check_type text,
  p_care_label text,
  p_status text,
  p_memo text
)
returns public.daily_care_checkins
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.daily_care_checkins;
begin
  insert into public.daily_care_checkins (
    family_code,
    elder_name,
    check_type,
    care_label,
    status,
    memo,
    occurred_at
  )
  values (
    p_family_code,
    p_elder_name,
    p_check_type,
    p_care_label,
    coalesce(p_status, 'done'),
    p_memo,
    now()
  )
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.create_daily_care_checkin(text, text, text, text, text, text)
to anon, authenticated, service_role;

notify pgrst, 'reload schema';
