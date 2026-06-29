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

update public.anbu_product_plans
set is_active = false,
    updated_at = now()
where plan_code not in ('monthly-report-9900', 'two-week-care-basic-179000', 'two-week-care-299000');

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
  '안부완료 리포트',
  '가족이 직접 부모님 안부를 확인하고 확인 결과를 기록해 리포트로 남기는 월 구독입니다.',
  9900,
  'monthly',
  0,
  true,
  jsonb_build_object(
    'priceLabel', '월 9,900원',
    'subPrice', '부모님 1명 기준 · 방문 없음',
    'category', 'subscription',
    'humanVisitIncluded', false
  )
),
(
  'two-week-care-basic-179000',
  '퇴원 후 2주 안부케어 베이직',
  '퇴원 직후 2주 동안 안부확인, 미응답 재확인, 생활확인 파트너 확인 1회, 종료 리포트를 제공합니다.',
  179000,
  'one_time',
  14,
  true,
  jsonb_build_object(
    'priceLabel', '179,000원',
    'subPrice', '14일 · 생활확인 파트너 1회 포함',
    'category', 'care',
    'durationDays', 14,
    'officeChecks', 3,
    'partnerVisits', 1,
    'humanVisitIncluded', true,
    'recommended', true
  )
),
(
  'two-week-care-299000',
  '퇴원 후 2주 안부케어 플러스',
  '퇴원 직후 2주 동안 안부확인, 미응답 재확인, 생활확인 파트너 확인 3회, 종료 리포트를 제공합니다.',
  299000,
  'one_time',
  14,
  true,
  jsonb_build_object(
    'priceLabel', '299,000원',
    'subPrice', '14일 · 생활확인 파트너 3회 포함',
    'category', 'care',
    'durationDays', 14,
    'officeChecks', 5,
    'partnerVisits', 3,
    'humanVisitIncluded', true,
    'premium', true
  )
)
on conflict (plan_code) do update set
  title = excluded.title,
  description = excluded.description,
  price_krw = excluded.price_krw,
  billing_cycle = excluded.billing_cycle,
  trial_days = excluded.trial_days,
  is_active = true,
  metadata = excluded.metadata,
  updated_at = now();

notify pgrst, 'reload schema';
