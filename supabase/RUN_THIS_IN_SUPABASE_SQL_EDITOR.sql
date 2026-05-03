-- ============================================================
-- 001_initial_schema.sql
-- ============================================================

-- 부모님 안심동행 케어 MVP schema
-- Supabase SQL Editor에서 실행하세요.
-- 민감정보/의료정보가 포함될 수 있으므로 RLS, 감사로그, 동의 테이블을 초기부터 포함합니다.

create extension if not exists pgcrypto;

-- 1) Enums --------------------------------------------------------------------
do $$ begin
  create type public.app_role as enum ('child', 'parent', 'manager', 'ops', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.appointment_status as enum (
    'draft',
    'requested',
    'manager_assigned',
    'consent_pending',
    'confirmed',
    'in_progress',
    'completed',
    'reported',
    'reviewed',
    'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.timeline_status as enum (
    'scheduled',
    'arrived',
    'picked_up',
    'checked_in',
    'doctor_consult',
    'pharmacy',
    'completed',
    'exception'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.risk_severity as enum ('low', 'medium', 'high', 'critical');
exception when duplicate_object then null; end $$;

-- 2) Common helpers -----------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 3) Identity / family --------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'child',
  display_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.email),
    case
      when new.raw_user_meta_data ->> 'role' in ('child', 'parent', 'manager', 'ops', 'admin')
        then (new.raw_user_meta_data ->> 'role')::public.app_role
      else 'child'::public.app_role
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  family_code text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 8)),
  name text not null default '우리 가족',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.family_members (
  family_id uuid not null references public.families(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  relationship text not null default 'guardian',
  can_manage_appointments boolean not null default true,
  can_view_reports boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (family_id, profile_id)
);

create table if not exists public.elders (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  name text not null,
  birth_year integer,
  phone text,
  address_alias text,
  emergency_contact_name text,
  emergency_contact_phone text,
  share_scopes text[] not null default array['schedule', 'progress', 'report_summary'],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4) Manager trust / screening ------------------------------------------------
create table if not exists public.managers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  approval_status text not null default 'pending' check (approval_status in ('pending', 'approved', 'rejected', 'suspended')),
  has_vehicle boolean not null default false,
  vehicle_note text,
  -- 핵심 정책: 차량 보유와 직접 운송 가능은 별개입니다.
  direct_transport_allowed boolean not null default false,
  direct_transport_policy_note text not null default '기본 서비스에서는 매니저 개인차량 유상운송을 제공하지 않음',
  career_summary text,
  certification_summary text,
  region_codes text[] not null default '{}',
  hospital_specialties text[] not null default '{}',
  trust_score numeric(5,2) not null default 70 check (trust_score >= 0 and trust_score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.manager_credentials (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references public.managers(id) on delete cascade,
  credential_type text not null,
  title text not null,
  storage_path text,
  verified_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- 5) Hospitals / transport policy --------------------------------------------
create table if not exists public.hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  region_code text,
  average_duration_minutes integer,
  specialty_tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transport_policies (
  code text primary key,
  label text not null,
  description text not null,
  manager_paid_transport_allowed boolean not null default false,
  requires_partner boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.transport_policies (code, label, description, manager_paid_transport_allowed, requires_partner)
values
  ('hospital_front_meet', '병원 앞 만남', '병원 입구 또는 접수처 앞에서 매니저와 만납니다.', false, false),
  ('home_front_meet_taxi', '집 앞 만남 후 택시 동행', '집 앞에서 만나 택시/대중교통으로 함께 이동합니다.', false, false),
  ('mobility_partner', '이동지원 제휴 연결', '허가된 이동지원/택시/콜 서비스 등 제휴 수단을 연결합니다.', false, true),
  ('manager_vehicle_info_only', '매니저 차량 보유 정보 표시', '매니저가 차량을 보유했다는 신뢰정보이며 직접 운송 가능을 뜻하지 않습니다.', false, false),
  ('direct_transport_partner', '직접 운송 제휴 서비스', '운송 자격/계약/보험이 확인된 별도 제휴 서비스에서만 사용합니다.', false, true)
on conflict (code) do nothing;

-- 6) Appointment flow ---------------------------------------------------------
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  elder_id uuid not null references public.elders(id) on delete cascade,
  hospital_id uuid references public.hospitals(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  title text not null,
  appointment_at timestamptz not null,
  meet_at timestamptz,
  meet_place text,
  pickup_method text not null references public.transport_policies(code),
  pickup_note text,
  meeting_code text not null default lpad((floor(random() * 10000))::int::text, 4, '0'),
  estimated_duration_minutes integer,
  status public.appointment_status not null default 'requested',
  cancelled_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.appointment_assignments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  manager_id uuid not null references public.managers(id) on delete restrict,
  assigned_by uuid references public.profiles(id) on delete set null,
  status text not null default 'assigned' check (status in ('assigned', 'accepted', 'declined', 'cancelled', 'completed')),
  assigned_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (appointment_id, manager_id)
);

create table if not exists public.appointment_questions (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  question text not null,
  answer text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  step_order integer not null default 0,
  status public.timeline_status not null,
  label text not null,
  description text,
  occurred_at timestamptz not null default now(),
  visible_to_family boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null unique references public.appointments(id) on delete cascade,
  manager_id uuid not null references public.managers(id) on delete restrict,
  visit_summary text,
  tests_and_results text,
  medication_note text,
  next_appointment_at timestamptz,
  parent_condition text,
  guardian_next_actions text,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  manager_id uuid not null references public.managers(id) on delete restrict,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  kindness_rating integer check (kindness_rating between 1 and 5),
  punctuality_rating integer check (punctuality_rating between 1 and 5),
  communication_rating integer check (communication_rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (appointment_id, reviewer_id)
);

create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  elder_id uuid not null references public.elders(id) on delete cascade,
  consent_type text not null check (consent_type in ('companion_service', 'information_sharing', 'report_sharing', 'payment_terms')),
  signed_by_profile uuid references public.profiles(id) on delete set null,
  signed_name text,
  share_scopes text[] not null default '{}',
  ip_address inet,
  user_agent text,
  signed_at timestamptz not null default now()
);

-- 7) Ops / safety -------------------------------------------------------------
create table if not exists public.risk_flags (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments(id) on delete cascade,
  manager_id uuid references public.managers(id) on delete cascade,
  severity public.risk_severity not null default 'low',
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  code text not null,
  title text not null,
  description text,
  created_by uuid references public.profiles(id) on delete set null,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- 8) Triggers -----------------------------------------------------------------
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'families', 'elders', 'managers', 'hospitals', 'appointments',
    'appointment_questions', 'reports', 'risk_flags'
  ] loop
    execute format('drop trigger if exists %I on public.%I', 'set_' || table_name || '_updated_at', table_name);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', 'set_' || table_name || '_updated_at', table_name);
  end loop;
end $$;

-- 9) RLS helper functions -----------------------------------------------------
create or replace function public.has_any_role(roles public.app_role[])
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = any(roles)
  );
$$;

create or replace function public.is_ops()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.has_any_role(array['ops', 'admin']::public.app_role[]);
$$;

create or replace function public.is_family_member(target_family_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.family_members fm
    where fm.family_id = target_family_id
      and fm.profile_id = auth.uid()
  );
$$;

create or replace function public.is_assigned_manager(target_appointment_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.appointment_assignments aa
    join public.managers m on m.id = aa.manager_id
    where aa.appointment_id = target_appointment_id
      and aa.status in ('assigned', 'accepted', 'completed')
      and m.profile_id = auth.uid()
  );
$$;

create or replace function public.can_access_appointment(target_appointment_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.appointments a
    where a.id = target_appointment_id
      and (
        public.is_ops()
        or public.is_family_member(a.family_id)
        or public.is_assigned_manager(a.id)
      )
  );
$$;

