create extension if not exists pgcrypto;

create table if not exists public.gov_pilot_manual_progress (
  id uuid primary key default gen_random_uuid(),
  step_key text not null,
  phase_key text not null,
  role_key text default 'ops',
  title text not null,
  status text default 'pending',
  note text,
  completed_by text,
  completed_at timestamptz,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.gov_pilot_manual_progress add column if not exists step_key text;
alter table public.gov_pilot_manual_progress add column if not exists phase_key text;
alter table public.gov_pilot_manual_progress add column if not exists role_key text default 'ops';
alter table public.gov_pilot_manual_progress add column if not exists title text;
alter table public.gov_pilot_manual_progress add column if not exists status text default 'pending';
alter table public.gov_pilot_manual_progress add column if not exists note text;
alter table public.gov_pilot_manual_progress add column if not exists completed_by text;
alter table public.gov_pilot_manual_progress add column if not exists completed_at timestamptz;
alter table public.gov_pilot_manual_progress add column if not exists payload jsonb default '{}'::jsonb;
alter table public.gov_pilot_manual_progress add column if not exists created_at timestamptz default now();
alter table public.gov_pilot_manual_progress add column if not exists updated_at timestamptz default now();

create unique index if not exists idx_gov_pilot_manual_progress_step
  on public.gov_pilot_manual_progress(step_key);

create index if not exists idx_gov_pilot_manual_progress_phase
  on public.gov_pilot_manual_progress(phase_key, status, updated_at desc);

create table if not exists public.gov_pilot_training_logs (
  id uuid primary key default gen_random_uuid(),
  training_type text default 'orientation',
  audience text default 'ops',
  trainer_name text,
  attendee_count integer default 0,
  session_date date default current_date,
  note text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.gov_pilot_training_logs add column if not exists training_type text default 'orientation';
alter table public.gov_pilot_training_logs add column if not exists audience text default 'ops';
alter table public.gov_pilot_training_logs add column if not exists trainer_name text;
alter table public.gov_pilot_training_logs add column if not exists attendee_count integer default 0;
alter table public.gov_pilot_training_logs add column if not exists session_date date default current_date;
alter table public.gov_pilot_training_logs add column if not exists note text;
alter table public.gov_pilot_training_logs add column if not exists payload jsonb default '{}'::jsonb;
alter table public.gov_pilot_training_logs add column if not exists created_at timestamptz default now();

create index if not exists idx_gov_pilot_training_logs_created
  on public.gov_pilot_training_logs(created_at desc);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.gov_pilot_manual_progress to anon, authenticated;
grant select, insert, update, delete on public.gov_pilot_training_logs to anon, authenticated;

alter table public.gov_pilot_manual_progress enable row level security;
alter table public.gov_pilot_training_logs enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'gov_pilot_manual_progress',
    'gov_pilot_training_logs'
  ]
  loop
    execute format('drop policy if exists "%s_select_all" on public.%I', t, t);
    execute format('drop policy if exists "%s_insert_all" on public.%I', t, t);
    execute format('drop policy if exists "%s_update_all" on public.%I', t, t);
    execute format('drop policy if exists "%s_delete_all" on public.%I', t, t);

    execute format('create policy "%s_select_all" on public.%I for select to anon, authenticated using (true)', t, t);
    execute format('create policy "%s_insert_all" on public.%I for insert to anon, authenticated with check (true)', t, t);
    execute format('create policy "%s_update_all" on public.%I for update to anon, authenticated using (true) with check (true)', t, t);
    execute format('create policy "%s_delete_all" on public.%I for delete to anon, authenticated using (true)', t, t);
  end loop;
end $$;

notify pgrst, 'reload schema';
select pg_sleep(1);
notify pgrst, 'reload schema';
