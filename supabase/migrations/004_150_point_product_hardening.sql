-- 004_150_point_product_hardening.sql
-- 목적: 클릭형 MVP를 실제 서비스 전환 가능한 운영 OS로 보강합니다.
-- 핵심: 이동 정책 가드레일, 배정 추천, 리포트 품질 게이트, 알림 템플릿, 안심도 이벤트, 리스크 자동 생성.

-- 1) Appointment intake / transport guardrail --------------------------------
alter table public.appointments add column if not exists direct_transport_requested boolean not null default false;
alter table public.appointments add column if not exists transport_policy_acknowledged boolean not null default false;
alter table public.appointments add column if not exists ops_review_required boolean not null default false;
alter table public.appointments add column if not exists guardian_contact_snapshot jsonb not null default '{}';
alter table public.appointments add column if not exists intake_snapshot jsonb not null default '{}';

comment on column public.appointments.direct_transport_requested is '보호자가 직접 운송을 요청했는지 여부. 기본 서비스 허용 의미가 아님';
comment on column public.appointments.transport_policy_acknowledged is '차량 보유와 직접 운송 분리 정책을 보호자가 확인했는지 여부';
comment on column public.appointments.ops_review_required is '운영실 수동 검토가 필요한 일정인지 여부';

-- 2) Manager quality / verification fields ------------------------------------
alter table public.managers add column if not exists background_check_status text not null default 'pending' check (background_check_status in ('pending', 'clear', 'expired', 'rejected'));
alter table public.managers add column if not exists report_quality_score numeric(5,2) not null default 80 check (report_quality_score between 0 and 100);
alter table public.managers add column if not exists last_training_at timestamptz;
alter table public.managers add column if not exists insurance_verified boolean not null default false;
alter table public.managers add column if not exists ops_note text;

comment on column public.managers.report_quality_score is '리포트 품질 게이트 결과를 매니저 배정/안심도에 반영하기 위한 점수';

-- 3) Report quality gate -------------------------------------------------------
create table if not exists public.report_quality_reviews (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  reviewer_id uuid references public.profiles(id) on delete set null,
  score integer not null default 80 check (score between 0 and 100),
  status text not null default 'reviewing' check (status in ('reviewing', 'approved', 'revision_requested', 'rejected')),
  checks jsonb not null default '{}',
  revision_note text,
  created_at timestamptz not null default now()
);

alter table public.report_quality_reviews enable row level security;

drop policy if exists report_quality_reviews_policy on public.report_quality_reviews;
create policy report_quality_reviews_policy on public.report_quality_reviews
for all using (public.is_ops()) with check (public.is_ops());

-- 4) Policy versions / notification templates ---------------------------------
create table if not exists public.policy_versions (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  version integer not null default 1,
  title text not null,
  body text not null,
  is_active boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (code, version)
);

create table if not exists public.notification_templates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  channel public.notification_channel not null default 'alimtalk',
  title text not null,
  body text not null,
  contains_transport_policy boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.policy_versions enable row level security;
alter table public.notification_templates enable row level security;

drop policy if exists policy_versions_select_policy on public.policy_versions;
create policy policy_versions_select_policy on public.policy_versions
for select using (is_active = true or public.is_ops());

drop policy if exists policy_versions_write_policy on public.policy_versions;
create policy policy_versions_write_policy on public.policy_versions
for all using (public.is_ops()) with check (public.is_ops());

drop policy if exists notification_templates_select_policy on public.notification_templates;
create policy notification_templates_select_policy on public.notification_templates
for select using (is_active = true or public.is_ops());

drop policy if exists notification_templates_write_policy on public.notification_templates;
create policy notification_templates_write_policy on public.notification_templates
for all using (public.is_ops()) with check (public.is_ops());

-- 5) Trust score events --------------------------------------------------------
create table if not exists public.manager_trust_events (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references public.managers(id) on delete cascade,
  source text not null check (source in ('rating', 'report_quality', 'risk_flag', 'ops_adjustment', 'completion')),
  score_delta numeric(6,2) not null default 0,
  reason text not null,
  metadata jsonb not null default '{}',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.manager_trust_events enable row level security;

drop policy if exists manager_trust_events_select_policy on public.manager_trust_events;
create policy manager_trust_events_select_policy on public.manager_trust_events
for select using (
  public.is_ops()
  or exists (select 1 from public.managers m where m.id = manager_id and m.profile_id = auth.uid())
);

drop policy if exists manager_trust_events_write_policy on public.manager_trust_events;
create policy manager_trust_events_write_policy on public.manager_trust_events
for insert with check (public.is_ops());

-- 6) Family invite code RPC ----------------------------------------------------
create or replace function public.create_family_invite_code(target_family_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  next_code text;
begin
  if not (public.is_ops() or public.is_family_member(target_family_id)) then
    raise exception 'not allowed';
  end if;

  next_code := upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 10));

  insert into public.family_invite_codes (family_id, code, created_by)
  values (target_family_id, next_code, auth.uid());

  return next_code;
