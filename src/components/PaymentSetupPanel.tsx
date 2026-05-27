'use client'

import { useEffect, useState } from 'react'

const sql = `-- 안부웍스 결제/구독 저장용 스키마
create extension if not exists pgcrypto;

create table if not exists public.anbu_payment_orders (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  order_id text unique not null,
  order_name text not null,
  plan_id text not null,
  plan_name text not null,
  amount integer not null default 0,
  billing_cycle text not null default 'one_time',
  plan_type text not null default 'care_fee',
  buyer_name text,
  buyer_phone text,
  buyer_email text,
  customer_key text,
  payment_provider text not null default 'toss',
  payment_key text,
  payment_status text not null default 'ready',
  requested_at timestamptz not null default now(),
  paid_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  raw_response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.anbu_subscriptions (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  plan_id text not null,
  plan_name text not null,
  subscription_status text not null default 'active',
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz,
  last_order_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_anbu_payment_orders_order_id
  on public.anbu_payment_orders(order_id);

create index if not exists idx_anbu_payment_orders_family_code
  on public.anbu_payment_orders(family_code);

create index if not exists idx_anbu_payment_orders_status
  on public.anbu_payment_orders(payment_status);

create index if not exists idx_anbu_subscriptions_family_code
  on public.anbu_subscriptions(family_code);

create index if not exists idx_anbu_subscriptions_status
  on public.anbu_subscriptions(subscription_status);`

type Health = {
  ok: boolean
  env: Record<string, boolean>
  tables: Array<{
    table: string
    ok: boolean
    message: string
  }>
}

