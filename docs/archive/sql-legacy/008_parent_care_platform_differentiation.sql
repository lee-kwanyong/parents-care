-- 008_parent_care_platform_differentiation.sql
-- 목적: 병원동행 앱을 "부모님 걱정 해결 케어 플랫폼"으로 고정하는 추가 migration
-- 실행 위치: Supabase SQL Editor
-- 실행 순서: 기존 RUN_THIS_IN_SUPABASE_SQL_EDITOR.sql 성공 후, 이 파일 전체를 새 Query에 붙여넣고 실행
-- 핵심: 40대 이상 보호자 맞춤 쉬운 접수, 케어팩, 안심밥상/정기배송, 가족 할 일, 쉬운 UX, 사회공헌 연결

-- -----------------------------------------------------------------------------
-- 0) 실행 전 필수 테이블 확인
-- -----------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.families') is null then
    raise exception 'public.families가 없습니다. RUN_THIS_IN_SUPABASE_SQL_EDITOR.sql 전체를 먼저 실행하세요.';
  end if;
  if to_regclass('public.family_members') is null then
    raise exception 'public.family_members가 없습니다. RUN_THIS_IN_SUPABASE_SQL_EDITOR.sql 전체를 먼저 실행하세요.';
  end if;
  if to_regclass('public.worry_requests') is null then
    raise exception 'public.worry_requests가 없습니다. 007_worry_resolution_platform.sql 또는 통합 schema를 먼저 실행하세요.';
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 1) 기존 걱정/케어패스포트 테이블 보강
-- -----------------------------------------------------------------------------
alter table public.worry_requests add column if not exists easy_mode boolean not null default true;
alter table public.worry_requests add column if not exists care_pack_code text;
alter table public.worry_requests add column if not exists one_minute_plan_summary text;
alter table public.worry_requests add column if not exists social_support_requested boolean not null default false;
alter table public.worry_requests add column if not exists guardian_next_action text;

alter table public.care_passports add column if not exists daily_life_note text;
alter table public.care_passports add column if not exists food_texture_note text;
alter table public.care_passports add column if not exists social_preference_note text;
alter table public.care_passports add column if not exists parent_wording_do text;
alter table public.care_passports add column if not exists parent_wording_do_not text;
alter table public.care_passports add column if not exists consent_reminder_note text;

alter table public.meal_support_requests add column if not exists regular_delivery_interest boolean not null default false;
alter table public.meal_support_requests add column if not exists public_or_sponsored_support_needed boolean not null default false;
alter table public.meal_support_requests add column if not exists delivery_address_hint text;
alter table public.meal_support_requests add column if not exists texture_level text;

alter table public.recurring_care_schedules add column if not exists auto_create_worry boolean not null default false;
alter table public.recurring_care_schedules add column if not exists reminder_channel text not null default 'kakao' check (reminder_channel in ('phone','kakao','app','sms','not_sure'));
alter table public.recurring_care_schedules add column if not exists last_checked_at timestamptz;

alter table public.cost_approval_requests add column if not exists approval_channel text not null default 'kakao' check (approval_channel in ('phone','kakao','app','sms'));
alter table public.cost_approval_requests add column if not exists cost_explained_text text;

