create extension if not exists pgcrypto;

create table if not exists public.ops_playbooks (
  id uuid primary key default gen_random_uuid(),
  request_type text not null,
  risk_level text default 'any',
  step_order integer not null default 1,
  delay_minutes integer not null default 0,
  action_code text not null,
  action_label text not null,
  action_detail text not null,
  sms_template_code text default '',
  auto_execute boolean default false,
  requires_human_confirm boolean default true,
  escalation_level text default 'notice',
  is_active boolean default true,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.ops_playbooks add column if not exists request_type text;
alter table public.ops_playbooks add column if not exists risk_level text default 'any';
alter table public.ops_playbooks add column if not exists step_order integer default 1;
alter table public.ops_playbooks add column if not exists delay_minutes integer default 0;
alter table public.ops_playbooks add column if not exists action_code text;
alter table public.ops_playbooks add column if not exists action_label text;
alter table public.ops_playbooks add column if not exists action_detail text;
alter table public.ops_playbooks add column if not exists sms_template_code text default '';
alter table public.ops_playbooks add column if not exists auto_execute boolean default false;
alter table public.ops_playbooks add column if not exists requires_human_confirm boolean default true;
alter table public.ops_playbooks add column if not exists escalation_level text default 'notice';
alter table public.ops_playbooks add column if not exists is_active boolean default true;
alter table public.ops_playbooks add column if not exists payload jsonb default '{}'::jsonb;
alter table public.ops_playbooks add column if not exists created_at timestamptz default now();
alter table public.ops_playbooks add column if not exists updated_at timestamptz default now();

create unique index if not exists idx_ops_playbooks_unique_step
  on public.ops_playbooks(request_type, risk_level, step_order, action_code);

create index if not exists idx_ops_playbooks_lookup
  on public.ops_playbooks(request_type, risk_level, is_active, step_order);

insert into public.ops_playbooks (
  request_type,
  risk_level,
  step_order,
  delay_minutes,
  action_code,
  action_label,
  action_detail,
  sms_template_code,
  auto_execute,
  requires_human_confirm,
  escalation_level,
  updated_at
)
values
('urgent_neighbor_help','high',1,0,'guardian_notify','보호자 즉시 알림','보호자에게 부모님 도움 요청 신호와 다음 행동을 즉시 알립니다.','guardian-followup',true,false,'urgent',now()),
('urgent_neighbor_help','high',2,0,'ops_alert','운영실 긴급 고정','운영실 화면 최상단에 긴급 사건으로 고정하고 제한시간 타이머를 시작합니다.','ops-escalation',true,false,'urgent',now()),
('urgent_neighbor_help','high',3,3,'provider_dispatch','지역 도움망 요청','보호자 확인이 늦어질 경우 가까운 돌봄파트너·요양보호사·수행기관에 요청을 전파합니다.','care-response-dispatch',false,true,'urgent',now()),
('urgent_neighbor_help','high',4,5,'manual_call','운영실 직접 전화','부모님·보호자·지역 도움망에 운영실이 직접 전화 확인합니다.','ops-escalation',false,true,'critical',now()),

('care_partner_check','high',1,0,'guardian_notify','보호자 알림','몸 상태 확인 요청을 보호자에게 알립니다.','guardian-followup',true,false,'warning',now()),
('care_partner_check','high',2,5,'ops_call_script','증상 확인 스크립트','낙상, 호흡곤란, 가슴통증, 의식저하 여부를 확인하는 스크립트를 표시합니다.','ops-escalation',false,true,'urgent',now()),
('care_partner_check','high',3,10,'provider_dispatch','돌봄파트너 확인 요청','보호자 확인이 늦어지면 지역 돌봄파트너에게 전화·방문 확인을 요청합니다.','care-response-dispatch',false,true,'urgent',now()),

('medication_reminder','high',1,0,'guardian_notify','보호자 복약 확인 알림','보호자에게 복약 미확인 신호를 알립니다. 처방·복용량 판단은 하지 않습니다.','guardian-followup',true,false,'warning',now()),
('medication_reminder','high',2,10,'provider_dispatch','복약 여부 확인 요청','실제 복약 여부 확인을 지역 도움망 또는 약국 상담으로 연결합니다.','care-response-dispatch',false,true,'warning',now()),
('medication_reminder','high',3,30,'manual_call','반복 복약 미확인 점검','반복 신호일 경우 운영실이 보호자 또는 약국 상담 필요 여부를 확인합니다.','ops-escalation',false,true,'urgent',now()),

('meal_delivery','medium',1,0,'guardian_notify','보호자 식사 확인 알림','보호자에게 식사 미확인 신호를 알립니다.','guardian-followup',true,false,'notice',now()),
('meal_delivery','medium',2,30,'provider_dispatch','식사 도움 연결','보호자 확인이 늦어지면 지역상점·도시락·돌봄파트너 연결을 검토합니다.','care-response-dispatch',false,true,'warning',now()),
('meal_delivery','medium',3,120,'manual_call','반복 식사 미확인 점검','반복 미식사 신호는 사례관리 후보로 전환합니다.','ops-escalation',false,true,'warning',now()),

('pharmacy_call','high',1,0,'guardian_notify','보호자 약국 상담 알림','보호자에게 약 관련 상담 필요 신호를 알립니다.','guardian-followup',true,false,'warning',now()),
('pharmacy_call','high',2,10,'provider_dispatch','약국·돌봄파트너 확인 요청','약국 또는 돌봄파트너에게 상담 연결 가능 여부를 확인합니다.','care-response-dispatch',false,true,'warning',now())
on conflict (request_type, risk_level, step_order, action_code)
do update set
  delay_minutes = excluded.delay_minutes,
  action_label = excluded.action_label,
  action_detail = excluded.action_detail,
  sms_template_code = excluded.sms_template_code,
  auto_execute = excluded.auto_execute,
  requires_human_confirm = excluded.requires_human_confirm,
  escalation_level = excluded.escalation_level,
  is_active = true,
  updated_at = now();

create table if not exists public.ops_incident_assignments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null,
  assigned_to_name text not null,
  assigned_role text default 'ops',
  assignment_status text default 'active',
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.ops_incident_assignments add column if not exists request_id uuid;
alter table public.ops_incident_assignments add column if not exists assigned_to_name text;
alter table public.ops_incident_assignments add column if not exists assigned_role text default 'ops';
alter table public.ops_incident_assignments add column if not exists assignment_status text default 'active';
alter table public.ops_incident_assignments add column if not exists note text;
alter table public.ops_incident_assignments add column if not exists created_at timestamptz default now();
alter table public.ops_incident_assignments add column if not exists updated_at timestamptz default now();

create index if not exists idx_ops_incident_assignments_request
  on public.ops_incident_assignments(request_id, assignment_status, created_at desc);

create table if not exists public.ops_contact_attempts (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null,
  contact_type text not null,
  to_name text,
  to_phone text,
  result_status text default 'pending',
  memo text,
  created_by text default '운영실',
  created_at timestamptz default now()
);

alter table public.ops_contact_attempts add column if not exists request_id uuid;
alter table public.ops_contact_attempts add column if not exists contact_type text;
alter table public.ops_contact_attempts add column if not exists to_name text;
alter table public.ops_contact_attempts add column if not exists to_phone text;
alter table public.ops_contact_attempts add column if not exists result_status text default 'pending';
alter table public.ops_contact_attempts add column if not exists memo text;
alter table public.ops_contact_attempts add column if not exists created_by text default '운영실';
alter table public.ops_contact_attempts add column if not exists created_at timestamptz default now();

create index if not exists idx_ops_contact_attempts_request
  on public.ops_contact_attempts(request_id, created_at desc);

create table if not exists public.ops_autopilot_logs (
  id uuid primary key default gen_random_uuid(),
  request_id uuid,
  action_type text not null,
  actor_name text default '안부웍스 오토파일럿',
  message text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.ops_autopilot_logs add column if not exists request_id uuid;
alter table public.ops_autopilot_logs add column if not exists action_type text;
alter table public.ops_autopilot_logs add column if not exists actor_name text default '안부웍스 오토파일럿';
alter table public.ops_autopilot_logs add column if not exists message text;
alter table public.ops_autopilot_logs add column if not exists payload jsonb default '{}'::jsonb;
alter table public.ops_autopilot_logs add column if not exists created_at timestamptz default now();

create index if not exists idx_ops_autopilot_logs_request
  on public.ops_autopilot_logs(request_id, created_at desc);

alter table public.notification_outbox
  alter column template_code drop not null;

alter table public.notification_outbox
  alter column template_code set default '';

update public.notification_outbox
   set template_code = ''
 where template_code is null;

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on public.ops_playbooks to anon, authenticated;
grant select, insert, update, delete on public.ops_incident_assignments to anon, authenticated;
grant select, insert, update, delete on public.ops_contact_attempts to anon, authenticated;
grant select, insert, update, delete on public.ops_autopilot_logs to anon, authenticated;

alter table public.ops_playbooks enable row level security;
alter table public.ops_incident_assignments enable row level security;
alter table public.ops_contact_attempts enable row level security;
alter table public.ops_autopilot_logs enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'ops_playbooks',
    'ops_incident_assignments',
    'ops_contact_attempts',
    'ops_autopilot_logs'
  ]
  loop
    execute format('drop policy if exists "%s_select_all" on public.%I', t, t);
    execute format('drop policy if exists "%s_insert_all" on public.%I', t, t);
    execute format('drop policy if exists "%s_update_all" on public.%I', t, t);
    execute format('drop policy if exists "%s_delete_all" on public.%I', t, t);

    execute format('create policy "%s_select_all" on public.%I for select to anon, authenticated using (true)', t, t);
    execute format('create policy "%s_insert_all" on public.%I for insert to anon, authenticated with check (true)', t, t);
    execute format('create policy "%s_update_all" on public.%I for update to anon, authenticated using (true) with check (true)', t, t);
    execute format('create policy "%s_delete_all" on public.%I for delete to anon, authenticated using (true)', t, t);
  end loop;
end $$;

notify pgrst, 'reload schema';
select pg_sleep(1);
notify pgrst, 'reload schema';
