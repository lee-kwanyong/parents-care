create extension if not exists pgcrypto;

create table if not exists public.ops_message_templates (
  id uuid primary key default gen_random_uuid(),
  template_code text not null unique,
  title text not null,
  audience text,
  situation text,
  severity text default 'normal',
  channel text default 'sms',
  body text not null,
  variables jsonb default '[]'::jsonb,
  enabled boolean default true,
  payload jsonb default '{}'::jsonb,
  created_by text default '운영실',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.ops_message_templates add column if not exists template_code text;
alter table public.ops_message_templates add column if not exists title text;
alter table public.ops_message_templates add column if not exists audience text;
alter table public.ops_message_templates add column if not exists situation text;
alter table public.ops_message_templates add column if not exists severity text default 'normal';
alter table public.ops_message_templates add column if not exists channel text default 'sms';
alter table public.ops_message_templates add column if not exists body text;
alter table public.ops_message_templates add column if not exists variables jsonb default '[]'::jsonb;
alter table public.ops_message_templates add column if not exists enabled boolean default true;
alter table public.ops_message_templates add column if not exists payload jsonb default '{}'::jsonb;
alter table public.ops_message_templates add column if not exists created_by text default '운영실';
alter table public.ops_message_templates add column if not exists created_at timestamptz default now();
alter table public.ops_message_templates add column if not exists updated_at timestamptz default now();

create unique index if not exists idx_ops_message_templates_code
  on public.ops_message_templates(template_code);

create table if not exists public.ops_message_rules (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null unique,
  title text not null,
  trigger_type text not null,
  signal_type text,
  request_status text,
  template_code text not null,
  audience text,
  min_age_minutes integer default 0,
  cooldown_minutes integer default 1440,
  auto_queue boolean default true,
  auto_dispatch boolean default false,
  enabled boolean default true,
  priority integer default 100,
  notes text,
  payload jsonb default '{}'::jsonb,
  created_by text default '운영실',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.ops_message_rules add column if not exists rule_key text;
alter table public.ops_message_rules add column if not exists title text;
alter table public.ops_message_rules add column if not exists trigger_type text;
alter table public.ops_message_rules add column if not exists signal_type text;
alter table public.ops_message_rules add column if not exists request_status text;
alter table public.ops_message_rules add column if not exists template_code text;
alter table public.ops_message_rules add column if not exists audience text;
alter table public.ops_message_rules add column if not exists min_age_minutes integer default 0;
alter table public.ops_message_rules add column if not exists cooldown_minutes integer default 1440;
alter table public.ops_message_rules add column if not exists auto_queue boolean default true;
alter table public.ops_message_rules add column if not exists auto_dispatch boolean default false;
alter table public.ops_message_rules add column if not exists enabled boolean default true;
alter table public.ops_message_rules add column if not exists priority integer default 100;
alter table public.ops_message_rules add column if not exists notes text;
alter table public.ops_message_rules add column if not exists payload jsonb default '{}'::jsonb;
alter table public.ops_message_rules add column if not exists created_by text default '운영실';
alter table public.ops_message_rules add column if not exists created_at timestamptz default now();
alter table public.ops_message_rules add column if not exists updated_at timestamptz default now();

create unique index if not exists idx_ops_message_rules_key
  on public.ops_message_rules(rule_key);

create index if not exists idx_ops_message_rules_trigger
  on public.ops_message_rules(enabled, trigger_type, signal_type, priority);

create table if not exists public.ops_message_automation_runs (
  id uuid primary key default gen_random_uuid(),
  run_type text default 'manual',
  status text default 'recorded',
  summary text,
  metrics jsonb default '{}'::jsonb,
  results jsonb default '[]'::jsonb,
  dispatch_result jsonb default '{}'::jsonb,
  payload jsonb default '{}'::jsonb,
  created_by text default '운영실',
  created_at timestamptz default now()
);

alter table public.ops_message_automation_runs add column if not exists run_type text default 'manual';
alter table public.ops_message_automation_runs add column if not exists status text default 'recorded';
alter table public.ops_message_automation_runs add column if not exists summary text;
alter table public.ops_message_automation_runs add column if not exists metrics jsonb default '{}'::jsonb;
alter table public.ops_message_automation_runs add column if not exists results jsonb default '[]'::jsonb;
alter table public.ops_message_automation_runs add column if not exists dispatch_result jsonb default '{}'::jsonb;
alter table public.ops_message_automation_runs add column if not exists payload jsonb default '{}'::jsonb;
alter table public.ops_message_automation_runs add column if not exists created_by text default '운영실';
alter table public.ops_message_automation_runs add column if not exists created_at timestamptz default now();

create index if not exists idx_ops_message_automation_runs_created
  on public.ops_message_automation_runs(created_at desc);

grant usage on schema public to service_role;
grant select, insert, update, delete on public.ops_message_templates to service_role;
grant select, insert, update, delete on public.ops_message_rules to service_role;
grant select, insert, update, delete on public.ops_message_automation_runs to service_role;

alter table public.ops_message_templates enable row level security;
alter table public.ops_message_rules enable row level security;
alter table public.ops_message_automation_runs enable row level security;

drop policy if exists "ops_message_templates_no_frontend_select" on public.ops_message_templates;
drop policy if exists "ops_message_templates_no_frontend_insert" on public.ops_message_templates;
drop policy if exists "ops_message_templates_no_frontend_update" on public.ops_message_templates;
drop policy if exists "ops_message_templates_no_frontend_delete" on public.ops_message_templates;

create policy "ops_message_templates_no_frontend_select"
  on public.ops_message_templates
  for select
  to anon, authenticated
  using (false);

create policy "ops_message_templates_no_frontend_insert"
  on public.ops_message_templates
  for insert
  to anon, authenticated
  with check (false);

create policy "ops_message_templates_no_frontend_update"
  on public.ops_message_templates
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "ops_message_templates_no_frontend_delete"
  on public.ops_message_templates
  for delete
  to anon, authenticated
  using (false);

drop policy if exists "ops_message_rules_no_frontend_select" on public.ops_message_rules;
drop policy if exists "ops_message_rules_no_frontend_insert" on public.ops_message_rules;
drop policy if exists "ops_message_rules_no_frontend_update" on public.ops_message_rules;
drop policy if exists "ops_message_rules_no_frontend_delete" on public.ops_message_rules;

create policy "ops_message_rules_no_frontend_select"
  on public.ops_message_rules
  for select
  to anon, authenticated
  using (false);

create policy "ops_message_rules_no_frontend_insert"
  on public.ops_message_rules
  for insert
  to anon, authenticated
  with check (false);

create policy "ops_message_rules_no_frontend_update"
  on public.ops_message_rules
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "ops_message_rules_no_frontend_delete"
  on public.ops_message_rules
  for delete
  to anon, authenticated
  using (false);

drop policy if exists "ops_message_automation_runs_no_frontend_select" on public.ops_message_automation_runs;
drop policy if exists "ops_message_automation_runs_no_frontend_insert" on public.ops_message_automation_runs;
drop policy if exists "ops_message_automation_runs_no_frontend_update" on public.ops_message_automation_runs;
drop policy if exists "ops_message_automation_runs_no_frontend_delete" on public.ops_message_automation_runs;

create policy "ops_message_automation_runs_no_frontend_select"
  on public.ops_message_automation_runs
  for select
  to anon, authenticated
  using (false);

create policy "ops_message_automation_runs_no_frontend_insert"
  on public.ops_message_automation_runs
  for insert
  to anon, authenticated
  with check (false);

create policy "ops_message_automation_runs_no_frontend_update"
  on public.ops_message_automation_runs
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "ops_message_automation_runs_no_frontend_delete"
  on public.ops_message_automation_runs
  for delete
  to anon, authenticated
  using (false);

insert into public.ops_message_automation_runs (
  run_type,
  status,
  summary,
  payload,
  created_by
)
values (
  'message_automation_sql',
  'applied',
  '상황별 문자 자동화 템플릿·규칙·실행 기록 테이블을 생성했습니다.',
  jsonb_build_object(
    'purpose', '필요한 상황에 따라 보호자, 운영실, 생활확인 파트너에게 자동 문자 대기열 생성 및 조건부 발송'
  ),
  'Supabase SQL Editor'
);

notify pgrst, 'reload schema';
select pg_sleep(1);
notify pgrst, 'reload schema';
