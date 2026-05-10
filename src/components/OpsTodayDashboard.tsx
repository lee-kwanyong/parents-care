'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type DashboardData = {
  ok: boolean
  attentionState: '긴급 확인' | '확인 필요' | '안정'
  summary: Record<string, number>
  nextActions: Array<{
    title: string
    description: string
    href: string
    priority: 'urgent' | 'high' | 'normal'
  }>
  recent: Record<string, any[]>
  errors: Array<{
    label: string
    error: unknown
  }>
}

function formatWon(value: number) {
  return `${Number(value || 0).toLocaleString('ko-KR')}원`
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString('ko-KR')
  } catch {
    return value || ''
  }
}

function typeLabel(type: string) {
  const map: Record<string, string> = {
    hospital_visit: '병원동행',
    meal_check: '식사 확인',
    medication_check: '복약 확인',
    discharge_check: '퇴원 후',
    document_pickup: '서류',
    wellbeing_check: '안부'
  }
  return map[type] || type || '케어'
}

export function OpsTodayDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/ops/dashboard', { cache: 'no-store' })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '운영실 대시보드를 불러오지 못했습니다.')
      }

      setData(result)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '운영실 대시보드를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const tone = useMemo(() => {
    if (!data) return 'green'
    if (data.attentionState === '긴급 확인') return 'red'
    if (data.attentionState === '확인 필요') return 'amber'
    return 'green'
  }, [data])

  const summary = data?.summary || {
    openIntakes: 0,
    urgentIntakes: 0,
    openCases: 0,
    pendingVetting: 0,
    verifiedManagers: 0,
    sentOffers: 0,
    acceptedOffers: 0,
    activeAssignments: 0,
    completedAssignments: 0,
    expectedEarningsAmount: 0,
    queuedNotifications: 0
  }

  return (
    <main className="min-h-screen bg-[#F7FCFB] px-5 py-8 text-[#24423F]">
      <section className="mx-auto max-w-7xl">
        <header
          className={
            'rounded-[2rem] p-6 shadow-[0_16px_44px_rgba(93,139,131,0.12)] ' +
            (tone === 'red'
              ? 'bg-[#FFF0F1]'
              : tone === 'amber'
                ? 'bg-[#FFF7E8]'
                : 'bg-[linear-gradient(135deg,#EAFBF6_0%,#F4FAFF_100%)]')
          }
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-sm font-black text-[#19A98E]">운영실 오늘 할 일</div>
              <h1 className="mt-2 text-5xl font-black tracking-[-0.06em] md:text-7xl">
                {data?.attentionState || '확인 중'}
              </h1>
              <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#607D79] md:text-lg md:leading-8">
                접수, 케어 케이스, 매니저 검증, 알림·수락, 현장 진행, 정산 예정까지 한 화면에서 확인합니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={load}
                className="rounded-2xl bg-white px-5 py-4 font-black text-[#426C68] ring-1 ring-[#CFE7E2]"
              >
                새로고침
              </button>
              <Link href="/ops/intake-inbox" className="rounded-2xl bg-[#19B99A] px-5 py-4 font-black text-white">
                접수함
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
          <div className="mt-6 rounded-[2rem] bg-white p-8 text-center text-xl font-black ring-1 ring-[#E3EFEC]">
            운영실 대시보드를 불러오는 중...
          </div>
        ) : (
          <>
            <section className="mt-6 grid gap-3 md:grid-cols-4 xl:grid-cols-6">
              <Stat label="새 접수" value={summary.openIntakes} href="/ops/intake-inbox" />
              <Stat label="긴급 접수" value={summary.urgentIntakes} href="/ops/intake-inbox" tone="red" />
              <Stat label="케어 케이스" value={summary.openCases} href="/ops/care-cases" />
              <Stat label="검증 대기" value={summary.pendingVetting} href="/ops/manager-vetting" tone="amber" />
              <Stat label="검증 매니저" value={summary.verifiedManagers} href="/ops/manager-vetting" />
              <Stat label="수락 대기" value={summary.acceptedOffers} href="/ops/manager-offers" tone="amber" />
              <Stat label="제안 발송" value={summary.sentOffers} href="/ops/manager-offers" />
              <Stat label="현장 진행" value={summary.activeAssignments} href="/manager/today" />
              <Stat label="완료 배정" value={summary.completedAssignments} href="/manager/earnings" />
              <Stat label="정산 예정" value={formatWon(summary.expectedEarningsAmount)} href="/manager/earnings" />
              <Stat label="알림 대기" value={summary.queuedNotifications} href="/ops/notifications" />
              <Stat label="전체 상태" value={data?.attentionState || '안정'} href="/ops/care-cases" />
            </section>

            <section className="mt-8 rounded-[2rem] border border-[#E3EFEC] bg-white p-6 shadow-[0_14px_40px_rgba(93,139,131,0.09)]">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-3xl font-black tracking-[-0.04em]">오늘 가장 먼저 할 일</h2>
                  <p className="mt-2 text-sm font-bold leading-6 text-[#607D79]">
                    위에서부터 처리하면 됩니다.
                  </p>
                </div>
                <Link
                  href="/ops/care-cases"
                  className="rounded-2xl bg-[#DCEFF7] px-5 py-4 text-center font-black text-[#365E78] ring-1 ring-[#C2DDEA]"
                >
                  케어 케이스 보기
                </Link>
              </div>

              <div className="mt-5 space-y-3">
                {(data?.nextActions || []).map((action, index) => (
                  <Link
                    key={`${action.href}-${action.title}`}
                    href={action.href}
                    className="block rounded-2xl bg-[#F6FCFA] p-5 ring-1 ring-[#E3EFEC] transition hover:bg-[#EAFBF6]"
                  >
                    <div className="flex flex-wrap gap-2">
                      <Badge text={`${index + 1}순위`} />
                      <Badge text={action.priority === 'urgent' ? '긴급' : action.priority === 'high' ? '중요' : '보통'} />
                    </div>
                    <h3 className="mt-3 text-xl font-black">{action.title}</h3>
                    <p className="mt-2 text-sm font-bold leading-6 text-[#607D79]">{action.description}</p>
                  </Link>
                ))}
              </div>
            </section>

            <section className="mt-8 grid gap-5 lg:grid-cols-2">
              <RecentPanel
                title="최근 접수"
                href="/ops/intake-inbox"
                items={data?.recent?.intakes || []}
                render={(item) => (
                  <>
                    <div className="text-lg font-black">{item.summary_title || '부모님 걱정 접수'}</div>
                    <p className="mt-1 text-sm font-bold text-[#607D79]">
                      {item.elder_name || '부모님'} · {item.contact_name || '보호자'} · {item.ops_status || item.status}
                    </p>
                    <p className="mt-1 text-xs font-bold text-[#8AA29E]">{formatDate(item.created_at)}</p>
                  </>
                )}
              />

              <RecentPanel
                title="최근 케어 케이스"
                href="/ops/care-cases"
                items={data?.recent?.cases || []}
                render={(item) => (
                  <>
                    <div className="text-lg font-black">{item.case_title || '케어 케이스'}</div>
                    <p className="mt-1 text-sm font-bold text-[#607D79]">
                      {typeLabel(item.care_case_type)} · {item.case_status} · {item.elder_name}
                    </p>
                    <p className="mt-1 text-xs font-bold text-[#8AA29E]">{formatDate(item.created_at)}</p>
                  </>
                )}
              />

              <RecentPanel
                title="매니저 검증 대기"
                href="/ops/manager-vetting"
                items={data?.recent?.applications || []}
                render={(item) => (
                  <>
                    <div className="text-lg font-black">{item.applicant_name || '지원자'}</div>
                    <p className="mt-1 text-sm font-bold text-[#607D79]">
                      {item.applicant_phone || '연락처 없음'} · {item.vetting_status || '검증 대기'}
                    </p>
                    <p className="mt-1 text-xs font-bold text-[#8AA29E]">{formatDate(item.created_at)}</p>
                  </>
                )}
              />

              <RecentPanel
                title="매니저 제안/수락"
                href="/ops/manager-offers"
                items={data?.recent?.offers || []}
                render={(item) => (
                  <>
                    <div className="text-lg font-black">{item.request_snapshot?.request_title || '케어 제안'}</div>
                    <p className="mt-1 text-sm font-bold text-[#607D79]">
                      {item.manager_name || '매니저'} · {item.offer_status} · {formatWon(item.expected_fee || 0)}
                    </p>
                    <p className="mt-1 text-xs font-bold text-[#8AA29E]">{formatDate(item.created_at)}</p>
                  </>
                )}
              />

              <RecentPanel
                title="현장 진행"
                href="/manager/today"
                items={data?.recent?.assignments || []}
                render={(item) => (
                  <>
                    <div className="text-lg font-black">{item.title || '현장 배정'}</div>
                    <p className="mt-1 text-sm font-bold text-[#607D79]">
                      {item.elder_name || '부모님'} · {item.manager_name || '매니저'} · {item.status}
                    </p>
                    <p className="mt-1 text-xs font-bold text-[#8AA29E]">{formatDate(item.created_at)}</p>
                  </>
                )}
              />

              <RecentPanel
                title="정산 예정"
                href="/manager/earnings"
                items={data?.recent?.earnings || []}
                render={(item) => (
                  <>
                    <div className="text-lg font-black">{item.earning_title || '정산 예정'}</div>
                    <p className="mt-1 text-sm font-bold text-[#607D79]">
                      {formatWon(item.amount || 0)} · {item.earning_status} · 지급예정 {item.payout_due_date || '미정'}
                    </p>
                    <p className="mt-1 text-xs font-bold text-[#8AA29E]">{formatDate(item.created_at)}</p>
                  </>
                )}
              />
            </section>

            {data?.errors?.length ? (
              <section className="mt-8 rounded-[2rem] border border-[#F0D6D8] bg-[#FFF5F5] p-6">
                <h2 className="text-2xl font-black text-[#965D65]">확인 필요한 데이터 소스</h2>
                <div className="mt-4 space-y-3">
                  {data.errors.map((error) => (
                    <div key={error.label} className="rounded-2xl bg-white p-4">
                      <div className="font-black">{error.label}</div>
                      <pre className="mt-2 max-h-32 overflow-auto text-xs text-[#965D65]">
                        {JSON.stringify(error.error, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="mt-8 rounded-[2rem] bg-[linear-gradient(135deg,#EAFBF6_0%,#F4FAFF_100%)] p-6 shadow-[0_16px_44px_rgba(93,139,131,0.12)]">
              <h2 className="text-3xl font-black tracking-[-0.04em]">주요 화면 바로가기</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-3 lg:grid-cols-4">
                {[
                  ['/ops/intake-inbox', '부모님 걱정 접수함'],
                  ['/ops/care-cases', '케어 케이스'],
                  ['/ops/manager-vetting', '매니저 최초 검증'],
                  ['/ops/manager-offers', '매니저 알림·수락'],
                  ['/manager/today', '현장 체크'],
                  ['/manager/earnings', '정산 예정'],
                  ['/buyer-demo', '바이어 데모'],
                  ['/ops/flow-qa', '통합 흐름 점검'],
                  ['/deploy-readiness', '배포 점검']
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

function Stat({
  label,
  value,
  href,
  tone = 'green'
}: {
  label: string
  value: string | number
  href: string
  tone?: 'green' | 'amber' | 'red'
}) {
  return (
    <Link
      href={href}
      className={
        'rounded-[1.5rem] bg-white p-5 ring-1 transition hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(93,139,131,0.10)] ' +
        (tone === 'red'
          ? 'ring-[#F0D6D8]'
          : tone === 'amber'
            ? 'ring-[#F0DDB6]'
            : 'ring-[#E3EFEC]')
      }
    >
      <div className="text-sm font-black text-[#718A87]">{label}</div>
      <div className="mt-2 text-2xl font-black tracking-[-0.03em] md:text-3xl">{value}</div>
    </Link>
  )
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-[#F4FAF9] px-3 py-1 text-xs font-black text-[#5B7774] ring-1 ring-[#E2EFEC]">
      {text}
    </span>
  )
}

function RecentPanel({
  title,
  href,
  items,
  render
}: {
  title: string
  href: string
  items: any[]
  render: (item: any) => React.ReactNode
}) {
  return (
    <section className="rounded-[2rem] border border-[#E3EFEC] bg-white p-6 shadow-[0_14px_40px_rgba(93,139,131,0.09)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-black">{title}</h2>
        <Link href={href} className="rounded-full bg-[#F4FAF9] px-4 py-2 text-sm font-black text-[#5B7774] ring-1 ring-[#E2EFEC]">
          보기
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl bg-[#F6FCFA] p-5 text-center font-bold text-[#607D79]">
            표시할 항목이 없습니다.
          </div>
        ) : (
          items.map((item, index) => (
            <div key={item.id || index} className="rounded-2xl bg-[#F6FCFA] p-4 ring-1 ring-[#E3EFEC]">
              {render(item)}
            </div>
          ))
        )}
      </div>
    </section>
  )
}
