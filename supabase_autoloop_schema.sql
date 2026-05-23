create extension if not exists pgcrypto;

create table if not exists public.auto_marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  campaign_date date not null default current_date,
  slot integer not null,
  keyword text not null,
  title text not null,
  long_body text not null,
  cards jsonb not null default '[]'::jsonb,
  video_script jsonb not null default '{}'::jsonb,
  ad_copy jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  video_status text not null default 'pending',
  video_url text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(campaign_date, slot)
);

create table if not exists public.auto_marketing_publish_jobs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.auto_marketing_campaigns(id) on delete cascade,
  channel text not null,
  status text not null default 'queued',
  external_url text,
  error_message text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  unique(campaign_id, channel)
);

create table if not exists public.auto_marketing_loop_events (
  id uuid primary key default gen_random_uuid(),
  event text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_auto_marketing_campaigns_date
on public.auto_marketing_campaigns(campaign_date desc, slot asc);

create index if not exists idx_auto_marketing_campaigns_status
on public.auto_marketing_campaigns(status);

create index if not exists idx_auto_marketing_publish_jobs_campaign
on public.auto_marketing_publish_jobs(campaign_id);

create index if not exists idx_auto_marketing_publish_jobs_status
on public.auto_marketing_publish_jobs(status);

notify pgrst, 'reload schema';
