'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Row = {
  id: string
  familyCode: string
  parentName: string
  guardianName: string
  parentPhoneMasked: string
  guardianPhoneMasked: string
  risk: {
    code: string
    label: string
    tone: string
  }
  latestCare?: {
    signalLabel: string
    createdAt: string
  } | null
  latestRing?: {
    score: number
    quality: number
    battery: number
    createdAt: string
  } | null
  hasSmartRing: boolean
  duplicateCount: number
}

type Data = {
  ok: boolean
  message?: string
  generatedKst?: string
  metrics?: {
    totalFamilies: number
    totalRows: number
    authUsers: number
    smartRingFamilies: number
    checkNeeded: number
    watch: number
    pending: number
    completed: number
    todayCompleted: number
    completionRate: number
    duplicateFamilies: number
    todayCareRecords: number
    todayRingReports: number
  }
  issueLists?: {
    checkNeeded: Row[]
    watch: Row[]
    duplicates: Row[]
    smartRing: Row[]
  }
  sourceErrors?: string[]
}

function toneClass(tone: string) {
  if (tone === 'danger') return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  if (tone === 'watch') return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  if (tone === 'safe') return 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'
  return 'bg-white text-[#17443F] ring-[#D6EDE7]'
}

function formatDate(value?: string) {
  if (!value) return '기록 없음'
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return value

  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(parsed))
}

function MetricCard({
  title,
  value,
  desc,
  href,
  tone = 'neutral'
}: {
  title: string
  value: string | number
  desc: string
  href: string
  tone?: string
}) {
  return (
    <Link
      href={href}
      className={`rounded-[2rem] p-5 shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(49,151,136,0.08)] ${toneClass(tone)}`}
    >
      <div className="text-sm font-black opacity-70">{title}</div>
      <div className="mt-3 text-5xl font-black tracking-[-0.08em]">{value}</div>
      <p className="mt-3 text-sm font-bold leading-7 opacity-75">{desc}</p>
    </Link>
  )
}

function CompactMenuCard({
  title,
  desc,
  href,
  badge
}: {
  title: string
  desc: string
  href: string
  badge: string
}) {
  return (
    <Link
      href={href}
      className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(49,151,136,0.08)]"
    >
      <span className="rounded-full bg-[#EFFFFA] px-3 py-1 text-xs font-black text-[#247A71] ring-1 ring-[#CDEFE7]">
        {badge}
      </span>
      <h3 className="mt-4 text-2xl font-black tracking-[-0.06em]">{title}</h3>
      <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">{desc}</p>
    </Link>
  )
}

