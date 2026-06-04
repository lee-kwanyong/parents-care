create extension if not exists pgcrypto;

alter table public.notification_outbox
  alter column template_code drop not null;

alter table public.notification_outbox
  alter column template_code set default '';

update public.notification_outbox
   set template_code = ''
 where template_code is null;

create table if not exists public.notification_message_templates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  category text default 'general',
  title text not null,
  body text not null,
  default_target_url text default '/ops/notification-dispatch',
  sort_order integer default 100,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.notification_message_templates add column if not exists code text;
alter table public.notification_message_templates add column if not exists category text default 'general';
alter table public.notification_message_templates add column if not exists title text;
alter table public.notification_message_templates add column if not exists body text;
alter table public.notification_message_templates add column if not exists default_target_url text default '/ops/notification-dispatch';
alter table public.notification_message_templates add column if not exists sort_order integer default 100;
alter table public.notification_message_templates add column if not exists is_active boolean default true;
alter table public.notification_message_templates add column if not exists created_at timestamptz default now();
alter table public.notification_message_templates add column if not exists updated_at timestamptz default now();

create unique index if not exists idx_notification_message_templates_code
  on public.notification_message_templates(code);

insert into public.notification_message_templates (
  code,
  category,
  title,
  body,
  default_target_url,
  sort_order,
  is_active,
  updated_at
)
values
(
  'ops-test',
  '테스트',
  '[안부웍스] 테스트 문자',
  $$안부웍스 알림 발송 테스트입니다.
이 문자는 운영실 발송센터 점검용입니다.$$,
  '/ops/notification-dispatch',
  10,
  true,
  now()
),
(
  'provider-urgent-help',
  '지역 도움망',
  '[안부웍스] 긴급 도움 요청',
  $$부모님께서 “도움이 필요해요” 신호를 보냈습니다.
가능하시면 요청함에서 수락 후 전화 또는 방문 확인을 부탁드립니다.
응급상황이 의심되면 119 또는 의료기관에 연락해주세요.$$,
  '/provider/requests',
  20,
  true,
  now()
),
(
  'provider-meal',
  '지역 도움망',
  '[안부웍스] 식사 확인 요청',
  $$부모님께서 식사를 못 하셨다는 신호가 접수되었습니다.
가능하시면 식사 여부를 확인하고, 필요 시 식사 전달 또는 지역상점 연결을 부탁드립니다.
처리 결과는 요청함에서 완료로 남겨주세요.$$,
  '/provider/requests',
  30,
  true,
  now()
),
(
  'provider-medication',
  '지역 도움망',
  '[안부웍스] 복약 확인 요청',
  $$부모님께서 약을 아직 못 드셨다는 신호가 접수되었습니다.
먼저 실제 복약 여부를 확인해주세요.
처방·복용량 판단은 보호자, 약사 또는 의료기관에 문의해야 합니다.$$,
  '/provider/requests',
  40,
  true,
  now()
),
(
  'provider-condition',
  '지역 도움망',
  '[안부웍스] 몸 상태 확인 요청',
  $$부모님께서 몸이 불편하다는 신호를 보냈습니다.
가능하시면 전화 또는 방문으로 상태를 확인해주세요.
심한 통증, 어지러움, 호흡곤란, 낙상 의심 등은 119 또는 의료기관 연락이 필요합니다.$$,
  '/provider/requests',
  50,
  true,
  now()
),
(
  'guardian-followup',
  '보호자',
  '[안부웍스] 부모님 후속조치 확인',
  $$부모님 안부 신호가 접수되었습니다.
보호자 후속조치 화면에서 현재 상태와 다음 할 일을 확인해주세요.
확인 후 처리 결과를 남겨주시면 가족 리포트에 반영됩니다.$$,
  '/response',
  60,
  true,
  now()
),
(
  'ops-escalation',
  '운영실',
  '[안부웍스] 운영실 확인 필요',
  $$후속조치 요청이 일정 시간 동안 완료되지 않았습니다.
운영실에서 보호자 또는 지역 도움망 연결 상태를 확인해주세요.
필요하면 수동 연결 또는 재알림을 진행해주세요.$$,
  '/response?scope=ops',
  70,
  true,
  now()
),
(
  'provider-reminder',
  '지역 도움망',
  '[안부웍스] 처리상태 확인 요청',
  $$수락하신 후속조치 요청이 아직 완료 처리되지 않았습니다.
처리가 끝났다면 요청함에서 “처리 완료”를 눌러주세요.
진행이 어렵다면 운영실이 다른 도움망을 찾을 수 있도록 알려주세요.$$,
  '/provider/requests',
  80,
  true,
  now()
),
(
  'report-arrived',
  '보호자',
  '[안부웍스] 부모님 리포트 도착',
  $$부모님 케어 리포트가 도착했습니다.
식사, 복약, 몸 상태, 도움 요청 기록을 확인해주세요.
필요한 후속조치가 있으면 보호자 화면에서 처리할 수 있습니다.$$,
  '/child/dashboard',
  90,
  true,
  now()
),
(
  'family-action',
  '가족',
  '[안부웍스] 가족 확인 요청',
  $$가족 확인이 필요한 안부 요청이 있습니다.
가능한 가족이 먼저 확인을 맡고, 처리 결과를 남겨주세요.
반복되는 위험 신호는 운영실 또는 지역 도움망 연결이 필요할 수 있습니다.$$,
  '/family/actions',
  100,
  true,
  now()
)
on conflict (code)
do update set
  category = excluded.category,
  title = excluded.title,
  body = excluded.body,
  default_target_url = excluded.default_target_url,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.notification_message_templates to anon, authenticated;

alter table public.notification_message_templates enable row level security;

drop policy if exists "notification_message_templates_select_all" on public.notification_message_templates;
drop policy if exists "notification_message_templates_insert_all" on public.notification_message_templates;
drop policy if exists "notification_message_templates_update_all" on public.notification_message_templates;
drop policy if exists "notification_message_templates_delete_all" on public.notification_message_templates;

create policy "notification_message_templates_select_all"
  on public.notification_message_templates
  for select
  to anon, authenticated
  using (true);

create policy "notification_message_templates_insert_all"
  on public.notification_message_templates
  for insert
  to anon, authenticated
  with check (true);

create policy "notification_message_templates_update_all"
  on public.notification_message_templates
  for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "notification_message_templates_delete_all"
  on public.notification_message_templates
  for delete
  to anon, authenticated
  using (true);

notify pgrst, 'reload schema';
select pg_sleep(1);
notify pgrst, 'reload schema';
