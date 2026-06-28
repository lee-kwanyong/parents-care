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
  'post-discharge-14',
  '퇴원 후 14일 케어',
  '퇴원 후 14일 동안 안부 확인, 미응답 재확인, 보호자 확인 기록, 안부완료 리포트를 제공합니다.',
  49000,
  'one_time',
  14,
  true,
  jsonb_build_object(
    'displayPrice', '14일 무료 실증',
    'regularPrice', '49,000원 예정',
    'pilot', true
  )
),
(
  'monthly-report-9900',
  '안부완료 리포트',
  '월 9,900원으로 부모님 안부 입력, 확인 사건함, 안부완료 리포트를 제공합니다.',
  9900,
  'monthly',
  0,
  true,
  jsonb_build_object(
    'displayPrice', '월 9,900원',
    'parentLimit', 1
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

create table if not exists public.anbu_referral_codes (
  id uuid primary key default gen_random_uuid(),
  referral_code text unique not null,
  owner_name text,
  owner_phone_last4 text,
  status text not null default 'active',
  point_balance integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.anbu_referral_codes add column if not exists referral_code text;
alter table public.anbu_referral_codes add column if not exists owner_name text;
alter table public.anbu_referral_codes add column if not exists owner_phone_last4 text;
alter table public.anbu_referral_codes add column if not exists status text default 'active';
alter table public.anbu_referral_codes add column if not exists point_balance integer default 0;
alter table public.anbu_referral_codes add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.anbu_referral_codes add column if not exists created_at timestamptz default now();
alter table public.anbu_referral_codes add column if not exists updated_at timestamptz default now();

create unique index if not exists idx_anbu_referral_codes_code
  on public.anbu_referral_codes(referral_code);

create table if not exists public.anbu_plan_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_name text not null,
  applicant_phone text,
  applicant_phone_last4 text,
  plan_code text not null,
  plan_title text,
  plan_price_krw integer not null default 0,
  application_status text not null default 'submitted',
  used_referral_code text,
  generated_referral_code text,
  point_amount integer not null default 5000,
  source text default 'pricing_page',
  memo text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.anbu_plan_applications add column if not exists applicant_name text;
alter table public.anbu_plan_applications add column if not exists applicant_phone text;
alter table public.anbu_plan_applications add column if not exists applicant_phone_last4 text;
alter table public.anbu_plan_applications add column if not exists plan_code text;
alter table public.anbu_plan_applications add column if not exists plan_title text;
alter table public.anbu_plan_applications add column if not exists plan_price_krw integer default 0;
alter table public.anbu_plan_applications add column if not exists application_status text default 'submitted';
alter table public.anbu_plan_applications add column if not exists used_referral_code text;
alter table public.anbu_plan_applications add column if not exists generated_referral_code text;
alter table public.anbu_plan_applications add column if not exists point_amount integer default 5000;
alter table public.anbu_plan_applications add column if not exists source text default 'pricing_page';
alter table public.anbu_plan_applications add column if not exists memo text;
alter table public.anbu_plan_applications add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.anbu_plan_applications add column if not exists created_at timestamptz default now();
alter table public.anbu_plan_applications add column if not exists updated_at timestamptz default now();

create index if not exists idx_anbu_plan_applications_created
  on public.anbu_plan_applications(created_at desc);

create index if not exists idx_anbu_plan_applications_plan
  on public.anbu_plan_applications(plan_code, created_at desc);

create index if not exists idx_anbu_plan_applications_referral
  on public.anbu_plan_applications(used_referral_code, created_at desc);

create table if not exists public.anbu_referral_events (
  id uuid primary key default gen_random_uuid(),
  referrer_code text not null,
  generated_referral_code text,
  application_id uuid,
  referee_name text,
  referee_phone_last4 text,
  plan_code text,
  reward_points integer not null default 5000,
  event_status text not null default 'pending',
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.anbu_referral_events add column if not exists referrer_code text;
alter table public.anbu_referral_events add column if not exists generated_referral_code text;
alter table public.anbu_referral_events add column if not exists application_id uuid;
alter table public.anbu_referral_events add column if not exists referee_name text;
alter table public.anbu_referral_events add column if not exists referee_phone_last4 text;
alter table public.anbu_referral_events add column if not exists plan_code text;
alter table public.anbu_referral_events add column if not exists reward_points integer default 5000;
alter table public.anbu_referral_events add column if not exists event_status text default 'pending';
alter table public.anbu_referral_events add column if not exists confirmed_at timestamptz;
alter table public.anbu_referral_events add column if not exists cancelled_at timestamptz;
alter table public.anbu_referral_events add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.anbu_referral_events add column if not exists created_at timestamptz default now();

create index if not exists idx_anbu_referral_events_referrer
  on public.anbu_referral_events(referrer_code, event_status, created_at desc);

create table if not exists public.anbu_point_ledger (
  id uuid primary key default gen_random_uuid(),
  referral_code text not null,
  amount integer not null,
  ledger_type text not null default 'referral_reward',
  ledger_status text not null default 'pending',
  related_application_id uuid,
  memo text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

alter table public.anbu_point_ledger add column if not exists referral_code text;
alter table public.anbu_point_ledger add column if not exists amount integer;
alter table public.anbu_point_ledger add column if not exists ledger_type text default 'referral_reward';
alter table public.anbu_point_ledger add column if not exists ledger_status text default 'pending';
alter table public.anbu_point_ledger add column if not exists related_application_id uuid;
alter table public.anbu_point_ledger add column if not exists memo text;
alter table public.anbu_point_ledger add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.anbu_point_ledger add column if not exists created_at timestamptz default now();
alter table public.anbu_point_ledger add column if not exists confirmed_at timestamptz;

create index if not exists idx_anbu_point_ledger_code
  on public.anbu_point_ledger(referral_code, ledger_status, created_at desc);

create table if not exists public.anbu_subscriptions (
  id uuid primary key default gen_random_uuid(),
  application_id uuid,
  family_code text,
  plan_code text not null,
  status text not null default 'pending_payment',
  price_krw integer not null default 0,
  started_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancelled_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.anbu_subscriptions add column if not exists application_id uuid;
alter table public.anbu_subscriptions add column if not exists family_code text;
alter table public.anbu_subscriptions add column if not exists plan_code text;
alter table public.anbu_subscriptions add column if not exists status text default 'pending_payment';
alter table public.anbu_subscriptions add column if not exists price_krw integer default 0;
alter table public.anbu_subscriptions add column if not exists started_at timestamptz;
alter table public.anbu_subscriptions add column if not exists current_period_start timestamptz;
alter table public.anbu_subscriptions add column if not exists current_period_end timestamptz;
alter table public.anbu_subscriptions add column if not exists cancelled_at timestamptz;
alter table public.anbu_subscriptions add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.anbu_subscriptions add column if not exists created_at timestamptz default now();
alter table public.anbu_subscriptions add column if not exists updated_at timestamptz default now();

create index if not exists idx_anbu_subscriptions_status
  on public.anbu_subscriptions(status, created_at desc);

create table if not exists public.anbu_care_pass_orders (
  id uuid primary key default gen_random_uuid(),
  application_id uuid,
  family_code text,
  plan_code text not null default 'post-discharge-14',
  status text not null default 'pilot_requested',
  price_krw integer not null default 49000,
  free_pilot boolean not null default true,
  start_at timestamptz,
  end_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.anbu_care_pass_orders add column if not exists application_id uuid;
alter table public.anbu_care_pass_orders add column if not exists family_code text;
alter table public.anbu_care_pass_orders add column if not exists plan_code text default 'post-discharge-14';
alter table public.anbu_care_pass_orders add column if not exists status text default 'pilot_requested';
alter table public.anbu_care_pass_orders add column if not exists price_krw integer default 49000;
alter table public.anbu_care_pass_orders add column if not exists free_pilot boolean default true;
alter table public.anbu_care_pass_orders add column if not exists start_at timestamptz;
alter table public.anbu_care_pass_orders add column if not exists end_at timestamptz;
alter table public.anbu_care_pass_orders add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.anbu_care_pass_orders add column if not exists created_at timestamptz default now();
alter table public.anbu_care_pass_orders add column if not exists updated_at timestamptz default now();

create index if not exists idx_anbu_care_pass_orders_status
  on public.anbu_care_pass_orders(status, created_at desc);

create table if not exists public.anbu_payments (
  id uuid primary key default gen_random_uuid(),
  application_id uuid,
  subscription_id uuid,
  care_pass_order_id uuid,
  provider text,
  provider_payment_id text,
  payment_status text not null default 'pending',
  amount_krw integer not null default 0,
  paid_at timestamptz,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.anbu_payments add column if not exists application_id uuid;
alter table public.anbu_payments add column if not exists subscription_id uuid;
alter table public.anbu_payments add column if not exists care_pass_order_id uuid;
alter table public.anbu_payments add column if not exists provider text;
alter table public.anbu_payments add column if not exists provider_payment_id text;
alter table public.anbu_payments add column if not exists payment_status text default 'pending';
alter table public.anbu_payments add column if not exists amount_krw integer default 0;
alter table public.anbu_payments add column if not exists paid_at timestamptz;
alter table public.anbu_payments add column if not exists raw_payload jsonb default '{}'::jsonb;
alter table public.anbu_payments add column if not exists created_at timestamptz default now();

grant usage on schema public to service_role;
grant select, insert, update, delete on public.anbu_product_plans to service_role;
grant select, insert, update, delete on public.anbu_referral_codes to service_role;
grant select, insert, update, delete on public.anbu_plan_applications to service_role;
grant select, insert, update, delete on public.anbu_referral_events to service_role;
grant select, insert, update, delete on public.anbu_point_ledger to service_role;
grant select, insert, update, delete on public.anbu_subscriptions to service_role;
grant select, insert, update, delete on public.anbu_care_pass_orders to service_role;
grant select, insert, update, delete on public.anbu_payments to service_role;

alter table public.anbu_product_plans enable row level security;
alter table public.anbu_referral_codes enable row level security;
alter table public.anbu_plan_applications enable row level security;
alter table public.anbu_referral_events enable row level security;
alter table public.anbu_point_ledger enable row level security;
alter table public.anbu_subscriptions enable row level security;
alter table public.anbu_care_pass_orders enable row level security;
alter table public.anbu_payments enable row level security;

notify pgrst, 'reload schema';
