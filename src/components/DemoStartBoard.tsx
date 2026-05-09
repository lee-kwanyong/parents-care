'use client'

import { useState } from 'react'
import Link from 'next/link'
import { demoAccounts, demoRoles, demoScenarioSteps, homePathForDemoRole, type DemoRole } from '@/lib/demo-engine'
import { CareButton } from '@/components/ui/CareButton'
import { CareCard } from '@/components/ui/CareCard'
import { StatusPill } from '@/components/ui/StatusPill'

type SeedResult = {
  ok: boolean
  status: string
  message: string
  createdObjects: Record<string, unknown>
  results: Array<{
    label: string
    ok: boolean
    error?: unknown
  }>
}

export function DemoStartBoard() {
  const [role, setRole] = useState<DemoRole>('guardian')
  const [secret, setSecret] = useState('')
  const [seeding, setSeeding] = useState(false)
  const [seedResult, setSeedResult] = useState<SeedResult | null>(null)
  const [message, setMessage] = useState('')

  async function setDemoRole(nextRole: DemoRole) {
    setRole(nextRole)
    setMessage('')

    try {
      const response = await fetch('/api/demo/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '데모 역할 변경 실패')
      }

      setMessage(`${demoRoles.find((item) => item.code === nextRole)?.label || nextRole} 역할로 설정했습니다.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '데모 역할 변경 실패')
    }
  }

  async function seedDemo() {
    setSeeding(true)
    setSeedResult(null)
    setMessage('')

    try {
      const response = await fetch('/api/demo/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, runLabel: '부모님 걱정해결 케어 데모 데이터' })
      })

      const data = await response.json()

      setSeedResult(data)

      if (!response.ok) {
        throw new Error(data.message || '데모 데이터 생성 실패')
      }

      setMessage(data.message || '데모 데이터 생성이 완료됐습니다.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '데모 데이터 생성 실패')
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div>
      <section className="rounded-[2rem] bg-slate-950 p-6 text-white md:p-8">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black">DEMO MODE</span>
          <span className="rounded-full bg-emerald-300 px-3 py-1 text-xs font-black text-slate-950">M&A 시연용</span>
        </div>

        <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
          실제로 움직이는
          <br />
          부모님 케어 데모
        </h1>

        <p className="mt-5 max-w-3xl text-lg font-bold leading-8 text-slate-200">
          보호자 걱정 접수부터 사진·카톡 접수, 운영실 처리, 검증 매니저 매칭, 부모님 큰 글씨 화면, 리포트, 평가까지 한 번에 시연합니다.
        </p>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-5">
        {demoRoles.map((item) => (
          <button
            key={item.code}
            type="button"
            onClick={() => setDemoRole(item.code)}
            className={
              'rounded-3xl border p-4 text-left transition ' +
              (role === item.code
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-slate-200 bg-white hover:bg-slate-50')
            }
          >
            <div className="text-xl font-black">{item.label}</div>
            <p className="mt-2 text-xs font-bold leading-5 text-slate-600">{item.description}</p>
            <Link href={item.homePath} className="mt-4 inline-block rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
              화면 열기
            </Link>
          </button>
        ))}
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <CareCard tone="white">
          <div className="flex flex-wrap gap-2">
            <StatusPill text="데모 데이터" tone="green" />
            <StatusPill text="Supabase 저장" tone="slate" />
          </div>

          <h2 className="mt-4 text-3xl font-black">데모 데이터를 자동 생성합니다</h2>
          <p className="mt-3 text-sm font-bold leading-6 text-slate-600">
            보호자, 매니저, 운영실 계정과 어머니 케이스, 검증 매니저, 매칭 요청, 현장 배정, 평가 데이터를 생성합니다.
          </p>

          <input
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
            className="mt-5 w-full rounded-2xl border border-slate-200 p-4"
            placeholder="Production에서는 DEMO_SEED_SECRET 또는 CRON_SECRET 입력"
          />

          <button
            onClick={seedDemo}
            disabled={seeding}
            className="mt-4 w-full rounded-3xl bg-emerald-600 px-6 py-5 text-xl font-black text-white disabled:opacity-50"
          >
            {seeding ? '데모 데이터 생성 중...' : '데모 데이터 생성'}
          </button>

          {message ? (
            <p className="mt-4 rounded-2xl bg-blue-50 p-4 text-sm font-black text-blue-900">
              {message}
            </p>
          ) : null}
        </CareCard>

        <CareCard tone="blue">
          <h2 className="text-3xl font-black">데모 계정</h2>
          <p className="mt-3 text-sm font-bold leading-6 text-slate-700">
            이메일/비밀번호 로그인 테스트용 계정입니다. Supabase Service Role Key가 있으면 자동 생성됩니다.
          </p>

          <div className="mt-5 space-y-3">
            {demoAccounts.map((account) => (
              <div key={account.email} className="rounded-2xl bg-white p-4">
                <div className="font-black">{account.label}</div>
                <p className="mt-1 text-sm font-bold text-slate-600">{account.email}</p>
                <p className="mt-1 text-sm font-bold text-slate-600">{account.password}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <CareButton href="/login" tone="dark">
              로그인 화면
            </CareButton>
            <CareButton href={homePathForDemoRole(role)} tone="white">
              현재 역할 홈
            </CareButton>
          </div>
        </CareCard>
      </section>

      {seedResult ? (
        <section className="mt-8 rounded-[2rem] bg-white p-5 shadow-sm md:p-7">
          <h2 className="text-2xl font-black">생성 결과</h2>
          <p className="mt-2 text-sm font-bold text-slate-600">{seedResult.message}</p>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {seedResult.results?.map((result) => (
              <div key={result.label} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex flex-wrap gap-2">
                  <StatusPill text={result.ok ? '성공' : '실패'} tone={result.ok ? 'green' : 'red'} />
                  <StatusPill text={result.label} tone="slate" />
                </div>
                {!result.ok ? (
                  <pre className="mt-3 max-h-32 overflow-auto rounded-xl bg-red-50 p-3 text-xs text-red-700">
                    {JSON.stringify(result.error, null, 2)}
                  </pre>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="text-3xl font-black">M&A 데모 시나리오</h2>
        <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
          바이어에게는 아래 순서대로 15분 안에 보여주면 됩니다.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {demoScenarioSteps.map((step) => (
            <CareCard key={step.order} tone="white">
              <div className="flex flex-wrap gap-2">
                <StatusPill text={`${step.order}단계`} tone="green" />
                <StatusPill text={demoRoles.find((item) => item.code === step.role)?.label || step.role} tone="slate" />
              </div>

              <h3 className="mt-4 text-2xl font-black">{step.title}</h3>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{step.description}</p>

              <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                <div className="text-xs font-black text-slate-500">확인 포인트</div>
                <p className="mt-1 text-sm font-bold leading-6">{step.checkPoint}</p>
              </div>

              <Link href={step.path} className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-4 font-black text-white">
                화면 열기: {step.path}
              </Link>
            </CareCard>
          ))}
        </div>
      </section>
    </div>
  )
}
