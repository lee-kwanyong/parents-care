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
