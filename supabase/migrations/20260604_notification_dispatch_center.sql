create extension if not exists pgcrypto;

create table if not exists public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  channel text default 'sms',
  to_name text,
  to_phone text,
  to_email text,
  title text,
  body text,
  template_code text,
  reason text,
  target_url text,
  status text default 'queued',
  provider text,
  provider_message_id text,
  source_key text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  sent_at timestamptz
);

alter table public.notification_outbox add column if not exists family_code text;
alter table public.notification_outbox add column if not exists channel text default 'sms';
alter table public.notification_outbox add column if not exists to_name text;
alter table public.notification_outbox add column if not exists to_phone text;
alter table public.notification_outbox add column if not exists to_email text;
alter table public.notification_outbox add column if not exists title text;
alter table public.notification_outbox add column if not exists body text;
alter table public.notification_outbox add column if not exists template_code text;
alter table public.notification_outbox add column if not exists reason text;
alter table public.notification_outbox add column if not exists target_url text;
alter table public.notification_outbox add column if not exists status text default 'queued';
alter table public.notification_outbox add column if not exists provider text;
alter table public.notification_outbox add column if not exists provider_message_id text;
alter table public.notification_outbox add column if not exists source_key text;
alter table public.notification_outbox add column if not exists payload jsonb default '{}'::jsonb;
alter table public.notification_outbox add column if not exists created_at timestamptz default now();
alter table public.notification_outbox add column if not exists sent_at timestamptz;

create index if not exists idx_notification_outbox_status_created
  on public.notification_outbox(status, created_at desc);

create index if not exists idx_notification_outbox_reason
  on public.notification_outbox(reason, created_at desc);

create index if not exists idx_notification_outbox_source_key
  on public.notification_outbox(source_key);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.notification_outbox to anon, authenticated;

alter table public.notification_outbox enable row level security;

drop policy if exists "notification_outbox_select_all" on public.notification_outbox;
drop policy if exists "notification_outbox_insert_all" on public.notification_outbox;
drop policy if exists "notification_outbox_update_all" on public.notification_outbox;
drop policy if exists "notification_outbox_delete_all" on public.notification_outbox;

create policy "notification_outbox_select_all"
  on public.notification_outbox
  for select
  to anon, authenticated
  using (true);

create policy "notification_outbox_insert_all"
  on public.notification_outbox
  for insert
  to anon, authenticated
  with check (true);

create policy "notification_outbox_update_all"
  on public.notification_outbox
  for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "notification_outbox_delete_all"
  on public.notification_outbox
  for delete
  to anon, authenticated
  using (true);

notify pgrst, 'reload schema';
select pg_sleep(1);
notify pgrst, 'reload schema';