-- 10) Enable RLS --------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.elders enable row level security;
alter table public.managers enable row level security;
alter table public.manager_credentials enable row level security;
alter table public.hospitals enable row level security;
alter table public.transport_policies enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_assignments enable row level security;
alter table public.appointment_questions enable row level security;
alter table public.timeline_events enable row level security;
alter table public.reports enable row level security;
alter table public.reviews enable row level security;
alter table public.consents enable row level security;
alter table public.risk_flags enable row level security;
alter table public.audit_logs enable row level security;

-- 11) Policies ----------------------------------------------------------------
drop policy if exists profiles_select_policy on public.profiles;
create policy profiles_select_policy on public.profiles
for select using (id = auth.uid() or public.is_ops());

drop policy if exists profiles_insert_policy on public.profiles;
create policy profiles_insert_policy on public.profiles
for insert with check (id = auth.uid() or public.is_ops());

drop policy if exists profiles_update_policy on public.profiles;
create policy profiles_update_policy on public.profiles
for update using (id = auth.uid() or public.is_ops()) with check (id = auth.uid() or public.is_ops());

drop policy if exists families_select_policy on public.families;
create policy families_select_policy on public.families
for select using (public.is_ops() or public.is_family_member(id));

drop policy if exists families_insert_policy on public.families;
create policy families_insert_policy on public.families
for insert with check (created_by = auth.uid() or public.is_ops());

drop policy if exists families_update_policy on public.families;
create policy families_update_policy on public.families
for update using (public.is_ops() or public.is_family_member(id));

drop policy if exists family_members_select_policy on public.family_members;
create policy family_members_select_policy on public.family_members
for select using (public.is_ops() or profile_id = auth.uid() or public.is_family_member(family_id));

drop policy if exists family_members_insert_policy on public.family_members;
create policy family_members_insert_policy on public.family_members
for insert with check (public.is_ops() or profile_id = auth.uid() or public.is_family_member(family_id));

drop policy if exists elders_all_policy on public.elders;
create policy elders_all_policy on public.elders
for all using (public.is_ops() or public.is_family_member(family_id))
with check (public.is_ops() or public.is_family_member(family_id));

drop policy if exists managers_select_policy on public.managers;
create policy managers_select_policy on public.managers
for select using (public.is_ops() or profile_id = auth.uid() or approval_status = 'approved');

drop policy if exists managers_insert_policy on public.managers;
create policy managers_insert_policy on public.managers
for insert with check (public.is_ops() or profile_id = auth.uid());

drop policy if exists managers_update_policy on public.managers;
create policy managers_update_policy on public.managers
for update using (public.is_ops() or profile_id = auth.uid())
with check (public.is_ops() or profile_id = auth.uid());

drop policy if exists manager_credentials_policy on public.manager_credentials;
create policy manager_credentials_policy on public.manager_credentials
for all using (
  public.is_ops()
  or exists (select 1 from public.managers m where m.id = manager_id and m.profile_id = auth.uid())
)
with check (
  public.is_ops()
  or exists (select 1 from public.managers m where m.id = manager_id and m.profile_id = auth.uid())
);

drop policy if exists hospitals_select_policy on public.hospitals;
create policy hospitals_select_policy on public.hospitals
for select using (true);

drop policy if exists hospitals_write_policy on public.hospitals;
create policy hospitals_write_policy on public.hospitals
for all using (public.is_ops()) with check (public.is_ops());

drop policy if exists transport_policies_select_policy on public.transport_policies;
create policy transport_policies_select_policy on public.transport_policies
for select using (is_active = true or public.is_ops());

drop policy if exists transport_policies_write_policy on public.transport_policies;
create policy transport_policies_write_policy on public.transport_policies
for all using (public.is_ops()) with check (public.is_ops());

drop policy if exists appointments_select_policy on public.appointments;
create policy appointments_select_policy on public.appointments
for select using (
  public.is_ops() or public.is_family_member(family_id) or public.is_assigned_manager(id)
);

drop policy if exists appointments_insert_policy on public.appointments;
create policy appointments_insert_policy on public.appointments
for insert with check (
  public.is_ops() or (created_by = auth.uid() and public.is_family_member(family_id))
);

drop policy if exists appointments_update_policy on public.appointments;
create policy appointments_update_policy on public.appointments
for update using (
  public.is_ops() or public.is_family_member(family_id) or public.is_assigned_manager(id)
)
with check (
  public.is_ops() or public.is_family_member(family_id) or public.is_assigned_manager(id)
);

drop policy if exists appointment_assignments_select_policy on public.appointment_assignments;
create policy appointment_assignments_select_policy on public.appointment_assignments
for select using (public.can_access_appointment(appointment_id));

drop policy if exists appointment_assignments_write_policy on public.appointment_assignments;
create policy appointment_assignments_write_policy on public.appointment_assignments
for all using (public.is_ops()) with check (public.is_ops());

drop policy if exists appointment_questions_policy on public.appointment_questions;
create policy appointment_questions_policy on public.appointment_questions
for all using (public.can_access_appointment(appointment_id))
with check (public.can_access_appointment(appointment_id));

drop policy if exists timeline_events_select_policy on public.timeline_events;
create policy timeline_events_select_policy on public.timeline_events
for select using (
  public.is_ops()
  or public.is_assigned_manager(appointment_id)
  or (visible_to_family = true and public.can_access_appointment(appointment_id))
);

drop policy if exists timeline_events_insert_policy on public.timeline_events;
create policy timeline_events_insert_policy on public.timeline_events
for insert with check (public.is_ops() or public.is_assigned_manager(appointment_id));

drop policy if exists reports_select_policy on public.reports;
create policy reports_select_policy on public.reports
for select using (public.can_access_appointment(appointment_id));

drop policy if exists reports_write_policy on public.reports;
create policy reports_write_policy on public.reports
for all using (public.is_ops() or public.is_assigned_manager(appointment_id))
with check (public.is_ops() or public.is_assigned_manager(appointment_id));

drop policy if exists reviews_select_policy on public.reviews;
create policy reviews_select_policy on public.reviews
for select using (public.can_access_appointment(appointment_id) or public.is_ops());

drop policy if exists reviews_insert_policy on public.reviews;
create policy reviews_insert_policy on public.reviews
for insert with check (
  reviewer_id = auth.uid()
  and exists (
    select 1 from public.appointments a
    where a.id = appointment_id
      and public.is_family_member(a.family_id)
  )
);

drop policy if exists consents_policy on public.consents;
create policy consents_policy on public.consents
for all using (public.can_access_appointment(appointment_id))
with check (public.can_access_appointment(appointment_id));

drop policy if exists risk_flags_select_policy on public.risk_flags;
create policy risk_flags_select_policy on public.risk_flags
for select using (
  public.is_ops()
  or (appointment_id is not null and public.is_assigned_manager(appointment_id))
);

drop policy if exists risk_flags_write_policy on public.risk_flags;
create policy risk_flags_write_policy on public.risk_flags
for all using (public.is_ops()) with check (public.is_ops());

drop policy if exists audit_logs_select_policy on public.audit_logs;
create policy audit_logs_select_policy on public.audit_logs
for select using (public.is_ops());

drop policy if exists audit_logs_insert_policy on public.audit_logs;
create policy audit_logs_insert_policy on public.audit_logs
for insert with check (actor_id = auth.uid() or public.is_ops());

-- 12) Optional private bucket for documents ----------------------------------
insert into storage.buckets (id, name, public)
values ('manager-documents', 'manager-documents', false)
on conflict (id) do nothing;

-- ============================================================
-- 002_product_expansion.sql
-- ============================================================

-- 부모님 안심동행 케어 확장 schema
-- 보호자, 부모님, 동행매니저, 운영실 모두에게 필요한 기능을 담기 위한 2차 마이그레이션입니다.

-- 1) Additional enums ---------------------------------------------------------
do $$ begin
  create type public.task_status as enum ('todo', 'in_progress', 'done', 'skipped');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.notification_channel as enum ('app', 'sms', 'alimtalk', 'email');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.emergency_status as enum ('open', 'acknowledged', 'resolved', 'false_alarm');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum ('draft', 'authorized', 'paid', 'cancelled', 'refunded', 'failed');
exception when duplicate_object then null; end $$;

