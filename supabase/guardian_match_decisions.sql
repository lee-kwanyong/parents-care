create extension if not exists pgcrypto;

create table if not exists public.care_guardian_match_decisions (
  id uuid primary key default gen_random_uuid(),
  matching_request_id uuid,
  match_offer_id uuid,
  manager_profile_id uuid,
  manager_name text,
  decision_type text not null default 'confirmed',
  decision_status text not null default 'received',
  guardian_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists care_guardian_match_decisions_request_idx
on public.care_guardian_match_decisions(matching_request_id);

create index if not exists care_guardian_match_decisions_offer_idx
on public.care_guardian_match_decisions(match_offer_id);

create index if not exists care_guardian_match_decisions_manager_idx
on public.care_guardian_match_decisions(manager_profile_id);

alter table public.care_guardian_match_decisions enable row level security;

drop policy if exists "service role can manage guardian match decisions" on public.care_guardian_match_decisions;

create policy "service role can manage guardian match decisions"
on public.care_guardian_match_decisions
for all
using (true)
with check (true);

notify pgrst, 'reload schema';
