create extension if not exists pgcrypto;

create table if not exists public.naver_five_daily_packages (
  id uuid primary key default gen_random_uuid(),
  campaign_date date not null default current_date,
  slot integer not null,
  keyword text not null,
  title text not null,
  subtitle text not null,
  body text not null,
  summary text not null,
  tags text[] not null default '{}',
  card_news jsonb not null default '[]'::jsonb,
  video_brief jsonb not null default '{}'::jsonb,
  youtube_brief jsonb not null default '{}'::jsonb,
  tiktok_brief jsonb not null default '{}'::jsonb,
  instagram_brief jsonb not null default '{}'::jsonb,
  cafe_answer text not null default '',
  kin_answer text not null default '',
  search_ad jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  approved_at timestamptz,
  published_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(campaign_date, slot)
);

create index if not exists idx_naver_five_daily_packages_date
on public.naver_five_daily_packages(campaign_date desc, slot asc);

create index if not exists idx_naver_five_daily_packages_status
on public.naver_five_daily_packages(status);

notify pgrst, 'reload schema';
