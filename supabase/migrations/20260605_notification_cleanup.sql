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
  template_code text default '',
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
alter table public.notification_outbox add column if not exists template_code text default '';
alter table public.notification_outbox add column if not exists reason text;
alter table public.notification_outbox add column if not exists target_url text;
alter table public.notification_outbox add column if not exists status text default 'queued';
alter table public.notification_outbox add column if not exists provider text;
alter table public.notification_outbox add column if not exists provider_message_id text;
alter table public.notification_outbox add column if not exists source_key text;
alter table public.notification_outbox add column if not exists payload jsonb default '{}'::jsonb;
alter table public.notification_outbox add column if not exists created_at timestamptz default now();
alter table public.notification_outbox add column if not exists sent_at timestamptz;

alter table public.notification_outbox add column if not exists archived_at timestamptz;
alter table public.notification_outbox add column if not exists archived_by text;
alter table public.notification_outbox add column if not exists archived_reason text;
alter table public.notification_outbox add column if not exists cancelled_at timestamptz;
alter table public.notification_outbox add column if not exists cancelled_reason text;
alter table public.notification_outbox add column if not exists cleanup_bucket text;
alter table public.notification_outbox add column if not exists cleanup_note text;

alter table public.notification_outbox alter column template_code drop not null;
alter table public.notification_outbox alter column template_code set default '';

update public.notification_outbox
   set template_code = ''
 where template_code is null;

create index if not exists idx_notification_outbox_cleanup_status
  on public.notification_outbox(status, archived_at, created_at desc);

create index if not exists idx_notification_outbox_cleanup_reason
  on public.notification_outbox(reason, template_code, created_at desc);

create index if not exists idx_notification_outbox_cleanup_archived
  on public.notification_outbox(archived_at desc);

create table if not exists public.ops_notification_cleanup_runs (
  id uuid primary key default gen_random_uuid(),
  action_type text not null,
  affected_count integer default 0,
  actor_name text default '운영실',
  message text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.ops_notification_cleanup_runs add column if not exists action_type text;
alter table public.ops_notification_cleanup_runs add column if not exists affected_count integer default 0;
alter table public.ops_notification_cleanup_runs add column if not exists actor_name text default '운영실';
alter table public.ops_notification_cleanup_runs add column if not exists message text;
alter table public.ops_notification_cleanup_runs add column if not exists payload jsonb default '{}'::jsonb;
alter table public.ops_notification_cleanup_runs add column if not exists created_at timestamptz default now();

create index if not exists idx_ops_notification_cleanup_runs_created
  on public.ops_notification_cleanup_runs(created_at desc);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.notification_outbox to anon, authenticated;
grant select, insert, update, delete on public.ops_notification_cleanup_runs to anon, authenticated;

alter table public.notification_outbox enable row level security;
alter table public.ops_notification_cleanup_runs enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'notification_outbox',
    'ops_notification_cleanup_runs'
  ]
  loop
    execute format('drop policy if exists "%s_select_all" on public.%I', t, t);
    execute format('drop policy if exists "%s_insert_all" on public.%I', t, t);
    execute format('drop policy if exists "%s_update_all" on public.%I', t, t);
    execute format('drop policy if exists "%s_delete_all" on public.%I', t, t);

    execute format('create policy "%s_select_all" on public.%I for select to anon, authenticated using (true)', t, t);
    execute format('create policy "%s_insert_all" on public.%I for insert to anon, authenticated with check (true)', t, t);
    execute format('create policy "%s_update_all" on public.%I for update to anon, authenticated using (true) with check (true)', t, t);
    execute format('create policy "%s_delete_all" on public.%I for delete to anon, authenticated using (true)', t, t);
  end loop;
end $$;

notify pgrst, 'reload schema';
select pg_sleep(1);
notify pgrst, 'reload schema';
