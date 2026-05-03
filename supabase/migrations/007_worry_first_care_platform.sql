-- 007_worry_first_care_platform.sql
-- 부모님 케어 플랫폼 전환: 걱정 접수센터, 케어 플랜, 안심밥상, 케어패스포트 이벤트, 사회공헌 레이어

-- 1) Care request intake ------------------------------------------------------
create table if not exists public.care_requests (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  elder_id uuid not null references public.elders(id) on delete cascade,
  requester_id uuid references public.profiles(id) on delete set null,
  category text not null default 'unknown' check (category in ('hospital', 'meal', 'medication', 'discharge', 'documents', 'regular_visit', 'lonely', 'emergency', 'unknown')),
  title text not null,
  situation text not null,
  desired_help text,
  preferred_channel text not null default 'phone' check (preferred_channel in ('phone', 'kakao', 'photo', 'direct')),
  source_input_type text not null default 'direct' check (source_input_type in ('phone', 'kakao', 'photo', 'direct')),
  urgency text not null default 'unknown' check (urgency in ('today', 'soon', 'regular', 'unknown')),
  status text not null default 'received' check (status in ('received', 'triaging', 'plan_ready', 'in_progress', 'resolved', 'cancelled')),
  not_sure boolean not null default false,
  callback_phone text,
  social_support_requested boolean not null default false,
  ops_owner_id uuid references public.profiles(id) on delete set null,
  resolution_summary text,
  intake_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.care_request_plan_steps (
  id uuid primary key default gen_random_uuid(),
  care_request_id uuid not null references public.care_requests(id) on delete cascade,
  step_order integer not null default 1,
  title text not null,
  description text not null,
  owner_role text not null default 'ops' check (owner_role in ('family', 'ops', 'manager', 'partner', 'system')),
  status text not null default 'waiting' check (status in ('todo', 'in_progress', 'done', 'skipped', 'waiting')),
  due_hint text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (care_request_id, step_order)
);

create table if not exists public.care_request_touchpoints (
  id uuid primary key default gen_random_uuid(),
  care_request_id uuid not null references public.care_requests(id) on delete cascade,
  channel text not null check (channel in ('phone', 'kakao', 'photo', 'direct', 'app', 'sms', 'alimtalk')),
  direction text not null default 'inbound' check (direction in ('inbound', 'outbound', 'internal')),
  message text not null,
  handled_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 2) Care passport event ledger ---------------------------------------------
create table if not exists public.care_passport_events (
  id uuid primary key default gen_random_uuid(),
  elder_id uuid not null references public.elders(id) on delete cascade,
  updated_by uuid references public.profiles(id) on delete set null,
  event_type text not null default 'family_update' check (event_type in ('family_update', 'ops_review', 'manager_observation', 'consent_change', 'risk_note')),
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.elder_care_profiles add column if not exists meal_support_note text;
alter table public.elder_care_profiles add column if not exists preferred_tone_note text;
alter table public.elder_care_profiles add column if not exists emergency_contact_note text;
alter table public.elder_care_profiles add column if not exists social_support_note text;

-- 3) Meal care / 안심밥상 ------------------------------------------------------
create table if not exists public.meal_care_preferences (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  elder_id uuid not null references public.elders(id) on delete cascade,
  meal_difficulty text not null default 'unknown' check (meal_difficulty in ('none', 'cooking_hard', 'chewing_hard', 'swallowing_hard', 'appetite_low', 'unknown')),
  preferred_texture text,
  diet_restrictions text[] not null default '{}',
  delivery_interest boolean not null default false,
  partner_status text not null default 'not_requested' check (partner_status in ('not_requested', 'requested', 'matched', 'paused', 'cancelled')),
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (elder_id)
);

create table if not exists public.meal_checkins (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  elder_id uuid not null references public.elders(id) on delete cascade,
  meal_time text not null check (meal_time in ('breakfast', 'lunch', 'dinner', 'snack')),
  eaten_status text not null default 'unknown' check (eaten_status in ('ate', 'not_yet', 'skipped', 'unknown')),
  note text,
  delivery_interest boolean not null default false,
  checked_by uuid references public.profiles(id) on delete set null,
  checked_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- 4) Social contribution layer ----------------------------------------------
create table if not exists public.care_impact_programs (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text not null,
  target text not null,
  app_action text not null,
  program_type text not null default 'support' check (program_type in ('support', 'public_link', 'voucher', 'free_checkin', 'partner')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.care_support_vouchers (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  elder_id uuid references public.elders(id) on delete set null,
  program_code text not null references public.care_impact_programs(code),
  requested_by uuid references public.profiles(id) on delete set null,
  status text not null default 'requested' check (status in ('requested', 'reviewing', 'approved', 'rejected', 'used', 'expired')),
  amount_krw integer not null default 0 check (amount_krw >= 0),
  reason text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5) Helper functions and dashboards ----------------------------------------
create or replace function public.can_access_care_request(target_care_request_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.care_requests cr
    where cr.id = target_care_request_id
      and (public.is_ops() or public.is_family_member(cr.family_id))
  );
$$;

create or replace view public.ops_care_request_board as
select
  cr.id,
  cr.family_id,
  cr.elder_id,
  e.name as elder_name,
  cr.category,
  cr.title,
  cr.urgency,
  cr.preferred_channel,
  cr.source_input_type,
  cr.status,
  cr.not_sure,
  cr.social_support_requested,
  cr.created_at,
  count(ps.id) filter (where ps.status in ('todo', 'waiting', 'in_progress')) as open_plan_step_count,
  count(tp.id) as touchpoint_count,
  max(tp.created_at) as last_touchpoint_at
from public.care_requests cr
join public.elders e on e.id = cr.elder_id
left join public.care_request_plan_steps ps on ps.care_request_id = cr.id
left join public.care_request_touchpoints tp on tp.care_request_id = cr.id
group by cr.id, e.name;

create or replace view public.family_reassurance_dashboard as
select
  f.id as family_id,
  count(cr.id) filter (where cr.status in ('received', 'triaging', 'plan_ready', 'in_progress')) as open_care_request_count,
  count(cr.id) filter (where cr.not_sure = true and cr.status in ('received', 'triaging')) as not_sure_request_count,
  count(mc.id) filter (where mc.eaten_status in ('skipped', 'unknown') and mc.checked_at > now() - interval '24 hours') as meal_check_needed_count,
  count(gt.id) filter (where gt.status in ('todo', 'in_progress')) as open_family_task_count
from public.families f
left join public.care_requests cr on cr.family_id = f.id
left join public.meal_checkins mc on mc.family_id = f.id
left join public.appointments a on a.family_id = f.id
left join public.guardian_tasks gt on gt.appointment_id = a.id
group by f.id;

-- 6) RLS ---------------------------------------------------------------------
alter table public.care_requests enable row level security;
alter table public.care_request_plan_steps enable row level security;
alter table public.care_request_touchpoints enable row level security;
alter table public.care_passport_events enable row level security;
alter table public.meal_care_preferences enable row level security;
alter table public.meal_checkins enable row level security;
alter table public.care_impact_programs enable row level security;
alter table public.care_support_vouchers enable row level security;

drop policy if exists care_requests_policy on public.care_requests;
create policy care_requests_policy on public.care_requests
for all using (public.is_ops() or public.is_family_member(family_id))
with check (public.is_ops() or public.is_family_member(family_id));

drop policy if exists care_request_plan_steps_policy on public.care_request_plan_steps;
create policy care_request_plan_steps_policy on public.care_request_plan_steps
for all using (public.can_access_care_request(care_request_id))
with check (public.can_access_care_request(care_request_id));

drop policy if exists care_request_touchpoints_policy on public.care_request_touchpoints;
create policy care_request_touchpoints_policy on public.care_request_touchpoints
for all using (public.can_access_care_request(care_request_id))
with check (public.can_access_care_request(care_request_id));

drop policy if exists care_passport_events_policy on public.care_passport_events;
create policy care_passport_events_policy on public.care_passport_events
for all using (
  public.is_ops()
  or exists (select 1 from public.elders e where e.id = elder_id and public.is_family_member(e.family_id))
  or exists (select 1 from public.appointments a where a.elder_id = care_passport_events.elder_id and public.is_assigned_manager(a.id))
)
with check (
  public.is_ops()
  or exists (select 1 from public.elders e where e.id = elder_id and public.is_family_member(e.family_id))
  or exists (select 1 from public.appointments a where a.elder_id = care_passport_events.elder_id and public.is_assigned_manager(a.id))
);

drop policy if exists meal_care_preferences_policy on public.meal_care_preferences;
create policy meal_care_preferences_policy on public.meal_care_preferences
for all using (public.is_ops() or public.is_family_member(family_id))
with check (public.is_ops() or public.is_family_member(family_id));

drop policy if exists meal_checkins_policy on public.meal_checkins;
create policy meal_checkins_policy on public.meal_checkins
for all using (public.is_ops() or public.is_family_member(family_id))
with check (public.is_ops() or public.is_family_member(family_id));

drop policy if exists care_impact_programs_select_policy on public.care_impact_programs;
create policy care_impact_programs_select_policy on public.care_impact_programs
for select using (is_active = true or public.is_ops());

drop policy if exists care_impact_programs_write_policy on public.care_impact_programs;
create policy care_impact_programs_write_policy on public.care_impact_programs
for all using (public.is_ops()) with check (public.is_ops());

drop policy if exists care_support_vouchers_policy on public.care_support_vouchers;
create policy care_support_vouchers_policy on public.care_support_vouchers
for all using (public.is_ops() or public.is_family_member(family_id))
with check (public.is_ops() or public.is_family_member(family_id));

-- 7) Updated_at triggers and indexes ----------------------------------------
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'care_requests', 'care_request_plan_steps', 'meal_care_preferences', 'care_impact_programs', 'care_support_vouchers'
  ] loop
    execute format('drop trigger if exists %I on public.%I', 'set_' || table_name || '_updated_at', table_name);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', 'set_' || table_name || '_updated_at', table_name);
  end loop;
