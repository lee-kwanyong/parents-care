create extension if not exists pgcrypto;

alter table public.anbu_family_links add column if not exists parent_address text;
alter table public.anbu_family_links add column if not exists guardian_address text;
alter table public.anbu_family_links add column if not exists address text;
alter table public.anbu_family_links add column if not exists member_status text default 'active';
alter table public.anbu_family_links add column if not exists admin_memo text;
alter table public.anbu_family_links add column if not exists updated_at timestamptz default now();

create unique index if not exists ux_anbu_family_links_family_code_not_blank
on public.anbu_family_links (family_code)
where nullif(family_code, '') is not null;

create table if not exists public.ops_phone_duplicate_reviews (
  id uuid primary key default gen_random_uuid(),
  audit_run_at timestamptz default now(),
  duplicate_type text,
  phone_key text,
  phone_masked text,
  family_code text,
  person_role text,
  person_name text,
  source_row_id text,
  source_created_at timestamptz,
  reviewed boolean default false,
  decision text,
  review_note text,
  created_at timestamptz default now()
);

alter table public.ops_phone_duplicate_reviews add column if not exists audit_run_at timestamptz default now();
alter table public.ops_phone_duplicate_reviews add column if not exists duplicate_type text;
alter table public.ops_phone_duplicate_reviews add column if not exists phone_key text;
alter table public.ops_phone_duplicate_reviews add column if not exists phone_masked text;
alter table public.ops_phone_duplicate_reviews add column if not exists family_code text;
alter table public.ops_phone_duplicate_reviews add column if not exists person_role text;
alter table public.ops_phone_duplicate_reviews add column if not exists person_name text;
alter table public.ops_phone_duplicate_reviews add column if not exists source_row_id text;
alter table public.ops_phone_duplicate_reviews add column if not exists source_created_at timestamptz;
alter table public.ops_phone_duplicate_reviews add column if not exists reviewed boolean default false;
alter table public.ops_phone_duplicate_reviews add column if not exists decision text;
alter table public.ops_phone_duplicate_reviews add column if not exists review_note text;
alter table public.ops_phone_duplicate_reviews add column if not exists created_at timestamptz default now();

create index if not exists idx_ops_phone_duplicate_reviews_family
  on public.ops_phone_duplicate_reviews(family_code, reviewed);

create index if not exists idx_ops_phone_duplicate_reviews_phone
  on public.ops_phone_duplicate_reviews(phone_key, reviewed);

alter table public.ops_phone_duplicate_reviews enable row level security;

drop policy if exists "ops_phone_duplicate_reviews_no_frontend_select" on public.ops_phone_duplicate_reviews;
drop policy if exists "ops_phone_duplicate_reviews_no_frontend_insert" on public.ops_phone_duplicate_reviews;
drop policy if exists "ops_phone_duplicate_reviews_no_frontend_update" on public.ops_phone_duplicate_reviews;
drop policy if exists "ops_phone_duplicate_reviews_no_frontend_delete" on public.ops_phone_duplicate_reviews;

create policy "ops_phone_duplicate_reviews_no_frontend_select"
  on public.ops_phone_duplicate_reviews
  for select
  to anon, authenticated
  using (false);

create policy "ops_phone_duplicate_reviews_no_frontend_insert"
  on public.ops_phone_duplicate_reviews
  for insert
  to anon, authenticated
  with check (false);

create policy "ops_phone_duplicate_reviews_no_frontend_update"
  on public.ops_phone_duplicate_reviews
  for update
  to anon, authenticated
  using (false)
  with check (false);

create policy "ops_phone_duplicate_reviews_no_frontend_delete"
  on public.ops_phone_duplicate_reviews
  for delete
  to anon, authenticated
  using (false);

grant usage on schema public to service_role;
grant select, insert, update, delete on public.ops_phone_duplicate_reviews to service_role;

notify pgrst, 'reload schema';