-- 2) Parent / patient comfort -------------------------------------------------
create table if not exists public.elder_care_profiles (
  elder_id uuid primary key references public.elders(id) on delete cascade,
  mobility_level text not null default 'unknown' check (mobility_level in ('unknown', 'independent', 'slow_walk', 'cane', 'wheelchair', 'needs_assist')),
  communication_preference text,
  hearing_note text,
  vision_note text,
  cognitive_note text,
  medication_caution text,
  allergy_note text,
  fall_risk boolean not null default false,
  preferred_call_name text,
  comfort_items text[] not null default '{}',
  important_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3) Guardian next actions ----------------------------------------------------
create table if not exists public.guardian_tasks (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  assigned_to uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  due_at timestamptz,
  status public.task_status not null default 'todo',
  source text not null default 'manual' check (source in ('manual', 'report', 'system', 'ops')),
  created_by uuid references public.profiles(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4) Communication / notification --------------------------------------------
create table if not exists public.appointment_messages (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  message text not null,
  is_internal boolean not null default false,
  visible_to_family boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments(id) on delete cascade,
  recipient_id uuid references public.profiles(id) on delete cascade,
  channel public.notification_channel not null default 'app',
  template_code text,
  title text not null,
  body text,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'cancelled')),
  provider_message_id text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- 5) Safety / emergency / location sharing -----------------------------------
create table if not exists public.emergency_events (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments(id) on delete cascade,
  elder_id uuid references public.elders(id) on delete set null,
  triggered_by uuid references public.profiles(id) on delete set null,
  status public.emergency_status not null default 'open',
  event_type text not null default 'help_requested',
  note text,
  location jsonb not null default '{}',
  acknowledged_by uuid references public.profiles(id) on delete set null,
  acknowledged_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.location_share_sessions (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  consent_id uuid references public.consents(id) on delete set null,
  subject_profile_id uuid references public.profiles(id) on delete set null,
  visible_to_family boolean not null default true,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  last_location jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6) Report files / receipts --------------------------------------------------
create table if not exists public.report_attachments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  report_id uuid references public.reports(id) on delete cascade,
  uploaded_by uuid references public.profiles(id) on delete set null,
  attachment_type text not null check (attachment_type in ('receipt', 'prescription', 'test_result', 'photo', 'document', 'other')),
  storage_path text not null,
  visible_to_family boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  payer_id uuid references public.profiles(id) on delete set null,
  status public.payment_status not null default 'draft',
  amount_krw integer not null check (amount_krw >= 0),
  base_service_amount_krw integer not null default 0 check (base_service_amount_krw >= 0),
  out_of_pocket_amount_krw integer not null default 0 check (out_of_pocket_amount_krw >= 0),
  -- 차량 정책: 매니저 개인차량 유상운송비를 기본 청구 항목으로 만들지 않습니다.
  manager_vehicle_transport_amount_krw integer not null default 0 check (manager_vehicle_transport_amount_krw = 0),
  provider text,
  provider_order_id text,
  receipt_url text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 7) Checklist templates ------------------------------------------------------
create table if not exists public.checklist_templates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text,
  applies_to text not null default 'appointment',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.checklist_templates(id) on delete cascade,
  sort_order integer not null default 0,
  title text not null,
  help_text text,
  is_required boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.appointment_checklist_items (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  checklist_item_id uuid references public.checklist_items(id) on delete set null,
  title text not null,
  is_required boolean not null default true,
  completed_by uuid references public.profiles(id) on delete set null,
  completed_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 8) Manager operations -------------------------------------------------------
create table if not exists public.manager_availability (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references public.managers(id) on delete cascade,
  available_date date not null,
  starts_at time not null,
  ends_at time not null,
  region_codes text[] not null default '{}',
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (manager_id, available_date, starts_at, ends_at)
);

-- 9) Seed templates -----------------------------------------------------------
insert into public.checklist_templates (code, title, description)
values
  ('default_hospital_companion', '기본 병원동행 체크리스트', '만남부터 귀가까지 매니저가 확인해야 할 기본 항목'),
  ('report_quality', '리포트 품질 체크리스트', '보호자가 바로 이해할 수 있는 리포트 작성 기준')
on conflict (code) do nothing;

insert into public.checklist_items (template_id, sort_order, title, help_text, is_required)
select t.id, v.sort_order, v.title, v.help_text, v.is_required
from public.checklist_templates t
join (values
  ('default_hospital_companion', 10, '만남 암호와 신원 확인', '부모님이 안심할 수 있도록 이름, 사진, 암호를 확인합니다.', true),
  ('default_hospital_companion', 20, '동행 동의 확인', '동행과 정보공유 범위를 확인합니다.', true),
  ('default_hospital_companion', 30, '이동 방식 확인', '택시 동행/병원 앞 만남/제휴 이동지원을 구분합니다.', true),
  ('default_hospital_companion', 40, '의사 질문 확인', '보호자가 등록한 질문을 진료 전 다시 확인합니다.', true),
  ('default_hospital_companion', 50, '약/검사/다음 예약 메모', '보호자 리포트에 들어갈 핵심 정보를 기록합니다.', true),
  ('report_quality', 10, '진료 내용 요약', '보호자가 이해하기 쉬운 문장으로 요약합니다.', true),
  ('report_quality', 20, '다음 액션 분리', '보호자가 해야 할 일을 별도 항목으로 작성합니다.', true),
  ('report_quality', 30, '부모님 컨디션 기록', '피로, 통증, 식사, 보행 상태를 기록합니다.', false)
) as v(template_code, sort_order, title, help_text, is_required) on v.template_code = t.code
where not exists (
  select 1 from public.checklist_items ci
  where ci.template_id = t.id and ci.title = v.title
);

-- 10) Triggers ----------------------------------------------------------------
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'elder_care_profiles', 'guardian_tasks', 'emergency_events', 'location_share_sessions',
    'payment_orders', 'checklist_templates', 'appointment_checklist_items', 'manager_availability'
  ] loop
    execute format('drop trigger if exists %I on public.%I', 'set_' || table_name || '_updated_at', table_name);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', 'set_' || table_name || '_updated_at', table_name);
  end loop;
end $$;

-- 11) RLS ---------------------------------------------------------------------
alter table public.elder_care_profiles enable row level security;
alter table public.guardian_tasks enable row level security;
alter table public.appointment_messages enable row level security;
alter table public.notification_events enable row level security;
alter table public.emergency_events enable row level security;
alter table public.location_share_sessions enable row level security;
alter table public.report_attachments enable row level security;
alter table public.payment_orders enable row level security;
alter table public.checklist_templates enable row level security;
alter table public.checklist_items enable row level security;
alter table public.appointment_checklist_items enable row level security;
alter table public.manager_availability enable row level security;

-- Elder care profile is visible to family, assigned manager through appointment context, and ops.
drop policy if exists elder_care_profiles_policy on public.elder_care_profiles;
create policy elder_care_profiles_policy on public.elder_care_profiles
for all using (
  public.is_ops()
  or exists (
    select 1 from public.elders e
    where e.id = elder_id and public.is_family_member(e.family_id)
  )
  or exists (
    select 1 from public.appointments a
    where a.elder_id = elder_care_profiles.elder_id and public.is_assigned_manager(a.id)
  )
)
with check (
  public.is_ops()
  or exists (
    select 1 from public.elders e
    where e.id = elder_id and public.is_family_member(e.family_id)
  )
);

drop policy if exists guardian_tasks_policy on public.guardian_tasks;
create policy guardian_tasks_policy on public.guardian_tasks
for all using (public.can_access_appointment(appointment_id))
with check (public.can_access_appointment(appointment_id));

drop policy if exists appointment_messages_select_policy on public.appointment_messages;
create policy appointment_messages_select_policy on public.appointment_messages
for select using (
  public.is_ops()
  or public.is_assigned_manager(appointment_id)
  or (visible_to_family = true and public.can_access_appointment(appointment_id))
);

drop policy if exists appointment_messages_insert_policy on public.appointment_messages;
create policy appointment_messages_insert_policy on public.appointment_messages
for insert with check (public.can_access_appointment(appointment_id));