end;
$$;

-- 7) Risk automation -----------------------------------------------------------
create or replace function public.set_transport_policy_review_required()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.pickup_method in ('manager_vehicle_info_only', 'direct_transport_partner')
     or new.direct_transport_requested = true
     or new.transport_policy_acknowledged = false then
    new.ops_review_required := true;
  end if;

  return new;
end;
$$;

drop trigger if exists appointments_transport_policy_guardrail on public.appointments;
create trigger appointments_transport_policy_guardrail
before insert or update of pickup_method, direct_transport_requested, transport_policy_acknowledged
on public.appointments
for each row execute function public.set_transport_policy_review_required();

create or replace function public.insert_transport_policy_risk()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.pickup_method in ('manager_vehicle_info_only', 'direct_transport_partner') or new.direct_transport_requested = true)
     and not exists (
       select 1 from public.risk_flags rf
       where rf.appointment_id = new.id
         and rf.code = 'TRANSPORT_POLICY_REVIEW'
         and rf.status in ('open', 'reviewing')
     ) then
    insert into public.risk_flags (appointment_id, severity, code, title, description, created_by)
    values (
      new.id,
      case when new.pickup_method = 'direct_transport_partner' then 'critical'::public.risk_severity else 'high'::public.risk_severity end,
      'TRANSPORT_POLICY_REVIEW',
      '차량/직접 운송 정책 운영실 검토 필요',
      '차량 보유 정보 또는 직접 운송 요청이 직접 유상운송으로 오해되지 않도록 이동 방식을 재확인해야 합니다.',
      new.created_by
    );
  end if;

  return new;
end;
$$;

drop trigger if exists appointments_transport_policy_risk_after on public.appointments;
create trigger appointments_transport_policy_risk_after
after insert or update of pickup_method, direct_transport_requested, transport_policy_acknowledged
on public.appointments
for each row execute function public.insert_transport_policy_risk();

create or replace function public.create_default_timeline_events()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.timeline_events (appointment_id, step_order, status, label, description, visible_to_family, created_by)
  values
    (new.id, 10, 'scheduled', '일정 접수', '보호자가 병원동행 일정을 등록했습니다.', true, new.created_by),
    (new.id, 20, 'scheduled', '매니저 배정 대기', '운영실이 지역, 전문분야, 안심도, 리스크를 확인합니다.', true, new.created_by)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists appointments_create_default_timeline_events on public.appointments;
create trigger appointments_create_default_timeline_events
after insert on public.appointments
for each row execute function public.create_default_timeline_events();

-- 8) Trust score recalculation v2 ---------------------------------------------
create or replace function public.recalculate_manager_trust_v2(target_manager_id uuid)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  rating_avg numeric;
  quality_score numeric;
  completion_bonus numeric;
  risk_penalty numeric;
  verification_bonus numeric;
  next_score numeric;
begin
  select coalesce(avg((
    coalesce(safety_rating, rating)::numeric +
    coalesce(kindness_rating, rating)::numeric +
    coalesce(accuracy_rating, communication_rating, rating)::numeric +
    coalesce(punctuality_rating_v2, punctuality_rating, rating)::numeric
  ) / 4.0), 4.0)
  into rating_avg
  from public.reviews
  where manager_id = target_manager_id;

  select coalesce(report_quality_score, 80)
  into quality_score
  from public.managers
  where id = target_manager_id;

  select least(count(*) * 0.25, 8)::numeric
  into completion_bonus
  from public.appointment_assignments
  where manager_id = target_manager_id and status = 'completed';

  select least(count(*) * 7, 22)::numeric
  into risk_penalty
  from public.risk_flags
  where manager_id = target_manager_id
    and status in ('open', 'reviewing')
    and severity in ('high', 'critical');

  select (
    case when background_check_status = 'clear' then 4 else 0 end +
    case when insurance_verified then 2 else 0 end +
    case when last_training_at is not null and last_training_at > now() - interval '1 year' then 3 else 0 end
  )::numeric
  into verification_bonus
  from public.managers
  where id = target_manager_id;

  next_score := greatest(0, least(100, (rating_avg * 15.5) + (quality_score * 0.13) + completion_bonus + verification_bonus - risk_penalty));

  update public.managers
  set trust_score = next_score,
      updated_at = now()
  where id = target_manager_id;

  return next_score;
