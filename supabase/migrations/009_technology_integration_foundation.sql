-- 009_technology_integration_foundation.sql
-- 부모님 케어 플랫폼 기술 연동 기반: 알림톡, 전화/카톡/사진 접수, 지도, 전자서명, 비용승인, 식사/복지 제휴, 쉬운 UX 이벤트.
create extension if not exists pgcrypto;

create table if not exists public.integration_connectors (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  category text not null check (category in ('auth','notification','intake','maps','payment','signature','partner','automation','pwa','social_care')),
  status text not null default 'planned' check (status in ('ready','needs_key','planned','disabled')),
  env_keys text[] not null default '{}',
  purpose text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.integration_connectors (code, title, category, status, env_keys, purpose) values
('supabase_auth_db_rls','Supabase Auth·DB·RLS','auth','ready','{NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY}','가족·부모님·매니저·운영실 권한 분리와 실제 데이터 저장'),
('pwa_parent_install','PWA 부모님 홈화면 설치','pwa','ready','{}','부모님 폰에서 큰 글씨 앱처럼 실행'),
('vercel_cron_safety','Vercel Cron 안전 점검','automation','ready','{CRON_SECRET}','지연·미확인 체크포인트를 주기적으로 운영실에 올림'),
('kakao_alimtalk','카카오 알림톡/채널 접수','notification','needs_key','{KAKAO_ALIMTALK_API_KEY,KAKAO_CHANNEL_ID}','앱이 어려운 보호자에게 일정·리포트·식사 확인 알림'),
('phone_intake','전화로 맡기기','intake','ready','{}','운영실 상담원이 걱정을 접수하고 케어팩으로 정리'),
('photo_intake','사진으로 맡기기','intake','ready','{}','예약 문자, 진료예약증, 처방전 사진 기반 접수'),
('google_maps_hospital_route','Google Maps 병원 동선','maps','needs_key','{GOOGLE_MAPS_API_KEY}','택시 하차, 접수층, 휠체어, 약국 동선 확인'),
('serpapi_local_search','SerpApi 지역 검색 보조','maps','needs_key','{SERPAPI_API_KEY}','지역 식사배송, 복지기관, 약국 후보 탐색 보조'),
('esign_consent','전자서명/동의','signature','planned','{ESIGN_PROVIDER_SECRET}','민감정보 공유 범위, 병원동행 동의, 리포트 가족 공유 범위 기록'),
('payment_approval','결제/추가비용 승인','payment','planned','{PAYMENT_PROVIDER_SECRET}','예상 비용, 택시비, 서류 발급비, 식사 배송비 사전 승인'),
('meal_delivery_partner','안심밥상 제휴','partner','planned','{}','정기 도시락, 저염식, 연화식, 회복식 제휴 연결'),
('social_care_support','공공지원·후원 쿠폰','social_care','planned','{}','비용 부담 가족에게 공공지원과 후원형 케어 쿠폰 연결')
on conflict (code) do update set
  title = excluded.title,
  category = excluded.category,
  status = excluded.status,
  env_keys = excluded.env_keys,
  purpose = excluded.purpose,
  updated_at = now();

create table if not exists public.care_intake_entries (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade,
  elder_id uuid references public.elders(id) on delete set null,
  intake_channel text not null default 'simple_form' check (intake_channel in ('phone','kakao','photo','simple_form','ops','api')),
  raw_text text,
  raw_file_path text,
  resolved_worry text not null default 'not_sure',
  recommended_pack_code text,
  ai_summary text,
  ops_status text not null default 'new' check (ops_status in ('new','triaged','plan_created','waiting_family','in_progress','resolved','cancelled')),
  social_care_requested boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  assigned_ops_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.care_orchestration_events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade,
  elder_id uuid references public.elders(id) on delete set null,
  care_intake_entry_id uuid references public.care_intake_entries(id) on delete cascade,
  event_type text not null,
  title text not null,
  description text,
  actor_role text not null default 'system' check (actor_role in ('system','family','parent','manager','ops','partner')),
  severity text not null default 'info' check (severity in ('info','attention','urgent')),
  created_at timestamptz not null default now()
);

create table if not exists public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade,
  elder_id uuid references public.elders(id) on delete set null,
  recipient_profile_id uuid references public.profiles(id) on delete set null,
  channel text not null check (channel in ('app','kakao_alimtalk','sms','phone','email')),
  template_code text not null,
  title text not null,
  body text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','queued','sent','failed','cancelled')),
  scheduled_at timestamptz not null default now(),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.care_consent_signatures (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  elder_id uuid references public.elders(id) on delete set null,
  signer_profile_id uuid references public.profiles(id) on delete set null,
  consent_type text not null check (consent_type in ('medical_info_share','care_report_share','hospital_companion','meal_support','payment_approval','transport_policy')),
  scopes text[] not null default '{}',
  signature_status text not null default 'draft' check (signature_status in ('draft','sent','signed','revoked','expired')),
  signature_storage_path text,
  signed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.care_payment_approvals (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  elder_id uuid references public.elders(id) on delete set null,
  requested_by uuid references public.profiles(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  label text not null,
  reason text not null,
  estimated_amount integer not null default 0 check (estimated_amount >= 0),
  final_amount integer check (final_amount is null or final_amount >= 0),
  status text not null default 'pending' check (status in ('pending','approved','rejected','paid','cancelled')),
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null default '병원명 미정',
  region text,
  created_at timestamptz not null default now()
);

create table if not exists public.hospital_route_guides (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid references public.hospitals(id) on delete set null,
  hospital_name text not null,
  department text,
  region text,
  taxi_dropoff text,
  reception_floor text,
  wheelchair_location text,
  restroom_hint text,
  pharmacy_hint text,
  parking_hint text,
  map_url text,
  verified_status text not null default 'needs_review' check (verified_status in ('needs_review','ops_verified','manager_verified','outdated')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partner_service_referrals (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade,
  elder_id uuid references public.elders(id) on delete set null,
  service_type text not null check (service_type in ('meal_delivery','mobility_partner','home_care','caregiver','pharmacy','public_welfare','insurance_document')),
  partner_name text,
  request_summary text not null,
  referral_status text not null default 'draft' check (referral_status in ('draft','requested','matched','completed','cancelled')),
  social_care boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.accessibility_preferences (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  family_id uuid references public.families(id) on delete cascade,
  easy_mode boolean not null default true,
  large_text boolean not null default true,
  show_only_essential_actions boolean not null default true,
  preferred_intake_channels text[] not null default '{phone,kakao,photo}',
  avoid_words text[] not null default '{관리,감시}',
  preferred_words text[] not null default '{도와드림,안심소식}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.integration_connectors enable row level security;
alter table public.care_intake_entries enable row level security;
alter table public.care_orchestration_events enable row level security;
alter table public.notification_outbox enable row level security;
alter table public.care_consent_signatures enable row level security;
alter table public.care_payment_approvals enable row level security;
alter table public.hospital_route_guides enable row level security;
alter table public.partner_service_referrals enable row level security;
alter table public.accessibility_preferences enable row level security;

drop policy if exists "ops can manage integration connectors" on public.integration_connectors;
create policy "ops can manage integration connectors" on public.integration_connectors for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
) with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
);

drop policy if exists "authenticated can read active connectors" on public.integration_connectors;
create policy "authenticated can read active connectors" on public.integration_connectors for select using (auth.role() = 'authenticated');

-- 가족 구성원 또는 운영실 접근 정책
create or replace function public.is_family_member_or_ops(target_family_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from public.family_members fm where fm.family_id = target_family_id and fm.profile_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'));
$$;

-- Apply shared policies safely.
do $$
declare t text;
begin
  foreach t in array array['care_intake_entries','care_orchestration_events','notification_outbox','care_consent_signatures','care_payment_approvals','partner_service_referrals','accessibility_preferences'] loop
    execute format('drop policy if exists "family ops access %s" on public.%I', t, t);
    execute format('create policy "family ops access %s" on public.%I for all using (public.is_family_member_or_ops(family_id)) with check (family_id is null or public.is_family_member_or_ops(family_id))', t, t);
  end loop;
end $$;

drop policy if exists "authenticated can read route guides" on public.hospital_route_guides;
create policy "authenticated can read route guides" on public.hospital_route_guides for select using (auth.role() = 'authenticated');

drop policy if exists "ops can manage route guides" on public.hospital_route_guides;
create policy "ops can manage route guides" on public.hospital_route_guides for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
) with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('ops','admin'))
);

create or replace view public.family_simple_home_dashboard as
select
  f.id as family_id,
  f.id::text as family_label,
  count(distinct cie.id) filter (where cie.ops_status in ('new','triaged','waiting_family')) as open_worry_count,
  count(distinct nox.id) filter (where nox.status in ('pending','queued')) as pending_notification_count,
  count(distinct cpa.id) filter (where cpa.status = 'pending') as pending_cost_approval_count,
  count(distinct pcr.id) filter (where pcr.referral_status in ('draft','requested','matched')) as active_partner_referral_count
from public.families f
left join public.care_intake_entries cie on cie.family_id = f.id
left join public.notification_outbox nox on nox.family_id = f.id
left join public.care_payment_approvals cpa on cpa.family_id = f.id
left join public.partner_service_referrals pcr on pcr.family_id = f.id
group by f.id;

create or replace view public.ops_integrated_care_command_center as
select
  cie.id,
  cie.family_id,
  cie.elder_id,
  cie.intake_channel,
  cie.resolved_worry,
  cie.recommended_pack_code,
  cie.ops_status,
  cie.social_care_requested,
  cie.created_at,
  coalesce(count(coe.id),0) as event_count,
  coalesce(count(no.id) filter (where no.status in ('pending','queued')),0) as pending_notifications
from public.care_intake_entries cie
left join public.care_orchestration_events coe on coe.care_intake_entry_id = cie.id
left join public.notification_outbox no on no.family_id = cie.family_id
group by cie.id;

create or replace function public.enqueue_family_notification(
  p_family_id uuid,
  p_elder_id uuid,
  p_channel text,
  p_template_code text,
  p_title text,
  p_body text,
  p_payload jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid;
begin
  insert into public.notification_outbox(family_id, elder_id, channel, template_code, title, body, payload)
  values (p_family_id, p_elder_id, p_channel, p_template_code, p_title, p_body, coalesce(p_payload,'{}'::jsonb))
  returning id into v_id;
  return v_id;
end;
$$;