drop policy if exists notification_events_policy on public.notification_events;
create policy notification_events_policy on public.notification_events
for select using (public.is_ops() or recipient_id = auth.uid());

drop policy if exists notification_events_insert_policy on public.notification_events;
create policy notification_events_insert_policy on public.notification_events
for insert with check (public.is_ops() or recipient_id = auth.uid());

drop policy if exists emergency_events_policy on public.emergency_events;
create policy emergency_events_policy on public.emergency_events
for all using (
  public.is_ops()
  or triggered_by = auth.uid()
  or (appointment_id is not null and public.can_access_appointment(appointment_id))
)
with check (
  public.is_ops()
  or triggered_by = auth.uid()
  or (appointment_id is not null and public.can_access_appointment(appointment_id))
);

drop policy if exists location_share_sessions_policy on public.location_share_sessions;
create policy location_share_sessions_policy on public.location_share_sessions
for all using (public.can_access_appointment(appointment_id))
with check (public.can_access_appointment(appointment_id));

drop policy if exists report_attachments_policy on public.report_attachments;
create policy report_attachments_policy on public.report_attachments
for all using (public.can_access_appointment(appointment_id))
with check (public.can_access_appointment(appointment_id));

drop policy if exists payment_orders_select_policy on public.payment_orders;
create policy payment_orders_select_policy on public.payment_orders
for select using (
  public.is_ops()
  or exists (
    select 1 from public.appointments a
    where a.id = appointment_id and public.is_family_member(a.family_id)
  )
);

drop policy if exists payment_orders_write_policy on public.payment_orders;
create policy payment_orders_write_policy on public.payment_orders
for all using (public.is_ops()) with check (public.is_ops());

drop policy if exists checklist_templates_select_policy on public.checklist_templates;
create policy checklist_templates_select_policy on public.checklist_templates
for select using (is_active = true or public.is_ops());

drop policy if exists checklist_templates_write_policy on public.checklist_templates;
create policy checklist_templates_write_policy on public.checklist_templates
for all using (public.is_ops()) with check (public.is_ops());

drop policy if exists checklist_items_select_policy on public.checklist_items;
create policy checklist_items_select_policy on public.checklist_items
for select using (
  exists (select 1 from public.checklist_templates t where t.id = template_id and (t.is_active = true or public.is_ops()))
);

drop policy if exists checklist_items_write_policy on public.checklist_items;
create policy checklist_items_write_policy on public.checklist_items
for all using (public.is_ops()) with check (public.is_ops());

drop policy if exists appointment_checklist_items_policy on public.appointment_checklist_items;
create policy appointment_checklist_items_policy on public.appointment_checklist_items
for all using (public.can_access_appointment(appointment_id))
with check (public.can_access_appointment(appointment_id));

drop policy if exists manager_availability_policy on public.manager_availability;
create policy manager_availability_policy on public.manager_availability
for all using (
  public.is_ops()
  or exists (select 1 from public.managers m where m.id = manager_id and m.profile_id = auth.uid())
)
with check (
  public.is_ops()
  or exists (select 1 from public.managers m where m.id = manager_id and m.profile_id = auth.uid())
);

-- 12) Additional private bucket for report attachments ------------------------
insert into storage.buckets (id, name, public)
values ('report-attachments', 'report-attachments', false)
on conflict (id) do nothing;

-- ============================================================
-- 003_unified_mvp_hardening.sql
-- ============================================================

-- 003_unified_mvp_hardening.sql
-- 첫 번째 MVP의 세부 항목과 두 번째 확장 설계를 합친 보강 migration입니다.
-- 핵심: 가족 공동조회 코드, 평가 4대 항목, 차량/직접운송 분리, 운영 리스크 로그를 더 명확히 합니다.

-- 1) 가족 공동조회 초대 코드 ---------------------------------------------------
create table if not exists public.family_invite_codes (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  code text not null unique,
  created_by uuid references public.profiles(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_by uuid references public.profiles(id) on delete set null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.family_invite_codes enable row level security;

drop policy if exists family_invite_codes_policy on public.family_invite_codes;
create policy family_invite_codes_policy on public.family_invite_codes
for all using (public.is_ops() or public.is_family_member(family_id))
with check (public.is_ops() or public.is_family_member(family_id));

-- 2) 평가 항목을 사용자가 요청한 4대 기준으로 명시 ------------------------------
alter table public.reviews add column if not exists safety_rating integer check (safety_rating between 1 and 5);
alter table public.reviews add column if not exists accuracy_rating integer check (accuracy_rating between 1 and 5);
alter table public.reviews add column if not exists punctuality_rating_v2 integer check (punctuality_rating_v2 between 1 and 5);

comment on column public.reviews.safety_rating is '매니저 평가: 안전';
comment on column public.reviews.kindness_rating is '매니저 평가: 친절';
comment on column public.reviews.accuracy_rating is '매니저 평가: 정확성';
comment on column public.reviews.punctuality_rating is '기존 시간준수 평가 컬럼';
comment on column public.reviews.punctuality_rating_v2 is '시간준수 평가 컬럼. 기존 컬럼과 병행 후 v2에서 통합 가능';

-- 3) 안심도 재계산 함수 ---------------------------------------------------------
create or replace function public.recalculate_manager_trust(target_manager_id uuid)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  avg_score numeric;
  risk_penalty numeric;
  completed_bonus numeric;
  next_score numeric;
begin
  select coalesce(avg((
    coalesce(safety_rating, rating)::numeric +
    coalesce(kindness_rating, rating)::numeric +
    coalesce(accuracy_rating, communication_rating, rating)::numeric +
    coalesce(punctuality_rating_v2, punctuality_rating, rating)::numeric
  ) / 4.0), 4.0)
  into avg_score
  from public.reviews
  where manager_id = target_manager_id;

  select least(count(*) * 2, 12)::numeric
  into risk_penalty
  from public.risk_flags
  where manager_id = target_manager_id
    and status in ('open', 'reviewing')
    and severity in ('high', 'critical');

  select least(count(*) * 0.2, 8)::numeric
  into completed_bonus
  from public.appointment_assignments
  where manager_id = target_manager_id and status = 'completed';

  next_score := greatest(0, least(100, (avg_score * 18) + completed_bonus - risk_penalty));

  update public.managers
  set trust_score = next_score,
      updated_at = now()
  where id = target_manager_id;

  return next_score;
end;
$$;

create or replace function public.recalculate_manager_trust_after_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recalculate_manager_trust(new.manager_id);
  return new;
end;
$$;

drop trigger if exists reviews_recalculate_manager_trust on public.reviews;
create trigger reviews_recalculate_manager_trust
after insert or update on public.reviews
for each row execute function public.recalculate_manager_trust_after_review();

-- 4) 차량/운송 정책을 테이블과 정산 항목에 고정 --------------------------------
alter table public.managers add column if not exists vehicle_info_visible boolean not null default true;
alter table public.managers add column if not exists direct_transport_contract_verified boolean not null default false;

comment on column public.managers.has_vehicle is '차량 보유 여부. 직접 운송 가능 여부와 분리';
comment on column public.managers.direct_transport_allowed is '기본 서비스 직접 유상운송 의미가 아님. 별도 제휴/정책 승인 시에만 true';
comment on column public.managers.direct_transport_contract_verified is '별도 운송 제휴 계약/보험/자격 확인 여부';

-- 5) 운영 리스크 처리 기록 ------------------------------------------------------
create table if not exists public.risk_flag_events (
  id uuid primary key default gen_random_uuid(),
  risk_flag_id uuid not null references public.risk_flags(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  note text,
  created_at timestamptz not null default now()
);

alter table public.risk_flag_events enable row level security;

drop policy if exists risk_flag_events_policy on public.risk_flag_events;
create policy risk_flag_events_policy on public.risk_flag_events
for all using (public.is_ops()) with check (public.is_ops());

-- 6) 리포트 필드 보강 -----------------------------------------------------------
alter table public.reports add column if not exists doctor_instructions text;
alter table public.reports add column if not exists cost_note text;
alter table public.reports add column if not exists ops_review_status text not null default 'draft' check (ops_review_status in ('draft', 'submitted', 'reviewing', 'approved', 'sent', 'revision_requested'));
alter table public.reports add column if not exists reviewed_by uuid references public.profiles(id) on delete set null;
alter table public.reports add column if not exists reviewed_at timestamptz;
alter table public.reports add column if not exists sent_at timestamptz;

