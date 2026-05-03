-- 008_care_platform_differentiators.sql
-- Locks the product direction as a parent care platform, not a simple dispatch marketplace.
-- Adds care packs, assisted intake, and elderly-friendly UX telemetry.

-- 1) Care service packs -------------------------------------------------------
create table if not exists public.care_service_packs (
  code text primary key,
  title text not null,
  one_line text not null,
  who_needs_it text not null,
  includes text[] not null default '{}',
  easy_start text not null,
  reassurance_result text not null,
  social_value text,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.care_pack_requests (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  elder_id uuid not null references public.elders(id) on delete cascade,
  requester_id uuid references public.profiles(id) on delete set null,
  pack_code text not null references public.care_service_packs(code),
  preferred_channel text not null default 'phone' check (preferred_channel in ('phone', 'kakao', 'photo', 'direct')),
  urgency text not null default 'soon' check (urgency in ('today', 'soon', 'regular', 'unknown')),
  situation text not null,
  callback_phone text,
  social_support_requested boolean not null default false,
  easy_mode_confirmed boolean not null default false,
  status text not null default 'received' check (status in ('received', 'triaging', 'plan_ready', 'in_progress', 'resolved', 'cancelled')),
  assigned_ops_id uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.care_pack_tasks (
  id uuid primary key default gen_random_uuid(),
  care_pack_request_id uuid not null references public.care_pack_requests(id) on delete cascade,
  step_order integer not null,
  title text not null,
  description text not null,
  owner_role text not null default 'ops' check (owner_role in ('family', 'ops', 'manager', 'partner', 'system')),
  status text not null default 'waiting' check (status in ('todo', 'in_progress', 'done', 'skipped', 'waiting')),
  due_hint text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Assisted intake sessions -------------------------------------------------
create table if not exists public.assisted_intake_sessions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade,
  elder_id uuid references public.elders(id) on delete cascade,
  care_request_id uuid references public.care_requests(id) on delete set null,
  care_pack_request_id uuid references public.care_pack_requests(id) on delete set null,
  channel text not null check (channel in ('phone', 'kakao', 'photo', 'direct')),
  raw_input_summary text,
  extracted_summary jsonb not null default '{}'::jsonb,
  missing_info text[] not null default '{}',
  handled_by uuid references public.profiles(id) on delete set null,
  status text not null default 'open' check (status in ('open', 'waiting_family', 'summarized', 'closed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3) Elder-friendly UX feedback ----------------------------------------------
create table if not exists public.elder_friendly_ux_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  family_id uuid references public.families(id) on delete cascade,
  role text not null default 'child' check (role in ('child', 'parent', 'manager', 'ops', 'admin')),
  surface text not null,
  event_name text not null,
  difficulty_score integer check (difficulty_score between 1 and 5),
  abandoned boolean not null default false,
  note text,
  created_at timestamptz not null default now()
);

-- 4) RLS ---------------------------------------------------------------------
alter table public.care_service_packs enable row level security;
alter table public.care_pack_requests enable row level security;
alter table public.care_pack_tasks enable row level security;
alter table public.assisted_intake_sessions enable row level security;
alter table public.elder_friendly_ux_events enable row level security;

drop policy if exists care_service_packs_select_policy on public.care_service_packs;
create policy care_service_packs_select_policy on public.care_service_packs
for select using (is_active = true or public.is_ops());

drop policy if exists care_service_packs_write_policy on public.care_service_packs;
create policy care_service_packs_write_policy on public.care_service_packs
for all using (public.is_ops()) with check (public.is_ops());

drop policy if exists care_pack_requests_policy on public.care_pack_requests;
create policy care_pack_requests_policy on public.care_pack_requests
for all using (public.is_ops() or public.is_family_member(family_id))
with check (public.is_ops() or public.is_family_member(family_id));

drop policy if exists care_pack_tasks_policy on public.care_pack_tasks;
create policy care_pack_tasks_policy on public.care_pack_tasks
for all using (
  public.is_ops()
  or exists (
    select 1 from public.care_pack_requests cpr
    where cpr.id = care_pack_tasks.care_pack_request_id
      and public.is_family_member(cpr.family_id)
  )
)
with check (
  public.is_ops()
  or exists (
    select 1 from public.care_pack_requests cpr
    where cpr.id = care_pack_tasks.care_pack_request_id
      and public.is_family_member(cpr.family_id)
  )
);

drop policy if exists assisted_intake_sessions_policy on public.assisted_intake_sessions;
create policy assisted_intake_sessions_policy on public.assisted_intake_sessions
for all using (public.is_ops() or (family_id is not null and public.is_family_member(family_id)))
with check (public.is_ops() or (family_id is not null and public.is_family_member(family_id)));

drop policy if exists elder_friendly_ux_events_policy on public.elder_friendly_ux_events;
create policy elder_friendly_ux_events_policy on public.elder_friendly_ux_events
for all using (public.is_ops() or (family_id is not null and public.is_family_member(family_id)) or profile_id = auth.uid())
with check (public.is_ops() or (family_id is not null and public.is_family_member(family_id)) or profile_id = auth.uid());

-- 5) Views -------------------------------------------------------------------
create or replace view public.ops_care_pack_board as
select
  cpr.id,
  cpr.status,
  cpr.urgency,
  cpr.preferred_channel,
  cpr.pack_code,
  csp.title as pack_title,
  e.name as elder_name,
  f.name as family_name,
  cpr.situation,
  cpr.social_support_requested,
  cpr.easy_mode_confirmed,
  cpr.created_at,
  count(cpt.id) filter (where cpt.status in ('todo', 'in_progress', 'waiting')) as open_task_count
from public.care_pack_requests cpr
join public.care_service_packs csp on csp.code = cpr.pack_code
join public.elders e on e.id = cpr.elder_id
join public.families f on f.id = cpr.family_id
left join public.care_pack_tasks cpt on cpt.care_pack_request_id = cpr.id
group by cpr.id, csp.title, e.name, f.name;

create or replace view public.family_care_pack_dashboard as
select
  cpr.id,
  cpr.family_id,
  cpr.status,
  cpr.urgency,
  csp.title,
  csp.one_line,
  csp.reassurance_result,
  cpr.social_support_requested,
  cpr.created_at,
  coalesce(jsonb_agg(
    jsonb_build_object(
      'order', cpt.step_order,
      'title', cpt.title,
      'status', cpt.status,
      'ownerRole', cpt.owner_role,
      'dueHint', cpt.due_hint
    ) order by cpt.step_order
  ) filter (where cpt.id is not null), '[]'::jsonb) as steps
from public.care_pack_requests cpr
join public.care_service_packs csp on csp.code = cpr.pack_code
left join public.care_pack_tasks cpt on cpt.care_pack_request_id = cpr.id
group by cpr.id, csp.title, csp.one_line, csp.reassurance_result;

-- 6) Updated_at triggers and indexes -----------------------------------------
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'care_service_packs', 'care_pack_requests', 'care_pack_tasks', 'assisted_intake_sessions'
  ] loop
    execute format('drop trigger if exists %I on public.%I', 'set_' || table_name || '_updated_at', table_name);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', 'set_' || table_name || '_updated_at', table_name);
  end loop;