end $$;

create index if not exists care_requests_family_status_idx on public.care_requests (family_id, status, urgency, created_at desc);
create index if not exists care_requests_ops_idx on public.care_requests (status, urgency, category, created_at desc);
create index if not exists care_request_steps_status_idx on public.care_request_plan_steps (care_request_id, status, step_order);
create index if not exists care_request_touchpoints_idx on public.care_request_touchpoints (care_request_id, created_at desc);
create index if not exists meal_checkins_family_recent_idx on public.meal_checkins (family_id, checked_at desc, eaten_status);
create index if not exists care_vouchers_family_status_idx on public.care_support_vouchers (family_id, status, created_at desc);

-- 8) Seed impact programs and notification templates -------------------------
insert into public.care_impact_programs (code, title, description, target, app_action, program_type)
values
  ('vulnerable_family_coupon', '취약가정 안심 쿠폰', '경제적 부담이 큰 가족에게 병원동행·식사 확인 일부를 후원 쿠폰으로 지원합니다.', '저소득·독거·긴급 돌봄 공백 가정', '운영실 심사 후 쿠폰 발급', 'voucher'),
  ('public_service_link', '지역 공공서비스 안내', '공공 병원동행, 도시락, 방문요양, 복지관 프로그램을 앱 안에서 안내하고 연결합니다.', '민간 서비스 비용이 부담되는 가정', '지역 기반 안내 카드 제공', 'public_link'),
  ('free_checkin_campaign', '무료 안부 확인 캠페인', '정기 결제 전이라도 고위험 부모님께 주 1회 안부 확인을 제공할 수 있게 설계합니다.', '식사·약·안부가 걱정되는 독거 부모님', '안부 확인 신청 접수', 'free_checkin')
