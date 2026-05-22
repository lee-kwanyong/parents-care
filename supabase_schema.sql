create extension if not exists pgcrypto;

create table if not exists public.marketing_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text,
  email text,
  phone text,
  service text not null default 'parent-care',
  situation text,
  opt_in boolean not null default false,
  privacy_consent boolean not null default false,
  consent_proof text,
  status text not null default 'new',
  suppressed boolean not null default false,
  last_action_at timestamptz
);

create table if not exists public.marketing_actions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  lead_id uuid references public.marketing_leads(id) on delete cascade,
  service text not null default 'parent-care',
  stage text not null,
  channel text not null default 'email',
  status text not null default 'draft',
  subject text,
  body text,
  due_at timestamptz not null default now(),
  approved_at timestamptz,
  sent_at timestamptz,
  rejected_at timestamptz
);

create table if not exists public.marketing_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  lead_id uuid,
  action_id uuid,
  event text not null,
  payload jsonb not null default '{}'::jsonb
);

create unique index if not exists marketing_actions_unique_live_stage
on public.marketing_actions(lead_id, stage)
where status not in ('rejected');

alter table public.marketing_leads enable row level security;
alter table public.marketing_actions enable row level security;
alter table public.marketing_events enable row level security;
