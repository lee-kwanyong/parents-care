create extension if not exists pgcrypto;

create table if not exists public.naver_keyword_research (
  id uuid primary key default gen_random_uuid(),
  keyword text not null,
  source text not null default 'naver_search_api',
  result_count integer not null default 0,
  top_titles text[] not null default '{}',
  top_links text[] not null default '{}',
  insights jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.naver_content_packages (
  id uuid primary key default gen_random_uuid(),
  package_type text not null default 'naver_blog',
  keyword text not null,
  title text not null,
  body text not null,
  tags text[] not null default '{}',
  publish_target text not null default 'naver_blog_manual_or_creator',
  image_brief jsonb not null default '{}'::jsonb,
  video_brief jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.naver_ad_plans (
  id uuid primary key default gen_random_uuid(),
  keyword text not null,
  campaign_name text not null,
  adgroup_name text not null,
  headline text not null,
  description text not null,
  landing_url text not null,
  daily_budget integer not null default 10000,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_naver_keyword_research_created_at on public.naver_keyword_research(created_at desc);
create index if not exists idx_naver_content_packages_created_at on public.naver_content_packages(created_at desc);
create index if not exists idx_naver_content_packages_status on public.naver_content_packages(status);
create index if not exists idx_naver_ad_plans_created_at on public.naver_ad_plans(created_at desc);
