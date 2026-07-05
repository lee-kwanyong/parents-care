create extension if not exists pgcrypto;

create table if not exists public.support_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  category text not null default 'general',
  message text not null,
  page_path text,
  status text not null default 'received',
  notify_email text,
  notify_status text not null default 'pending',
  notify_error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.support_inquiries add column if not exists name text;
alter table public.support_inquiries add column if not exists phone text;
alter table public.support_inquiries add column if not exists email text;
alter table public.support_inquiries add column if not exists category text default 'general';
alter table public.support_inquiries add column if not exists message text;
alter table public.support_inquiries add column if not exists page_path text;
alter table public.support_inquiries add column if not exists status text default 'received';
alter table public.support_inquiries add column if not exists notify_email text;
alter table public.support_inquiries add column if not exists notify_status text default 'pending';
alter table public.support_inquiries add column if not exists notify_error text;
alter table public.support_inquiries add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.support_inquiries add column if not exists created_at timestamptz default now();

create index if not exists idx_support_inquiries_created_at
  on public.support_inquiries(created_at desc);

create index if not exists idx_support_inquiries_status
  on public.support_inquiries(status, created_at desc);

grant usage on schema public to service_role;
grant select, insert, update, delete on public.support_inquiries to service_role;

alter table public.support_inquiries enable row level security;

notify pgrst, 'reload schema';
