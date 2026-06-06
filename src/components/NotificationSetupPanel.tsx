'use client'

import { useEffect, useState } from 'react'

const sql = `-- 안부웍스 알림 이벤트 저장용 스키마
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
    '[안부웍스]\\n#{parentName} 안부 확인이 필요합니다.\\n\\n확인 신호: #{reason}\\n\\n앱에서 오늘 상태를 확인해주세요.',
    'draft'
  )
on conflict (channel, template_key) do update
set
  title = excluded.title,
  body = excluded.body,
  updated_at = now();`

type Health = {
  ok: boolean
  env: {
    supabase: boolean
    smsEnabled: boolean
    aligo: {
      apiKey: boolean
      userId: boolean
      sender: boolean
    }
    kakaoAlimtalk: {
      enabled: boolean
      provider: string
      templateAttention: boolean
    }
  }
  tables: Array<{
    table: string
    ok: boolean
    message: string
  }>
}

export function NotificationSetupPanel() {
  const [health, setHealth] = useState<Health | null>(null)
  const [adminCode, setAdminCode] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [result, setResult] = useState('')

  async function loadHealth() {
    setResult('')

    try {
      const response = await fetch('/api/notifications/health', { cache: 'no-store' })
      const data = await response.json()
      setHealth(data)
    } catch (error) {
      setResult(error instanceof Error ? error.message : '알림 설정 확인 실패')
    }
  }

  async function copySql() {
    await navigator.clipboard.writeText(sql)
    setResult('SQL이 복사되었습니다. Supabase SQL Editor에 붙여넣고 실행하세요.')
  }

  async function sendTest(channel: 'sms' | 'alimtalk') {
    setResult('테스트 발송 요청 중...')

    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminCode,
          to: phone,
          channel,
          message: message || '[안부웍스] 알림 테스트입니다. 안부온 보호자 알림이 준비되었습니다.'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setResult(data.message || '테스트 발송 실패')
        return
      }

      setResult(JSON.stringify(data, null, 2))
      await loadHealth()
    } catch (error) {
      setResult(error instanceof Error ? error.message : '테스트 발송 실패')
    }
  }

  useEffect(() => {
    loadHealth()
  }, [])

  return (
    <section className="mx-auto max-w-6xl px-5 py-8 text-[#17443F]">
      <div className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:p-8">
        <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
          안부웍스 알림 설정
        </div>

        <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
          응답 없음과 확인 필요 신호를
          <br />
          보호자에게 알려줍니다.
        </h1>

        <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#637B76] sm:text-lg sm:leading-8">
          부모님이 약을 깜빡했거나, 식사를 못 했거나, 몸이 불편하다고 응답하면 알림 이벤트를 만들고
          환경변수가 준비된 경우 실제 SMS를 발송합니다.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={copySql}
            className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white"
          >
            알림 SQL 복사
          </button>
          <button
            type="button"
            onClick={loadHealth}
            className="rounded-2xl bg-[#20C5A8] px-5 py-4 text-sm font-black text-white"
          >
            알림 설정 다시 확인
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">현재 알림 상태</h2>

          <div className="mt-5 grid gap-3">
            <StatusRow label="Supabase 연결" ok={Boolean(health?.env?.supabase)} />
            <StatusRow label="SMS 실제 발송 활성화" ok={Boolean(health?.env?.smsEnabled)} />
            <StatusRow label="ALIGO_API_KEY" ok={Boolean(health?.env?.aligo?.apiKey)} />
            <StatusRow label="ALIGO_USER_ID" ok={Boolean(health?.env?.aligo?.userId)} />
            <StatusRow label="ALIGO_SENDER" ok={Boolean(health?.env?.aligo?.sender)} />
            <StatusRow label="카카오 알림톡 활성화" ok={Boolean(health?.env?.kakaoAlimtalk?.enabled)} />
          </div>

          <h3 className="mt-6 text-xl font-black tracking-[-0.04em]">알림 테이블</h3>

          <div className="mt-3 grid gap-2">
            {(health?.tables || []).map((item) => (
              <div
                key={item.table}
                className={
                  'rounded-2xl p-3 text-sm font-black ring-1 ' +
                  (item.ok
                    ? 'bg-[#EFFFFA] text-[#2AA897] ring-[#CDEFE7]'
                    : 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]')
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

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">테스트 발송</h2>
          <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
            실제 SMS는 ANBU_SMS_ENABLED=true와 알리고 환경변수가 있어야 발송됩니다.
            없으면 알림 이벤트만 저장됩니다.
          </p>

          <div className="mt-5 grid gap-3">
            <Input label="관리자 코드" value={adminCode} onChange={setAdminCode} placeholder="ANBU_ADMIN_CODE" />
            <Input label="받는 전화번호" value={phone} onChange={setPhone} placeholder="01012345678" />
            <label className="grid gap-2">
              <span className="text-sm font-black text-[#637B76]">테스트 메시지</span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="[안부웍스] 알림 테스트입니다."
                className="min-h-28 rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-[#D6F6EC]"
              />
            </label>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => sendTest('sms')}
              className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white"
            >
              SMS 테스트
            </button>

            <button
              type="button"
              onClick={() => sendTest('alimtalk')}
              className="rounded-2xl bg-[#F9E9B7] px-5 py-4 text-sm font-black text-[#795C22]"
            >
              알림톡 큐 테스트
            </button>
          </div>

          {result ? (
            <pre className="mt-5 max-h-80 overflow-auto rounded-2xl bg-[#FAFFFD] p-4 text-xs leading-6 text-[#17443F] ring-1 ring-[#D6EDE7]">
              {result}
            </pre>
          ) : null}
        </section>
      </div>

      <section className="mt-5 rounded-[2rem] bg-[#247A71] p-5 text-white shadow-sm sm:p-6">
        <h2 className="text-2xl font-black tracking-[-0.05em]">Vercel 환경변수</h2>
        <p className="mt-3 text-sm font-bold leading-7 text-[#CDEEE6]">
          Vercel Project Settings → Environment Variables에 아래 값을 넣은 뒤 다시 배포해야 실제 발송됩니다.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {[
            ['ANBU_ADMIN_CODE', '테스트 발송용 관리자 코드'],
            ['ANBU_SMS_ENABLED', 'true 입력 시 실제 SMS 발송'],
            ['ALIGO_API_KEY', '알리고 API Key'],
            ['ALIGO_USER_ID', '알리고 계정 ID'],
            ['ALIGO_SENDER', '알리고에 등록된 발신번호'],
            ['ANBU_NOTIFY_ALL_CHECKINS', 'true면 정상 확인도 문자 발송. 기본은 확인 필요만 발송']
          ].map(([name, desc]) => (
            <div key={name} className="rounded-2xl bg-white/10 p-4">
              <div className="text-sm font-black text-[#9DF4DD]">{name}</div>
              <p className="mt-1 text-xs font-bold leading-5 text-[#E7FFF7]">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-[2rem] bg-white p-5 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D6EDE7] sm:p-6">
        <h2 className="text-2xl font-black tracking-[-0.05em] text-[#17443F]">카카오 알림톡 진행 순서</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5">
          <li>카카오 비즈니스 채널 준비</li>
          <li>공식 딜러사 또는 메시지 제공사 선택</li>
          <li>안부온 확인 필요 템플릿 등록</li>
          <li>카카오 템플릿 심사 승인</li>
          <li>승인된 템플릿 코드로 실제 알림톡 API 연결</li>
        </ol>
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
          ? 'bg-[#EFFFFA] text-[#2AA897] ring-[#CDEFE7]'
          : 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]')
      }
    >
      <span>{label}</span>
      <span>{ok ? '정상' : '확인 필요'}</span>
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-[#637B76]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-[#D6F6EC]"
      />
    </label>
  )
}
