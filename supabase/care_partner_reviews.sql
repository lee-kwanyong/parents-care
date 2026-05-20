create extension if not exists pgcrypto;

create table if not exists public.care_partner_reviews (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid,
  care_report_id uuid,
  manager_profile_id uuid,
  manager_name text,
  elder_name text,
  guardian_name text,
  rating int not null default 5 check (rating >= 1 and rating <= 5),
  review_tags text[] not null default '{}',
  review_comment text,
  review_status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists care_partner_reviews_manager_profile_idx
on public.care_partner_reviews(manager_profile_id);

create index if not exists care_partner_reviews_assignment_idx
on public.care_partner_reviews(assignment_id);

create index if not exists care_partner_reviews_status_idx
on public.care_partner_reviews(review_status);

alter table public.care_partner_reviews enable row level security;

drop policy if exists "service role can manage care partner reviews" on public.care_partner_reviews;

create policy "service role can manage care partner reviews"
on public.care_partner_reviews
for all
using (true)
with check (true);

notify pgrst, 'reload schema';
