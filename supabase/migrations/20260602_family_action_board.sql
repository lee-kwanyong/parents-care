create extension if not exists pgcrypto;

create table if not exists public.family_action_tasks (
  id uuid primary key default gen_random_uuid(),
  family_code text not null,
  task_type text default 'check',
  title text not null,
  description text,
  priority text default 'medium',
  status text default 'todo',
  assigned_to_name text,
  created_by_name text,
  source text default 'manual',
  source_key text,
  due_at timestamptz,
  completed_at timestamptz,
  completed_note text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.family_action_tasks add column if not exists family_code text;
alter table public.family_action_tasks add column if not exists task_type text default 'check';
alter table public.family_action_tasks add column if not exists title text;
alter table public.family_action_tasks add column if not exists description text;
alter table public.family_action_tasks add column if not exists priority text default 'medium';
alter table public.family_action_tasks add column if not exists status text default 'todo';
alter table public.family_action_tasks add column if not exists assigned_to_name text;
alter table public.family_action_tasks add column if not exists created_by_name text;
alter table public.family_action_tasks add column if not exists source text default 'manual';
alter table public.family_action_tasks add column if not exists source_key text;
alter table public.family_action_tasks add column if not exists due_at timestamptz;
alter table public.family_action_tasks add column if not exists completed_at timestamptz;
alter table public.family_action_tasks add column if not exists completed_note text;
alter table public.family_action_tasks add column if not exists payload jsonb default '{}'::jsonb;
alter table public.family_action_tasks add column if not exists created_at timestamptz default now();
alter table public.family_action_tasks add column if not exists updated_at timestamptz default now();

create index if not exists idx_family_action_tasks_family_code
  on public.family_action_tasks(family_code);

create index if not exists idx_family_action_tasks_family_status
  on public.family_action_tasks(family_code, status);

create index if not exists idx_family_action_tasks_created_at
  on public.family_action_tasks(created_at desc);

create index if not exists idx_family_action_tasks_source_key
  on public.family_action_tasks(family_code, source_key);

alter table public.family_action_tasks enable row level security;

drop policy if exists "family_action_tasks_select_all" on public.family_action_tasks;
drop policy if exists "family_action_tasks_insert_all" on public.family_action_tasks;
drop policy if exists "family_action_tasks_update_all" on public.family_action_tasks;
drop policy if exists "family_action_tasks_delete_all" on public.family_action_tasks;

create policy "family_action_tasks_select_all"
  on public.family_action_tasks
  for select
  to anon, authenticated
  using (true);

create policy "family_action_tasks_insert_all"
  on public.family_action_tasks
  for insert
  to anon, authenticated
  with check (true);

create policy "family_action_tasks_update_all"
  on public.family_action_tasks
  for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "family_action_tasks_delete_all"
  on public.family_action_tasks
  for delete
  to anon, authenticated
  using (true);

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

create index if not exists idx_daily_care_checkins_family_date
  on public.daily_care_checkins(family_code, care_date desc);

notify pgrst, 'reload schema';