-- 7) 기본 정책 로그 -------------------------------------------------------------
insert into public.audit_logs (entity_type, action, metadata)
values (
  'migration',
  '003_unified_mvp_hardening',
  '{"message":"Merged MVP detail routes, care-room expansion, vehicle policy separation, four-dimension manager rating."}'::jsonb
)
on conflict do nothing;

-- ============================================================
-- 004_150_point_product_hardening.sql
-- ============================================================

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

-- ============================================================
-- 005_safety_handoff_sla.sql
-- ============================================================

-- 005_safety_handoff_sla.sql
-- 실제 현장 운영에서 빠지면 위험한 안전 레이어만 추가합니다.
-- 핵심: 만남 암호 검증, 필수 체크포인트 SLA, 지연 자동 플래그, 안전 종료 확인.

-- 1) Safety handoff / checkpoint tables ---------------------------------------
create table if not exists public.appointment_handoff_verifications (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  manager_id uuid references public.managers(id) on delete set null,
  verified_by uuid references public.profiles(id) on delete set null,
  actor_role text not null default 'unknown' check (actor_role in ('family', 'parent', 'manager', 'ops', 'unknown')),
  verification_method text not null default 'meeting_code' check (verification_method in ('meeting_code', 'ops_override')),
  status text not null check (status in ('success', 'failed', 'overridden')),
  code_fingerprint text,
  location_label text,
  verification_note text,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.appointment_safety_checkpoints (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  code text not null check (code in (
    'pre_call',
    'handoff_code',
    'departure_confirmed',
    'hospital_checkin',
    'doctor_consult_update',
    'pharmacy_payment',
    'safe_return_close'
  )),
  label text not null,
  description text,
  expected_at timestamptz not null,
  due_grace_minutes integer not null default 10 check (due_grace_minutes between 0 and 240),
  required_by_role text not null default 'manager' check (required_by_role in ('manager', 'parent', 'ops', 'system')),
  status text not null default 'pending' check (status in ('pending', 'completed', 'missed', 'skipped', 'escalated')),
  completed_at timestamptz,
  completed_by uuid references public.profiles(id) on delete set null,
  visible_to_family boolean not null default true,
  escalation_owner text not null default '운영실',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (appointment_id, code)
);

create table if not exists public.safety_escalations (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  checkpoint_id uuid references public.appointment_safety_checkpoints(id) on delete set null,
  manager_id uuid references public.managers(id) on delete set null,
  severity public.risk_severity not null default 'medium',
  reason_code text not null,
  status text not null default 'open' check (status in ('open', 'acknowledged', 'backup_dispatched', 'resolved', 'false_alarm')),
  owner_id uuid references public.profiles(id) on delete set null,
  backup_manager_id uuid references public.managers(id) on delete set null,
  trigger_snapshot jsonb not null default '{}',
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) RLS ----------------------------------------------------------------------
alter table public.appointment_handoff_verifications enable row level security;
alter table public.appointment_safety_checkpoints enable row level security;
alter table public.safety_escalations enable row level security;

drop policy if exists appointment_handoff_verifications_policy on public.appointment_handoff_verifications;
create policy appointment_handoff_verifications_policy on public.appointment_handoff_verifications
for all using (public.can_access_appointment(appointment_id))
with check (public.can_access_appointment(appointment_id));

drop policy if exists appointment_safety_checkpoints_policy on public.appointment_safety_checkpoints;
create policy appointment_safety_checkpoints_policy on public.appointment_safety_checkpoints
for all using (public.can_access_appointment(appointment_id))
with check (public.can_access_appointment(appointment_id));

drop policy if exists safety_escalations_select_policy on public.safety_escalations;
create policy safety_escalations_select_policy on public.safety_escalations
for select using (public.can_access_appointment(appointment_id));

drop policy if exists safety_escalations_write_policy on public.safety_escalations;
create policy safety_escalations_write_policy on public.safety_escalations
for all using (public.is_ops()) with check (public.is_ops());

-- 3) Default safety checkpoint creation ---------------------------------------
create or replace function public.create_safety_checkpoints_for_appointment(target_appointment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.appointments%rowtype;
  base_meet_at timestamptz;
begin
  select * into target
  from public.appointments
  where id = target_appointment_id;

  if not found then
    return;
  end if;

  base_meet_at := coalesce(target.meet_at, target.appointment_at - interval '90 minutes');

  insert into public.appointment_safety_checkpoints (
    appointment_id,
    code,
    label,
    description,
    expected_at,
    due_grace_minutes,
    required_by_role,
    visible_to_family,
    escalation_owner,
    metadata
  )
  values
    (target.id, 'pre_call', '도착 전 연락', '매니저가 부모님 또는 보호자에게 도착 전 전화를 하고 만남 장소를 재확인합니다.', base_meet_at - interval '30 minutes', 10, 'manager', true, '상담 운영자', jsonb_build_object('sla_group', 'handoff')),
    (target.id, 'handoff_code', '만남 암호 상호확인', '부모님과 매니저가 이름·얼굴·암호를 함께 확인해야 실제 만남으로 인정됩니다.', base_meet_at, 10, 'manager', true, '운영실 책임자', jsonb_build_object('sla_group', 'handoff')),
    (target.id, 'departure_confirmed', '이동 시작 확인', '택시 동행 또는 제휴 이동지원 출발 여부를 보호자 타임라인에 남깁니다.', base_meet_at + interval '15 minutes', 10, 'manager', true, '상담 운영자', jsonb_build_object('sla_group', 'transport')),
    (target.id, 'hospital_checkin', '병원 접수 확인', '접수 완료, 대기번호, 예상 대기시간을 자녀가 볼 수 있게 기록합니다.', target.appointment_at - interval '15 minutes', 15, 'manager', true, '현장 운영자', jsonb_build_object('sla_group', 'hospital')),
    (target.id, 'doctor_consult_update', '진료 진행 확인', '보호자 질문 리스트와 의료진 안내사항 기록이 시작됐는지 확인합니다.', target.appointment_at + interval '35 minutes', 25, 'manager', true, '리포트 검수자', jsonb_build_object('sla_group', 'hospital')),
    (target.id, 'pharmacy_payment', '수납·약국 확인', '비용, 약, 다음 예약, 영수증 여부를 빠짐없이 정리합니다.', target.appointment_at + interval '120 minutes', 30, 'manager', true, '리포트 검수자', jsonb_build_object('sla_group', 'closing')),
    (target.id, 'safe_return_close', '안전 종료 확인', '부모님이 안전하게 귀가했거나 보호자에게 인계됐는지 확인해야 일정이 닫힙니다.', target.appointment_at + interval '210 minutes', 30, 'parent', true, '운영실 책임자', jsonb_build_object('sla_group', 'closing'))
  on conflict (appointment_id, code) do nothing;
end;
$$;

create or replace function public.create_default_safety_checkpoints()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.create_safety_checkpoints_for_appointment(new.id);
  return new;
end;
$$;

drop trigger if exists appointments_create_default_safety_checkpoints on public.appointments;
create trigger appointments_create_default_safety_checkpoints
after insert on public.appointments
for each row execute function public.create_default_safety_checkpoints();

-- 4) Meeting-code verification RPC -------------------------------------------
create or replace function public.verify_appointment_handoff(
  target_appointment_id uuid,
  entered_code text,
  location_label text default null,
  verification_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.appointments%rowtype;
  actor_manager_id uuid;
  assignment_manager_id uuid;
  actor_role text := 'unknown';
  is_valid boolean;
  failed_count integer;
  handoff_checkpoint_id uuid;
begin
  select * into target
  from public.appointments
  where id = target_appointment_id;

  if not found then
    raise exception 'appointment not found';
  end if;

  if not (public.is_ops() or public.is_family_member(target.family_id) or public.is_assigned_manager(target.id)) then
    raise exception 'not allowed';
  end if;

  perform public.create_safety_checkpoints_for_appointment(target.id);

  select m.id into actor_manager_id
  from public.managers m
  where m.profile_id = auth.uid()
  limit 1;

  select aa.manager_id into assignment_manager_id
  from public.appointment_assignments aa
  where aa.appointment_id = target.id
    and aa.status in ('assigned', 'accepted')
  order by aa.assigned_at desc
  limit 1;

  if public.is_ops() then
    actor_role := 'ops';
  elsif actor_manager_id is not null then
    actor_role := 'manager';
  elsif public.is_family_member(target.family_id) then
    actor_role := 'family';
  end if;

  is_valid := trim(coalesce(entered_code, '')) = target.meeting_code;

  insert into public.appointment_handoff_verifications (
    appointment_id,
    manager_id,
    verified_by,
    actor_role,
    verification_method,
    status,
    code_fingerprint,
    location_label,
    verification_note,
    verified_at
  )
  values (
    target.id,
    coalesce(actor_manager_id, assignment_manager_id),
    auth.uid(),
    actor_role,
    'meeting_code',
    case when is_valid then 'success' else 'failed' end,
    encode(digest(coalesce(entered_code, '') || ':' || target.id::text, 'sha256'), 'hex'),
    location_label,
    verification_note,
    case when is_valid then now() else null end
  );

  if is_valid then
    update public.appointment_safety_checkpoints
    set status = 'completed',
        completed_at = now(),
        completed_by = auth.uid(),
        metadata = metadata || jsonb_build_object('verified_by_role', actor_role),
        updated_at = now()
    where appointment_id = target.id
      and code = 'handoff_code';

    insert into public.timeline_events (appointment_id, step_order, status, label, description, visible_to_family, created_by)
    values (target.id, 30, 'picked_up', '만남 암호 확인 완료', coalesce(verification_note, '부모님과 매니저가 만남 암호를 상호 확인했습니다.'), true, auth.uid());

    update public.appointments
    set status = case
          when status in ('requested', 'manager_assigned', 'confirmed', 'consent_pending') then 'in_progress'::public.appointment_status
          else status
        end,
        updated_at = now()
    where id = target.id;

    insert into public.audit_logs (actor_id, entity_type, entity_id, action, metadata)
    values (auth.uid(), 'appointment', target.id, 'handoff_verified', jsonb_build_object('actor_role', actor_role, 'location_label', location_label));

    return jsonb_build_object('success', true, 'message', '만남 암호가 확인되었습니다. 실제 만남으로 기록했습니다.');
  end if;

  select count(*) into failed_count
  from public.appointment_handoff_verifications
  where appointment_id = target.id
    and status = 'failed'
    and created_at > now() - interval '2 hours';

  select id into handoff_checkpoint_id
  from public.appointment_safety_checkpoints
  where appointment_id = target.id and code = 'handoff_code'
  limit 1;

  if failed_count >= 2 then
    insert into public.risk_flags (appointment_id, manager_id, severity, code, title, description, created_by)
    select target.id,
           assignment_manager_id,
           'high'::public.risk_severity,
           'MEETING_CODE_MISMATCH',
           '만남 암호 불일치 반복',
           '만남 암호가 2회 이상 일치하지 않았습니다. 운영실이 부모님, 보호자, 매니저를 즉시 확인해야 합니다.',
           auth.uid()
    where not exists (
      select 1 from public.risk_flags rf
      where rf.appointment_id = target.id
        and rf.code = 'MEETING_CODE_MISMATCH'
        and rf.status in ('open', 'reviewing')
    );

    insert into public.safety_escalations (appointment_id, checkpoint_id, manager_id, severity, reason_code, status, trigger_snapshot)
    values (
      target.id,
      handoff_checkpoint_id,
      assignment_manager_id,
      'high'::public.risk_severity,
      'MEETING_CODE_MISMATCH',
      'open',
      jsonb_build_object('failed_count', failed_count, 'actor_role', actor_role, 'location_label', location_label)
    );
  end if;

  return jsonb_build_object('success', false, 'message', '만남 암호가 맞지 않습니다. 모르는 사람이면 부모님앱 긴급 버튼 또는 자녀 전화로 확인하세요.');
end;
$$;

-- 5) Checkpoint completion RPC -------------------------------------------------
create or replace function public.complete_safety_checkpoint(
  target_appointment_id uuid,
  checkpoint_code text,
  completion_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.appointments%rowtype;
  checkpoint public.appointment_safety_checkpoints%rowtype;
  mapped_timeline_status public.timeline_status := 'scheduled';
  next_step_order integer := 40;
begin
  select * into target
  from public.appointments
  where id = target_appointment_id;

  if not found then
    raise exception 'appointment not found';
  end if;

  if not (public.is_ops() or public.is_family_member(target.family_id) or public.is_assigned_manager(target.id)) then
    raise exception 'not allowed';
  end if;

  perform public.create_safety_checkpoints_for_appointment(target.id);

  select * into checkpoint
  from public.appointment_safety_checkpoints
  where appointment_id = target.id and code = checkpoint_code
  limit 1;

  if not found then
    raise exception 'checkpoint not found';
  end if;

  update public.appointment_safety_checkpoints
  set status = 'completed',
      completed_at = now(),
      completed_by = auth.uid(),
      metadata = metadata || jsonb_build_object('completion_note', completion_note),
      updated_at = now()
  where id = checkpoint.id;

  mapped_timeline_status := case checkpoint_code
    when 'pre_call' then 'arrived'::public.timeline_status
    when 'handoff_code' then 'picked_up'::public.timeline_status
    when 'departure_confirmed' then 'picked_up'::public.timeline_status
    when 'hospital_checkin' then 'checked_in'::public.timeline_status
    when 'doctor_consult_update' then 'doctor_consult'::public.timeline_status
    when 'pharmacy_payment' then 'pharmacy'::public.timeline_status
    when 'safe_return_close' then 'completed'::public.timeline_status
    else 'scheduled'::public.timeline_status
  end;

  next_step_order := case checkpoint_code
    when 'pre_call' then 25
    when 'handoff_code' then 30
    when 'departure_confirmed' then 35
    when 'hospital_checkin' then 40
    when 'doctor_consult_update' then 50
    when 'pharmacy_payment' then 60
    when 'safe_return_close' then 80
    else 45
  end;

  insert into public.timeline_events (appointment_id, step_order, status, label, description, visible_to_family, created_by)
  values (
    target.id,
    next_step_order,
    mapped_timeline_status,
    checkpoint.label,
    coalesce(completion_note, checkpoint.description),
    checkpoint.visible_to_family,
    auth.uid()
  );

  if checkpoint_code = 'safe_return_close' then
    update public.appointments
    set status = 'completed'::public.appointment_status,
        updated_at = now()
    where id = target.id;
  end if;

  insert into public.audit_logs (actor_id, entity_type, entity_id, action, metadata)
  values (auth.uid(), 'appointment_safety_checkpoint', checkpoint.id, 'completed', jsonb_build_object('code', checkpoint_code, 'appointment_id', target.id));

  return jsonb_build_object('success', true, 'message', checkpoint.label || ' 단계가 완료되었습니다.');
end;
$$;

-- 6) Missed-checkpoint escalation RPC -----------------------------------------
create or replace function public.escalate_missed_safety_checkpoints(reference_now timestamptz default now())
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  checkpoint record;
  processed_count integer := 0;
  assignment_manager_id uuid;
  risk_severity public.risk_severity;
  jwt_claims jsonb := coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb);
