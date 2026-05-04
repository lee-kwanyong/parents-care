'use client'

import { useEffect, useMemo, useState } from 'react'
import { CareButton } from '@/components/ui/CareButton'
import { CareCard } from '@/components/ui/CareCard'
import { StatusPill } from '@/components/ui/StatusPill'
import type { DeployCheck, DeployReadinessSummary } from '@/lib/deploy-readiness-engine'

type DeployReadinessData = {
  ok: boolean
  summary: DeployReadinessSummary
  checks: DeployCheck[]
  system: {
    vercelEnv: string
    vercelUrlPresent: boolean
    nodeEnv: string
  }
}

const groupLabels: Record<string, string> = {
  public_env: '공개 환경변수',
  server_secret: '서버 전용 시크릿',
  supabase: 'Supabase',
  storage: 'Storage',
  optional_provider: '선택 연동',
  vercel: 'Vercel',
  security: '보안'
}

function toneForStatus(status: string) {
  if (status === 'pass') return 'green'
  if (status === 'warning') return 'amber'
  if (status === 'fail') return 'red'
  return 'slate'
}

function labelForStatus(status: string) {
  if (status === 'pass') return '통과'
  if (status === 'warning') return '확인'
  if (status === 'fail') return '수정'
  return '선택'
}

export function DeployReadinessBoard() {
  const [data, setData] = useState<DeployReadinessData | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/deploy-readiness', { cache: 'no-store' })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '배포 점검 정보를 불러오지 못했습니다.')
      }

      setData(result)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '배포 점검 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const grouped = useMemo(() => {
    const map = new Map<string, DeployCheck[]>()

    for (const check of data?.checks || []) {
      const current = map.get(check.group) || []
      current.push(check)
      map.set(check.group, current)
    }

    return Array.from(map.entries())
  }, [data])

  if (loading) {
    return (
      <CareCard>
        <div className="text-center text-xl font-black">배포 점검 정보를 불러오는 중...</div>
      </CareCard>
    )
  }

  if (!data) {
    return (
      <CareCard tone="red">
        <h2 className="text-2xl font-black">배포 점검 실패</h2>
        <p className="mt-3 text-sm font-bold leading-6">{message}</p>
      </CareCard>
    )
  }

  const summary = data.summary

  return (
    <div>
      <section
        className={
          'rounded-3xl p-6 shadow-sm ' +
          (summary.readinessState === '배포 가능'
            ? 'bg-emerald-50'
            : summary.readinessState === '확인 필요'
              ? 'bg-amber-50'
              : 'bg-red-50')
        }
      >
        <p className="text-sm font-black text-slate-600">배포 전 점검판</p>
        <h2 className="mt-2 text-5xl font-black">{summary.readinessState}</h2>

        <div className="mt-5 grid gap-3 md:grid-cols-5">
          <Stat label="전체" value={summary.total} />
          <Stat label="통과" value={summary.pass} />
          <Stat label="확인" value={summary.warning} />
          <Stat label="수정" value={summary.fail} />
          <Stat label="선택" value={summary.optional} />
        </div>

        <div className="mt-5 rounded-2xl bg-white p-4 text-sm font-black">
          Vercel 환경: {data.system.vercelEnv} · Node 환경: {data.system.nodeEnv} · Vercel URL: {data.system.vercelUrlPresent ? '있음' : '없음'}
        </div>
      </section>

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

      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={load} className="rounded-2xl bg-slate-950 px-5 py-4 font-black text-white">
          다시 점검
        </button>
        <CareButton href="/mobile-check" tone="soft">
          모바일 점검
        </CareButton>
        <CareButton href="/ops/qa" tone="soft">
          QA 보드
        </CareButton>
      </div>

      {message ? (
        <p className="mt-5 rounded-2xl bg-blue-50 p-4 font-bold text-blue-900">
          {message}
        </p>
      ) : null}

      <section className="mt-8 grid gap-5 lg:grid-cols-2">
        {grouped.map(([group, checks]) => (
          <CareCard key={group}>
            <h3 className="text-2xl font-black">{groupLabels[group] || group}</h3>
            <div className="mt-4 space-y-3">
              {checks.map((check) => (
                <div key={check.key} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex flex-wrap gap-2">
                    <StatusPill text={labelForStatus(check.status)} tone={toneForStatus(check.status) as 'green' | 'amber' | 'red' | 'slate'} />
                    <StatusPill text={check.key} tone="slate" />
                  </div>
                  <div className="mt-3 text-lg font-black">{check.label}</div>
                  <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{check.message}</p>
                </div>
              ))}
            </div>
          </CareCard>
        ))}
      </section>

      <section className="mt-8 rounded-[2rem] bg-slate-950 p-6 text-white">
        <h2 className="text-2xl font-black">배포 전 수동 확인</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {[
            'npm run typecheck',
            'npm run build',
            'Vercel 환경변수 등록',
            'Supabase SQL 전체 실행',
            'care-files Storage 확인',
            'PWA 설치 확인',
            '모바일 실제 기기 확인',
            'Service Role 브라우저 노출 없음'
          ].map((item) => (
            <div key={item} className="rounded-2xl bg-white/10 p-4 text-sm font-black">
              {item}
            </div>
          ))}
        </div>
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
