-- 부모님 안심케어 family link table fix

create extension if not exists pgcrypto;

create table if not exists public.anbu_family_links (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  guardian_name text,
  guardian_phone text,
  parent_name text,
  parent_phone text,
  link_status text default 'active',
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.anbu_family_links add column if not exists family_code text;
alter table public.anbu_family_links add column if not exists guardian_name text;
alter table public.anbu_family_links add column if not exists guardian_phone text;
alter table public.anbu_family_links add column if not exists parent_name text;
alter table public.anbu_family_links add column if not exists parent_phone text;
alter table public.anbu_family_links add column if not exists link_status text default 'active';
alter table public.anbu_family_links add column if not exists payload jsonb default '{}'::jsonb;
alter table public.anbu_family_links add column if not exists created_at timestamptz default now();
alter table public.anbu_family_links add column if not exists updated_at timestamptz default now();

create index if not exists idx_anbu_family_links_family_code
  on public.anbu_family_links(family_code);

create index if not exists idx_anbu_family_links_guardian_phone
  on public.anbu_family_links(guardian_phone);

create index if not exists idx_anbu_family_links_parent_phone
  on public.anbu_family_links(parent_phone);

notify pgrst, 'reload schema';
