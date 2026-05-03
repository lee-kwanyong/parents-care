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
