create extension if not exists pgcrypto;

create table if not exists public.gov_recipients (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  recipient_name text,
  birth_year integer,
  age_band text,
  region_sido text,
  region_sigungu text,
  region_eupmyeondong text,
  household_type text,
  program_type text default '지역사회 통합돌봄',
  assigned_org_name text,
  assigned_staff_name text,
  guardian_name text,
  consent_status text default 'pending',
  risk_level text default 'normal',
  service_status text default 'active',
  service_started_at date default ((now() at time zone 'Asia/Seoul')::date),
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.gov_recipients add column if not exists family_code text;
alter table public.gov_recipients add column if not exists recipient_name text;
alter table public.gov_recipients add column if not exists birth_year integer;
alter table public.gov_recipients add column if not exists age_band text;
alter table public.gov_recipients add column if not exists region_sido text;
alter table public.gov_recipients add column if not exists region_sigungu text;
alter table public.gov_recipients add column if not exists region_eupmyeondong text;
alter table public.gov_recipients add column if not exists household_type text;
alter table public.gov_recipients add column if not exists program_type text default '지역사회 통합돌봄';
alter table public.gov_recipients add column if not exists assigned_org_name text;
alter table public.gov_recipients add column if not exists assigned_staff_name text;
alter table public.gov_recipients add column if not exists guardian_name text;
alter table public.gov_recipients add column if not exists consent_status text default 'pending';
alter table public.gov_recipients add column if not exists risk_level text default 'normal';
alter table public.gov_recipients add column if not exists service_status text default 'active';
alter table public.gov_recipients add column if not exists service_started_at date default ((now() at time zone 'Asia/Seoul')::date);
alter table public.gov_recipients add column if not exists payload jsonb default '{}'::jsonb;
alter table public.gov_recipients add column if not exists created_at timestamptz default now();
alter table public.gov_recipients add column if not exists updated_at timestamptz default now();

create index if not exists idx_gov_recipients_family_code
  on public.gov_recipients(family_code);

create index if not exists idx_gov_recipients_region
  on public.gov_recipients(region_sigungu, region_eupmyeondong);

create index if not exists idx_gov_recipients_risk
  on public.gov_recipients(risk_level);

create table if not exists public.gov_case_notes (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  recipient_id uuid,
  case_type text default 'phone_check',
  title text,
  content text,
  status text default 'open',
  priority text default 'medium',
  actor_name text,
  actor_role text default 'staff',
  org_name text,
  next_action text,
  due_at timestamptz,
  completed_at timestamptz,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.gov_case_notes add column if not exists family_code text;
alter table public.gov_case_notes add column if not exists recipient_id uuid;
alter table public.gov_case_notes add column if not exists case_type text default 'phone_check';
alter table public.gov_case_notes add column if not exists title text;
alter table public.gov_case_notes add column if not exists content text;
alter table public.gov_case_notes add column if not exists status text default 'open';
alter table public.gov_case_notes add column if not exists priority text default 'medium';
alter table public.gov_case_notes add column if not exists actor_name text;
alter table public.gov_case_notes add column if not exists actor_role text default 'staff';
alter table public.gov_case_notes add column if not exists org_name text;
alter table public.gov_case_notes add column if not exists next_action text;
alter table public.gov_case_notes add column if not exists due_at timestamptz;
alter table public.gov_case_notes add column if not exists completed_at timestamptz;
alter table public.gov_case_notes add column if not exists payload jsonb default '{}'::jsonb;
alter table public.gov_case_notes add column if not exists created_at timestamptz default now();
alter table public.gov_case_notes add column if not exists updated_at timestamptz default now();

create index if not exists idx_gov_case_notes_family_code
  on public.gov_case_notes(family_code);

create index if not exists idx_gov_case_notes_status
  on public.gov_case_notes(status);

create index if not exists idx_gov_case_notes_created
  on public.gov_case_notes(created_at desc);

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

create index if not exists idx_gov_audit_logs_family_code
  on public.gov_audit_logs(family_code);

create index if not exists idx_gov_audit_logs_created
  on public.gov_audit_logs(created_at desc);

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

create index if not exists idx_daily_care_checkins_family_type_slot_date
  on public.daily_care_checkins(family_code, check_type, check_slot, care_date desc);

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

create index if not exists idx_family_action_tasks_family_status
  on public.family_action_tasks(family_code, status);

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

alter table public.gov_recipients enable row level security;
alter table public.gov_case_notes enable row level security;
alter table public.gov_audit_logs enable row level security;
alter table public.daily_care_checkins enable row level security;
alter table public.family_action_tasks enable row level security;
alter table public.anbu_family_links enable row level security;

drop policy if exists "gov_recipients_select_all" on public.gov_recipients;
drop policy if exists "gov_recipients_insert_all" on public.gov_recipients;
drop policy if exists "gov_recipients_update_all" on public.gov_recipients;
drop policy if exists "gov_case_notes_select_all" on public.gov_case_notes;
drop policy if exists "gov_case_notes_insert_all" on public.gov_case_notes;
drop policy if exists "gov_case_notes_update_all" on public.gov_case_notes;
drop policy if exists "gov_audit_logs_select_all" on public.gov_audit_logs;
drop policy if exists "gov_audit_logs_insert_all" on public.gov_audit_logs;

create policy "gov_recipients_select_all" on public.gov_recipients for select to anon, authenticated using (true);
create policy "gov_recipients_insert_all" on public.gov_recipients for insert to anon, authenticated with check (true);
create policy "gov_recipients_update_all" on public.gov_recipients for update to anon, authenticated using (true) with check (true);

create policy "gov_case_notes_select_all" on public.gov_case_notes for select to anon, authenticated using (true);
create policy "gov_case_notes_insert_all" on public.gov_case_notes for insert to anon, authenticated with check (true);
create policy "gov_case_notes_update_all" on public.gov_case_notes for update to anon, authenticated using (true) with check (true);

create policy "gov_audit_logs_select_all" on public.gov_audit_logs for select to anon, authenticated using (true);
create policy "gov_audit_logs_insert_all" on public.gov_audit_logs for insert to anon, authenticated with check (true);

drop policy if exists "daily_care_checkins_select_all" on public.daily_care_checkins;
drop policy if exists "daily_care_checkins_insert_all" on public.daily_care_checkins;
drop policy if exists "daily_care_checkins_update_all" on public.daily_care_checkins;

create policy "daily_care_checkins_select_all" on public.daily_care_checkins for select to anon, authenticated using (true);
create policy "daily_care_checkins_insert_all" on public.daily_care_checkins for insert to anon, authenticated with check (true);
create policy "daily_care_checkins_update_all" on public.daily_care_checkins for update to anon, authenticated using (true) with check (true);

drop policy if exists "family_action_tasks_select_all" on public.family_action_tasks;
drop policy if exists "family_action_tasks_insert_all" on public.family_action_tasks;
drop policy if exists "family_action_tasks_update_all" on public.family_action_tasks;

create policy "family_action_tasks_select_all" on public.family_action_tasks for select to anon, authenticated using (true);
create policy "family_action_tasks_insert_all" on public.family_action_tasks for insert to anon, authenticated with check (true);
create policy "family_action_tasks_update_all" on public.family_action_tasks for update to anon, authenticated using (true) with check (true);

drop policy if exists "anbu_family_links_select_all" on public.anbu_family_links;
drop policy if exists "anbu_family_links_insert_all" on public.anbu_family_links;
drop policy if exists "anbu_family_links_update_all" on public.anbu_family_links;

create policy "anbu_family_links_select_all" on public.anbu_family_links for select to anon, authenticated using (true);
create policy "anbu_family_links_insert_all" on public.anbu_family_links for insert to anon, authenticated with check (true);
create policy "anbu_family_links_update_all" on public.anbu_family_links for update to anon, authenticated using (true) with check (true);

notify pgrst, 'reload schema';
