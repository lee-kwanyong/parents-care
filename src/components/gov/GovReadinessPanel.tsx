'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Status = 'ready' | 'warning' | 'missing'

type CheckItem = {
  key: string
  label: string
  status: Status
  detail: string
  action?: string
}

type RouteCheck = {
  route: string
  status: Status
  code?: number
  detail: string
}

type ReadinessData = {
  ok: boolean
  generatedAt: string
  readinessScore: number
  status: Status
  sections: {
    environmentChecks: CheckItem[]
    databaseChecks: CheckItem[]
    publicSectorChecks: CheckItem[]
  }
  routeTargets: string[]
  manualScenarios: string[]
  recommendedNextActions: string[]
}

function statusLabel(status: Status) {
  if (status === 'ready') return '준비됨'
  if (status === 'warning') return '점검 필요'
  return '미준비'
}

function statusClass(status: Status) {
  if (status === 'ready') return 'bg-[#EFFFF9] text-[#116D5F] ring-[#CDEFE5]'
  if (status === 'warning') return 'bg-[#FFF8E8] text-[#795313] ring-[#F4D8A5]'
  return 'bg-[#FFF1F1] text-[#8A2525] ring-[#F3BBBB]'
}

function scoreClass(score: number) {
  if (score >= 85) return 'bg-[#EFFFF9] text-[#116D5F] ring-[#CDEFE5]'
  if (score >= 60) return 'bg-[#FFF8E8] text-[#795313] ring-[#F4D8A5]'
  return 'bg-[#FFF1F1] text-[#8A2525] ring-[#F3BBBB]'
}

function countStatus(items: CheckItem[], status: Status) {
  return items.filter((item) => item.status === status).length
}