export function AdminOpsUnifiedDashboardPanel() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin-family-hub', {
        cache: 'no-store',
        credentials: 'include'
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || result.ok === false) {
        setMessage(result.message || '관리자 대시보드를 불러오지 못했습니다.')
        setData(result)
        return
      }

      setData(result)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '관리자 대시보드를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function copySummary() {
    const m = data?.metrics

    const lines = [
      '[안부웍스] 오늘 운영 요약',
      '',
      `오늘 완료율: ${m?.completionRate ?? 0}%`,
      `확인필요: ${m?.checkNeeded ?? 0}건`,
      `주의: ${m?.watch ?? 0}건`,
      `가입 가족: ${m?.totalFamilies ?? 0}가구`,
      `스마트링 배정: ${m?.smartRingFamilies ?? 0}가구`,
      `전화번호 중복 검토: ${m?.duplicateFamilies ?? 0}가구`
    ]

    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      setMessage('운영 요약을 복사했습니다.')
    } catch {
      setMessage('복사에 실패했습니다.')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const metrics = data?.metrics || {
    totalFamilies: 0,
    totalRows: 0,
    authUsers: 0,
    smartRingFamilies: 0,
    checkNeeded: 0,
    watch: 0,
    pending: 0,
    completed: 0,
    todayCompleted: 0,
    completionRate: 0,
    duplicateFamilies: 0,
    todayCareRecords: 0,
    todayRingReports: 0
  }

  const urgentRows = useMemo(() => {
    return [
      ...(data?.issueLists?.checkNeeded || []),
      ...(data?.issueLists?.watch || [])
    ].slice(0, 8)
  }, [data])

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#E7FFF7_0%,#F7FFFC_34%,#FFFFFF_72%)] px-4 py-8 text-[#17443F]">
      <section className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[2.5rem] bg-white/95 shadow-[0_24px_80px_rgba(49,151,136,0.10)] ring-1 ring-[#D6EDE7]">
          <div className="grid gap-0 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="p-6 sm:p-9">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7]">
                  Admin Dashboard
                </span>
                <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                  {data?.generatedKst || '오늘'}
                </span>
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.08em] sm:text-6xl">
                오늘 봐야 할 것만
                <br />
                먼저 보여줍니다.
              </h1>

              <p className="mt-5 max-w-3xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
                확인필요, 주의, 가입자, 가족, 스마트링 배정 상태를 한 화면에서 확인합니다.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  onClick={load}
                  disabled={loading}
                  className="rounded-2xl bg-[#EFFFFA] px-5 py-4 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7] disabled:opacity-50"
                >
                  {loading ? '새로고침 중' : '새로고침'}
                </button>

                <button
                  onClick={copySummary}
                  className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
                >
                  오늘 요약 복사
                </button>

                <Link
                  href="/admin/ops/families"
                  className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
                >
                  가입자 통합관리
                </Link>
              </div>
            </div>

            <aside className="bg-[linear-gradient(135deg,#EFFFFA_0%,#F7FFFC_50%,#FFFFFF_100%)] p-6 sm:p-9">
              <div className="rounded-[2rem] bg-white/90 p-6 ring-1 ring-[#D6EDE7]">
                <div className="text-sm font-black text-[#637B76]">오늘 완료율</div>
                <Link href="/admin/ops/families?filter=completed" className="mt-3 block text-6xl font-black tracking-[-0.08em] text-[#247A71]">
                  {metrics.completionRate}%
                </Link>
                <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">
                  클릭하면 오늘 완료된 가입자/가족 목록으로 이동합니다.
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Link href="/admin/ops/families?filter=check-needed" className="rounded-2xl bg-[#FFF4F4] p-4 text-[#8A3030] ring-1 ring-[#F3C8C8]">
                    <div className="text-xs font-black opacity-70">확인필요</div>
                    <div className="mt-2 text-3xl font-black">{metrics.checkNeeded}</div>
                  </Link>

                  <Link href="/admin/ops/families?filter=watch" className="rounded-2xl bg-[#FFF9EE] p-4 text-[#795C22] ring-1 ring-[#F3DEB5]">
                    <div className="text-xs font-black opacity-70">주의</div>
                    <div className="mt-2 text-3xl font-black">{metrics.watch}</div>
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {message ? (
          <section className="rounded-[2rem] bg-[#FFF9EE] p-5 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            {message}
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="확인필요"
            value={metrics.checkNeeded}
            desc="전화 확인, 보호자 연락, 후속 조치가 필요한 가족"
            href="/admin/ops/families?filter=check-needed"
            tone="danger"
          />

          <MetricCard
            title="주의"
            value={metrics.watch}
            desc="안부 신호나 스마트링 참고 신호가 평소와 다른 가족"
            href="/admin/ops/families?filter=watch"
            tone="watch"
          />

          <MetricCard
            title="가입 가족"
            value={metrics.totalFamilies}
            desc="부모님·보호자·가입자 정보가 연결된 가족코드"
            href="/admin/ops/families"
            tone="safe"
          />

          <MetricCard
            title="스마트링"
            value={metrics.smartRingFamilies}
            desc="스마트링 리포트나 기기 배정이 연결된 가족"
            href="/admin/ops/families?filter=smart-ring"
            tone="neutral"
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <article className="rounded-[2rem] bg-white/95 p-6 shadow-sm ring-1 ring-[#D6EDE7]">
            <div className="inline-flex rounded-full bg-[#FFF4F4] px-4 py-2 text-sm font-black text-[#8A3030] ring-1 ring-[#F3C8C8]">
              먼저 볼 가족
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-[-0.07em]">확인필요·주의 목록</h2>

            <div className="mt-5 space-y-3">
              {urgentRows.length ? (
                urgentRows.map((row) => (
                  <Link
                    key={row.id}
                    href={`/admin/ops/families?familyCode=${encodeURIComponent(row.familyCode || '')}&filter=${row.risk.code}`}
                    className="block rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]"
                  >
                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${toneClass(row.risk.tone)}`}>
                        {row.risk.label}
                      </span>
                      {row.hasSmartRing ? (
                        <span className="rounded-full bg-[#F6F4FF] px-3 py-1 text-xs font-black text-[#4A3A8A] ring-1 ring-[#DED8FF]">
                          스마트링
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-3 text-lg font-black">
                      {row.parentName} / 보호자 {row.guardianName}
                    </div>

                    <p className="mt-1 text-sm font-bold leading-7 text-[#637B76]">
                      {row.latestCare?.signalLabel || '안부 기록 없음'} · {formatDate(row.latestCare?.createdAt || row.latestRing?.createdAt)}
                    </p>
                  </Link>
                ))
              ) : (
                <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D6EDE7]">
                  현재 확인필요·주의 가족이 없습니다.
                </div>
              )}
            </div>
          </article>

          <article className="rounded-[2rem] bg-white/95 p-6 shadow-sm ring-1 ring-[#D6EDE7]">
            <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7]">
              핵심 메뉴
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-[-0.07em]">관리자는 여기서 시작합니다.</h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <CompactMenuCard
                title="가입자 통합관리"
                desc="가입자, 가족, 보호자, 부모님, 스마트링 배정을 한 화면에서 봅니다."
                href="/admin/ops/families"
                badge="필수"
              />

              <CompactMenuCard
                title="문자/알림"
                desc="문자 발송 이력, 실패, 재발송 후보를 점검합니다."
                href="/admin/ops/notifications"
                badge="운영"
              />

              <CompactMenuCard
                title="지자체·R&D"
                desc="지자체, 스마트링 공급사, R&D 파이프라인을 관리합니다."
                href="/admin/ops/gov-rnd"
                badge="영업"
              />

              <CompactMenuCard
                title="제안 표현 점검"
                desc="의료·119·오탐률 표현을 비의료 안부 참고 문장으로 낮춥니다."
                href="/admin/ops/proposal-reality-check"
                badge="점검"
              />
            </div>

            <details className="mt-5 rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
              <summary className="cursor-pointer text-sm font-black text-[#17443F]">
                고급 메뉴 보기
              </summary>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {[
                  ['/admin/ops/ring-pilot-dashboard', '스마트링 실증 대시보드'],
                  ['/admin/ops/ring-csv-import', '스마트링 CSV 업로드'],
                  ['/admin/ops/ring-report-lab', '리포트 실험실'],
                  ['/admin/ops/admin-menu', '전체 메뉴'],
                  ['/admin/ops/system-check', '시스템 점검'],
                  ['/admin/ops/family-data-cleanup', '가족 데이터 정리']
                ].map(([href, label]) => (
                  <Link
                    key={href}
                    href={href}
                    className="rounded-xl bg-white px-3 py-3 text-xs font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </details>
          </article>
        </section>

        {data?.sourceErrors?.length ? (
          <details className="rounded-[2rem] bg-white/95 p-5 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D6EDE7]">
            <summary className="cursor-pointer text-base font-black text-[#795C22]">
              데이터 연결 확인 필요 {data.sourceErrors.length}건
            </summary>
            <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap rounded-2xl bg-[#FFF9EE] p-4 text-xs leading-6 text-[#795C22]">
              {data.sourceErrors.join('\n\n')}
            </pre>
          </details>
        ) : null}
      </section>
    </main>
  )
}

export default AdminOpsUnifiedDashboardPanel
