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
