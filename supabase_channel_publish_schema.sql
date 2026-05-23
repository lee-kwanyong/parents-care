create extension if not exists pgcrypto;

create table if not exists public.channel_publish_jobs (
  id uuid primary key default gen_random_uuid(),
  source_type text not null default 'marketing_package',
  source_id text not null,
  channel text not null,
  title text not null,
  body text not null,
  tags text[] not null default '{}',
  image_urls text[] not null default '{}',
  video_brief jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  manual_reason text,
  external_url text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  unique(source_id, channel)
);

create index if not exists idx_channel_publish_jobs_status
on public.channel_publish_jobs(status);

create index if not exists idx_channel_publish_jobs_created_at
on public.channel_publish_jobs(created_at desc);

notify pgrst, 'reload schema';
