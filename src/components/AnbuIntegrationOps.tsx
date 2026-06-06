'use client'

import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'

type IntegrationStatus = {
  key: string
  label: string
  configured: boolean
  desc: string
}

type NotificationResult = {
  ok?: boolean
  message?: string
  mode?: string
  detail?: unknown
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={'rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6 ' + className}>
      {children}
    </section>
  )
}

function Badge({ configured }: { configured: boolean }) {
  return (
    <span
      className={
        'rounded-full px-3 py-1 text-xs font-black ring-1 ' +
        (configured
          ? 'bg-[#EFFFFA] text-[#2AA897] ring-[#CDEFE7]'
          : 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]')
      }
    >
      {configured ? '설정됨' : '미설정'}
    </span>
  )
}

export function AnbuIntegrationOps() {
  const [statuses, setStatuses] = useState<IntegrationStatus[]>([])
  const [result, setResult] = useState<NotificationResult | null>(null)
  const [loading, setLoading] = useState(false)

  async function loadStatus() {
    const response = await fetch('/api/anbu-integrations/status', { cache: 'no-store' })
    const data = await response.json()
    setStatuses(data.statuses || [])
  }

  useEffect(() => {
    loadStatus()
  }, [])

  async function sendTest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setResult(null)

    const form = new FormData(event.currentTarget)

    const payload = {
      channel: String(form.get('channel') || 'app'),
      toName: String(form.get('toName') || ''),
      toPhone: String(form.get('toPhone') || ''),
      toEmail: String(form.get('toEmail') || ''),
      title: String(form.get('title') || ''),
      body: String(form.get('body') || ''),
      reason: 'ops-test',
      url: '/child/dashboard'
    }

    const response = await fetch('/api/anbu-notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deliveryMode: 'send',
        payload
      })
    })

    const data = await response.json().catch(() => ({}))
    setResult(data)
    setLoading(false)
  }

  async function createRoutineNotifications() {
    setLoading(true)
    setResult(null)

    const response = await fetch('/api/anbu-cron/routines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dryRun: false })
    })

    const data = await response.json().catch(() => ({}))
    setResult(data)
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-5 py-8 text-[#17443F]">
      <section className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            운영실 · 외부연동
          </div>
          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            SMS, 카카오 알림톡, 결제 연동을 준비합니다.
          </h1>
          <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#637B76] sm:text-lg sm:leading-8">
            API 키가 없으면 알림은 발송함에 저장됩니다. Webhook URL과 결제 키를 넣으면 실제 발송·결제 흐름으로 확장됩니다.
          </p>
        </section>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {statuses.map((item) => (
            <Card key={item.key}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black tracking-[-0.05em]">{item.label}</h2>
                  <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">{item.desc}</p>
                </div>
                <Badge configured={item.configured} />
              </div>
            </Card>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <h2 className="text-2xl font-black tracking-[-0.05em]">테스트 알림 보내기</h2>
            <form onSubmit={sendTest} className="mt-5 grid gap-3">
              <label className="grid gap-2">
                <span className="text-sm font-black text-[#637B76]">채널</span>
                <select
                  name="channel"
                  className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold"
                >
                  <option value="app">앱 알림</option>
                  <option value="sms">SMS</option>
                  <option value="kakao">카카오 알림톡</option>
                  <option value="email">이메일</option>
                </select>
              </label>

              <Input label="수신자 이름" name="toName" placeholder="예: 보호자" />
              <Input label="휴대폰" name="toPhone" placeholder="예: 01012345678" />
              <Input label="이메일" name="toEmail" placeholder="선택" />
              <Input label="제목" name="title" placeholder="예: 부모님 안부 확인 필요" />
              <label className="grid gap-2">
                <span className="text-sm font-black text-[#637B76]">내용</span>
                <textarea
                  name="body"
                  rows={4}
                  className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold leading-6"
                  placeholder="예: 오늘 점심 약 확인이 아직 되지 않았습니다."
                />
              </label>

              <button
                disabled={loading}
                className="rounded-2xl bg-[#247A71] px-5 py-4 text-base font-black text-white disabled:opacity-60"
              >
                {loading ? '처리 중...' : '테스트 알림 생성'}
              </button>
            </form>
          </Card>

          <div className="space-y-5">
            <Card>
              <h2 className="text-2xl font-black tracking-[-0.05em]">루틴 알림 생성</h2>
              <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">
                Supabase에 등록된 복약·병원 일정 중 현재 시간과 가까운 건을 알림 발송함에 생성합니다.
                Vercel Cron 또는 외부 Cron에서 이 API를 호출하면 자동 알림 루틴이 됩니다.
              </p>
              <button
                onClick={createRoutineNotifications}
                disabled={loading}
                className="mt-5 rounded-2xl bg-[#20C5A8] px-5 py-4 text-base font-black text-white disabled:opacity-60"
              >
                루틴 알림 생성 테스트
              </button>
            </Card>

            <Card className="bg-[#F8FFFC]">
              <h2 className="text-2xl font-black tracking-[-0.05em]">처리 결과</h2>
              {result ? (
                <pre className="mt-4 max-h-[24rem] overflow-auto rounded-2xl bg-[#247A71] p-4 text-xs font-bold leading-6 text-[#E7FFF7]">
                  {JSON.stringify(result, null, 2)}
                </pre>
              ) : (
                <p className="mt-4 rounded-2xl bg-white p-4 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D6EDE7]">
                  아직 실행 결과가 없습니다.
                </p>
              )}
            </Card>
          </div>
        </div>

        <Card>
          <h2 className="text-2xl font-black tracking-[-0.05em]">필요한 환경변수</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              'ANBU_NOTIFICATION_WEBHOOK_URL',
              'ANBU_NOTIFICATION_WEBHOOK_TOKEN',
              'ANBU_SMS_FROM',
              'KAKAO_ALIMTALK_SENDER_KEY',
              'NEXT_PUBLIC_TOSS_CLIENT_KEY',
              'TOSS_SECRET_KEY',
              'CRON_SECRET'
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-[#FAFFFD] p-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                {item}
              </div>
            ))}
          </div>
        </Card>
      </section>
    </main>
  )
}

function Input({
  label,
  name,
  placeholder = ''
}: {
  label: string
  name: string
  placeholder?: string
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-[#637B76]">{label}</span>
      <input
        name={name}
        placeholder={placeholder}
        className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold"
      />
    </label>
  )
}