begin
  if not (public.is_ops() or jwt_claims ->> 'role' = 'service_role') then
    raise exception 'ops only';
  end if;

  for checkpoint in
    select sc.*, a.title as appointment_title
    from public.appointment_safety_checkpoints sc
    join public.appointments a on a.id = sc.appointment_id
    where sc.status = 'pending'
      and sc.expected_at + ((sc.due_grace_minutes::text || ' minutes')::interval) < reference_now
  loop
    select aa.manager_id into assignment_manager_id
    from public.appointment_assignments aa
    where aa.appointment_id = checkpoint.appointment_id
      and aa.status in ('assigned', 'accepted')
    order by aa.assigned_at desc
    limit 1;

    risk_severity := case
      when checkpoint.code in ('handoff_code', 'safe_return_close') then 'high'::public.risk_severity
      else 'medium'::public.risk_severity
    end;

    update public.appointment_safety_checkpoints
    set status = 'escalated',
        updated_at = now(),
        metadata = metadata || jsonb_build_object('escalated_at', reference_now)
    where id = checkpoint.id;

    insert into public.risk_flags (appointment_id, manager_id, severity, code, title, description, created_by)
    select checkpoint.appointment_id,
           assignment_manager_id,
           risk_severity,
           'MISSED_SAFETY_CHECKPOINT',
           checkpoint.label || ' 업데이트 지연',
           checkpoint.label || ' 단계가 예정 시간과 grace time 안에 완료되지 않았습니다. 운영실 연락 확인과 대체 배정 검토가 필요합니다.',
           auth.uid()
    where not exists (
      select 1 from public.risk_flags rf
      where rf.appointment_id = checkpoint.appointment_id
        and rf.code = 'MISSED_SAFETY_CHECKPOINT'
        and rf.status in ('open', 'reviewing')
    );

    insert into public.safety_escalations (appointment_id, checkpoint_id, manager_id, severity, reason_code, status, trigger_snapshot)
    values (
      checkpoint.appointment_id,
      checkpoint.id,
      assignment_manager_id,
      risk_severity,
      'MISSED_SAFETY_CHECKPOINT',
      'open',
      jsonb_build_object(
        'checkpoint_code', checkpoint.code,
        'label', checkpoint.label,
        'expected_at', checkpoint.expected_at,
        'due_grace_minutes', checkpoint.due_grace_minutes,
        'reference_now', reference_now
      )
    );

    processed_count := processed_count + 1;
  end loop;

  return processed_count;
