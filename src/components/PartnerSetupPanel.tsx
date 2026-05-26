'use client'

import { useEffect, useState } from 'react'

const sql = `-- 안부웍스 케어파트너 모집/승인/배정 스키마
create extension if not exists pgcrypto;

create table if not exists public.anbu_partner_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_name text,
  phone text,
  email text,
  region text,
  available_time text,
  has_caregiver_license boolean not null default false,
  can_hospital_accompany boolean not null default false,
  can_medication_check boolean not null default false,
  can_meal_check boolean not null default false,
  can_drive boolean not null default false,
  verification_status text not null default 'pending',
  verification_memo text,
  memo text,
  approved_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.anbu_partner_applications
  add column if not exists applicant_name text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists region text,
  add column if not exists available_time text,
  add column if not exists has_caregiver_license boolean default false,
  add column if not exists can_hospital_accompany boolean default false,
  add column if not exists can_medication_check boolean default false,
  add column if not exists can_meal_check boolean default false,
  add column if not exists can_drive boolean default false,
  add column if not exists verification_status text default 'pending',
  add column if not exists verification_memo text,
  add column if not exists memo text,
  add column if not exists approved_at timestamptz,
  add column if not exists rejected_at timestamptz,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create table if not exists public.anbu_care_assignments (
  id uuid primary key default gen_random_uuid(),
  family_code text not null,
  partner_application_id uuid,
  partner_name text,
  partner_phone text,
  partner_region text,
  task_type text not null default '생활확인',
  task_title text not null,
  task_description text,
  scheduled_at timestamptz,
  assignment_status text not null default 'assigned',
  ops_memo text,
  report_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.anbu_care_assignments
  add column if not exists family_code text,
  add column if not exists partner_application_id uuid,
  add column if not exists partner_name text,
  add column if not exists partner_phone text,
  add column if not exists partner_region text,
  add column if not exists task_type text default '생활확인',
  add column if not exists task_title text,
  add column if not exists task_description text,
  add column if not exists scheduled_at timestamptz,
  add column if not exists assignment_status text default 'assigned',
  add column if not exists ops_memo text,
  add column if not exists report_summary text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create index if not exists idx_anbu_partner_applications_status
  on public.anbu_partner_applications(verification_status);

create index if not exists idx_anbu_partner_applications_region
  on public.anbu_partner_applications(region);

create index if not exists idx_anbu_care_assignments_family_code
  on public.anbu_care_assignments(family_code);

create index if not exists idx_anbu_care_assignments_status
  on public.anbu_care_assignments(assignment_status);

create index if not exists idx_anbu_care_assignments_scheduled_at
  on public.anbu_care_assignments(scheduled_at);`

type Health = {
  ok: boolean
  env: Record<string, boolean>
  tables: Array<{
    table: string
    ok: boolean
    message: string
  }>
}

export function PartnerSetupPanel() {
  const [health, setHealth] = useState<Health | null>(null)
  const [message, setMessage] = useState('')

  async function loadHealth() {
    setMessage('')

    try {
      const response = await fetch('/api/setup/partners-health', { cache: 'no-store' })
      const data = await response.json()
      setHealth(data)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '파트너 DB 점검 실패')
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
          파트너/배정 DB 설정
        </div>

        <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
          케어파트너 신청과
          <br />
          배정을 서버에 저장합니다.
        </h1>

        <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#637B76] sm:text-lg sm:leading-8">
          케어파트너 신청, 운영실 승인/거절, 부모님 연결코드별 케어 배정을 저장하려면 아래 SQL을 Supabase에 실행하세요.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={copySql} className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white">
            파트너 SQL 복사
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
            <StatusRow label="ANBU_ADMIN_CODE" ok={Boolean(health?.env?.ANBU_ADMIN_CODE)} />
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

          {health?.ok ? (
            <div className="mt-5 rounded-2xl bg-[#EFFFF9] p-4 text-sm font-black text-[#116D5F] ring-1 ring-[#CDEFE5]">
              파트너/배정 서버 저장 준비가 완료되었습니다.
            </div>
          ) : (
            <div className="mt-5 rounded-2xl bg-[#FFF8E8] p-4 text-sm font-black leading-7 text-[#795313] ring-1 ring-[#F4D8A5]">
              아직 DB 설정이 완료되지 않았습니다. SQL 실행과 Vercel 환경변수를 확인하세요.
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