-- -----------------------------------------------------------------------------
-- 2) 케어팩: 사용자가 기능을 찾지 않고 "걱정"을 맡기면 운영실이 묶어서 처리
-- -----------------------------------------------------------------------------
create table if not exists public.care_service_packs (
  code text primary key,
  title text not null,
  short_title text not null,
  one_line text not null,
  primary_worry_category text not null check (primary_worry_category in ('hospital','meal','medication','discharge','documents','recurring','not_sure','wellbeing','emergency')),
  who_needs_it text not null,
  includes text[] not null default '{}',
  easy_start text not null,
  reassurance_result text not null,
  social_value text,
  active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.care_pack_requests (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  elder_id uuid references public.elders(id) on delete set null,
  worry_request_id uuid references public.worry_requests(id) on delete set null,
  requester_id uuid references auth.users(id) on delete set null,
  pack_code text not null references public.care_service_packs(code),
  source_channel text not null default 'phone' check (source_channel in ('phone','kakao','photo','simple_form','ops')),
  urgency text not null default 'not_sure' check (urgency in ('today','this_week','regular','not_sure')),
  situation text not null,
  callback_phone text,
  easy_mode_confirmed boolean not null default true,
  social_support_requested boolean not null default false,
  status text not null default 'received' check (status in ('received','triaging','plan_ready','guardian_confirming','in_progress','resolved','cancelled','urgent')),
  ops_owner_id uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.care_pack_task_templates (
  pack_code text not null references public.care_service_packs(code) on delete cascade,
  step_order integer not null,
  title text not null,
  description text not null,
  owner_role text not null default 'ops' check (owner_role in ('family','ops','manager','partner','system')),
  due_hint text,
  visible_to_family boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (pack_code, step_order)
);

create table if not exists public.care_pack_tasks (
  id uuid primary key default gen_random_uuid(),
  care_pack_request_id uuid not null references public.care_pack_requests(id) on delete cascade,
  step_order integer not null,
  title text not null,
  description text not null,
  owner_role text not null default 'ops' check (owner_role in ('family','ops','manager','partner','system')),
  status text not null default 'todo' check (status in ('todo','in_progress','done','skipped','waiting')),
  due_hint text,
  visible_to_family boolean not null default true,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (care_pack_request_id, step_order)
);

-- -----------------------------------------------------------------------------
-- 3) 40대 이상 보호자 맞춤 Easy Mode 설정
-- -----------------------------------------------------------------------------
create table if not exists public.family_easy_mode_settings (
  family_id uuid primary key references public.families(id) on delete cascade,
  preferred_contact_channel text not null default 'phone' check (preferred_contact_channel in ('phone','kakao','app','sms')),
  fallback_phone text,
  phone_first boolean not null default true,
  photo_first boolean not null default true,
  kakao_text_allowed boolean not null default true,
  avoid_long_forms boolean not null default true,
  max_steps_per_task integer not null default 3 check (max_steps_per_task between 1 and 5),
  show_only_reassurance_state boolean not null default true,
  large_text_default boolean not null default true,
  note text,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.elder_life_needs_profiles (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  elder_id uuid not null references public.elders(id) on delete cascade,
  cooking_ability text not null default 'unknown' check (cooking_ability in ('independent','simple_only','hard','unable','unknown')),
  meal_risk_level text not null default 'unknown' check (meal_risk_level in ('low','medium','high','unknown')),
  chewing_or_swallowing_note text,
  diet_caution_note text,
  grocery_or_cooking_help_needed boolean not null default false,
  medication_check_needed boolean not null default false,
  wellbeing_call_needed boolean not null default false,
  home_safety_note text,
  loneliness_note text,
  public_support_note text,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (elder_id)
);

create table if not exists public.elder_friendly_ux_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references auth.users(id) on delete set null,
  family_id uuid references public.families(id) on delete cascade,
  role text not null default 'child' check (role in ('child','parent','manager','ops','admin')),
  surface text not null,
  event_name text not null,
  difficulty_score integer check (difficulty_score between 1 and 5),
  abandoned boolean not null default false,
  note text,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 4) 안심밥상/음식 정기배송 연결
-- -----------------------------------------------------------------------------
create table if not exists public.care_partner_directory (
  id uuid primary key default gen_random_uuid(),
  partner_type text not null check (partner_type in ('meal','mobility','homecare','welfare','pharmacy','hospital','document','other')),
  name text not null,
  region_hint text,
  service_summary text not null,
  contact_hint text,
  ops_note text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (partner_type, name, region_hint)
);

create table if not exists public.meal_delivery_subscriptions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  elder_id uuid references public.elders(id) on delete set null,
  meal_support_request_id uuid references public.meal_support_requests(id) on delete set null,
  requested_by uuid references auth.users(id) on delete set null,
  subscription_type text not null default 'not_sure' check (subscription_type in ('regular_lunch','regular_dinner','side_dish','soft_food','recovery_meal','low_salt','diabetes_care','not_sure')),
  cadence text not null default 'weekly' check (cadence in ('daily','weekdays','weekly','custom','not_sure')),
  delivery_days text[] not null default '{}',
  dietary_profile text[] not null default '{}',
  texture_level text,
  delivery_address_hint text,
  partner_id uuid references public.care_partner_directory(id) on delete set null,
  partner_name_snapshot text,
  start_date date,
  end_date date,
  family_contact text,
  public_or_sponsored_support_needed boolean not null default false,
  status text not null default 'requested' check (status in ('requested','ops_review','partner_matching','active','paused','cancelled','completed')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meal_delivery_events (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.meal_delivery_subscriptions(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  elder_id uuid references public.elders(id) on delete set null,
  scheduled_for date not null,
  meal_label text not null default '점심',
  delivery_status text not null default 'scheduled' check (delivery_status in ('scheduled','delivered','failed','cancelled','skipped')),
  eaten_status text not null default 'unknown' check (eaten_status in ('ate','not_ate','unknown','needs_help')),
  checked_by text check (checked_by in ('parent','family','manager','ops','system')),
  note text,
  delivered_at timestamptz,
  checked_at timestamptz,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 5) 가족이 바로 누를 수 있는 간단 할 일
-- -----------------------------------------------------------------------------
create table if not exists public.simple_family_action_items (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  elder_id uuid references public.elders(id) on delete set null,
  source_type text not null default 'care_pack' check (source_type in ('worry','care_pack','meal','medication','discharge','document','recurring','ops','system')),
  source_id uuid,
  title text not null,
  simple_action_label text not null default '확인했어요',
  owner_label text,
  due_at timestamptz,
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  status text not null default 'todo' check (status in ('todo','in_progress','done','skipped')),
  completed_by uuid references auth.users(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.public_support_links (
  id uuid primary key default gen_random_uuid(),
  region_hint text,
  support_type text not null check (support_type in ('meal','hospital_companion','homecare','welfare','emergency','voucher','other')),
  title text not null,
  description text not null,
  contact_hint text,
  eligibility_hint text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (support_type, title, region_hint)
);

-- -----------------------------------------------------------------------------
-- 6) 케어팩 요청 시 기본 실행 단계 자동 생성
-- -----------------------------------------------------------------------------
create or replace function public.create_default_care_pack_tasks()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.care_pack_tasks (
    care_pack_request_id,
    step_order,
    title,
    description,
    owner_role,
    due_hint,
    visible_to_family
  )
  select
    new.id,
    t.step_order,
    t.title,
    t.description,
    t.owner_role,
    t.due_hint,
    t.visible_to_family
  from public.care_pack_task_templates t
  where t.pack_code = new.pack_code
  on conflict (care_pack_request_id, step_order) do nothing;

  return new;
end;
$$;

drop trigger if exists care_pack_requests_create_default_tasks on public.care_pack_requests;
create trigger care_pack_requests_create_default_tasks
after insert on public.care_pack_requests
for each row execute function public.create_default_care_pack_tasks();

-- -----------------------------------------------------------------------------
-- 7) 걱정 접수 시 케어팩 자동 연결
-- -----------------------------------------------------------------------------
create or replace function public.link_worry_request_to_care_pack()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pack_code text;
  v_title text;
begin
  v_pack_code := case new.category
    when 'hospital' then 'hospital_day'
    when 'meal' then 'meal_delivery'
    when 'medication' then 'medication_check'
    when 'discharge' then 'discharge_7days'
    when 'documents' then 'documents_insurance'
    when 'recurring' then 'regular_care'
    when 'not_sure' then 'not_sure_consult'
    when 'emergency' then 'urgent_help'
    else 'not_sure_consult'
  end;

  select title into v_title
  from public.care_service_packs
  where code = v_pack_code and active = true;

  if v_title is not null then
    insert into public.care_pack_requests (
      family_id,
      elder_id,
      worry_request_id,
      requester_id,
      pack_code,
      source_channel,
      urgency,
      situation,
      callback_phone,
      easy_mode_confirmed,
      social_support_requested,
      status
    ) values (
      new.family_id,
      new.elder_id,
      new.id,
      new.created_by,
      v_pack_code,
      new.source_channel,
      new.urgency,
      new.situation_text,
      new.preferred_contact,
      true,
      coalesce(new.social_support_requested, false),
      'received'
    );

    update public.worry_requests
    set
      care_pack_code = v_pack_code,
      one_minute_plan_summary = coalesce(one_minute_plan_summary, v_title || '으로 정리해 운영실이 필요한 단계만 확인합니다.'),
      guardian_next_action = coalesce(guardian_next_action, '운영실 연락 또는 1분 해결 플랜 확인')
    where id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists worry_requests_auto_link_care_pack on public.worry_requests;
create trigger worry_requests_auto_link_care_pack
after insert on public.worry_requests
for each row execute function public.link_worry_request_to_care_pack();

-- -----------------------------------------------------------------------------
-- 8) 가족 안심판 / 운영실 관제 뷰
-- -----------------------------------------------------------------------------
create or replace view public.family_parent_care_dashboard as
select
  f.id as family_id,
  f.name as family_name,
  count(distinct wr.id) filter (where wr.status in ('received','triaging','plan_ready','guardian_confirming','in_progress','urgent')) as open_worry_count,
  count(distinct wr.id) filter (where wr.assurance_state = 'urgent') as urgent_worry_count,
  count(distinct cpr.id) filter (where cpr.status in ('received','triaging','plan_ready','guardian_confirming','in_progress','urgent')) as open_care_pack_count,
  count(distinct mds.id) filter (where mds.status in ('requested','ops_review','partner_matching','active')) as active_meal_delivery_count,
  count(distinct sfa.id) filter (where sfa.status in ('todo','in_progress') and sfa.priority in ('high','urgent')) as important_family_action_count,
  count(distinct sfa.id) filter (where sfa.status in ('todo','in_progress')) as open_family_action_count,
  case
    when count(distinct wr.id) filter (where wr.assurance_state = 'urgent') > 0 then 'urgent'
    when count(distinct wr.id) filter (where wr.status in ('received','triaging','plan_ready','guardian_confirming','in_progress','urgent')) > 0
      or count(distinct sfa.id) filter (where sfa.status in ('todo','in_progress') and sfa.priority in ('high','urgent')) > 0
      then 'needs_check'
    else 'safe'
  end as today_reassurance_state
from public.families f
left join public.worry_requests wr on wr.family_id = f.id
left join public.care_pack_requests cpr on cpr.family_id = f.id
left join public.meal_delivery_subscriptions mds on mds.family_id = f.id
left join public.simple_family_action_items sfa on sfa.family_id = f.id
group by f.id;

create or replace view public.ops_parent_care_command_center as
select
  cpr.id as care_pack_request_id,
  cpr.family_id,
  cpr.elder_id,
  e.name as elder_name,
  f.name as family_name,
  cpr.pack_code,
  csp.title as pack_title,
  cpr.source_channel,
  cpr.urgency,
  cpr.status,
  cpr.social_support_requested,
  cpr.created_at,
  count(cpt.id) filter (where cpt.status in ('todo','in_progress','waiting')) as open_task_count,
  count(sfa.id) filter (where sfa.status in ('todo','in_progress')) as open_family_action_count
from public.care_pack_requests cpr
join public.care_service_packs csp on csp.code = cpr.pack_code
left join public.elders e on e.id = cpr.elder_id
join public.families f on f.id = cpr.family_id
left join public.care_pack_tasks cpt on cpt.care_pack_request_id = cpr.id
left join public.simple_family_action_items sfa on sfa.source_type = 'care_pack' and sfa.source_id = cpr.id
group by cpr.id, csp.title, e.name, f.name;

create or replace view public.ops_meal_delivery_board as
select
  mds.id,
  mds.family_id,
  mds.elder_id,
  e.name as elder_name,
  f.name as family_name,
  mds.subscription_type,
  mds.cadence,
  mds.dietary_profile,
  mds.texture_level,
  mds.public_or_sponsored_support_needed,
  mds.status,
  mds.created_at,
  count(mde.id) filter (where mde.delivery_status = 'scheduled') as scheduled_delivery_count,
  count(mde.id) filter (where mde.eaten_status in ('unknown','needs_help','not_ate')) as meal_check_needed_count
from public.meal_delivery_subscriptions mds
left join public.meal_delivery_events mde on mde.subscription_id = mds.id
left join public.elders e on e.id = mds.elder_id
join public.families f on f.id = mds.family_id
group by mds.id, e.name, f.name;

-- -----------------------------------------------------------------------------
-- 9) RLS
-- -----------------------------------------------------------------------------
alter table public.care_service_packs enable row level security;
alter table public.care_pack_requests enable row level security;
alter table public.care_pack_task_templates enable row level security;
alter table public.care_pack_tasks enable row level security;
alter table public.family_easy_mode_settings enable row level security;
alter table public.elder_life_needs_profiles enable row level security;
alter table public.elder_friendly_ux_events enable row level security;
alter table public.care_partner_directory enable row level security;
alter table public.meal_delivery_subscriptions enable row level security;
alter table public.meal_delivery_events enable row level security;
alter table public.simple_family_action_items enable row level security;
alter table public.public_support_links enable row level security;

drop policy if exists "public read active care packs" on public.care_service_packs;
drop policy if exists "ops manage care packs" on public.care_service_packs;
create policy "public read active care packs" on public.care_service_packs for select using (active = true or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin')));
create policy "ops manage care packs" on public.care_service_packs for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))) with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin')));

