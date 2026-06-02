create extension if not exists pgcrypto;

create table if not exists public.family_member_invites (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null,
  family_code text not null,
  inviter_id text,
  inviter_email text,
  inviter_name text,
  inviter_phone text,
  invitee_name text,
  invitee_phone text,
  invitee_phone_last4 text,
  relationship text default 'family',
  role text default 'family_viewer',
  invite_status text default 'pending',
  expires_at timestamptz default (now() + interval '14 days'),
  accepted_at timestamptz,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.family_member_invites add column if not exists invite_code text;
alter table public.family_member_invites add column if not exists family_code text;
alter table public.family_member_invites add column if not exists inviter_id text;
alter table public.family_member_invites add column if not exists inviter_email text;
alter table public.family_member_invites add column if not exists inviter_name text;
alter table public.family_member_invites add column if not exists inviter_phone text;
alter table public.family_member_invites add column if not exists invitee_name text;
alter table public.family_member_invites add column if not exists invitee_phone text;
alter table public.family_member_invites add column if not exists invitee_phone_last4 text;
alter table public.family_member_invites add column if not exists relationship text default 'family';
alter table public.family_member_invites add column if not exists role text default 'family_viewer';
alter table public.family_member_invites add column if not exists invite_status text default 'pending';
alter table public.family_member_invites add column if not exists expires_at timestamptz default (now() + interval '14 days');
alter table public.family_member_invites add column if not exists accepted_at timestamptz;
alter table public.family_member_invites add column if not exists payload jsonb default '{}'::jsonb;
alter table public.family_member_invites add column if not exists created_at timestamptz default now();
alter table public.family_member_invites add column if not exists updated_at timestamptz default now();

update public.family_member_invites
set invitee_phone_last4 = right(regexp_replace(coalesce(invitee_phone, ''), '[^0-9]', '', 'g'), 4)
where invitee_phone_last4 is null
  and invitee_phone is not null;

create unique index if not exists idx_family_member_invites_invite_code_unique
  on public.family_member_invites(invite_code);

create index if not exists idx_family_member_invites_family_code
  on public.family_member_invites(family_code);

create index if not exists idx_family_member_invites_invitee_phone
  on public.family_member_invites(invitee_phone);

create index if not exists idx_family_member_invites_status
  on public.family_member_invites(invite_status);

alter table public.family_member_invites enable row level security;

drop policy if exists "family_member_invites_select_all" on public.family_member_invites;
drop policy if exists "family_member_invites_insert_all" on public.family_member_invites;
drop policy if exists "family_member_invites_update_all" on public.family_member_invites;

create policy "family_member_invites_select_all"
  on public.family_member_invites
  for select
  to anon, authenticated
  using (true);

create policy "family_member_invites_insert_all"
  on public.family_member_invites
  for insert
  to anon, authenticated
  with check (true);

create policy "family_member_invites_update_all"
  on public.family_member_invites
  for update
  to anon, authenticated
  using (true)
  with check (true);

notify pgrst, 'reload schema';
