-- 007_worry_resolution_platform.sql
-- 부모님 걱정해결 케어: 40대 이상 보호자 맞춤 걱정 접수, 케어패스포트, 식사, 퇴원 후 7일, 정기케어, 편리함/사회공헌 레이어

-- 주의: 이 migration은 001_initial_schema.sql 이후에 실행해야 합니다.
-- public.families / public.family_members / public.elders / public.appointments / public.reports가 없으면
-- supabase/schema.sql 전체를 먼저 실행하세요.
do $$
begin
  if to_regclass('public.families') is null then
    raise exception 'public.families가 없습니다. 007만 단독 실행하지 말고 supabase/schema.sql 전체 또는 001_initial_schema.sql부터 순서대로 실행하세요.';
  end if;
  if to_regclass('public.family_members') is null then
    raise exception 'public.family_members가 없습니다. 001_initial_schema.sql부터 순서대로 실행하세요.';
  end if;
end $$;


create table if not exists public.worry_requests (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  elder_id uuid references public.elders(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  category text not null check (category in ('hospital','meal','medication','discharge','documents','recurring','not_sure','emergency')),
  source_channel text not null check (source_channel in ('phone','kakao','photo','simple_form')),
  elder_name_snapshot text,
  situation_text text not null,
  preferred_contact text,
  urgency text not null default 'not_sure' check (urgency in ('today','this_week','regular','not_sure')),
  needs_ops_call boolean not null default true,
  status text not null default 'received' check (status in ('received','triaging','plan_ready','guardian_confirming','in_progress','resolved','cancelled','urgent')),
  assurance_state text not null default 'needs_check' check (assurance_state in ('safe','needs_check','urgent')),
  ops_owner_id uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.worry_request_attachments (
  id uuid primary key default gen_random_uuid(),
  worry_request_id uuid not null references public.worry_requests(id) on delete cascade,
  uploaded_by uuid references auth.users(id) on delete set null,
  kind text not null default 'photo' check (kind in ('photo','kakao_text','reservation_sms','prescription','receipt','other')),
  storage_path text,
  pasted_text text,
  extracted_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.worry_care_plan_steps (
  id uuid primary key default gen_random_uuid(),
  worry_request_id uuid not null references public.worry_requests(id) on delete cascade,
  title text not null,
  description text,
  owner_role text not null default 'ops' check (owner_role in ('family','ops','manager','partner','system')),
  status text not null default 'todo' check (status in ('todo','in_progress','done','skipped')),
  due_at timestamptz,
  sort_order int not null default 1,
  visible_to_family boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.care_passports (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  elder_id uuid not null references public.elders(id) on delete cascade,
  elder_name_snapshot text,
  nickname text,
  mobility text not null,
  hearing text,
  vision text,
  communication text,
  meal_needs text[] not null default '{}',
  medications_text text,
  allergy text,
  fall_risk_note text,
  preferred_hospital_time text,
  preferred_manager_note text,
  emergency_contacts_text text,
  share_scope text not null default 'essential',
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(elder_id)
);

create table if not exists public.meal_support_requests (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  elder_id uuid references public.elders(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  elder_name_snapshot text,
  meal_concern text not null,
  diet_needs text[] not null default '{}',
  support_type text not null check (support_type in ('meal_check','regular_delivery','recovery_meal','soft_food','diabetes_low_salt','not_sure')),
  preferred_cadence text,
  family_contact text,
  status text not null default 'ops_review' check (status in ('ops_review','partner_matching','active','paused','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meal_check_events (
  id uuid primary key default gen_random_uuid(),
  meal_support_request_id uuid references public.meal_support_requests(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  elder_id uuid references public.elders(id) on delete set null,
  meal_label text not null,
  checked_by text not null default 'parent' check (checked_by in ('parent','family','manager','ops','system')),
  status text not null default 'unknown' check (status in ('ate','not_ate','unknown','needs_help')),
  note text,
  checked_at timestamptz not null default now()
);

create table if not exists public.post_discharge_care_packs (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  elder_id uuid references public.elders(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  elder_name_snapshot text,
  discharge_date date not null,
  hospital_name text,
  surgery_or_reason text,
  main_concern text not null,
  needs_meal boolean not null default false,
  needs_medication_sorting boolean not null default true,
  needs_fall_risk_check boolean not null default true,
  family_contact text,
  status text not null default 'requested' check (status in ('requested','planning','active','completed','cancelled')),
  final_report_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.post_discharge_daily_checks (
  id uuid primary key default gen_random_uuid(),
  pack_id uuid not null references public.post_discharge_care_packs(id) on delete cascade,
  day_number int not null check (day_number between 1 and 7),
  check_title text not null,
  checks jsonb not null default '[]'::jsonb,
  family_output text,
  status text not null default 'todo' check (status in ('todo','in_progress','done','missed','skipped')),
  checked_at timestamptz,
  created_at timestamptz not null default now(),
  unique(pack_id, day_number)
);

create table if not exists public.recurring_care_schedules (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  elder_id uuid references public.elders(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  elder_name_snapshot text,
  care_type text not null check (care_type in ('regular_visit','medication','meal_check','wellbeing_call','therapy','not_sure')),
  cadence text not null,
  next_due date,
  family_owner_label text,
  note text,
  status text not null default 'active' check (status in ('active','paused','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.care_comfort_preferences (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  elder_id uuid not null references public.elders(id) on delete cascade,
  elder_name_snapshot text,
  pre_call_needed boolean not null default true,
  audio_summary_needed boolean not null default true,
  same_manager_preferred boolean not null default true,
  cost_approval_required boolean not null default true,
  parent_wording_preference text,
  family_role_note text,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(elder_id)
);

create table if not exists public.cost_approval_requests (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  worry_request_id uuid references public.worry_requests(id) on delete set null,
  title text not null,
  amount_krw int not null default 0,
  reason text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.pre_reassurance_calls (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  elder_id uuid references public.elders(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  scheduled_at timestamptz,
  call_result text not null default 'scheduled' check (call_result in ('scheduled','completed','missed','refused','needs_followup')),
  parent_reaction text,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.audio_report_summaries (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete cascade,
  report_id uuid references public.reports(id) on delete set null,
  summary_text text not null,
  audio_storage_path text,
  duration_seconds int not null default 30,
  status text not null default 'draft' check (status in ('draft','ready','sent','archived')),
  created_at timestamptz not null default now()
);

create table if not exists public.social_contribution_programs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  target text not null,
  contribution_mode text not null,
  active boolean not null default true,
  ops_note text,
  created_at timestamptz not null default now()
);

insert into public.social_contribution_programs (title, description, target, contribution_mode, ops_note)
values
  ('취약가정 안심동행 할인', '돌봄 공백이 큰 가정에 할인 또는 후원 쿠폰을 제공합니다.', '취약가정/긴급 돌봄', '후원형 케어 쿠폰', '상담 기반 1차 지원 후 운영실 검수'),
  ('무료 안부 확인 캠페인', '혼자 계신 부모님께 식사와 안부를 확인하는 캠페인입니다.', '독거/고립 위험 어르신', '무료 또는 저가 안부', '응급 신호 발견 시 보호자 및 기관 연결'),
  ('공공지원 서비스 안내', '지역 병원동행, 식사 지원, 방문요양, 복지관 프로그램 정보를 안내합니다.', '공공지원 대상 가능 가정', '정보 연계', '지역별 안내 링크와 상담 스크립트 관리')
on conflict do nothing;

create or replace view public.ops_worry_center_dashboard as
select
  wr.id,
  wr.family_id,
  wr.elder_id,
  wr.category,
  wr.source_channel,
  wr.urgency,
  wr.status,
  wr.assurance_state,
  wr.needs_ops_call,
  wr.created_at,
  count(wcps.id) filter (where wcps.status <> 'done') as open_plan_steps
from public.worry_requests wr
left join public.worry_care_plan_steps wcps on wcps.worry_request_id = wr.id
group by wr.id;

create or replace view public.family_care_home_summary as
select
  f.id as family_id,
  count(distinct wr.id) filter (where wr.status in ('received','triaging','plan_ready','guardian_confirming','in_progress','urgent')) as open_worry_count,
  count(distinct m.id) filter (where m.status in ('ops_review','partner_matching','active')) as active_meal_requests,
  count(distinct p.id) filter (where p.status in ('requested','planning','active')) as active_discharge_packs,
  count(distinct r.id) filter (where r.status = 'active') as active_recurring_schedules
from public.families f
left join public.worry_requests wr on wr.family_id = f.id
left join public.meal_support_requests m on m.family_id = f.id
left join public.post_discharge_care_packs p on p.family_id = f.id
left join public.recurring_care_schedules r on r.family_id = f.id
group by f.id;

alter table public.worry_requests enable row level security;
alter table public.worry_request_attachments enable row level security;
alter table public.worry_care_plan_steps enable row level security;
alter table public.care_passports enable row level security;
alter table public.meal_support_requests enable row level security;
alter table public.meal_check_events enable row level security;
alter table public.post_discharge_care_packs enable row level security;
alter table public.post_discharge_daily_checks enable row level security;
alter table public.recurring_care_schedules enable row level security;
alter table public.care_comfort_preferences enable row level security;
alter table public.cost_approval_requests enable row level security;
alter table public.pre_reassurance_calls enable row level security;
alter table public.audio_report_summaries enable row level security;
alter table public.social_contribution_programs enable row level security;


-- 재실행 안전장치: 이전 실행이 중간에 멈췄어도 정책 중복 오류가 나지 않게 합니다.
drop policy if exists "family can read worry requests" on public.worry_requests;
drop policy if exists "family can create worry requests" on public.worry_requests;
drop policy if exists "ops can update worry requests" on public.worry_requests;
drop policy if exists "family can read care passports" on public.care_passports;
drop policy if exists "family can upsert care passports" on public.care_passports;
drop policy if exists "family ops access meal requests" on public.meal_support_requests;
drop policy if exists "family ops access discharge packs" on public.post_discharge_care_packs;
drop policy if exists "family ops access recurring care" on public.recurring_care_schedules;
drop policy if exists "family ops access comfort preferences" on public.care_comfort_preferences;
drop policy if exists "family ops access worry attachments" on public.worry_request_attachments;
drop policy if exists "family ops access worry plan steps" on public.worry_care_plan_steps;
drop policy if exists "family ops access meal check events" on public.meal_check_events;
drop policy if exists "family ops access discharge daily checks" on public.post_discharge_daily_checks;
drop policy if exists "family ops access cost approvals" on public.cost_approval_requests;
drop policy if exists "family ops access reassurance calls" on public.pre_reassurance_calls;
drop policy if exists "family ops access audio summaries" on public.audio_report_summaries;
drop policy if exists "public can read active social programs" on public.social_contribution_programs;

-- 가족 구성원은 자신의 가족 케어 데이터 조회/작성 가능, 운영실은 전체 가능.
create policy "family can read worry requests" on public.worry_requests for select using (
  exists (select 1 from public.family_members fm where fm.family_id = worry_requests.family_id and fm.profile_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
);
create policy "family can create worry requests" on public.worry_requests for insert with check (
  exists (select 1 from public.family_members fm where fm.family_id = worry_requests.family_id and fm.profile_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
);
create policy "ops can update worry requests" on public.worry_requests for update using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
);

create policy "family can read care passports" on public.care_passports for select using (
  exists (select 1 from public.family_members fm where fm.family_id = care_passports.family_id and fm.profile_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
);
create policy "family can upsert care passports" on public.care_passports for all using (
  exists (select 1 from public.family_members fm where fm.family_id = care_passports.family_id and fm.profile_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
) with check (
  exists (select 1 from public.family_members fm where fm.family_id = care_passports.family_id and fm.profile_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
);

create policy "family ops access meal requests" on public.meal_support_requests for all using (
  exists (select 1 from public.family_members fm where fm.family_id = meal_support_requests.family_id and fm.profile_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
) with check (
  exists (select 1 from public.family_members fm where fm.family_id = meal_support_requests.family_id and fm.profile_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
);

create policy "family ops access discharge packs" on public.post_discharge_care_packs for all using (
  exists (select 1 from public.family_members fm where fm.family_id = post_discharge_care_packs.family_id and fm.profile_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
) with check (
  exists (select 1 from public.family_members fm where fm.family_id = post_discharge_care_packs.family_id and fm.profile_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
);

create policy "family ops access recurring care" on public.recurring_care_schedules for all using (
  exists (select 1 from public.family_members fm where fm.family_id = recurring_care_schedules.family_id and fm.profile_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
) with check (
  exists (select 1 from public.family_members fm where fm.family_id = recurring_care_schedules.family_id and fm.profile_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
);

create policy "family ops access comfort preferences" on public.care_comfort_preferences for all using (
  exists (select 1 from public.family_members fm where fm.family_id = care_comfort_preferences.family_id and fm.profile_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
) with check (
  exists (select 1 from public.family_members fm where fm.family_id = care_comfort_preferences.family_id and fm.profile_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
);


create policy "family ops access worry attachments" on public.worry_request_attachments for all using (
  exists (
    select 1 from public.worry_requests wr
    join public.family_members fm on fm.family_id = wr.family_id
    where wr.id = worry_request_attachments.worry_request_id and fm.profile_id = auth.uid()
  )
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
) with check (
  exists (
    select 1 from public.worry_requests wr
    join public.family_members fm on fm.family_id = wr.family_id
    where wr.id = worry_request_attachments.worry_request_id and fm.profile_id = auth.uid()
  )
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
);

create policy "family ops access worry plan steps" on public.worry_care_plan_steps for all using (
  exists (
    select 1 from public.worry_requests wr
    join public.family_members fm on fm.family_id = wr.family_id
    where wr.id = worry_care_plan_steps.worry_request_id and fm.profile_id = auth.uid()
  )
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
) with check (
  exists (
    select 1 from public.worry_requests wr
    join public.family_members fm on fm.family_id = wr.family_id
    where wr.id = worry_care_plan_steps.worry_request_id and fm.profile_id = auth.uid()
  )
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
);

create policy "family ops access meal check events" on public.meal_check_events for all using (
  exists (select 1 from public.family_members fm where fm.family_id = meal_check_events.family_id and fm.profile_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
) with check (
  exists (select 1 from public.family_members fm where fm.family_id = meal_check_events.family_id and fm.profile_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
);

create policy "family ops access discharge daily checks" on public.post_discharge_daily_checks for all using (
  exists (
    select 1 from public.post_discharge_care_packs pack
    join public.family_members fm on fm.family_id = pack.family_id
    where pack.id = post_discharge_daily_checks.pack_id and fm.profile_id = auth.uid()
  )
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
) with check (
  exists (
    select 1 from public.post_discharge_care_packs pack
    join public.family_members fm on fm.family_id = pack.family_id
    where pack.id = post_discharge_daily_checks.pack_id and fm.profile_id = auth.uid()
  )
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
);

create policy "family ops access cost approvals" on public.cost_approval_requests for all using (
  exists (select 1 from public.family_members fm where fm.family_id = cost_approval_requests.family_id and fm.profile_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
) with check (
  exists (select 1 from public.family_members fm where fm.family_id = cost_approval_requests.family_id and fm.profile_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
);

create policy "family ops access reassurance calls" on public.pre_reassurance_calls for all using (
  exists (select 1 from public.family_members fm where fm.family_id = pre_reassurance_calls.family_id and fm.profile_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
) with check (
  exists (select 1 from public.family_members fm where fm.family_id = pre_reassurance_calls.family_id and fm.profile_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
);

create policy "family ops access audio summaries" on public.audio_report_summaries for all using (
  exists (select 1 from public.family_members fm where fm.family_id = audio_report_summaries.family_id and fm.profile_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
) with check (
  exists (select 1 from public.family_members fm where fm.family_id = audio_report_summaries.family_id and fm.profile_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
);

create policy "public can read active social programs" on public.social_contribution_programs for select using (active = true);