drop policy if exists "public read care pack task templates" on public.care_pack_task_templates;
drop policy if exists "ops manage care pack task templates" on public.care_pack_task_templates;
create policy "public read care pack task templates" on public.care_pack_task_templates for select using (true);
create policy "ops manage care pack task templates" on public.care_pack_task_templates for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))) with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin')));

drop policy if exists "family ops access care pack requests" on public.care_pack_requests;
create policy "family ops access care pack requests" on public.care_pack_requests for all using (
  exists (select 1 from public.family_members fm where fm.family_id = care_pack_requests.family_id and fm.profile_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
) with check (
  exists (select 1 from public.family_members fm where fm.family_id = care_pack_requests.family_id and fm.profile_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
);

drop policy if exists "family ops access care pack tasks" on public.care_pack_tasks;
create policy "family ops access care pack tasks" on public.care_pack_tasks for all using (
  exists (
    select 1 from public.care_pack_requests cpr
    join public.family_members fm on fm.family_id = cpr.family_id
    where cpr.id = care_pack_tasks.care_pack_request_id and fm.profile_id = auth.uid()
  )
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
) with check (
  exists (
    select 1 from public.care_pack_requests cpr
    join public.family_members fm on fm.family_id = cpr.family_id
    where cpr.id = care_pack_tasks.care_pack_request_id and fm.profile_id = auth.uid()
  )
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
);

drop policy if exists "family ops access easy mode settings" on public.family_easy_mode_settings;
create policy "family ops access easy mode settings" on public.family_easy_mode_settings for all using (
  exists (select 1 from public.family_members fm where fm.family_id = family_easy_mode_settings.family_id and fm.profile_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
) with check (
  exists (select 1 from public.family_members fm where fm.family_id = family_easy_mode_settings.family_id and fm.profile_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
);

drop policy if exists "family ops access elder life needs" on public.elder_life_needs_profiles;
create policy "family ops access elder life needs" on public.elder_life_needs_profiles for all using (
  exists (select 1 from public.family_members fm where fm.family_id = elder_life_needs_profiles.family_id and fm.profile_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
) with check (
  exists (select 1 from public.family_members fm where fm.family_id = elder_life_needs_profiles.family_id and fm.profile_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
);

drop policy if exists "family ops access ux events" on public.elder_friendly_ux_events;
create policy "family ops access ux events" on public.elder_friendly_ux_events for all using (
  profile_id = auth.uid()
  or (family_id is not null and exists (select 1 from public.family_members fm where fm.family_id = elder_friendly_ux_events.family_id and fm.profile_id = auth.uid()))
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
) with check (
  profile_id = auth.uid()
  or (family_id is not null and exists (select 1 from public.family_members fm where fm.family_id = elder_friendly_ux_events.family_id and fm.profile_id = auth.uid()))
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
);

drop policy if exists "public read active care partners" on public.care_partner_directory;
drop policy if exists "ops manage care partners" on public.care_partner_directory;
create policy "public read active care partners" on public.care_partner_directory for select using (active = true or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin')));
create policy "ops manage care partners" on public.care_partner_directory for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))) with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin')));

drop policy if exists "family ops access meal delivery subscriptions" on public.meal_delivery_subscriptions;
create policy "family ops access meal delivery subscriptions" on public.meal_delivery_subscriptions for all using (
  exists (select 1 from public.family_members fm where fm.family_id = meal_delivery_subscriptions.family_id and fm.profile_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
) with check (
  exists (select 1 from public.family_members fm where fm.family_id = meal_delivery_subscriptions.family_id and fm.profile_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
);

drop policy if exists "family ops access meal delivery events" on public.meal_delivery_events;
create policy "family ops access meal delivery events" on public.meal_delivery_events for all using (
  exists (select 1 from public.family_members fm where fm.family_id = meal_delivery_events.family_id and fm.profile_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
) with check (
  exists (select 1 from public.family_members fm where fm.family_id = meal_delivery_events.family_id and fm.profile_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
);

drop policy if exists "family ops access simple action items" on public.simple_family_action_items;
create policy "family ops access simple action items" on public.simple_family_action_items for all using (
  exists (select 1 from public.family_members fm where fm.family_id = simple_family_action_items.family_id and fm.profile_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
) with check (
  exists (select 1 from public.family_members fm where fm.family_id = simple_family_action_items.family_id and fm.profile_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
);

drop policy if exists "public read active support links" on public.public_support_links;
drop policy if exists "ops manage support links" on public.public_support_links;
create policy "public read active support links" on public.public_support_links for select using (active = true or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin')));
create policy "ops manage support links" on public.public_support_links for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))) with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin')));

-- -----------------------------------------------------------------------------
-- 10) 트리거/인덱스
-- -----------------------------------------------------------------------------
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'care_service_packs', 'care_pack_requests', 'care_pack_tasks',
    'family_easy_mode_settings', 'elder_life_needs_profiles', 'care_partner_directory',
    'meal_delivery_subscriptions', 'simple_family_action_items', 'public_support_links'
  ] loop
    execute format('drop trigger if exists %I on public.%I', 'set_' || table_name || '_updated_at', table_name);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', 'set_' || table_name || '_updated_at', table_name);
  end loop;
end $$;

create index if not exists worry_requests_pack_idx on public.worry_requests (care_pack_code, status, created_at desc);
create index if not exists care_pack_requests_family_status_idx on public.care_pack_requests (family_id, status, urgency, created_at desc);
create index if not exists care_pack_requests_ops_idx on public.care_pack_requests (status, urgency, pack_code, created_at desc);
create index if not exists care_pack_requests_worry_idx on public.care_pack_requests (worry_request_id);
create index if not exists care_pack_tasks_request_status_idx on public.care_pack_tasks (care_pack_request_id, status, step_order);
create index if not exists meal_delivery_subscriptions_family_status_idx on public.meal_delivery_subscriptions (family_id, status, created_at desc);
create index if not exists meal_delivery_events_schedule_idx on public.meal_delivery_events (family_id, scheduled_for, delivery_status, eaten_status);
create index if not exists simple_family_action_items_family_status_idx on public.simple_family_action_items (family_id, status, priority, due_at);
create index if not exists elder_life_needs_profiles_family_idx on public.elder_life_needs_profiles (family_id, meal_risk_level);
create index if not exists elder_friendly_ux_events_surface_idx on public.elder_friendly_ux_events (surface, event_name, created_at desc);

-- -----------------------------------------------------------------------------
-- 11) 기본 케어팩 seed
-- -----------------------------------------------------------------------------
insert into public.care_service_packs (
  code, title, short_title, one_line, primary_worry_category, who_needs_it, includes, easy_start, reassurance_result, social_value, sort_order
)
values
  ('hospital_day', '병원 가는 날 안심팩', '병원 안심팩', '병원 일정, 만남 암호, 진료 동행, 약국, 귀가 확인을 한 번에 맡깁니다.', 'hospital', '자녀가 병원에 같이 가기 어려운 가족', array['사진/전화 예약 접수','만남 암호','현장 타임라인','진료 리포트','약/서류/다음 예약 확인'], '예약 문자나 병원 카톡만 올리면 시작', '오늘 상태가 안심/확인 필요/긴급으로 표시됩니다.', null, 10),
  ('meal_delivery', '안심밥상 케어', '안심밥상', '식사 확인, 도시락·밑반찬·죽·회복식 정기배송 연결을 가족 알림과 묶습니다.', 'meal', '혼자 요리하기 어렵거나 식사를 자주 거르는 부모님', array['아침/점심/저녁 확인','식사 미확인 알림','정기배송 상담','저염식/연화식/회복식 메모','주간 식사 리포트'], '점심 드셨어요 버튼 하나로 시작', '식사 확인 여부가 자녀 홈에 바로 표시됩니다.', '결식 위험 어르신에게 공공·후원 식사 연결 가능', 20),
  ('medication_check', '약 챙김 안심팩', '약 챙김', '처방약 사진, 복용 시간, 먹었어요 확인, 미확인 알림을 단순하게 관리합니다.', 'medication', '약을 깜빡하거나 새 처방약이 자주 바뀌는 부모님', array['약 봉투 사진','복용 시간표','먹었어요 버튼','가족 담당자','미확인 알림'], '약 봉투 사진 한 장으로 시작', '아침/점심/저녁 약 확인 상태를 보여줍니다.', null, 30),
  ('discharge_7days', '퇴원 후 7일 안심팩', '퇴원 7일팩', '퇴원 당일부터 7일 동안 식사, 약, 통증, 낙상, 다음 외래를 확인합니다.', 'discharge', '입원·수술·골절 후 집에서 지내는 부모님', array['귀가 동행','처방약 정리','회복식 상담','컨디션 확인','낙상 위험 체크','다음 외래 정리'], '퇴원 예정일만 알려주면 운영실이 플랜 생성', '7일 최종 안심 리포트를 제공합니다.', null, 40),
  ('documents_insurance', '보험서류 챙김팩', '서류 챙김', '영수증, 세부내역서, 통원확인서, 처방전, 검사결과지를 목적별로 챙깁니다.', 'documents', '실손보험, 가족 정산, 다음 병원 제출 서류가 필요한 가족', array['필요 서류 추천','부모님 동의 범위 확인','현장 요청 체크','서류 수령 상태','가족 공유'], '잘 모르겠어요, 필요한 서류 추천해주세요 선택 가능', '빠진 서류가 있는지 운영실이 검수합니다.', null, 50),
  ('regular_care', '정기진료·정기케어 자동관리', '정기케어', '혈압, 당뇨, 재활, 안과 등 반복 진료와 식사·약 확인을 케어 캘린더로 관리합니다.', 'recurring', '반복 진료나 주기적 안부 확인이 필요한 부모님', array['진료 주기 기록','다음 예약 후보','같은 매니저 우선','가족 역할 배분','자동 리마인드'], '마지막 진료 리포트에서 다음 예약 후보 생성', '다음 진료와 가족 할 일을 놓치지 않게 표시합니다.', null, 60),
  ('wellbeing_check', '정기 안부 확인', '안부 확인', '전화, 문자, 큰 버튼으로 식사·약·컨디션 안부를 부담 없이 확인합니다.', 'wellbeing', '혼자 계시는 시간이 길고 가족이 자주 확인하기 어려운 부모님', array['주 1~3회 안부','식사/약 질문','부모님 부담 없는 표현','긴급 전환','가족 요약 알림'], '원하는 요일과 시간만 선택', '이번 주 안부 확인 상태를 표시합니다.', '무료 안부 캠페인과 연결 가능', 70),
  ('not_sure_consult', '뭘 해야 할지 모르겠어요 상담', '모름 상담', '부모님 상황만 말하면 운영실이 필요한 케어 조합을 제안합니다.', 'not_sure', '무엇을 신청해야 할지 모르는 가족', array['상황 듣기','걱정 분류','케어패스포트 확인','서비스 조합 제안','비용 부담 시 공공/후원 연결'], '전화 버튼 하나로 시작', '가족이 바로 확인할 수 있는 1분 해결 플랜을 만듭니다.', '돌봄 사각지대 가족에게 길 안내 역할', 80),
  ('urgent_help', '긴급 확인 요청', '긴급 도움', '부모님 연락 두절, 갑작스러운 컨디션 이상, 현장 사고 가능성을 운영실이 우선 확인합니다.', 'emergency', '즉시 확인이 필요한 가족', array['운영실 우선 확인','보호자 연락','필요 시 119/지역기관 안내','상황 로그','가족 긴급 알림'], '긴급 도움 버튼 하나로 시작', '확인 필요/긴급 상태를 명확히 보여줍니다.', '고립 위험 어르신의 안전망 역할', 5)
on conflict (code) do update set
  title = excluded.title,
  short_title = excluded.short_title,
  one_line = excluded.one_line,
  primary_worry_category = excluded.primary_worry_category,
  who_needs_it = excluded.who_needs_it,
  includes = excluded.includes,
  easy_start = excluded.easy_start,
  reassurance_result = excluded.reassurance_result,
  social_value = excluded.social_value,
  sort_order = excluded.sort_order,
  active = true,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- 12) 케어팩 기본 단계 seed
-- -----------------------------------------------------------------------------
insert into public.care_pack_task_templates (pack_code, step_order, title, description, owner_role, due_hint, visible_to_family)
values
  ('hospital_day', 1, '예약 정보 확인', '예약 문자·사진·카톡을 보고 병원명, 시간, 준비물을 정리합니다.', 'ops', '접수 직후', true),
  ('hospital_day', 2, '이동/만남 방식 확인', '병원 앞 만남, 집 앞 만남 후 택시 동행, 제휴 이동지원 중 안전한 방식을 확인합니다.', 'ops', '배정 전', true),
  ('hospital_day', 3, '매니저 배정 및 만남 암호 안내', '매니저 신뢰정보와 만남 암호를 가족과 부모님에게 안내합니다.', 'ops', '전날 또는 당일', true),
  ('hospital_day', 4, '진료/약/서류/귀가 리포트', '진료 내용, 약, 서류, 다음 예약, 귀가 확인을 요약합니다.', 'manager', '진료 후', true),

  ('meal_delivery', 1, '식사 위험도 확인', '요리 가능 여부, 씹기/삼킴 어려움, 식사 누락 빈도를 확인합니다.', 'ops', '접수 직후', true),
  ('meal_delivery', 2, '식사 확인 방식 선택', '부모님 큰 버튼, 전화 확인, 매니저 확인 중 부담 없는 방식을 정합니다.', 'ops', '당일', true),
  ('meal_delivery', 3, '정기배송/회복식 연결 검토', '도시락, 밑반찬, 죽, 연화식, 저염식 등 필요한 연결 후보를 정리합니다.', 'partner', '1~2일 내', true),
  ('meal_delivery', 4, '가족 식사 리포트', '식사 확인 여부와 도움이 필요한 신호를 가족에게 간단히 공유합니다.', 'system', '매일/매주', true),

  ('medication_check', 1, '약 봉투/처방전 사진 확인', '약 이름, 용량, 복용 시점을 가족이 이해할 수 있게 정리합니다.', 'ops', '진료 후', true),
  ('medication_check', 2, '먹었어요 확인 시간 설정', '아침/점심/저녁 중 필요한 복약 확인 시간을 정합니다.', 'ops', '당일', true),
  ('medication_check', 3, '미확인 알림 설정', '정해진 시간에 확인이 안 되면 가족에게 알려줍니다.', 'system', '반복', true),

  ('discharge_7days', 1, '퇴원 당일 귀가/약/식사 확인', '귀가, 처방약, 첫 식사, 통증 여부를 확인합니다.', 'manager', '1일차', true),
  ('discharge_7days', 2, '7일 체크 계획 생성', '식사, 약, 통증, 낙상, 다음 외래를 7일 동안 확인하도록 계획합니다.', 'ops', '1일차', true),
  ('discharge_7days', 3, '다음 외래/검사 정리', '다음 병원 일정과 가족이 해야 할 일을 정리합니다.', 'ops', '3~7일차', true),
  ('discharge_7days', 4, '최종 안심 리포트', '7일간 상태와 앞으로 필요한 케어를 요약합니다.', 'ops', '7일차', true),

  ('documents_insurance', 1, '필요 서류 추천', '실손보험, 가족 정산, 다음 병원 제출 목적에 맞는 서류를 추천합니다.', 'ops', '접수 직후', true),
  ('documents_insurance', 2, '부모님 동의 범위 확인', '민감정보/의료정보 공유 범위를 확인합니다.', 'family', '서류 요청 전', true),
  ('documents_insurance', 3, '현장 서류 요청/수령 확인', '영수증, 세부내역서, 통원확인서, 처방전 등을 현장에서 체크합니다.', 'manager', '진료 당일', true),

  ('regular_care', 1, '반복 일정 파악', '정기진료, 식사확인, 복약확인, 안부전화 주기를 정리합니다.', 'ops', '접수 직후', true),
  ('regular_care', 2, '가족 담당자 지정', '누가 예약/약/식사/서류를 확인할지 간단히 나눕니다.', 'family', '1일 내', true),
  ('regular_care', 3, '다음 할 일 자동 생성', '다음 예약, 복약 확인, 식사 확인을 가족 할 일로 만듭니다.', 'system', '반복', true),

  ('wellbeing_check', 1, '부모님께 부담 없는 표현 확인', '감시/관리처럼 느껴지지 않도록 안내 문구를 정합니다.', 'ops', '접수 직후', true),
  ('wellbeing_check', 2, '안부 시간과 방식 설정', '전화, 큰 버튼, 카톡 중 부모님께 편한 방식을 정합니다.', 'ops', '1일 내', true),
  ('wellbeing_check', 3, '이상 신호 시 가족 알림', '식사/약/컨디션 이상 신호가 있으면 가족에게 알려줍니다.', 'system', '반복', true),

  ('not_sure_consult', 1, '상황 듣기', '부모님 상황을 전화/카톡/사진으로 편하게 접수합니다.', 'ops', '접수 직후', true),
  ('not_sure_consult', 2, '걱정 분류', '병원, 식사, 약, 퇴원, 서류, 정기케어 중 필요한 조합을 정리합니다.', 'ops', '상담 후', true),
  ('not_sure_consult', 3, '1분 해결 플랜 제안', '가족이 바로 이해할 수 있는 안심/확인 필요/긴급 플랜을 제안합니다.', 'ops', '상담 후', true),

  ('urgent_help', 1, '운영실 우선 확인', '부모님 상태와 연락 가능 여부를 먼저 확인합니다.', 'ops', '즉시', true),
  ('urgent_help', 2, '보호자/기관 연결', '필요 시 가족, 119, 지역기관 안내를 진행합니다.', 'ops', '즉시', true),
  ('urgent_help', 3, '상황 로그와 후속 조치', '확인 결과와 후속 조치를 가족에게 정리합니다.', 'ops', '확인 후', true)
on conflict (pack_code, step_order) do update set
  title = excluded.title,
  description = excluded.description,
  owner_role = excluded.owner_role,
  due_hint = excluded.due_hint,
  visible_to_family = excluded.visible_to_family;

-- -----------------------------------------------------------------------------
-- 13) 파트너/공공지원 seed
-- -----------------------------------------------------------------------------
insert into public.care_partner_directory (partner_type, name, region_hint, service_summary, contact_hint, ops_note)
values
  ('meal', '안심밥상 정기배송 후보', '지역별 설정 필요', '도시락, 밑반찬, 죽, 회복식, 연화식 등 식사 연결 후보를 관리합니다.', '운영실 확인', '실제 제휴 전까지 후보/상담용으로만 사용'),
  ('meal', '퇴원 후 회복식 후보', '지역별 설정 필요', '퇴원 후 7일 회복식 또는 부드러운 식단 연결 후보입니다.', '운영실 확인', '의학적 식단 처방이 아니라 가족 선택형 식사 연결로 안내'),
  ('homecare', '방문요양/가사도움 연결 후보', '지역별 설정 필요', '식사 준비, 청소, 안부 확인이 필요한 가정에 연결할 후보입니다.', '운영실 확인', '장기요양/민간 가사도움 구분 안내 필요'),
  ('welfare', '지역 복지기관 안내 후보', '지역별 설정 필요', '비용 부담 가정에 공공지원 또는 복지기관 정보를 안내합니다.', '운영실 확인', '지역별 공공서비스 확인 후 안내')
on conflict (partner_type, name, region_hint) do update set
  service_summary = excluded.service_summary,
  contact_hint = excluded.contact_hint,
  ops_note = excluded.ops_note,
  active = true,
  updated_at = now();

insert into public.public_support_links (region_hint, support_type, title, description, contact_hint, eligibility_hint)
values
  ('지역별 확인 필요', 'hospital_companion', '공공 병원동행 서비스 안내', '거주 지역 또는 병원 소재지에 따라 이용 가능한 공공 병원동행 서비스를 확인합니다.', '운영실 상담 후 안내', '지역, 연령, 1인가구 여부 등에 따라 다를 수 있음'),
  ('지역별 확인 필요', 'meal', '어르신 식사 지원 안내', '도시락, 밑반찬, 무료급식 등 지역 식사 지원 가능성을 확인합니다.', '운영실 상담 후 안내', '소득, 거주지, 결식 위험 등에 따라 다를 수 있음'),
  ('지역별 확인 필요', 'homecare', '방문요양/장기요양 상담 안내', '가사, 신체활동, 정기 돌봄이 필요한 경우 장기요양 또는 방문요양 상담을 안내합니다.', '운영실 상담 후 안내', '등급, 건강상태, 가족 상황에 따라 다를 수 있음'),
  ('지역별 확인 필요', 'emergency', '독거/고립 위험 어르신 안전 확인 안내', '연락 두절, 식사 미확인, 응급 위험이 반복되는 경우 지역 안전망 연결을 검토합니다.', '운영실 상담 후 안내', '지역 기관 기준에 따라 다를 수 있음')
on conflict (support_type, title, region_hint) do update set
  description = excluded.description,
  contact_hint = excluded.contact_hint,
  eligibility_hint = excluded.eligibility_hint,
  active = true,
  updated_at = now();

-- 사회공헌 프로그램 보강: 기존 social_contribution_programs에는 unique key가 없어 where not exists 방식으로 중복 방지
do $$
begin
  if to_regclass('public.social_contribution_programs') is not null then
    insert into public.social_contribution_programs (title, description, target, contribution_mode, ops_note)
    select '안심밥상 후원 연결', '식사를 챙기기 어려운 어르신에게 식사 확인과 정기배송 후보, 공공/후원 연결을 함께 안내합니다.', '결식 위험 또는 퇴원 후 회복기 어르신', '식사 지원/후원 연결', '비용 부담 여부와 지역 공공지원 가능성을 함께 검토'
    where not exists (select 1 from public.social_contribution_programs where title = '안심밥상 후원 연결');

    insert into public.social_contribution_programs (title, description, target, contribution_mode, ops_note)
    select '뭘 해야 할지 모르겠어요 상담', '부모님 걱정은 있지만 어떤 서비스를 신청해야 할지 모르는 가족에게 무료 또는 저비용 1차 상담을 제공합니다.', '40대 이상 보호자/돌봄 초보 가족', '상담/길 안내', '수익보다 돌봄 사각지대 안내를 우선하는 사회공헌 기능'
    where not exists (select 1 from public.social_contribution_programs where title = '뭘 해야 할지 모르겠어요 상담');
  end if;
end $$;

-- 알림 템플릿 보강: notification_templates가 있는 경우만 삽입
do $$
begin
  if to_regclass('public.notification_templates') is not null then
    insert into public.notification_templates (code, channel, title, body, contains_transport_policy)
    values
      ('care_pack_received_easy', 'alimtalk', '부모님 걱정이 케어팩으로 접수됐어요', '기능을 직접 고르지 않아도 됩니다. 운영실이 걱정을 해결 플랜으로 정리하겠습니다.', false),
      ('meal_delivery_plan_ready', 'alimtalk', '안심밥상 연결 플랜이 준비됐어요', '식사 확인, 정기배송 후보, 공공/후원 연결 가능 여부를 간단히 확인해 주세요.', false),
      ('family_simple_action_due', 'alimtalk', '가족이 확인할 일이 있어요', '복잡한 설명 대신 버튼 하나로 확인할 수 있는 가족 할 일을 정리했습니다.', false),
      ('not_sure_consult_ready', 'alimtalk', '1분 해결 플랜이 준비됐어요', '부모님 걱정을 병원·식사·약·서류·퇴원 후 케어 중 필요한 단계로 정리했습니다.', false)
    on conflict (code) do nothing;
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 14) 감사 로그
-- -----------------------------------------------------------------------------
insert into public.audit_logs (entity_type, action, metadata)
values (
  'migration',
  '008_parent_care_platform_differentiation',
  '{"message":"Added care packs, easy-mode settings for 40+ guardians, meal delivery subscriptions, simple family actions, social support links, and auto-linking from worry requests to care packs."}'::jsonb
)
on conflict do nothing;