end;
$$;

-- 7) Ops dashboard view / templates / indexes ---------------------------------
create or replace view public.ops_safety_dashboard as
select
  a.id as appointment_id,
  a.title,
  a.appointment_at,
  a.meet_at,
  a.status as appointment_status,
  count(sc.id) filter (where sc.status = 'pending') as pending_count,
  count(sc.id) filter (where sc.status = 'completed') as completed_count,
  count(sc.id) filter (where sc.status = 'escalated') as escalated_count,
  min(sc.expected_at) filter (where sc.status = 'pending') as next_expected_at,
  coalesce(bool_or(sc.code = 'handoff_code' and sc.status = 'completed'), false) as handoff_verified,
  coalesce(bool_or(sc.code = 'safe_return_close' and sc.status = 'completed'), false) as safe_return_confirmed
from public.appointments a
left join public.appointment_safety_checkpoints sc on sc.appointment_id = a.id
group by a.id;

insert into public.notification_templates (code, channel, title, body, contains_transport_policy)
values
  ('handoff_verified', 'alimtalk', '만남 암호 확인 완료', '부모님과 동행매니저가 만남 암호를 확인했습니다. 이제 현장 동행이 시작됩니다.', false),
  ('safety_checkpoint_missed', 'alimtalk', '안심 체크 지연 확인 중', '예정된 안심 체크 업데이트가 지연되어 운영실이 매니저와 보호자 연락을 확인하고 있습니다.', false),
  ('safe_return_closed', 'alimtalk', '안전 종료 확인', '부모님 병원동행이 안전 종료로 확인되었습니다. 보호자 리포트를 확인해 주세요.', false)
on conflict (code) do nothing;

create index if not exists handoff_verifications_appointment_idx on public.appointment_handoff_verifications (appointment_id, created_at desc);
create index if not exists safety_checkpoints_due_idx on public.appointment_safety_checkpoints (status, expected_at);
create index if not exists safety_checkpoints_appointment_idx on public.appointment_safety_checkpoints (appointment_id, code);
create index if not exists safety_escalations_status_idx on public.safety_escalations (status, severity, created_at desc);

-- 8) Updated_at triggers -------------------------------------------------------
do $$
declare
  table_name text;
begin
  foreach table_name in array array['appointment_safety_checkpoints', 'safety_escalations'] loop
    execute format('drop trigger if exists %I on public.%I', 'set_' || table_name || '_updated_at', table_name);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', 'set_' || table_name || '_updated_at', table_name);
  end loop;
end $$;

insert into public.audit_logs (entity_type, action, metadata)
values (
  'migration',
  '005_safety_handoff_sla',
  '{"message":"Added safety handoff verification, SLA checkpoints, missed-checkpoint escalation, and safe-return closure."}'::jsonb
)
on conflict do nothing;

-- ============================================================
-- 006_real_life_convenience_layer.sql
-- ============================================================

-- 006 Real-life convenience layer
-- 준비물, 병원 동선, 서류/영수증 요청, 복약 확인, 다음 예약 후보를 일정 중심으로 묶습니다.

-- 1) Existing table hardening -------------------------------------------------
alter table public.guardian_tasks add column if not exists owner_label text;
alter table public.guardian_tasks add column if not exists priority text not null default 'medium' check (priority in ('low', 'medium', 'high'));
alter table public.guardian_tasks add column if not exists convenience_category text;

alter table public.hospitals add column if not exists route_guide jsonb not null default '{}';
alter table public.hospitals add column if not exists accessibility_guide jsonb not null default '{}';
alter table public.hospitals add column if not exists parking_guide text;
alter table public.hospitals add column if not exists pharmacy_guide text;

-- 2) Hospital wayfinding guide ------------------------------------------------
create table if not exists public.hospital_visit_guides (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid references public.hospitals(id) on delete cascade,
  hospital_name text not null,
  address text,
  main_entrance text,
  checkin_floor text,
  taxi_dropoff text,
  pickup_return_spot text,
  wheelchair_desk text,
  restroom_hint text,
  pharmacy_hint text,
  parking_hint text,
  estimated_stay_minutes integer,
  accessibility_tips text[] not null default '{}',
  manager_tips text[] not null default '{}',
  is_verified boolean not null default false,
  verified_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hospital_id),
  unique (hospital_name)
);

-- 3) Appointment preparation pack --------------------------------------------
create table if not exists public.appointment_preparation_items (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  category text not null default 'document' check (category in ('document', 'medicine', 'mobility', 'payment', 'comfort', 'question', 'arrival')),
  title text not null,
  description text,
  owner_label text,
  due_at timestamptz,
  due_label text,
  status text not null default 'missing' check (status in ('ready', 'missing', 'optional', 'done')),
  is_required boolean not null default true,
  source text not null default 'system' check (source in ('family', 'manager', 'ops', 'system')),
  note text,
  completed_by uuid references public.profiles(id) on delete set null,
  completed_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (appointment_id, title)
);

-- 4) Document and receipt request board --------------------------------------
create table if not exists public.appointment_document_requests (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  title text not null,
  reason text,
  fee_hint text,
  required_consent_scope text not null default 'payment_receipt',
  share_with_family boolean not null default true,
  status text not null default 'needed' check (status in ('needed', 'requested', 'received', 'not_needed')),
  requested_by uuid references public.profiles(id) on delete set null,
  handled_by uuid references public.profiles(id) on delete set null,
  handled_at timestamptz,
  attachment_id uuid references public.report_attachments(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (appointment_id, title)
);

-- 5) Medication reminder after visit -----------------------------------------
create table if not exists public.appointment_medication_reminders (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  medicine_name text not null,
  dose text,
  timing text,
  reminder_at timestamptz not null,
  owner_label text,
  status text not null default 'scheduled' check (status in ('scheduled', 'confirmed', 'missed', 'cancelled')),
  confirmed_by uuid references public.profiles(id) on delete set null,
  confirmed_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6) Next visit candidate -----------------------------------------------------