export function PaymentSetupPanel() {
  const [health, setHealth] = useState<Health | null>(null)
  const [message, setMessage] = useState('')

  async function loadHealth() {
    setMessage('')

    try {
      const response = await fetch('/api/setup/payments-health', { cache: 'no-store' })
      const data = await response.json()
      setHealth(data)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '결제 설정 확인 실패')
    }
  }

  async function copySql() {
    await navigator.clipboard.writeText(sql)
    setMessage('SQL이 복사되었습니다. Supabase SQL Editor에 붙여넣고 실행하세요.')
  }

  useEffect(() => {
    loadHealth()
  }, [])

  return (
    <section className="mx-auto max-w-6xl px-5 py-8 text-[#173B36]">
      <div className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:p-8">
        <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
          안부웍스 결제 설정
        </div>

        <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
          결제 주문과 구독을
          <br />
          서버에 저장합니다.
        </h1>

        <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#637B76] sm:text-lg sm:leading-8">
          토스페이먼츠 결제창을 연결하고, 결제 성공 후 서버에서 승인한 뒤 결제내역과 구독 상태를 Supabase에 저장합니다.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={copySql} className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white">
            결제 SQL 복사
          </button>
          <button onClick={loadHealth} className="rounded-2xl bg-[#20C5A8] px-5 py-4 text-sm font-black text-white">
            결제 설정 다시 확인
          </button>
        </div>

        {message ? (
          <div className="mt-5 rounded-2xl bg-[#EFFFF9] p-4 text-sm font-black text-[#116D5F] ring-1 ring-[#CDEFE5]">
            {message}
          </div>
        ) : null}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">현재 상태</h2>

          <div className="mt-5 grid gap-3">
            <StatusRow label="NEXT_PUBLIC_SUPABASE_URL" ok={Boolean(health?.env?.NEXT_PUBLIC_SUPABASE_URL)} />
            <StatusRow label="SUPABASE_SERVICE_ROLE_KEY" ok={Boolean(health?.env?.SUPABASE_SERVICE_ROLE_KEY)} />
            <StatusRow label="NEXT_PUBLIC_TOSS_CLIENT_KEY" ok={Boolean(health?.env?.NEXT_PUBLIC_TOSS_CLIENT_KEY)} />
            <StatusRow label="TOSS_SECRET_KEY" ok={Boolean(health?.env?.TOSS_SECRET_KEY)} />
            <StatusRow label="ANBU_ADMIN_CODE" ok={Boolean(health?.env?.ANBU_ADMIN_CODE)} />
          </div>

          <h3 className="mt-6 text-xl font-black tracking-[-0.04em]">결제 테이블</h3>

          <div className="mt-3 grid gap-2">
            {(health?.tables || []).map((item) => (
              <div
                key={item.table}
                className={
                  'rounded-2xl p-3 text-sm font-black ring-1 ' +
                  (item.ok
                    ? 'bg-[#EFFFF9] text-[#116D5F] ring-[#CDEFE5]'
                    : 'bg-[#FFF8E8] text-[#795313] ring-[#F4D8A5]')
                }
              >
                <div className="flex items-center justify-between gap-3">
                  <span>{item.table}</span>
                  <span>{item.ok ? '정상' : '확인 필요'}</span>
                </div>
                {!item.ok ? (
                  <p className="mt-2 text-xs font-bold leading-5 opacity-80">{item.message}</p>
                ) : null}
              </div>
            ))}
          </div>

          {health?.ok ? (
            <div className="mt-5 rounded-2xl bg-[#EFFFF9] p-4 text-sm font-black text-[#116D5F] ring-1 ring-[#CDEFE5]">
              결제 연결 준비가 완료되었습니다.
            </div>
          ) : (
            <div className="mt-5 rounded-2xl bg-[#FFF8E8] p-4 text-sm font-black leading-7 text-[#795313] ring-1 ring-[#F4D8A5]">
              아직 결제 설정이 완료되지 않았습니다. SQL 실행과 Vercel 환경변수를 확인하세요.
            </div>
          )}
        </section>

        <section className="rounded-[2rem] bg-[#123F38] p-5 text-white shadow-sm sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">실행할 SQL</h2>
          <p className="mt-2 text-sm font-bold leading-7 text-[#CDEEE6]">
            Supabase Dashboard → SQL Editor → New query에 붙여넣고 Run을 누르세요.
          </p>

          <pre className="mt-5 max-h-[34rem] overflow-auto rounded-2xl bg-black/30 p-4 text-xs leading-6 text-[#E7FFF7]">
            {sql}
          </pre>
        </section>
      </div>

      <section className="mt-5 rounded-[2rem] bg-white p-5 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D8EEE8] sm:p-6">
        <h2 className="text-2xl font-black tracking-[-0.05em] text-[#173B36]">Vercel 환경변수</h2>
        <p className="mt-3">Vercel Project Settings → Environment Variables에 아래 값을 넣고 재배포해야 합니다.</p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            ['NEXT_PUBLIC_TOSS_CLIENT_KEY', '토스페이먼츠 클라이언트 키. 브라우저 결제창에서 사용합니다.'],
            ['TOSS_SECRET_KEY', '토스페이먼츠 시크릿 키. 서버 결제 승인 API에서만 사용합니다.'],
            ['NEXT_PUBLIC_SUPABASE_URL', 'Supabase Project URL'],
            ['SUPABASE_SERVICE_ROLE_KEY', 'Supabase service_role key'],
            ['ANBU_ADMIN_CODE', '운영실/설정 화면 관리자 코드']
          ].map(([name, desc]) => (
            <div key={name} className="rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8]">
              <div className="font-black text-[#173B36]">{name}</div>
              <p className="mt-1 text-xs">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </section>
  )
}

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div
      className={
        'flex items-center justify-between rounded-2xl p-4 text-sm font-black ring-1 ' +
        (ok
          ? 'bg-[#EFFFF9] text-[#116D5F] ring-[#CDEFE5]'
          : 'bg-[#FFF8E8] text-[#795313] ring-[#F4D8A5]')
      }
    >
      <span>{label}</span>
      <span>{ok ? '정상' : '확인 필요'}</span>
    </div>
  )
}