end $$;

create index if not exists care_pack_requests_family_status_idx on public.care_pack_requests (family_id, status, urgency, created_at desc);
create index if not exists care_pack_requests_ops_idx on public.care_pack_requests (status, urgency, pack_code, created_at desc);
create index if not exists care_pack_tasks_request_status_idx on public.care_pack_tasks (care_pack_request_id, status, step_order);
create index if not exists assisted_intake_sessions_family_idx on public.assisted_intake_sessions (family_id, status, created_at desc);
create index if not exists elder_friendly_ux_events_surface_idx on public.elder_friendly_ux_events (surface, event_name, created_at desc);

-- 7) Seed care packs ----------------------------------------------------------
insert into public.care_service_packs (code, title, one_line, who_needs_it, includes, easy_start, reassurance_result, social_value, sort_order)
values
  ('hospital_day', '병원 가는 날 안심팩', '병원 일정, 만남 암호, 진료 동행, 약국, 귀가 확인을 한 번에 맡깁니다.', '자녀가 병원에 동행하기 어려운 가족', array['사진/전화 예약 접수','만남 암호','현장 타임라인','진료 리포트','약/서류/다음 예약 확인'], '예약 문자나 병원 카톡만 올리면 시작', '오늘 상태가 안심/확인 필요/긴급으로 표시', null, 10),
  ('meal_subscription', '안심밥상 케어', '식사 확인, 도시락·밑반찬·죽·회복식 연결을 가족 알림과 묶습니다.', '혼자 요리하기 어렵거나 식사를 자주 거르는 부모님', array['아침/점심/저녁 확인','식사 미확인 알림','정기배송 상담','저염식/연화식/회복식 메모','주간 식사 리포트'], '점심 드셨어요 버튼 하나로 시작', '식사 확인 여부가 자녀 홈에 바로 표시', '결식 위험 어르신에게 공공·후원 식사 연결 가능', 20),
  ('medication_check', '약 챙김 안심팩', '처방약 사진, 복용 시간, 먹었어요 확인, 미확인 알림을 단순하게 관리합니다.', '약을 깜빡하거나 새 처방약이 자주 바뀌는 부모님', array['약 봉투 사진','복용 시간표','먹었어요 버튼','가족 담당자','미확인 알림'], '약 봉투 사진 한 장으로 시작', '아침/점심/저녁 약 확인 상태 표시', null, 30),
  ('discharge_7days', '퇴원 후 7일 안심팩', '퇴원 당일부터 7일 동안 식사, 약, 통증, 낙상, 다음 외래를 확인합니다.', '입원·수술·골절 후 집에서 지내는 부모님', array['귀가 동행','처방약 정리','회복식 상담','컨디션 확인','낙상 위험 체크','다음 외래 정리'], '퇴원 예정일만 알려주면 운영실이 플랜 생성', '7일 최종 안심 리포트 제공', null, 40),
  ('documents_insurance', '보험서류 챙김팩', '영수증, 세부내역서, 통원확인서, 처방전, 검사결과지를 목적별로 챙깁니다.', '실손보험, 가족 정산, 다음 병원 제출 서류가 필요한 가족', array['필요 서류 추천','부모님 동의 범위 확인','현장 요청 체크','서류 수령 상태','가족 공유'], '잘 모르겠어요, 추천해주세요 선택 가능', '빠진 서류가 있는지 운영실이 검수', null, 50),
  ('regular_visit', '정기진료 자동관리', '혈압, 당뇨, 재활, 안과 등 반복 진료를 케어 캘린더로 관리합니다.', '매달 또는 매주 병원 예약이 반복되는 부모님', array['진료 주기 기록','다음 예약 후보','같은 매니저 우선','가족 역할 배분','자동 리마인드'], '마지막 진료 리포트에서 다음 예약 후보 생성', '다음 진료를 놓치지 않게 확인 필요로 표시', null, 60),
  ('companionship_checkin', '정기 안부 확인', '전화, 문자, 큰 버튼으로 식사·약·컨디션 안부를 부담 없이 확인합니다.', '혼자 계시는 시간이 길고 가족이 자주 확인하기 어려운 부모님', array['주 1~3회 안부','식사/약 질문','부모님 부담 없는 표현','긴급 전환','가족 요약 알림'], '원하는 요일과 시간만 선택', '이번 주 안부 확인 상태 표시', '무료 안부 캠페인과 연결 가능', 70),
  ('not_sure_consult', '뭘 해야 할지 모르겠어요 상담', '부모님 상황만 말하면 운영실이 필요한 케어 조합을 제안합니다.', '병원, 식사, 약, 퇴원, 서류 중 뭘 신청해야 할지 모르는 가족', array['상황 듣기','걱정 분류','케어패스포트 확인','서비스 조합 제안','비용 부담 시 공공/후원 연결'], '전화 버튼 하나로 시작', '가족이 바로 확인할 수 있는 1분 해결 플랜', '돌봄 사각지대 가족에게 길 안내 역할', 80)
