'use client'

import { useEffect, useState } from 'react'

const sql = `-- 안부웍스 개인정보/데이터 요청 저장용 스키마
create extension if not exists pgcrypto;

create table if not exists public.anbu_data_requests (
  id uuid primary key default gen_random_uuid(),
  request_type text not null,
  requester_name text,
  phone text,
  email text,
  family_code text,
  details text,
  request_status text not null default 'received',
  ops_memo text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists idx_anbu_data_requests_type
  on public.anbu_data_requests(request_type);

create index if not exists idx_anbu_data_requests_status
  on public.anbu_data_requests(request_status);

create index if not exists idx_anbu_data_requests_created_at
  on public.anbu_data_requests(created_at desc);`

type Health = {
  ok: boolean
  env: Record<string, boolean>
  tables: Array<{
    table: string
    ok: boolean
    message: string
  }>
}

export function LegalSetupPanel() {
  const [health, setHealth] = useState<Health | null>(null)
  const [message, setMessage] = useState('')

  async function loadHealth() {
    setMessage('')

    try {
      const response = await fetch('/api/setup/legal-health', { cache: 'no-store' })
      const data = await response.json()
      setHealth(data)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '법무 DB 점검 실패')
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
          Play Store 법무 설정
        </div>

        <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
          개인정보·데이터 요청을
          <br />
          서버에 저장합니다.
        </h1>

        <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#637B76] sm:text-lg sm:leading-8">
          데이터 삭제, 열람, 정정, 동의 철회 요청을 접수하려면 아래 SQL을 Supabase에 실행하세요.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={copySql} className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white">
            법무 SQL 복사
          </button>
          <button onClick={loadHealth} className="rounded-2xl bg-[#20C5A8] px-5 py-4 text-sm font-black text-white">
            DB 다시 점검
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
            <StatusRow label="NEXT_PUBLIC_SUPPORT_EMAIL" ok={Boolean(health?.env?.NEXT_PUBLIC_SUPPORT_EMAIL)} />
          </div>

          <h3 className="mt-6 text-xl font-black tracking-[-0.04em]">테이블 상태</h3>

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
