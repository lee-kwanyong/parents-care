'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AppFrame } from '@/components/ui/AppFrame'
import { CareButton } from '@/components/ui/CareButton'
import { CareCard } from '@/components/ui/CareCard'
import { StatusPill } from '@/components/ui/StatusPill'

type AnyRow = Record<string, any>

type Dashboard = {
  summary: AnyRow
  latestEvents: AnyRow[]
}

function formatDate(value: string) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatWon(value: number) {
  return `${Number(value || 0).toLocaleString('ko-KR')}원`
}

function labelStatus(status: string) {
  const map: Record<string, string> = {
    received: '신규 접수',
    reviewing: '확인 중',
    matching_requested: '매칭 전환',
    requested: '매칭 대기',
    candidate_generated: '후보 생성',
    assigned: '배정',
    in_progress: '진행 중',
    completed: '완료',
    sent: '제안 발송',
    accepted: '수락',
    declined: '거절',
    ready: '확인 가능',
    approved: '승인',
    in_review: '검토 중',
    not_started: '검증 전'
  }

  return map[status] || status || '-'
}

export function OpsDashboardBoard() {
  const [data, setData] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/ops-dashboard', { cache: 'no-store' })
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

  const summary = data?.summary || {
    intakes: {},
    matching: {},
    offers: {},
    assignments: {},
    managers: {},
    reports: {},
    earnings: {}
  }

  const needsAttention =
    Number(summary.intakes?.received || 0) +
    Number(summary.intakes?.highPriority || 0) +
    Number(summary.matching?.requested || 0) +
    Number(summary.offers?.sent || 0) +
    Number(summary.assignments?.assigned || 0) +
    Number(summary.managers?.inReview || 0) +
    Number(summary.reports?.openActions || 0)

  return (
    <AppFrame
      title="운영실"
      subtitle="부모님 안심케어 전체 운영 현황을 한눈에 확인합니다"
      showMobileNav={false}
    >
      <section className="space-y-6">
        <CareCard tone="green">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill text="운영실 홈" tone="green" />
            <StatusPill text="통합 대시보드" tone="slate" />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <h1 className="text-4xl font-black tracking-[-0.05em] md:text-6xl">
                오늘 운영 상태를
                <br />
                한 화면에서 확인하세요.
              </h1>
              <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#4E6D69] md:text-lg">
                접수, 매칭, 매니저 승인, 배정, 보호자 리포트, 정산 예정까지 운영에 필요한 핵심 상태를 모았습니다.
              </p>
            </div>

            <div className="rounded-[2rem] bg-white p-5 ring-1 ring-[#D5EEE8]">
              <div className="text-sm font-black text-[#718A87]">지금 확인할 일</div>
              <div className="mt-2 text-5xl font-black text-[#19A98E]">{needsAttention}</div>
              <p className="mt-2 text-sm font-bold leading-6 text-[#607D79]">
                신규 접수, 매칭 대기, 제안 발송, 승인 대기, 가족 할 일 기준입니다.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={load}
              className="rounded-3xl bg-white px-5 py-4 font-black text-[#426C68] ring-1 ring-[#CFE7E2]"
            >
              새로고침
            </button>
            <CareButton href="/ops/intake">운영접수 보기</CareButton>
            <CareButton href="/ops/matching" tone="dark">매칭관리 보기</CareButton>
            <CareButton href="/ops/managers" tone="dark">매니저관리 보기</CareButton>
            <CareButton href="/admin/health" tone="dark">시스템 점검센터 보기</CareButton>
          </div>
        </CareCard>

        {message ? (
          <div className="rounded-2xl bg-[#FFF5DF] p-4 font-black text-[#886B35]">
            {message}
          </div>
        ) : null}

        {loading ? (
          <CareCard tone="white">
            <p className="text-lg font-black">운영 현황을 불러오는 중...</p>
          </CareCard>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="신규 접수"
            main={summary.intakes?.received || 0}
            desc={`확인 중 ${summary.intakes?.reviewing || 0}건 · 우선 확인 ${summary.intakes?.highPriority || 0}건`}
            href="/ops/intake"
          />
          <SummaryCard
            title="매칭 대기"
            main={summary.matching?.requested || 0}
            desc={`후보 생성 ${summary.matching?.candidates || 0}건 · 배정 ${summary.matching?.assigned || 0}건`}
            href="/ops/matching"
          />
          <SummaryCard
            title="제안 발송"
            main={summary.offers?.sent || 0}
            desc={`수락 ${summary.offers?.accepted || 0}건 · 거절 ${summary.offers?.declined || 0}건`}
            href="/ops/matching"
          />
          <SummaryCard
            title="오늘 배정"
            main={summary.assignments?.assigned || 0}
            desc={`진행 중 ${summary.assignments?.inProgress || 0}건 · 완료 ${summary.assignments?.completed || 0}건`}
            href="/manager"
          />
          <SummaryCard
            title="매니저 승인"
            main={summary.managers?.inReview || 0}
            desc={`활성 매니저 ${summary.managers?.active || 0}명 · 매칭 가능 ${summary.managers?.matchingEligible || 0}명`}
            href="/ops/managers"
          />
          <SummaryCard
            title="보호자 리포트"
            main={summary.reports?.ready || 0}
            desc={`확인 완료 ${summary.reports?.viewed || 0}건 · 가족 할 일 ${summary.reports?.openActions || 0}건`}
            href="/child/reports"
          />
          <SummaryCard
            title="정산 예정"
            main={formatWon(summary.earnings?.expected || 0)}
            desc={`지급 완료 ${formatWon(summary.earnings?.paid || 0)}`}
            href="/manager"
          />
          <SummaryCard
            title="전체 진행"
            main={summary.intakes?.total || 0}
            desc={`접수 전체 ${summary.intakes?.total || 0}건 · 매칭 전체 ${summary.matching?.total || 0}건`}
            href="/ops/intake"
          />
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
          <CareCard tone="white">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-3xl font-black tracking-[-0.04em]">최근 운영 활동</h2>
                <p className="mt-2 text-sm font-bold text-[#607D79]">
                  접수, 매칭, 제안, 배정, 리포트, 매니저 등록 순서로 최근 활동을 보여줍니다.
                </p>
              </div>
              <button
                type="button"
                onClick={load}
                className="rounded-2xl bg-[#F4FAF9] px-4 py-3 text-sm font-black text-[#426C68] ring-1 ring-[#DDEDE9]"
              >
                새로고침
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {(data?.latestEvents || []).length === 0 ? (
                <Empty message="아직 운영 활동이 없습니다." />
              ) : (
                (data?.latestEvents || []).map((event, index) => (
                  <Link
                    key={`${event.type}-${event.title}-${index}`}
                    href={event.href}
                    className="block rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#E3EFEC] transition hover:bg-white"
                  >
                    <div className="flex flex-wrap gap-2">
                      <Badge text={event.type} />
                      <Badge text={labelStatus(event.status)} />
                      <Badge text={formatDate(event.date)} />
                    </div>
                    <div className="mt-3 text-lg font-black">{event.title}</div>
                  </Link>
                ))
              )}
            </div>
          </CareCard>

          <CareCard tone="amber">
            <h2 className="text-3xl font-black tracking-[-0.04em]">운영 체크리스트</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-[#6F5B31]">
              베타 운영 전에 아래 순서대로 확인하면 전체 흐름이 안정적으로 보입니다.
            </p>

            <div className="mt-5 space-y-3">
              <ChecklistItem
                title="신규 접수 확인"
                desc="보호자 신청이 /ops/intake에 들어오는지 확인"
                href="/ops/intake"
              />
              <ChecklistItem
                title="매니저 승인"
                desc="등록한 매니저를 /ops/managers에서 검증 완료 처리"
                href="/ops/managers"
              />
              <ChecklistItem
                title="후보 제안 생성"
                desc="접수 건을 매칭 요청으로 전환하고 후보 생성"
                href="/ops/matching"
              />
              <ChecklistItem
                title="매니저 수락"
                desc="매니저별 링크로 접속해서 제안 수락"
                href="/manager"
              />
              <ChecklistItem
                title="부모님 화면 확인"
                desc="배정된 매니저 정보가 /parent/today에 뜨는지 확인"
                href="/parent/today"
              />
              <ChecklistItem
                title="보호자 리포트"
                desc="현장 완료 후 /child/reports에 리포트 생성 확인"
                href="/child/reports"
              />
            </div>
          </CareCard>
        </section>
      </section>
    </AppFrame>
  )
}

function SummaryCard({
  title,
  main,
  desc,
  href
}: {
  title: string
  main: string | number
  desc: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="block rounded-[1.8rem] bg-white p-5 ring-1 ring-[#E3EFEC] shadow-[0_14px_40px_rgba(93,139,131,0.08)] transition hover:-translate-y-0.5 hover:bg-[#F8FCFB]"
    >
      <div className="text-sm font-black text-[#718A87]">{title}</div>
      <div className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#24423F]">{main}</div>
      <p className="mt-2 text-sm font-bold leading-6 text-[#607D79]">{desc}</p>
    </Link>
  )
}

function ChecklistItem({
  title,
  desc,
  href
}: {
  title: string
  desc: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl bg-white/75 p-4 ring-1 ring-[#F0E0C4] transition hover:bg-white"
    >
      <div className="text-lg font-black text-[#514536]">{title}</div>
      <p className="mt-1 text-sm font-bold leading-6 text-[#7A673C]">{desc}</p>
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

function Empty({ message }: { message: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 text-center font-black text-[#607D79] ring-1 ring-[#E3EFEC]">
      {message}
    </div>
  )
}