create table if not exists public.next_visit_candidates (
  id uuid primary key default gen_random_uuid(),
  source_appointment_id uuid not null references public.appointments(id) on delete cascade,
  title text not null,
  suggested_at timestamptz,
  reason text,
  owner_label text,
  status text not null default 'suggested' check (status in ('suggested', 'drafted', 'confirmed', 'dismissed')),
  created_appointment_id uuid references public.appointments(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 7) Default convenience pack trigger ----------------------------------------
create or replace function public.create_default_convenience_pack()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.appointment_preparation_items (
    appointment_id, category, title, description, owner_label, due_at, due_label, status, is_required, source, created_by
  )
  values
    (new.id, 'document', '신분증 또는 모바일 신분 확인 수단', '접수·수납·서류 발급 시 필요할 수 있습니다.', '부모님', coalesce(new.meet_at, new.appointment_at - interval '90 minutes') - interval '12 hours', '전날 저녁', 'missing', true, 'system', new.created_by),
    (new.id, 'medicine', '현재 복용약 목록 또는 약 봉투 사진', '의료진에게 복용 중인 약을 바로 보여줄 수 있게 준비합니다.', '가족', coalesce(new.meet_at, new.appointment_at - interval '90 minutes') - interval '1 hour', '진료 1시간 전', 'missing', true, 'system', new.created_by),
    (new.id, 'question', '의사에게 물어볼 질문 리스트', '보호자 질문을 진료 전 매니저가 다시 확인합니다.', '가족', coalesce(new.meet_at, new.appointment_at - interval '90 minutes') - interval '1 hour', '진료 1시간 전', 'missing', true, 'system', new.created_by),
    (new.id, 'payment', '결제수단과 소액 현금', '진료비, 약제비, 서류 발급비를 대비합니다.', '부모님', coalesce(new.meet_at, new.appointment_at - interval '90 minutes') - interval '30 minutes', '출발 전', 'missing', true, 'system', new.created_by),
    (new.id, 'comfort', '물, 얇은 겉옷, 보행 보조 물품', '대기 시간이 길 때 불편함을 줄입니다.', '부모님', coalesce(new.meet_at, new.appointment_at - interval '90 minutes') - interval '30 minutes', '출발 전', 'optional', false, 'system', new.created_by),
    (new.id, 'arrival', '택시 하차 위치와 접수층 확인', '매니저가 하차 후 접수 동선을 미리 확인합니다.', '매니저', coalesce(new.meet_at, new.appointment_at - interval '90 minutes') - interval '30 minutes', '만남 30분 전', 'missing', true, 'system', new.created_by)
  on conflict (appointment_id, title) do nothing;

  return new;
end;
$$;

drop trigger if exists appointments_create_default_convenience_pack on public.appointments;
create trigger appointments_create_default_convenience_pack
after insert on public.appointments
for each row execute function public.create_default_convenience_pack();

-- 8) Convenience dashboard view ----------------------------------------------
create or replace view public.ops_convenience_dashboard as
select
  a.id as appointment_id,
  a.title,
  a.appointment_at,
  a.meet_at,
  a.status as appointment_status,
  count(pi.id) filter (where pi.is_required = true and pi.status in ('missing', 'optional')) as required_prep_open_count,
  count(pi.id) filter (where pi.status = 'done') as prep_done_count,
  count(dr.id) filter (where dr.status in ('needed', 'requested')) as document_open_count,
  count(mr.id) filter (where mr.status = 'scheduled') as medication_scheduled_count,
  count(nv.id) filter (where nv.status in ('suggested', 'drafted')) as next_visit_candidate_count
from public.appointments a
left join public.appointment_preparation_items pi on pi.appointment_id = a.id
left join public.appointment_document_requests dr on dr.appointment_id = a.id
left join public.appointment_medication_reminders mr on mr.appointment_id = a.id
left join public.next_visit_candidates nv on nv.source_appointment_id = a.id
group by a.id;

-- 9) RLS ----------------------------------------------------------------------
alter table public.hospital_visit_guides enable row level security;
alter table public.appointment_preparation_items enable row level security;
alter table public.appointment_document_requests enable row level security;
alter table public.appointment_medication_reminders enable row level security;
alter table public.next_visit_candidates enable row level security;


drop policy if exists hospital_visit_guides_select_policy on public.hospital_visit_guides;
create policy hospital_visit_guides_select_policy on public.hospital_visit_guides
for select using (true);

drop policy if exists hospital_visit_guides_write_policy on public.hospital_visit_guides;
create policy hospital_visit_guides_write_policy on public.hospital_visit_guides
for all using (public.is_ops()) with check (public.is_ops());

drop policy if exists appointment_preparation_items_policy on public.appointment_preparation_items;
create policy appointment_preparation_items_policy on public.appointment_preparation_items
for all using (public.can_access_appointment(appointment_id))
with check (public.can_access_appointment(appointment_id));

drop policy if exists appointment_document_requests_policy on public.appointment_document_requests;
create policy appointment_document_requests_policy on public.appointment_document_requests
for all using (public.can_access_appointment(appointment_id))
with check (public.can_access_appointment(appointment_id));

drop policy if exists appointment_medication_reminders_policy on public.appointment_medication_reminders;
create policy appointment_medication_reminders_policy on public.appointment_medication_reminders
for all using (public.can_access_appointment(appointment_id))
with check (public.can_access_appointment(appointment_id));

drop policy if exists next_visit_candidates_policy on public.next_visit_candidates;
create policy next_visit_candidates_policy on public.next_visit_candidates
for all using (public.can_access_appointment(source_appointment_id))
with check (public.can_access_appointment(source_appointment_id));

-- 10) Notification templates --------------------------------------------------
insert into public.notification_templates (code, channel, title, body, contains_transport_policy)
values
  ('prep_pack_missing', 'alimtalk', '병원 일정 준비물이 남아 있어요', '신분증, 복용약, 질문 리스트 등 병원 일정 준비물을 확인해 주세요.', false),
  ('document_request_added', 'alimtalk', '현장 서류 요청이 추가됐어요', '보호자가 요청한 서류를 매니저가 수납 전 확인합니다. 공유 범위 동의가 필요한 항목은 동의 후 발송됩니다.', false),
  ('medication_reminder', 'alimtalk', '복약 확인 시간입니다', '오늘 진료 후 받은 약을 복용하셨는지 가족이 확인해 주세요.', false),
  ('next_visit_candidate', 'app', '다음 예약 후보가 생겼어요', '리포트에 기록된 다음 예약 안내를 일정 초안으로 만들 수 있습니다.', false)
on conflict (code) do nothing;

-- 11) Updated_at triggers / indexes ------------------------------------------
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'hospital_visit_guides', 'appointment_preparation_items', 'appointment_document_requests',
    'appointment_medication_reminders', 'next_visit_candidates'
  ] loop
    execute format('drop trigger if exists %I on public.%I', 'set_' || table_name || '_updated_at', table_name);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', 'set_' || table_name || '_updated_at', table_name);
  end loop;
end $$;

create index if not exists prep_items_appointment_status_idx on public.appointment_preparation_items (appointment_id, status, is_required);
create index if not exists document_requests_appointment_status_idx on public.appointment_document_requests (appointment_id, status);
create index if not exists medication_reminders_due_idx on public.appointment_medication_reminders (status, reminder_at);
create index if not exists next_visit_candidates_source_idx on public.next_visit_candidates (source_appointment_id, status, suggested_at);
create index if not exists guardian_tasks_owner_label_idx on public.guardian_tasks (owner_label, status, due_at);

insert into public.audit_logs (entity_type, action, metadata)
values (
  'migration',
  '006_real_life_convenience_layer',
  '{"message":"Added real-life convenience layer: prep pack, hospital guide, document requests, medication reminders, next visit candidates, and convenience ops dashboard."}'::jsonb
)
on conflict do nothing;

-- ============================================================
-- 007_worry_resolution_platform.sql
-- ============================================================

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
