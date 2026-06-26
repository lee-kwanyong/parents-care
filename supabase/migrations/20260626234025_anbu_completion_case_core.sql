create extension if not exists pgcrypto;

create table if not exists public.anbu_cases (
  id uuid primary key default gen_random_uuid(),
  family_code text not null,
  parent_name text,
  guardian_name text,
  title text not null default '안부 확인 필요',
  reason_type text not null default 'manual',
  risk_level text not null default 'medium',
  status text not null default 'opened',
  source text not null default 'manual',
  opened_by text,
  assigned_to text,
  assigned_role text,
  assigned_at timestamptz,
  due_at timestamptz,
  resolved_at timestamptz,
  cancelled_at timestamptz,
  close_result text,
  close_note text,
  data_quality text not null default 'unknown',
  ring_reference jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.anbu_cases add column if not exists family_code text;
alter table public.anbu_cases add column if not exists parent_name text;
alter table public.anbu_cases add column if not exists guardian_name text;
alter table public.anbu_cases add column if not exists title text default '안부 확인 필요';
alter table public.anbu_cases add column if not exists reason_type text default 'manual';
alter table public.anbu_cases add column if not exists risk_level text default 'medium';
alter table public.anbu_cases add column if not exists status text default 'opened';
alter table public.anbu_cases add column if not exists source text default 'manual';
alter table public.anbu_cases add column if not exists opened_by text;
alter table public.anbu_cases add column if not exists assigned_to text;
alter table public.anbu_cases add column if not exists assigned_role text;
alter table public.anbu_cases add column if not exists assigned_at timestamptz;
alter table public.anbu_cases add column if not exists due_at timestamptz;
alter table public.anbu_cases add column if not exists resolved_at timestamptz;
alter table public.anbu_cases add column if not exists cancelled_at timestamptz;
alter table public.anbu_cases add column if not exists close_result text;
alter table public.anbu_cases add column if not exists close_note text;
alter table public.anbu_cases add column if not exists data_quality text default 'unknown';
alter table public.anbu_cases add column if not exists ring_reference jsonb default '{}'::jsonb;
alter table public.anbu_cases add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.anbu_cases add column if not exists created_at timestamptz default now();
alter table public.anbu_cases add column if not exists updated_at timestamptz default now();

create index if not exists idx_anbu_cases_family_status
  on public.anbu_cases(family_code, status, created_at desc);

create index if not exists idx_anbu_cases_family_created
  on public.anbu_cases(family_code, created_at desc);

create index if not exists idx_anbu_cases_reason
  on public.anbu_cases(reason_type, status, created_at desc);

create table if not exists public.anbu_case_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid,
  family_code text not null,
  event_type text not null default 'note',
  actor_name text,
  actor_role text,
  method text,
  result_type text,
  note text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.anbu_case_events add column if not exists case_id uuid;
alter table public.anbu_case_events add column if not exists family_code text;
alter table public.anbu_case_events add column if not exists event_type text default 'note';
alter table public.anbu_case_events add column if not exists actor_name text;
alter table public.anbu_case_events add column if not exists actor_role text;
alter table public.anbu_case_events add column if not exists method text;
alter table public.anbu_case_events add column if not exists result_type text;
alter table public.anbu_case_events add column if not exists note text;
alter table public.anbu_case_events add column if not exists payload jsonb default '{}'::jsonb;
alter table public.anbu_case_events add column if not exists created_at timestamptz default now();

create index if not exists idx_anbu_case_events_case
  on public.anbu_case_events(case_id, created_at asc);

create index if not exists idx_anbu_case_events_family
  on public.anbu_case_events(family_code, created_at desc);

create table if not exists public.anbu_completion_reports (
  id uuid primary key default gen_random_uuid(),
  report_no text unique default (
    'ANBU-' ||
    to_char(now() at time zone 'Asia/Seoul', 'YYYYMMDD') ||
    '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
  ),
  family_code text not null,
  parent_name text,
  guardian_name text,
  report_date date default ((now() at time zone 'Asia/Seoul')::date),
  report_type text not null default 'daily',
  status_summary text,
  completion_rate numeric default 0,
  average_close_minutes integer,
  case_count integer default 0,
  open_count integer default 0,
  resolved_count integer default 0,
  report_text text not null default '',
  report_json jsonb not null default '{}'::jsonb,
  created_by text default '안부웍스',
  share_token text unique default encode(gen_random_bytes(18), 'hex'),
  viewed_count integer default 0,
  last_viewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.anbu_completion_reports add column if not exists report_no text;
alter table public.anbu_completion_reports add column if not exists family_code text;
alter table public.anbu_completion_reports add column if not exists parent_name text;
alter table public.anbu_completion_reports add column if not exists guardian_name text;
alter table public.anbu_completion_reports add column if not exists report_date date default ((now() at time zone 'Asia/Seoul')::date);
alter table public.anbu_completion_reports add column if not exists report_type text default 'daily';
alter table public.anbu_completion_reports add column if not exists status_summary text;
alter table public.anbu_completion_reports add column if not exists completion_rate numeric default 0;
alter table public.anbu_completion_reports add column if not exists average_close_minutes integer;
alter table public.anbu_completion_reports add column if not exists case_count integer default 0;
alter table public.anbu_completion_reports add column if not exists open_count integer default 0;
alter table public.anbu_completion_reports add column if not exists resolved_count integer default 0;
alter table public.anbu_completion_reports add column if not exists report_text text default '';
alter table public.anbu_completion_reports add column if not exists report_json jsonb default '{}'::jsonb;
alter table public.anbu_completion_reports add column if not exists created_by text default '안부웍스';
alter table public.anbu_completion_reports add column if not exists share_token text;
alter table public.anbu_completion_reports add column if not exists viewed_count integer default 0;
alter table public.anbu_completion_reports add column if not exists last_viewed_at timestamptz;
alter table public.anbu_completion_reports add column if not exists created_at timestamptz default now();

create index if not exists idx_anbu_completion_reports_family
  on public.anbu_completion_reports(family_code, report_date desc, created_at desc);

create unique index if not exists idx_anbu_completion_reports_share
  on public.anbu_completion_reports(share_token)
  where share_token is not null;

create table if not exists public.anbu_report_shares (
  id uuid primary key default gen_random_uuid(),
  report_id uuid,
  family_code text,
  share_token text unique not null default encode(gen_random_bytes(18), 'hex'),
  viewer_role text default 'guardian',
  expires_at timestamptz,
  viewed_count integer default 0,
  last_viewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.anbu_report_shares add column if not exists report_id uuid;
alter table public.anbu_report_shares add column if not exists family_code text;
alter table public.anbu_report_shares add column if not exists share_token text;
alter table public.anbu_report_shares add column if not exists viewer_role text default 'guardian';
alter table public.anbu_report_shares add column if not exists expires_at timestamptz;
alter table public.anbu_report_shares add column if not exists viewed_count integer default 0;
alter table public.anbu_report_shares add column if not exists last_viewed_at timestamptz;
alter table public.anbu_report_shares add column if not exists created_at timestamptz default now();

create table if not exists public.anbu_member_roles (
  id uuid primary key default gen_random_uuid(),
  family_code text not null,
  person_name text,
  phone text,
  role text not null default 'guardian',
  notification_level text default 'important_only',
  is_primary boolean default false,
  created_at timestamptz not null default now()
);

alter table public.anbu_member_roles add column if not exists family_code text;
alter table public.anbu_member_roles add column if not exists person_name text;
alter table public.anbu_member_roles add column if not exists phone text;
alter table public.anbu_member_roles add column if not exists role text default 'guardian';
alter table public.anbu_member_roles add column if not exists notification_level text default 'important_only';
alter table public.anbu_member_roles add column if not exists is_primary boolean default false;
alter table public.anbu_member_roles add column if not exists created_at timestamptz default now();

create index if not exists idx_anbu_member_roles_family
  on public.anbu_member_roles(family_code, role, created_at desc);

grant usage on schema public to service_role;
grant select, insert, update, delete on public.anbu_cases to service_role;
grant select, insert, update, delete on public.anbu_case_events to service_role;
grant select, insert, update, delete on public.anbu_completion_reports to service_role;
grant select, insert, update, delete on public.anbu_report_shares to service_role;
grant select, insert, update, delete on public.anbu_member_roles to service_role;

alter table public.anbu_cases enable row level security;
alter table public.anbu_case_events enable row level security;
alter table public.anbu_completion_reports enable row level security;
alter table public.anbu_report_shares enable row level security;
alter table public.anbu_member_roles enable row level security;

notify pgrst, 'reload schema';
