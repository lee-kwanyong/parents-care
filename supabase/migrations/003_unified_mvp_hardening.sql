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
