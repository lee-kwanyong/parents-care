'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { demoRoles, demoScenarioSteps, type DemoRole } from '@/lib/demo-engine'
import type { DemoHealthCheck, DemoHealthSummary } from '@/lib/demo-health-engine'
import { CareButton } from '@/components/ui/CareButton'
import { CareCard } from '@/components/ui/CareCard'
import { StatusPill } from '@/components/ui/StatusPill'

type HealthData = {
  ok: boolean
  summary: DemoHealthSummary
  checks: DemoHealthCheck[]
  generatedAt: string
}

const groupLabels: Record<string, string> = {
  intake: '접수',
  parent: '부모님 정보',
  manager: '매니저 검증',
  matching: '매칭',
  field: '현장 배정',
  report: '리포트·알림',
  evaluation: '평가',
  infra: '인프라'
}

function statusLabel(status: string) {
  if (status === 'pass') return '통과'
  if (status === 'warning') return '필요'
  return '실패'
}

function statusTone(status: string) {
  if (status === 'pass') return 'green'
  if (status === 'warning') return 'amber'
  return 'red'
}

export function BuyerDemoBoard() {
  const [role, setRole] = useState<DemoRole>('guardian')
  const [secret, setSecret] = useState('')
  const [health, setHealth] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [message, setMessage] = useState('')

  async function loadHealth() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/demo/health', { cache: 'no-store' })
      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '데모 헬스체크 실패')
      }

      setHealth(data)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '데모 헬스체크 실패')
    } finally {
      setLoading(false)
    }
  }

  async function chooseRole(nextRole: DemoRole) {
    setRole(nextRole)

    try {
      const response = await fetch('/api/demo/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '역할 설정 실패')
      }

      setMessage(`${demoRoles.find((item) => item.code === nextRole)?.label || nextRole} 역할로 설정했습니다.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '역할 설정 실패')
    }
  }

  async function seedDemo() {
    setSeeding(true)
    setMessage('')

    try {
      const response = await fetch('/api/demo/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, runLabel: 'Buyer Demo Seed' })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || '데모 데이터 생성 실패')
      }

      setMessage(data.message || '데모 데이터 생성 완료')
      await loadHealth()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '데모 데이터 생성 실패')
    } finally {
      setSeeding(false)
    }
  }

  useEffect(() => {
    loadHealth()
  }, [])

  const grouped = useMemo(() => {
    const map = new Map<string, DemoHealthCheck[]>()

    for (const check of health?.checks || []) {
      const current = map.get(check.group) || []
      current.push(check)
      map.set(check.group, current)
    }

    return Array.from(map.entries())
  }, [health])

  const summary = health?.summary

  return (
    <div>
      <section
        className={
          'rounded-[2rem] p-6 shadow-sm md:p-8 ' +
          (!summary
            ? 'bg-white'
            : summary.readinessState === '시연 가능'
              ? 'bg-emerald-50'
              : summary.readinessState === '데이터 생성 필요'
                ? 'bg-amber-50'
                : 'bg-red-50')
        }
      >
        <p className="text-sm font-black text-slate-600">BUYER DEMO HEALTH</p>
        <h2 className="mt-3 text-5xl font-black">
          {summary?.readinessState || '확인 중'}
        </h2>

        <p className="mt-4 max-w-3xl text-lg font-bold leading-8 text-slate-700">
          바이어가 실제 URL에서 접수, 운영실 처리, 매니저 검증, 매칭, 현장 배정, 리포트, 평가가 연결되는지 확인할 수 있는 시연 페이지입니다.
        </p>

        {summary ? (
          <div className="mt-6 grid gap-3 md:grid-cols-5">
            <Stat label="전체" value={summary.total} />
            <Stat label="통과" value={summary.pass} />
            <Stat label="필요" value={summary.warning} />
            <Stat label="실패" value={summary.fail} />
            <Stat label="단계" value={demoScenarioSteps.length} />
          </div>
        ) : null}
      </section>

      {summary ? (
        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black">다음 액션</h2>
          <div className="mt-4 space-y-3">
            {summary.nextActions.map((action, index) => (
              <div key={action} className="rounded-2xl bg-slate-50 p-4 text-lg font-black">
                {index + 1}. {action}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-6 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <CareCard tone="white">
          <h2 className="text-2xl font-black">시연 역할 선택</h2>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
            바이어 시연 중 보호자, 부모님, 매니저, 운영실 화면을 빠르게 전환합니다.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {demoRoles.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => chooseRole(item.code)}
                className={
                  'rounded-2xl border p-4 text-left ' +
                  (role === item.code
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 bg-slate-50')
                }
              >
                <div className="font-black">{item.label}</div>
                <p className="mt-1 text-xs font-bold leading-5 text-slate-600">{item.description}</p>
              </button>
            ))}
          </div>

          <div className="mt-5">
            <CareButton href={demoRoles.find((item) => item.code === role)?.homePath || '/demo-start'} tone="dark" className="md:w-full">
              선택 역할 화면 열기
            </CareButton>
          </div>
        </CareCard>

        <CareCard tone="blue">
          <h2 className="text-2xl font-black">데모 데이터 생성</h2>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
            데모 데이터가 부족하면 여기서 생성합니다. 로컬은 비워도 되고, Production은 DEMO_SEED_SECRET 또는 CRON_SECRET이 필요합니다.
          </p>

          <input
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
            className="mt-5 w-full rounded-2xl border border-slate-200 p-4"
            placeholder="Production secret"
          />

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={seedDemo}
              disabled={seeding}
              className="rounded-2xl bg-emerald-600 px-5 py-4 font-black text-white disabled:opacity-50"
            >
              {seeding ? '생성 중...' : '데모 데이터 생성'}
            </button>
            <button onClick={loadHealth} className="rounded-2xl bg-slate-950 px-5 py-4 font-black text-white">
              헬스체크 다시 확인
            </button>
          </div>

          {message ? (
            <p className="mt-4 rounded-2xl bg-white p-4 text-sm font-black text-blue-950">
              {message}
            </p>
          ) : null}
        </CareCard>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-2">
        {loading ? (
          <CareCard>
            <p className="text-xl font-black">데모 상태를 불러오는 중...</p>
          </CareCard>
        ) : grouped.map(([group, checks]) => (
          <CareCard key={group} tone="white">
            <h3 className="text-2xl font-black">{groupLabels[group] || group}</h3>
            <div className="mt-4 space-y-3">
              {checks.map((check) => (
                <div key={check.key} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex flex-wrap gap-2">
                    <StatusPill text={statusLabel(check.status)} tone={statusTone(check.status) as 'green' | 'amber' | 'red'} />
                    <StatusPill text={check.key} tone="slate" />
                    {check.count !== null ? <StatusPill text={`${check.count}건`} tone="slate" /> : null}
                  </div>
                  <div className="mt-3 text-lg font-black">{check.label}</div>
                  <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{check.message}</p>
                  {check.path ? (
                    <Link href={check.path} className="mt-3 inline-block rounded-xl bg-white px-3 py-2 text-xs font-black ring-1 ring-slate-200">
                      화면 열기: {check.path}
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          </CareCard>
        ))}
      </section>

      <section className="mt-10">
        <h2 className="text-3xl font-black">15분 시연 순서</h2>
        <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
          자료 설명보다 이 순서대로 직접 화면을 열어 보여주는 것이 M&A 검토에 더 효과적입니다.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {demoScenarioSteps.map((step) => (
            <CareCard key={step.order}>
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
                화면 열기
              </Link>
            </CareCard>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-[2rem] bg-slate-950 p-6 text-white md:p-8">
        <h2 className="text-3xl font-black">바이어에게 보여줄 핵심 문장</h2>
        <p className="mt-5 max-w-4xl text-xl font-black leading-9 text-blue-200">
          “이 데모는 전국 운영 전 단계의 MVP입니다. 보호자 걱정 접수, 운영실 정리, 검증 매니저 매칭, 부모님 화면, 리포트, 평가가 실제 DB에 저장되고 화면에서 확인됩니다.”
        </p>
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <div className="text-sm font-black text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-black">{value}</div>
    </div>
  )
}