on conflict (code) do update set
  title = excluded.title,
  one_line = excluded.one_line,
  who_needs_it = excluded.who_needs_it,
  includes = excluded.includes,
  easy_start = excluded.easy_start,
  reassurance_result = excluded.reassurance_result,
  social_value = excluded.social_value,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();

insert into public.notification_templates (code, channel, title, body, contains_transport_policy)
values
  ('care_pack_received', 'alimtalk', '부모님 케어팩 요청이 접수됐어요', '기능을 직접 고르지 않아도 됩니다. 운영실이 걱정을 해결 플랜으로 정리하겠습니다.', false),
  ('easy_mode_callback_needed', 'alimtalk', '상담원이 대신 정리해드릴게요', '전화·카톡·사진으로 맡긴 내용을 확인하고 부족한 정보만 간단히 여쭤보겠습니다.', false),
  ('meal_subscription_candidate', 'app', '안심밥상 연결 후보가 있어요', '식사를 못 챙기시는 부모님께 식사 확인과 정기배송 연결을 함께 안내할 수 있습니다.', false)
on conflict (code) do nothing;

insert into public.audit_logs (entity_type, action, metadata)
values (
  'migration',
  '008_care_platform_differentiators',
  '{"message":"Added care packs, assisted intake, 40-plus simplicity guardrails, and product differentiation data."}'::jsonb
)
on conflict do nothing;
