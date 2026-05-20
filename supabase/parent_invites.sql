create extension if not exists pgcrypto;

create table if not exists care_parent_invites (
  id uuid primary key default gen_random_uuid(),
  guardian_name text,
  guardian_phone text,
  parent_name text not null default '부모님',
  parent_phone text,
  invite_code text not null,
  invite_status text not null default 'active',
  used_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists care_parent_invites_code_idx
on care_parent_invites(invite_code);

create index if not exists care_parent_invites_status_idx
on care_parent_invites(invite_status);

create index if not exists care_parent_invites_guardian_phone_idx
on care_parent_invites(guardian_phone);

alter table care_parent_invites enable row level security;

drop policy if exists "service role can manage parent invites" on care_parent_invites;

create policy "service role can manage parent invites"
on care_parent_invites
for all
using (true)
with check (true);

notify pgrst, 'reload schema';
