create extension if not exists pgcrypto;

create table if not exists public.care_providers (
  id uuid primary key default gen_random_uuid(),
  provider_type text not null,
  provider_name text not null,
  phone text,
  email text,
  service_area text,
  address_hint text,
  available_status text default 'available',
  verified_status text default 'pending',
  qualification text,
  available_hours text,
  response_time_min integer default 30,
  notes text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.care_providers add column if not exists provider_type text;
alter table public.care_providers add column if not exists provider_name text;
alter table public.care_providers add column if not exists phone text;
alter table public.care_providers add column if not exists email text;
alter table public.care_providers add column if not exists service_area text;
alter table public.care_providers add column if not exists address_hint text;
alter table public.care_providers add column if not exists available_status text default 'available';
alter table public.care_providers add column if not exists verified_status text default 'pending';
alter table public.care_providers add column if not exists qualification text;
alter table public.care_providers add column if not exists available_hours text;
alter table public.care_providers add column if not exists response_time_min integer default 30;
alter table public.care_providers add column if not exists notes text;
alter table public.care_providers add column if not exists payload jsonb default '{}'::jsonb;
alter table public.care_providers add column if not exists created_at timestamptz default now();
alter table public.care_providers add column if not exists updated_at timestamptz default now();

create index if not exists idx_care_providers_type_area
  on public.care_providers(provider_type, service_area);

create index if not exists idx_care_providers_status
  on public.care_providers(available_status, verified_status);

create table if not exists public.care_response_requests (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  parent_name text,
  parent_phone text,
  guardian_name text,
  guardian_phone text,
  signal_type text not null,
  signal_label text,
  request_type text not null,
  risk_level text default 'medium',
  status text default 'open',
  service_area text,
  address_hint text,
  requested_action text,
  dispatch_scope text default 'family_first',
  accepted_by_provider_id uuid,
  accepted_by_name text,
  accepted_at timestamptz,
  completed_at timestamptz,
  completed_note text,
  source text default 'manual',
  source_key text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.care_response_requests add column if not exists family_code text;
alter table public.care_response_requests add column if not exists parent_name text;
alter table public.care_response_requests add column if not exists parent_phone text;
alter table public.care_response_requests add column if not exists guardian_name text;
alter table public.care_response_requests add column if not exists guardian_phone text;
alter table public.care_response_requests add column if not exists signal_type text;
alter table public.care_response_requests add column if not exists signal_label text;
alter table public.care_response_requests add column if not exists request_type text;
alter table public.care_response_requests add column if not exists risk_level text default 'medium';
alter table public.care_response_requests add column if not exists status text default 'open';
alter table public.care_response_requests add column if not exists service_area text;
alter table public.care_response_requests add column if not exists address_hint text;
alter table public.care_response_requests add column if not exists requested_action text;
alter table public.care_response_requests add column if not exists dispatch_scope text default 'family_first';
alter table public.care_response_requests add column if not exists accepted_by_provider_id uuid;
alter table public.care_response_requests add column if not exists accepted_by_name text;
alter table public.care_response_requests add column if not exists accepted_at timestamptz;
alter table public.care_response_requests add column if not exists completed_at timestamptz;
alter table public.care_response_requests add column if not exists completed_note text;
alter table public.care_response_requests add column if not exists source text default 'manual';
alter table public.care_response_requests add column if not exists source_key text;
alter table public.care_response_requests add column if not exists payload jsonb default '{}'::jsonb;
alter table public.care_response_requests add column if not exists created_at timestamptz default now();
alter table public.care_response_requests add column if not exists updated_at timestamptz default now();

create unique index if not exists idx_care_response_requests_source_key
  on public.care_response_requests(source_key)
  where source_key is not null;

create index if not exists idx_care_response_requests_status
  on public.care_response_requests(status, risk_level, created_at desc);

create index if not exists idx_care_response_requests_family
  on public.care_response_requests(family_code, status);

create table if not exists public.care_response_matches (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null,
  provider_id uuid not null,
  match_status text default 'notified',
  notified_at timestamptz default now(),
  accepted_at timestamptz,
  declined_at timestamptz,
  completed_at timestamptz,
  note text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.care_response_matches add column if not exists request_id uuid;
alter table public.care_response_matches add column if not exists provider_id uuid;
alter table public.care_response_matches add column if not exists match_status text default 'notified';
alter table public.care_response_matches add column if not exists notified_at timestamptz default now();
alter table public.care_response_matches add column if not exists accepted_at timestamptz;
alter table public.care_response_matches add column if not exists declined_at timestamptz;
alter table public.care_response_matches add column if not exists completed_at timestamptz;
alter table public.care_response_matches add column if not exists note text;
alter table public.care_response_matches add column if not exists payload jsonb default '{}'::jsonb;
alter table public.care_response_matches add column if not exists created_at timestamptz default now();
alter table public.care_response_matches add column if not exists updated_at timestamptz default now();

create index if not exists idx_care_response_matches_request
  on public.care_response_matches(request_id, match_status);

create table if not exists public.care_response_updates (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null,
  actor_type text default 'system',
  actor_name text,
  update_type text,
  message text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.care_response_updates add column if not exists request_id uuid;
alter table public.care_response_updates add column if not exists actor_type text default 'system';
alter table public.care_response_updates add column if not exists actor_name text;
alter table public.care_response_updates add column if not exists update_type text;
alter table public.care_response_updates add column if not exists message text;
alter table public.care_response_updates add column if not exists payload jsonb default '{}'::jsonb;
alter table public.care_response_updates add column if not exists created_at timestamptz default now();

create index if not exists idx_care_response_updates_request
  on public.care_response_updates(request_id, created_at desc);

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

create index if not exists idx_notification_outbox_status
  on public.notification_outbox(status, created_at desc);

create index if not exists idx_notification_outbox_source
  on public.notification_outbox(source_key);

create table if not exists public.daily_care_checkins (
  id uuid primary key default gen_random_uuid(),
  family_code text not null,
  elder_name text,
  check_type text not null,
  check_slot text default 'day',
  care_date date default ((now() at time zone 'Asia/Seoul')::date),
  care_label text,
  status text default 'done',
  memo text,
  occurred_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.daily_care_checkins add column if not exists family_code text;
alter table public.daily_care_checkins add column if not exists elder_name text;
alter table public.daily_care_checkins add column if not exists check_type text;
alter table public.daily_care_checkins add column if not exists check_slot text default 'day';
alter table public.daily_care_checkins add column if not exists care_date date default ((now() at time zone 'Asia/Seoul')::date);
alter table public.daily_care_checkins add column if not exists care_label text;
alter table public.daily_care_checkins add column if not exists status text default 'done';
alter table public.daily_care_checkins add column if not exists memo text;
alter table public.daily_care_checkins add column if not exists occurred_at timestamptz default now();
alter table public.daily_care_checkins add column if not exists created_at timestamptz default now();

create table if not exists public.gov_case_notes (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  recipient_id uuid,
  case_type text default 'phone_check',
  title text,
  content text,
  status text default 'open',
  priority text default 'medium',
  actor_name text,
  actor_role text default 'staff',
  org_name text,
  next_action text,
  due_at timestamptz,
  completed_at timestamptz,
  source_key text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.gov_case_notes add column if not exists family_code text;
alter table public.gov_case_notes add column if not exists case_type text default 'phone_check';
alter table public.gov_case_notes add column if not exists title text;
alter table public.gov_case_notes add column if not exists content text;
alter table public.gov_case_notes add column if not exists status text default 'open';
alter table public.gov_case_notes add column if not exists priority text default 'medium';
alter table public.gov_case_notes add column if not exists actor_name text;
alter table public.gov_case_notes add column if not exists actor_role text default 'staff';
alter table public.gov_case_notes add column if not exists next_action text;
alter table public.gov_case_notes add column if not exists source_key text;
alter table public.gov_case_notes add column if not exists payload jsonb default '{}'::jsonb;
alter table public.gov_case_notes add column if not exists created_at timestamptz default now();
alter table public.gov_case_notes add column if not exists updated_at timestamptz default now();

create or replace function public.care_response_after_checkin()
returns trigger
language plpgsql
as $$
declare
  v_source_key text;
  v_request_type text;
  v_risk_level text;
  v_action text;
  v_signal_label text;
  v_title text;
begin
  if new.family_code is null or length(trim(new.family_code)) = 0 then
    return new;
  end if;

  if coalesce(new.status, '') not in ('not_done', 'needs_help') then
    return new;
  end if;

  v_source_key := 'care-checkin-' || new.id::text;
  v_signal_label := coalesce(new.care_label, new.status);

  if new.check_type = 'meal' then
    v_request_type := 'meal_delivery';
    v_risk_level := 'medium';
    v_title := '식사 후속조치 요청';
    v_action := '가족이 먼저 식사 여부를 확인하고, 필요하면 지역상점·도시락·반찬가게 연결을 검토하세요.';
  elsif new.check_type = 'medication' then
    v_request_type := 'medication_reminder';
    v_risk_level := 'high';
    v_title := '복약 후속조치 요청';
    v_action := '부모님께 복약 여부를 다시 확인하고, 반복되면 보호자·돌봄파트너·약국 상담 연결을 검토하세요.';
  elsif new.check_type = 'condition' then
    v_request_type := 'care_partner_check';
    v_risk_level := 'high';
    v_title := '몸 상태 확인 요청';
    v_action := '가족이 즉시 전화 확인하고, 연락이 어렵거나 위험 신호가 있으면 돌봄파트너·수행기관 확인을 요청하세요. 응급 가능성이 있으면 119 또는 의료기관에 연락하세요.';
  elsif new.check_type = 'emergency' then
    v_request_type := 'urgent_neighbor_help';
    v_risk_level := 'high';
    v_title := '도움 요청 긴급 확인';
    v_action := '가족에게 즉시 알리고, 응답이 없으면 가까운 돌봄파트너·수행기관 확인 요청으로 연결하세요. 응급 가능성이 있으면 119 또는 의료기관에 연락하세요.';
  else
    v_request_type := 'care_partner_check';
    v_risk_level := 'medium';
    v_title := '안부 확인 요청';
    v_action := '가족 또는 주변 돌봄망이 상태를 확인하고 결과를 기록하세요.';
  end if;

  insert into public.care_response_requests (
    family_code,
    parent_name,
    signal_type,
    signal_label,
    request_type,
    risk_level,
    status,
    requested_action,
    dispatch_scope,
    source,
    source_key,
    payload,
    updated_at
  )
  values (
    new.family_code,
    coalesce(nullif(new.elder_name, ''), '부모님'),
    new.check_type,
    v_signal_label,
    v_request_type,
    v_risk_level,
    'open',
    v_action,
    'family_first',
    'daily_care_checkin',
    v_source_key,
    jsonb_build_object('checkin', row_to_json(new)),
    now()
  )
  on conflict (source_key)
  do update set
    signal_label = excluded.signal_label,
    request_type = excluded.request_type,
    risk_level = excluded.risk_level,
    status = case
      when public.care_response_requests.status in ('completed', 'cancelled') then public.care_response_requests.status
      else 'open'
    end,
    requested_action = excluded.requested_action,
    payload = excluded.payload,
    updated_at = now();

  insert into public.care_response_updates (
    request_id,
    actor_type,
    actor_name,
    update_type,
    message,
    payload
  )
  select
    id,
    'system',
    '안부웍스',
    'created',
    v_title || ': ' || v_signal_label,
    jsonb_build_object('sourceKey', v_source_key)
  from public.care_response_requests
  where source_key = v_source_key
  limit 1;

  insert into public.notification_outbox (
    family_code,
    channel,
    title,
    body,
    reason,
    target_url,
    status,
    provider,
    source_key,
    payload
  )
  values (
    new.family_code,
    'sms',
    '[안부웍스] ' || v_title,
    v_signal_label || E'\n' || v_action || E'\nhttps://parents-care.net/response',
    'response-network',
    '/response',
    'queued',
    'response-network',
    v_source_key,
    jsonb_build_object('requestType', v_request_type, 'riskLevel', v_risk_level)
  )
  on conflict do nothing;

  if v_risk_level = 'high' then
    insert into public.gov_case_notes (
      family_code,
      case_type,
      title,
      content,
      status,
      priority,
      actor_name,
      actor_role,
      next_action,
      source_key,
      payload,
      updated_at
    )
    values (
      new.family_code,
      v_request_type,
      v_title,
      v_signal_label,
      'open',
      'high',
      '안부웍스 지역 후속조치 엔진',
      'system',
      v_action,
      v_source_key,
      jsonb_build_object('requestType', v_request_type, 'riskLevel', v_risk_level),
      now()
    )
    on conflict do nothing;
  end if;

  return new;
end $$;

drop trigger if exists trg_care_response_after_checkin on public.daily_care_checkins;

create trigger trg_care_response_after_checkin
after insert or update of status, care_label, memo on public.daily_care_checkins
for each row
execute function public.care_response_after_checkin();

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on public.care_providers to anon, authenticated;
grant select, insert, update, delete on public.care_response_requests to anon, authenticated;
grant select, insert, update, delete on public.care_response_matches to anon, authenticated;
grant select, insert, update, delete on public.care_response_updates to anon, authenticated;
grant select, insert, update, delete on public.notification_outbox to anon, authenticated;
grant select, insert, update, delete on public.gov_case_notes to anon, authenticated;

alter table public.care_providers enable row level security;
alter table public.care_response_requests enable row level security;
alter table public.care_response_matches enable row level security;
alter table public.care_response_updates enable row level security;
alter table public.notification_outbox enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'care_providers',
    'care_response_requests',
    'care_response_matches',
    'care_response_updates',
    'notification_outbox'
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