export function GovReadinessPanel() {
  const [data, setData] = useState<ReadinessData | null>(null)
  const [routeChecks, setRouteChecks] = useState<RouteCheck[]>([])
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(true)
  const [routeLoading, setRouteLoading] = useState(false)

  const allItems = useMemo(() => {
    if (!data) return []
    return [
      ...data.sections.environmentChecks,
      ...data.sections.databaseChecks,
      ...data.sections.publicSectorChecks
    ]
  }, [data])

  const routeScore = useMemo(() => {
    if (routeChecks.length === 0) return 0
    const points = routeChecks.reduce((sum, item) => {
      if (item.status === 'ready') return sum + 1
      if (item.status === 'warning') return sum + 0.5
      return sum
    }, 0)

    return Math.round((points / routeChecks.length) * 100)
  }, [routeChecks])

  async function load() {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/gov-readiness', { cache: 'no-store' })
      const json = await response.json().catch(() => ({}))

      if (!response.ok || !json.ok) {
        setMessage(json.message || '준비상태를 불러오지 못했습니다.')
        setDebug(JSON.stringify(json.detail || json, null, 2))
        return
      }

      setData(json)
      await checkRoutes(json.routeTargets || [])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '준비상태를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function checkRoutes(routes: string[]) {
    if (!routes.length) return

    setRouteLoading(true)

    const results: RouteCheck[] = []

    for (const route of routes) {
      try {
        const response = await fetch(route, {
          method: 'GET',
          cache: 'no-store'
        })

        results.push({
          route,
          status: response.status < 500 ? 'ready' : 'missing',
          code: response.status,
          detail: response.status < 500 ? '페이지 접근 가능' : '서버 오류'
        })
      } catch (error) {
        results.push({
          route,
          status: 'missing',
          detail: error instanceof Error ? error.message : '접근 실패'
        })
      }
    }

    setRouteChecks(results)
    setRouteLoading(false)
  }

  async function copyReport() {
    if (!data) return

    const report = [
      '# 안부웍스 지자체 제출 전 준비상태',
      '',
      `- 총점: ${data.readinessScore}점`,
      `- 페이지 점검: ${routeScore}점`,
      `- 생성 시각: ${data.generatedAt}`,
      '',
      '## 미준비 항목',
      ...allItems
        .filter((item) => item.status === 'missing')
        .map((item) => `- ${item.label}: ${item.detail}${item.action ? ` / 조치: ${item.action}` : ''}`),
      '',
      '## 점검 필요 항목',
      ...allItems
        .filter((item) => item.status === 'warning')
        .map((item) => `- ${item.label}: ${item.detail}${item.action ? ` / 조치: ${item.action}` : ''}`),
      '',
      '## 추천 다음 행동',
      ...data.recommendedNextActions.map((item) => `- ${item}`)
    ].join('\n')

    try {
      await navigator.clipboard.writeText(report)
      setMessage('준비상태 보고서가 복사되었습니다.')
    } catch {
      setMessage('복사에 실패했습니다.')
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-5 text-[#173B36] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            지자체 제출 전 최종 검수판
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            서비스가 제출 가능한 상태인지
            <br />
            한눈에 확인합니다.
          </h1>

          <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            부모님 입력, 자녀 리포트, 가족 실행 보드, 지자체 운영실, IoT 관제 준비, 제출 PDF, DB 테이블, 환경변수, 공공 제안 체크리스트를 점검합니다.
          </p>

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#FFF8E8] p-4 text-sm font-black leading-7 text-[#795313] ring-1 ring-[#F4D8A5]">
              {message}
            </div>
          ) : null}

          {debug ? (
            <details className="mt-4 rounded-2xl bg-[#123F38] p-4 text-xs font-bold leading-6 text-[#E7FFF7]">
              <summary className="cursor-pointer text-sm font-black">상세 오류 보기</summary>
              <pre className="mt-3 max-h-60 overflow-auto whitespace-pre-wrap">{debug}</pre>
            </details>
          ) : null}
        </section>

        {data ? (
          <>
            <section className="grid gap-4 md:grid-cols-4">
              <MetricCard
                title="제출 준비 점수"
                value={`${data.readinessScore}점`}
                desc={statusLabel(data.status)}
                status={data.status}
                score={data.readinessScore}
              />
              <MetricCard
                title="페이지 접근 점수"
                value={routeLoading ? '점검 중' : `${routeScore}점`}
                desc={`${routeChecks.filter((item) => item.status === 'ready').length}/${routeChecks.length} 페이지 접근 가능`}
                status={routeScore >= 85 ? 'ready' : routeScore >= 60 ? 'warning' : 'missing'}
                score={routeScore}
              />
              <MetricCard
                title="미준비"
                value={`${countStatus(allItems, 'missing')}개`}
                desc="SQL·환경변수·필수 구성 누락"
                status={countStatus(allItems, 'missing') > 0 ? 'missing' : 'ready'}
              />
              <MetricCard
                title="점검 필요"
                value={`${countStatus(allItems, 'warning')}개`}
                desc="제출 전 수동 확인 필요"
                status={countStatus(allItems, 'warning') > 0 ? 'warning' : 'ready'}
              />
            </section>

            <section className="grid gap-5 lg:grid-cols-3">
              <CheckSection title="환경변수" items={data.sections.environmentChecks} />
              <CheckSection title="Supabase DB" items={data.sections.databaseChecks} />
              <CheckSection title="공공 제출 체크" items={data.sections.publicSectorChecks} />
            </section>

            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-3xl font-black tracking-[-0.06em]">주요 페이지 접근 테스트</h2>
                  <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                    서비스 핵심 화면이 배포 환경에서 열리는지 확인합니다.
                  </p>
                </div>

                <button
                  onClick={() => checkRoutes(data.routeTargets)}
                  disabled={routeLoading}
                  className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
                >
                  {routeLoading ? '점검 중' : '페이지 다시 점검'}
                </button>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {routeChecks.map((item) => (
                  <article key={item.route} className={'rounded-2xl p-4 ring-1 ' + statusClass(item.status)}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-lg font-black">{item.route}</div>
                      <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-current">
                        {item.code || '-'}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-bold leading-6 opacity-80">{item.detail}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
              <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
                <h2 className="text-2xl font-black tracking-[-0.05em]">수동 시나리오 테스트</h2>
                <div className="mt-5 space-y-3">
                  {data.manualScenarios.map((item, index) => (
                    <div key={item} className="flex gap-3 rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8]">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8FAF5] text-sm font-black text-[#11977F]">
                        {index + 1}
                      </div>
                      <div className="text-sm font-black leading-7 text-[#637B76]">{item}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
                <h2 className="text-2xl font-black tracking-[-0.05em]">추천 다음 행동</h2>
                <div className="mt-5 space-y-3">
                  {data.recommendedNextActions.map((item, index) => (
                    <div key={item} className="flex gap-3 rounded-2xl bg-[#EFFFF9] p-4 text-[#116D5F] ring-1 ring-[#CDEFE5]">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/70 text-sm font-black">
                        {index + 1}
                      </div>
                      <div className="text-sm font-black leading-7">{item}</div>
                    </div>
                  ))}
                </div>
              </section>
            </section>

            <section className="rounded-[2rem] bg-[#123F38] p-5 text-white sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">제출 전 최종 판단</h2>
              <p className="mt-4 text-sm font-bold leading-7 text-[#E7FFF7]">
                {data.readinessScore >= 85
                  ? '현재 상태는 지자체 제안 미팅용 데모와 제출 PDF 준비가 가능한 수준입니다. 실제 부모님·보호자 시나리오 테스트 후 기관 리스트를 정리하세요.'
                  : data.readinessScore >= 60
                    ? '기본 구조는 준비됐지만 일부 SQL·환경변수·수동 검수 항목이 남아 있습니다. 미준비 항목을 먼저 해결하세요.'
                    : '아직 제출 전 검수 항목이 많이 남아 있습니다. Supabase SQL 실행과 환경변수 설정을 먼저 확인하세요.'}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-4">
                <button
                  onClick={copyReport}
                  className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#173B36]"
                >
                  점검 보고서 복사
                </button>

                <Link
                  href="/gov/submission/print"
                  className="rounded-2xl bg-[#20BFA7] px-5 py-4 text-center text-sm font-black text-white"
                >
                  제출 PDF 인쇄본
                </Link>

                <Link
                  href="/gov/submission"
                  className="rounded-2xl bg-white/10 px-5 py-4 text-center text-sm font-black text-white ring-1 ring-white/30"
                >
                  제출 패키지
                </Link>

                <button
                  onClick={load}
                  disabled={loading}
                  className="rounded-2xl bg-white/10 px-5 py-4 text-sm font-black text-white ring-1 ring-white/30 disabled:opacity-50"
                >
                  다시 점검
                </button>
              </div>
            </section>
          </>
        ) : (
          <section className="rounded-[2rem] bg-white p-6 text-center shadow-sm ring-1 ring-[#D8EEE8]">
            <div className="text-2xl font-black">{loading ? '준비상태 점검 중입니다.' : '준비상태를 불러오지 못했습니다.'}</div>
          </section>
        )}
      </section>
    </main>
  )
}

function MetricCard({
  title,
  value,
  desc,
  status,
  score
}: {
  title: string
  value: string
  desc: string
  status: Status
  score?: number
}) {
  return (
    <article className={'rounded-[2rem] p-5 shadow-sm ring-1 ' + (typeof score === 'number' ? scoreClass(score) : statusClass(status))}>
      <div className="text-sm font-black opacity-70">{title}</div>
      <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{value}</div>
      <p className="mt-2 text-sm font-bold leading-6 opacity-75">{desc}</p>
    </article>
  )
}

function CheckSection({ title, items }: { title: string; items: CheckItem[] }) {
  return (
    <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
      <h2 className="text-2xl font-black tracking-[-0.05em]">{title}</h2>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <article key={item.key} className={'rounded-2xl p-4 ring-1 ' + statusClass(item.status)}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-black">{item.label}</h3>
              <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-current">
                {statusLabel(item.status)}
              </span>
            </div>
            <p className="mt-2 text-sm font-bold leading-6 opacity-80">{item.detail}</p>
            {item.action ? (
              <p className="mt-2 text-xs font-black leading-6 opacity-75">조치: {item.action}</p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}

export default GovReadinessPanel