on conflict (code) do update set
  title = excluded.title,
  description = excluded.description,
  target = excluded.target,
  app_action = excluded.app_action,
  program_type = excluded.program_type,
  is_active = true;

insert into public.notification_templates (code, channel, title, body, contains_transport_policy)
values
  ('care_request_received', 'alimtalk', '부모님 걱정이 접수됐어요', '상황을 확인해 병원·식사·약·서류·퇴원 후 케어 중 필요한 플랜으로 정리하겠습니다.', false),
  ('care_plan_ready', 'alimtalk', '부모님 케어 플랜이 준비됐어요', '긴 설명 대신 안심/확인 필요/긴급 상태와 가족이 해야 할 다음 액션만 먼저 확인해 주세요.', false),
  ('meal_check_needed', 'alimtalk', '식사 확인이 필요해요', '부모님 식사 확인이 아직 되지 않았습니다. 큰 버튼 또는 전화로 간단히 확인할 수 있습니다.', false),
  ('social_support_suggested', 'app', '공공지원/후원 연결 후보가 있어요', '비용 부담이 있는 가정은 운영실이 공공지원, 후원 쿠폰, 지역 서비스를 함께 안내합니다.', false)
on conflict (code) do nothing;

insert into public.audit_logs (entity_type, action, metadata)
values (
  'migration',
  '007_worry_first_care_platform',
  '{"message":"Converted product direction to worry-first parent care platform with care requests, care plans, care passport events, meal care, and social contribution layer."}'::jsonb
)
on conflict do nothing;
