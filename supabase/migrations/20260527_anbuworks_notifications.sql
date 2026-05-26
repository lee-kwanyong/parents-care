-- 안부웍스 알림 이벤트 저장용 스키마
-- Supabase SQL Editor에서 실행하세요.

create extension if not exists pgcrypto;

create table if not exists public.anbu_notification_events (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  channel text not null default 'app',
  event_type text not null,
  recipient text,
  title text,
  message text not null,
  provider text,
  provider_message_id text,
  status text not null default 'queued',
  error_message text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create table if not exists public.anbu_notification_templates (
  id uuid primary key default gen_random_uuid(),
  channel text not null,
  template_key text not null,
  provider_template_code text,
  title text,
  body text not null,
  approval_status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(channel, template_key)
);

create index if not exists idx_anbu_notification_events_family_code
  on public.anbu_notification_events(family_code);

create index if not exists idx_anbu_notification_events_status
  on public.anbu_notification_events(status);

create index if not exists idx_anbu_notification_events_created_at
  on public.anbu_notification_events(created_at desc);

insert into public.anbu_notification_templates
  (channel, template_key, title, body, approval_status)
values
  (
    'sms',
    'daily_care_attention',
    '안부온 확인 필요',
    '[안부웍스] #{parentName} 안부 확인이 필요합니다. #{reason} 보호자 확인 또는 운영실 요청을 진행해주세요.',
    'ready'
  ),
  (
    'alimtalk',
    'daily_care_attention',
    '안부온 확인 필요',
    '[안부웍스]\n#{parentName} 안부 확인이 필요합니다.\n\n확인 신호: #{reason}\n\n앱에서 오늘 상태를 확인해주세요.',
    'draft'
  ),
  (
    'sms',
    'daily_care_normal',
    '안부온 확인 완료',
    '[안부웍스] #{parentName} 안부 확인 완료: #{reason}',
    'ready'
  )
on conflict (channel, template_key) do update
set
  title = excluded.title,
  body = excluded.body,
  updated_at = now();
