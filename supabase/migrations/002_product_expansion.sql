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
