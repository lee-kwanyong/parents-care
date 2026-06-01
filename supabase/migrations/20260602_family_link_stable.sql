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

create or replace function public.create_anbu_family_link(
  p_family_code text,
  p_guardian_name text,
  p_guardian_phone text,
  p_parent_name text,
  p_parent_phone text,
  p_payload jsonb default '{}'::jsonb
)
returns public.anbu_family_links
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.anbu_family_links;
begin
  insert into public.anbu_family_links (
    family_code,
    guardian_name,
    guardian_phone,
    parent_name,
    parent_phone,
    link_status,
    payload,
    updated_at
  )
  values (
    p_family_code,
    p_guardian_name,
    p_guardian_phone,
    p_parent_name,
    p_parent_phone,
    'active',
    coalesce(p_payload, '{}'::jsonb),
    now()
  )
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.get_anbu_family_link(
  p_family_code text
)
returns public.anbu_family_links
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.anbu_family_links;
begin
  select *
  into v_row
  from public.anbu_family_links
  where family_code = p_family_code
  order by created_at desc
  limit 1;

  return v_row;
end;
$$;

grant execute on function public.create_anbu_family_link(text, text, text, text, text, jsonb) to anon, authenticated, service_role;
grant execute on function public.get_anbu_family_link(text) to anon, authenticated, service_role;

notify pgrst, 'reload schema';
