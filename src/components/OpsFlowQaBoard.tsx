'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type CheckStatus = 'pass' | 'warn' | 'fail'

type FlowCheck = {
  group: string
  label: string
  status: CheckStatus
  description: string
  href?: string
  detail?: unknown
  count?: number
  critical?: boolean
}

type FlowQaData = {
  healthState: string
  readinessScore: number
  summary: {
    total: number
    pass: number
    warn: number
    fail: number
    criticalFail: number
  }
  checks: FlowCheck[]
  nextActions: Array<{
    title: string
    description: string
    href: string
    priority: 'urgent' | 'high' | 'normal'
  }>
  generatedAt: string
}

function statusLabel(status: CheckStatus) {
  if (status === 'pass') return '통과'
  if (status === 'warn') return '확인'
  return '수정'
}

function toneClass(status: CheckStatus) {
  if (status === 'fail') return 'bg-[#FFF0F1] text-[#965D65] ring-[#EFD2D6]'
  if (status === 'warn') return 'bg-[#FFF5DF] text-[#886B35] ring-[#F0DDB6]'
  return 'bg-[#F4FAF9] text-[#5B7774] ring-[#E2EFEC]'
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString('ko-KR')
  } catch {
    return value
  }
}

export function OpsFlowQaBoard() {
  const [data, setData] = useState<FlowQaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/ops/flow-qa', { cache: 'no-store' })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '통합 점검 데이터를 불러오지 못했습니다.')
      }

      setData(result)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '통합 점검 데이터를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const groupedChecks = useMemo(() => {
    const map = new Map<string, FlowCheck[]>()

    for (const check of data?.checks || []) {
      const list = map.get(check.group) || []
      list.push(check)
      map.set(check.group, list)
    }

    return Array.from(map.entries())
  }, [data?.checks])

  const heroTone =
    data?.healthState === '배포 전 수정'
      ? 'bg-[#FFF0F1]'
      : data?.healthState === '확인 필요'
        ? 'bg-[#FFF7E8]'
        : 'bg-[linear-gradient(135deg,#EAFBF6_0%,#F4FAFF_100%)]'

  return (
    <main className="min-h-screen bg-[#F7FCFB] px-5 py-8 text-[#24423F]">
      <section className="mx-auto max-w-7xl">
        <header className={`rounded-[2rem] p-6 shadow-[0_16px_44px_rgba(93,139,131,0.12)] ${heroTone}`}>
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-sm font-black text-[#19A98E]">정식 배포 전 통합 점검</div>
              <h1 className="mt-2 text-5xl font-black tracking-[-0.06em] md:text-7xl">
                {data?.healthState || '확인 중'}
              </h1>
              <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#607D79] md:text-lg md:leading-8">
                보호자 접수부터 케어 케이스, 매니저 검증, 현장 체크, 보호자 리포트, 알림, 정산까지 핵심 운영 흐름을 점검합니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={load}
                className="rounded-2xl bg-white px-5 py-4 font-black text-[#426C68] ring-1 ring-[#CFE7E2]"
              >
                다시 점검
              </button>
              <Link href="/ops" className="rounded-2xl bg-[#19B99A] px-5 py-4 font-black text-white">
                운영실 홈
              </Link>
            </div>
          </div>
        </header>

        {message ? (
          <div className="mt-5 rounded-2xl bg-[#FFF5DF] p-4 font-black text-[#886B35]">
            {message}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-8 rounded-[2rem] bg-white p-8 text-center text-xl font-black ring-1 ring-[#E3EFEC]">
            통합 흐름을 점검하는 중...
          </div>
        ) : data ? (
          <>
            <section className="mt-6 grid gap-3 md:grid-cols-5">
              <Stat label="준비 점수" value={`${data.readinessScore}%`} />
              <Stat label="통과" value={data.summary.pass} />
              <Stat label="확인" value={data.summary.warn} tone="warn" />
              <Stat label="수정" value={data.summary.fail} tone="fail" />
              <Stat label="필수 오류" value={data.summary.criticalFail} tone="fail" />
            </section>

            <section className="mt-8 rounded-[2rem] border border-[#E3EFEC] bg-white p-6 shadow-[0_14px_40px_rgba(93,139,131,0.09)]">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-3xl font-black tracking-[-0.04em]">다음 액션</h2>
                  <p className="mt-2 text-sm font-bold leading-6 text-[#607D79]">
                    위에서부터 처리하면 운영 흐름이 정리됩니다.
                  </p>
                </div>
                <div className="text-sm font-bold text-[#8AA29E]">
                  점검 시각: {formatDate(data.generatedAt)}
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {data.nextActions.map((action, index) => (
                  <Link
                    key={`${action.href}-${action.title}`}
                    href={action.href}
                    className="block rounded-2xl bg-[#F6FCFA] p-5 ring-1 ring-[#E3EFEC] transition hover:bg-[#EAFBF6]"
                  >
                    <div className="flex flex-wrap gap-2">
                      <Badge text={`${index + 1}순위`} status="pass" />
                      <Badge text={action.priority === 'urgent' ? '긴급' : action.priority === 'high' ? '중요' : '보통'} status={action.priority === 'normal' ? 'pass' : 'warn'} />
                    </div>
                    <h3 className="mt-3 text-xl font-black">{action.title}</h3>
                    <p className="mt-2 text-sm font-bold leading-6 text-[#607D79]">{action.description}</p>
                  </Link>
                ))}
              </div>
            </section>

            <section className="mt-8 space-y-5">
              {groupedChecks.map(([group, checks]) => (
                <div key={group} className="rounded-[2rem] border border-[#E3EFEC] bg-white p-6 shadow-[0_14px_40px_rgba(93,139,131,0.09)]">
                  <h2 className="text-2xl font-black">{group}</h2>

                  <div className="mt-5 grid gap-3 lg:grid-cols-2">
                    {checks.map((check) => (
                      <div key={`${check.group}-${check.label}`} className="rounded-2xl bg-[#F6FCFA] p-5 ring-1 ring-[#E3EFEC]">
                        <div className="flex flex-wrap gap-2">
                          <Badge text={statusLabel(check.status)} status={check.status} />
                          {check.critical ? <Badge text="필수" status={check.status === 'fail' ? 'fail' : 'warn'} /> : null}
                          {typeof check.count === 'number' ? <Badge text={`${check.count}건`} status="pass" /> : null}
                        </div>

                        <h3 className="mt-3 text-xl font-black">{check.label}</h3>
                        <p className="mt-2 text-sm font-bold leading-6 text-[#607D79]">{check.description}</p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {check.href ? (
                            <Link
                              href={check.href}
                              className="rounded-xl bg-white px-4 py-3 text-sm font-black text-[#426C68] ring-1 ring-[#CFE7E2]"
                            >
                              관련 화면 열기
                            </Link>
                          ) : null}

                          {check.detail ? (
                            <details className="w-full">
                              <summary className="cursor-pointer rounded-xl bg-white px-4 py-3 text-sm font-black text-[#607D79] ring-1 ring-[#E3EFEC]">
                                상세 보기
                              </summary>
                              <pre className="mt-2 max-h-44 overflow-auto rounded-xl bg-white p-4 text-xs text-[#607D79] ring-1 ring-[#E3EFEC]">
                                {JSON.stringify(check.detail, null, 2)}
                              </pre>
                            </details>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>

            <section className="mt-8 rounded-[2rem] bg-[linear-gradient(135deg,#EAFBF6_0%,#F4FAFF_100%)] p-6 shadow-[0_16px_44px_rgba(93,139,131,0.12)]">
              <h2 className="text-3xl font-black tracking-[-0.04em]">운영 시연 순서</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {[
                  ['/care-request', '1. 보호자 접수'],
                  ['/admin/ops/intake-inbox', '2. 접수함 변환'],
                  ['/admin/ops/care-cases', '3. 케어 케이스'],
                  ['/admin/ops/manager-vetting', '4. 매니저 검증'],
                  ['/admin/ops/manager-offers', '5. 매니저 알림'],
                  ['/manager/today', '6. 현장 체크'],
                  ['/child/reports', '7. 보호자 리포트'],
                  ['/admin/ops/notifications', '8. 알림 큐'],
                  ['/admin/ops/cron-health', '9. 자동 발송']
                ].map(([href, label]) => (
                  <Link
                    key={href}
                    href={href}
                    className="rounded-2xl bg-white p-5 text-center font-black ring-1 ring-[#E3EFEC] transition hover:bg-[#F6FCFA]"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </section>
          </>
        ) : null}
      </section>
    </main>
  )
}

function Stat({
  label,
  value,
  tone = 'pass'
}: {
  label: string
  value: string | number
  tone?: 'pass' | 'warn' | 'fail'
}) {
  return (
    <div
      className={
        'rounded-2xl bg-white p-5 ring-1 ' +
        (tone === 'fail'
          ? 'ring-[#F0D6D8]'
          : tone === 'warn'
            ? 'ring-[#F0DDB6]'
            : 'ring-[#E3EFEC]')
      }
    >
      <div className="text-sm font-black text-[#718A87]">{label}</div>
      <div className="mt-1 text-3xl font-black">{value}</div>
    </div>
  )
}

function Badge({ text, status }: { text: string; status: CheckStatus }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${toneClass(status)}`}>
      {text}
    </span>
  )
}
