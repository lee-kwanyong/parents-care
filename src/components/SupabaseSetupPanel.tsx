'use client'

import { useEffect, useState } from 'react'

const sql = `-- 안부웍스 / 안부온 실제 서버 저장용 핵심 스키마
create extension if not exists pgcrypto;

create table if not exists public.anbu_family_links (
  id uuid primary key default gen_random_uuid(),
  family_code text unique not null,
  guardian_name text,
  guardian_phone text,
  parent_name text,
  parent_phone text,
  consent_status text not null default 'pending',
  link_status text not null default 'active',
  parent_joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_care_checkins (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  elder_name text not null default '부모님',
  check_type text not null,
  care_label text not null,
  status text not null,
  actor_role text default 'parent',
  source text,
  memo text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.anbu_routines (
  id uuid primary key default gen_random_uuid(),
  family_code text not null,
  routine_label text not null,
  routine_time text not null,
  message text,
  channel text not null default 'app',
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.anbu_weekly_reports (
  id uuid primary key default gen_random_uuid(),
  family_code text not null,
  report_period text,
  summary text,
  score integer not null default 0,
  stats jsonb not null default '[]'::jsonb,
  next_actions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.anbu_partner_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_name text,
  phone text,
  region text,
  available_time text,
  has_caregiver_license boolean not null default false,
  can_hospital_accompany boolean not null default false,
  can_medication_check boolean not null default false,
  can_meal_check boolean not null default false,
  can_drive boolean not null default false,
  verification_status text not null default 'pending',
  memo text,
  created_at timestamptz not null default now()
);

create table if not exists public.anbu_privacy_consents (
  id uuid primary key default gen_random_uuid(),
  family_code text,
  subject_role text,
  consent_item text not null,
  agreed boolean not null default false,
  agreed_at timestamptz not null default now()
);

create index if not exists idx_anbu_family_links_code on public.anbu_family_links(family_code);
create index if not exists idx_daily_care_checkins_family_code on public.daily_care_checkins(family_code);
create index if not exists idx_daily_care_checkins_occurred_at on public.daily_care_checkins(occurred_at desc);
create index if not exists idx_anbu_routines_family_code on public.anbu_routines(family_code);
create index if not exists idx_anbu_weekly_reports_family_code on public.anbu_weekly_reports(family_code);
create index if not exists idx_anbu_partner_applications_status on public.anbu_partner_applications(verification_status);`

type Health = {
  ok: boolean
  env: Record<string, boolean>
  tables: Array<{
    table: string
    ok: boolean
    status?: number
    message: string
  }>
}

export function SupabaseSetupPanel() {
  const [health, setHealth] = useState<Health | null>(null)
  const [message, setMessage] = useState('')

  async function loadHealth() {
    setMessage('')

    try {
      const response = await fetch('/api/setup/supabase-health', { cache: 'no-store' })
      const data = await response.json()
      setHealth(data)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'DB 점검 실패')
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
          안부웍스 DB 설정
        </div>

        <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
          Supabase 서버 저장을
          <br />
          먼저 연결해야 합니다.
        </h1>

        <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#637B76] sm:text-lg sm:leading-8">
          부모님-자녀 연결, 안부 버튼, 주간 리포트, 케어파트너 신청이 실제 서버에 저장되려면
          아래 SQL을 Supabase SQL Editor에서 실행하고 Vercel 환경변수를 설정해야 합니다.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={copySql}
            className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white"
          >
            SQL 복사하기
          </button>
          <button
            type="button"
            onClick={loadHealth}
            className="rounded-2xl bg-[#20C5A8] px-5 py-4 text-sm font-black text-white"
          >
            DB 다시 점검
          </button>
        </div>

        {message ? (
          <div className="mt-5 rounded-2xl bg-[#EFFFF9] p-4 text-sm font-black text-[#116D5F] ring-1 ring-[#CDEFE5]">
            {message}
          </div>
        ) : null}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">현재 연결 상태</h2>

          <div className="mt-5 grid gap-3">
            <StatusRow label="NEXT_PUBLIC_SUPABASE_URL" ok={Boolean(health?.env?.NEXT_PUBLIC_SUPABASE_URL)} />
            <StatusRow label="SUPABASE_SERVICE_ROLE_KEY" ok={Boolean(health?.env?.SUPABASE_SERVICE_ROLE_KEY)} />
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
              Supabase 서버 저장 준비가 완료되었습니다.
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

      <section className="mt-5 rounded-[2rem] bg-white p-5 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D8EEE8] sm:p-6">
        <h2 className="text-2xl font-black tracking-[-0.05em] text-[#173B36]">Vercel 환경변수</h2>
        <p className="mt-3">Vercel Project Settings → Environment Variables에 아래 2개를 넣어야 합니다.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8]">
            <div className="font-black text-[#173B36]">NEXT_PUBLIC_SUPABASE_URL</div>
            <p className="mt-1 text-xs">Supabase Project URL</p>
          </div>
          <div className="rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8]">
            <div className="font-black text-[#173B36]">SUPABASE_SERVICE_ROLE_KEY</div>
            <p className="mt-1 text-xs">Supabase service_role key. 절대 브라우저에 노출하면 안 됩니다.</p>
          </div>
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
      <span>{ok ? '있음' : '없음'}</span>
    </div>
  )
}
