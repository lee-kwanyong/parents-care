'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type DemoData = {
  summary: Record<string, number>
  latestCases: Record<string, any>[]
  latestReports: Record<string, any>[]
  latestNotifications: Record<string, any>[]
}

function formatDate(value: string | null | undefined) {
  if (!value) return ''
  try {
    return new Date(value).toLocaleString('ko-KR')
  } catch {
    return value
  }
}

export function OpsDemoScenarioBoard() {
  const [data, setData] = useState<DemoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/ops/demo-scenario', { cache: 'no-store' })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '데모 시나리오 상태를 불러오지 못했습니다.')
      }

      setData({
        summary: result.summary || {},
        latestCases: result.latestCases || [],
        latestReports: result.latestReports || [],
        latestNotifications: result.latestNotifications || []
      })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '데모 시나리오 상태를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function postAction(action: string) {
    setBusy(true)
    setMessage('')

    try {
      const response = await fetch('/api/ops/demo-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '처리 중 오류가 발생했습니다.')
      }

      setMessage(result.message || '처리됐습니다.')
      setData({
        summary: result.summary || {},
        latestCases: result.latestCases || [],
        latestReports: result.latestReports || [],
        latestNotifications: result.latestNotifications || []
      })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const summary = data?.summary || {}

  return (
    <main className="min-h-screen bg-[#F7FCFB] px-5 py-8 text-[#24423F]">
      <section className="mx-auto max-w-7xl">
        <header className="rounded-[2rem] bg-[linear-gradient(135deg,#EAFBF6_0%,#F4FAFF_100%)] p-6 shadow-[0_16px_44px_rgba(93,139,131,0.12)]">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-sm font-black text-[#19A98E]">바이어·운영 시연</div>
              <h1 className="mt-2 text-5xl font-black tracking-[-0.06em] md:text-7xl">
                원클릭 통합 시나리오
              </h1>
              <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#607D79] md:text-lg md:leading-8">
                버튼 하나로 보호자 접수부터 매니저 배정, 현장 체크, 보호자 리포트, 알림, 정산까지 전체 운영 흐름을 생성합니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={load}
                className="rounded-2xl bg-white px-5 py-4 font-black text-[#426C68] ring-1 ring-[#CFE7E2]"
              >
                새로고침
              </button>
              <Link href="/ops/flow-qa" className="rounded-2xl bg-[#19B99A] px-5 py-4 font-black text-white">
                통합 점검
              </Link>
            </div>
          </div>
        </header>

        {message ? (
          <div className="mt-5 rounded-2xl bg-[#FFF5DF] p-4 font-black text-[#886B35]">
            {message}
          </div>
        ) : null}

        <section className="mt-6 grid gap-3 md:grid-cols-5">
          <Stat label="접수" value={summary.intakes || 0} />
          <Stat label="케이스" value={summary.cases || 0} />
          <Stat label="검증 매니저" value={summary.managers || 0} />
          <Stat label="현장 배정" value={summary.assignments || 0} />
          <Stat label="리포트" value={summary.guardianReports || 0} />
          <Stat label="알림" value={summary.notifications || 0} />
          <Stat label="정산" value={summary.earnings || 0} />
          <Stat label="체크 이벤트" value={summary.checkEvents || 0} />
          <Stat label="매칭 요청" value={summary.matchingRequests || 0} />
          <Stat label="매니저 제안" value={summary.offers || 0} />
        </section>

        <section className="mt-8 rounded-[2rem] border border-[#E3EFEC] bg-white p-6 shadow-[0_14px_40px_rgba(93,139,131,0.09)]">
          <h2 className="text-3xl font-black tracking-[-0.04em]">시연 시작</h2>
          <p className="mt-2 text-sm font-bold leading-6 text-[#607D79]">
            바이어 앞에서는 먼저 원클릭 시나리오를 생성한 뒤, 아래 시연 순서대로 화면을 열면 됩니다.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <button
              disabled={busy}
              onClick={() => postAction('create_full_demo')}
              className="rounded-3xl bg-[#19B99A] px-6 py-5 text-xl font-black text-white shadow-[0_18px_45px_rgba(25,185,154,0.25)] disabled:opacity-60"
            >
              {busy ? '생성 중...' : '원클릭 전체 시나리오 생성'}
            </button>

            <button
              disabled={busy}
              onClick={() => postAction('dry_run_notifications')}
              className="rounded-3xl bg-[#DCEFF7] px-6 py-5 text-xl font-black text-[#365E78] ring-1 ring-[#C2DDEA] disabled:opacity-60"
            >
              알림 Dry Run
            </button>

            <button
              disabled={busy}
              onClick={() => postAction('run_notifications')}
              className="rounded-3xl bg-white px-6 py-5 text-xl font-black text-[#426C68] ring-1 ring-[#CFE7E2] disabled:opacity-60"
            >
              알림 자동 발송 실행
            </button>
          </div>
        </section>

        {loading ? (
          <div className="mt-8 rounded-[2rem] bg-white p-8 text-center text-xl font-black ring-1 ring-[#E3EFEC]">
            상태를 불러오는 중...
          </div>
        ) : (
          <>
            <section className="mt-8 grid gap-5 lg:grid-cols-3">
              <RecentPanel title="최근 케어 케이스" items={data?.latestCases || []} empty="케이스가 없습니다.">
                {(item) => (
                  <>
                    <div className="text-lg font-black">{item.case_title || '케어 케이스'}</div>
                    <p className="mt-1 text-sm font-bold text-[#607D79]">
                      {item.elder_name || '부모님'} · {item.case_status || '상태 없음'}
                    </p>
                    <p className="mt-1 text-xs font-bold text-[#8AA29E]">{formatDate(item.created_at)}</p>
                  </>
                )}
              </RecentPanel>

              <RecentPanel title="최근 보호자 리포트" items={data?.latestReports || []} empty="리포트가 없습니다.">
                {(item) => (
                  <>
                    <div className="text-lg font-black">{item.report_title || '보호자 리포트'}</div>
                    <p className="mt-1 text-sm font-bold text-[#607D79]">
                      {item.elder_name || '부모님'} · {item.reassurance_state || '확인 필요'}
                    </p>
                    <p className="mt-1 text-xs font-bold text-[#8AA29E]">{formatDate(item.created_at)}</p>
                  </>
                )}
              </RecentPanel>

              <RecentPanel title="최근 알림" items={data?.latestNotifications || []} empty="알림이 없습니다.">
                {(item) => (
                  <>
                    <div className="text-lg font-black">{item.title || '알림'}</div>
                    <p className="mt-1 text-sm font-bold text-[#607D79]">
                      {item.recipient_role || 'role 없음'} · {item.status || '상태 없음'}
                    </p>
                    <p className="mt-1 text-xs font-bold text-[#8AA29E]">{formatDate(item.created_at)}</p>
                  </>
                )}
              </RecentPanel>
            </section>

            <section className="mt-8 rounded-[2rem] bg-[linear-gradient(135deg,#EAFBF6_0%,#F4FAFF_100%)] p-6 shadow-[0_16px_44px_rgba(93,139,131,0.12)]">
              <h2 className="text-3xl font-black tracking-[-0.04em]">바이어 시연 순서</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {[
                  ['/care-request', '1. 보호자 접수'],
                  ['/ops/intake-inbox', '2. 접수함'],
                  ['/ops/care-cases', '3. 케어 케이스'],
                  ['/ops/manager-vetting', '4. 매니저 검증'],
                  ['/ops/manager-offers', '5. 매니저 알림·수락'],
                  ['/manager/today', '6. 현장 체크'],
                  ['/child/reports', '7. 보호자 리포트'],
                  ['/ops/notifications', '8. 알림 큐'],
                  ['/ops/cron-health', '9. 자동 발송'],
                  ['/manager/earnings', '10. 정산 예정'],
                  ['/ops/flow-qa', '11. 통합 점검'],
                  ['/buyer-demo', '12. 바이어 데모']
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
        )}
      </section>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-[#E3EFEC]">
      <div className="text-sm font-black text-[#718A87]">{label}</div>
      <div className="mt-1 text-3xl font-black">{value}</div>
    </div>
  )
}

function RecentPanel({
  title,
  items,
  empty,
  children
}: {
  title: string
  items: Record<string, any>[]
  empty: string
  children: (item: Record<string, any>) => React.ReactNode
}) {
  return (
    <section className="rounded-[2rem] border border-[#E3EFEC] bg-white p-6 shadow-[0_14px_40px_rgba(93,139,131,0.09)]">
      <h2 className="text-2xl font-black">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl bg-[#F6FCFA] p-5 text-center font-bold text-[#607D79]">
            {empty}
          </div>
        ) : (
          items.map((item, index) => (
            <div key={item.id || index} className="rounded-2xl bg-[#F6FCFA] p-4 ring-1 ring-[#E3EFEC]">
              {children(item)}
            </div>
          ))
        )}
      </div>
    </section>
  )
}