end;
$$;

-- 9) Ops views ----------------------------------------------------------------
create or replace view public.ops_manager_assignment_candidates as
select
  m.id as manager_id,
  p.display_name,
  m.approval_status,
  m.trust_score,
  m.report_quality_score,
  m.has_vehicle,
  m.direct_transport_allowed,
  m.direct_transport_contract_verified,
  m.region_codes,
  m.hospital_specialties,
  m.background_check_status,
  m.insurance_verified,
  m.last_training_at,
  coalesce((
    select count(*) from public.risk_flags rf
    where rf.manager_id = m.id and rf.status in ('open', 'reviewing')
  ), 0) as open_risk_count,
  coalesce((
    select count(*) from public.appointment_assignments aa
    where aa.manager_id = m.id and aa.status = 'completed'
  ), 0) as completed_count
from public.managers m
join public.profiles p on p.id = m.profile_id;

create or replace view public.ops_risk_dashboard as
select
  rf.id,
  rf.appointment_id,
  rf.manager_id,
  rf.severity,
  rf.status,
  rf.code,
  rf.title,
  rf.description,
  rf.created_at,
  a.title as appointment_title,
  a.pickup_method,
  a.ops_review_required
from public.risk_flags rf
left join public.appointments a on a.id = rf.appointment_id;

alter view public.ops_manager_assignment_candidates set (security_invoker = true);
alter view public.ops_risk_dashboard set (security_invoker = true);

-- 10) Seeds -------------------------------------------------------------------
insert into public.policy_versions (code, version, title, body, is_active)
values
  ('vehicle_transport_separation', 1, '차량 보유와 직접 운송 분리', '차량 보유 여부는 참고 정보입니다. 매니저 개인차량 직접 유상운송은 기본 서비스에 포함되지 않습니다. 기본 이동은 병원 앞 만남, 집 앞 만남 후 택시 동행, 이동지원 제휴입니다.', true),
  ('report_quality_gate', 1, '리포트 품질 게이트', '진료 진행 내용, 의료진 안내사항, 검사/약/다음 예약, 비용, 부모님 컨디션, 가족 다음 액션이 검수되어야 보호자에게 발송합니다.', true)
on conflict (code, version) do nothing;

insert into public.notification_templates (code, channel, title, body, contains_transport_policy)
values
  ('manager_assigned', 'alimtalk', '매니저 배정 완료', '동행매니저가 배정되었습니다. 차량 보유 여부는 직접 운송 가능을 의미하지 않으며 기본 이동은 병원 앞 만남/택시 동행/제휴 이동지원 기준입니다.', true),
  ('timeline_checked_in', 'alimtalk', '병원 접수 완료', '부모님 병원 접수가 완료되었습니다. 예상 대기시간과 다음 진행상황을 타임라인에서 확인하실 수 있습니다.', false),
  ('report_sent', 'alimtalk', '보호자 리포트 발송', '운영실 검수가 완료되어 보호자 리포트가 발송되었습니다. 다음 액션을 확인해 주세요.', false)
on conflict (code) do nothing;

-- 11) Indexes -----------------------------------------------------------------
create index if not exists appointments_family_status_idx on public.appointments (family_id, status, appointment_at desc);
create index if not exists appointments_ops_review_idx on public.appointments (ops_review_required, appointment_at desc);
create index if not exists managers_assignment_search_idx on public.managers using gin (region_codes, hospital_specialties);
create index if not exists risk_flags_status_severity_idx on public.risk_flags (status, severity, created_at desc);
create index if not exists timeline_events_appointment_order_idx on public.timeline_events (appointment_id, step_order, occurred_at);
create index if not exists notification_events_status_idx on public.notification_events (status, created_at);

-- 12) Updated_at triggers ------------------------------------------------------
do $$
declare
  table_name text;
begin
  foreach table_name in array array['notification_templates'] loop
    execute format('drop trigger if exists %I on public.%I', 'set_' || table_name || '_updated_at', table_name);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', 'set_' || table_name || '_updated_at', table_name);
  end loop;
end $$;

insert into public.audit_logs (entity_type, action, metadata)
values (
  'migration',
  '004_150_point_product_hardening',
  '{"message":"Added transport guardrail automation, report quality gate, policy templates, assignment candidate view, trust score events."}'::jsonb
)
on conflict do nothing;
