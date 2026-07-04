create extension if not exists pgcrypto;

create table if not exists public.anbu_product_plans (
  id uuid primary key default gen_random_uuid(),
  plan_code text unique not null,
  title text not null,
  description text,
  price_krw integer not null default 0,
  billing_cycle text not null default 'one_time',
  trial_days integer not null default 0,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.anbu_product_plans add column if not exists plan_code text;
alter table public.anbu_product_plans add column if not exists title text;
alter table public.anbu_product_plans add column if not exists description text;
alter table public.anbu_product_plans add column if not exists price_krw integer default 0;
alter table public.anbu_product_plans add column if not exists billing_cycle text default 'one_time';
alter table public.anbu_product_plans add column if not exists trial_days integer default 0;
alter table public.anbu_product_plans add column if not exists is_active boolean default true;
alter table public.anbu_product_plans add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.anbu_product_plans add column if not exists created_at timestamptz default now();
alter table public.anbu_product_plans add column if not exists updated_at timestamptz default now();

create unique index if not exists idx_anbu_product_plans_code
  on public.anbu_product_plans(plan_code);

insert into public.anbu_product_plans (
  plan_code,
  title,
  description,
  price_krw,
  billing_cycle,
  trial_days,
  is_active,
  metadata
)
values
(
  'monthly-report-9900',
  '안부완료 리포트 베이직',
  '가족이 직접 확인하고 기록하는 월 9,900원 소프트웨어/리포트 요금제입니다.',
  9900,
  'monthly',
  0,
  true,
  jsonb_build_object(
    'priceLabel', '월 9,900원',
    'subPrice', '부모님 1명 기준 · 사람 방문 없음',
    'category', 'subscription',
    'humanVisitIncluded', false
  )
),
(
  'report-14-49000',
  '14일 안부완료 리포트',
  '14일 동안 안부확인과 보호자 확인 결과를 리포트로 남기는 상품입니다.',
  49000,
  'one_time',
  14,
  true,
  jsonb_build_object(
    'priceLabel', '49,000원',
    'subPrice', '14일 · 보호자 직접 확인 중심',
    'category', 'report',
    'humanVisitIncluded', false
  )
),
(
  'post-discharge-light-99000',
  '퇴원 후 14일 안부케어 라이트',
  '방문 없이 전화/운영실 확인 중심으로 운영하는 퇴원 후 14일 안부케어입니다.',
  99000,
  'one_time',
  14,
  true,
  jsonb_build_object(
    'priceLabel', '99,000원',
    'subPrice', '14일 · 전화/운영실 중심 · 방문 없음',
    'category', 'care',
    'officeChecks', 2,
    'partnerVisits', 0,
    'humanVisitIncluded', false
  )
),
(
  'post-discharge-basic-179000',
  '퇴원 후 14일 안부케어 기본',
  '생활확인 파트너 1회를 포함한 퇴원 후 14일 안부케어 기본 상품입니다.',
  179000,
  'one_time',
  14,
  true,
  jsonb_build_object(
    'priceLabel', '179,000원',
    'subPrice', '14일 · 생활확인 파트너 1회 포함',
    'category', 'care',
    'officeChecks', 3,
    'partnerVisits', 1,
    'humanVisitIncluded', true,
    'recommended', true
  )
),
(
  'post-discharge-plus-299000',
  '퇴원 후 14일 안부케어 플러스',
  '생활확인 파트너 3회를 포함한 퇴원 후 14일 안부케어 안심형 상품입니다.',
  299000,
  'one_time',
  14,
  true,
  jsonb_build_object(
    'priceLabel', '299,000원',
    'subPrice', '14일 · 생활확인 파트너 3회 포함',
    'category', 'care',
    'officeChecks', 5,
    'partnerVisits', 3,
    'humanVisitIncluded', true
  )
),
(
  'addon-visit-check-45000',
  '생활확인 방문 추가',
  '생활확인 파트너 방문 1회 추가 상품입니다.',
  45000,
  'addon',
  0,
  true,
  jsonb_build_object(
    'priceLabel', '45,000원/회',
    'subPrice', '요청 시 1회 방문 확인',
    'category', 'addon',
    'partnerVisits', 1,
    'humanVisitIncluded', true
  )
),
(
  'addon-urgent-day-check-60000',
  '긴급 당일 생활확인',
  '당일 생활확인이 필요한 경우 사용하는 추가 확인 상품입니다.',
  60000,
  'addon',
  0,
  true,
  jsonb_build_object(
    'priceLabel', '60,000원/회',
    'subPrice', '당일 확인 필요 시',
    'category', 'addon',
    'partnerVisits', 1,
    'urgent', true,
    'humanVisitIncluded', true
  )
)
on conflict (plan_code) do update set
  title = excluded.title,
  description = excluded.description,
  price_krw = excluded.price_krw,
  billing_cycle = excluded.billing_cycle,
  trial_days = excluded.trial_days,
  is_active = excluded.is_active,
  metadata = excluded.metadata,
  updated_at = now();

notify pgrst, 'reload schema';
