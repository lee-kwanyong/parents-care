'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

type ReportCard = {
  key: string
  title: string
  status: string
  value: string
  detail: string
}

type Report = {
  id: string
  familyCode: string
  parentName: string
  guardianName: string
  reportDate: string
  overallStatus: string
  anbuScore: number
  summaryText: string
  recommendedAction: string
  dataQualityScore: number
  cards: ReportCard[]
  shareMessage: string
  createdKst: string
}

function toneClass(tone?: string) {
  if (['normal', 'safe', 'ok'].includes(tone || '')) return 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'
  if (['watch', 'warning'].includes(tone || '')) return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  if (['check_needed', 'danger'].includes(tone || '')) return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  return 'bg-white text-[#17443F] ring-[#D6EDE7]'
}

function statusLabel(status?: string) {
  if (status === 'normal') return '정상'
  if (status === 'watch') return '주의'
  if (status === 'check_needed') return '확인필요'
  return status || '확인'
}

function Pill({ children, tone }: { children: ReactNode; tone?: string }) {
  return (
    <span className={'inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ' + toneClass(tone)}>
      {children}
    </span>
  )
}

export function GuardianRingReportPanel() {
  const params = useSearchParams()
  const [familyCode, setFamilyCode] = useState('')
  const [last4, setLast4] = useState('')
  const [report, setReport] = useState<Report | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function loadReport(nextFamilyCode = familyCode, nextLast4 = last4) {
    const cleanFamily = nextFamilyCode.trim()
    const cleanLast4 = nextLast4.replace(/[^\d]/g, '').slice(-4)

    if (!cleanFamily || cleanLast4.length !== 4) {
      setMessage('가족코드와 휴대폰 뒤 4자리를 입력해주세요.')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch(
        `/api/ring-report-lab?public=1&familyCode=${encodeURIComponent(cleanFamily)}&last4=${encodeURIComponent(cleanLast4)}`,
        { cache: 'no-store' }
      )

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setReport(null)
        setMessage(data.message || '리포트를 찾지 못했습니다.')
        return
      }

      setReport(data.report)
      setMessage('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '리포트를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function copyReport() {
    if (!report) return

    try {
      await navigator.clipboard.writeText(report.shareMessage)
      setMessage('리포트 내용을 복사했습니다.')
    } catch {
      setMessage('복사에 실패했습니다. 직접 선택해서 복사해주세요.')
    }
  }

  useEffect(() => {
    const initialFamily = params.get('familyCode') || ''
    const initialLast4 = params.get('last4') || ''

    setFamilyCode(initialFamily)
    setLast4(initialLast4.replace(/[^\d]/g, '').slice(-4))

    if (initialFamily && initialLast4) {
      loadReport(initialFamily, initialLast4)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-7 text-[#17443F] sm:px-5 sm:py-10">
      <section className="mx-auto max-w-5xl space-y-5">
        <section className="rounded-[2rem] bg-white/95 p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            보호자 안부완료 리포트
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            부모님의 오늘 리듬을
            <br />
            쉽게 확인합니다.
          </h1>

          <p className="mt-4 text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            수면, 활동, 심박, 체온, 착용 정보를 보호자가 이해하기 쉬운 정상/주의/확인필요 리포트로 보여드립니다.
          </p>

          <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            본 리포트는 의료 진단이 아닌 가족 안부 참고 신호입니다. 응급상황이 의심되면 즉시 119 또는 의료기관에 연락하세요.
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <input
              value={familyCode}
              onChange={(event) => setFamilyCode(event.target.value)}
              placeholder="가족코드"
              className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-bold outline-none"
            />

            <input
              value={last4}
              onChange={(event) => setLast4(event.target.value.replace(/[^\d]/g, '').slice(-4))}
              placeholder="휴대폰 뒤 4자리"
              inputMode="numeric"
              className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-bold outline-none"
            />

            <button onClick={() => loadReport()} disabled={loading} className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50">
              리포트 보기
            </button>
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#EFFFFA] p-4 text-sm font-black leading-7 text-[#247A71] ring-1 ring-[#CDEFE7]">
              {message}
            </div>
          ) : null}
        </section>

        {report ? (
          <section className="space-y-5">
            <article className={'rounded-[2rem] p-6 shadow-sm ring-1 ' + toneClass(report.overallStatus)}>
              <div className="flex flex-wrap gap-2">
                <Pill tone={report.overallStatus}>{statusLabel(report.overallStatus)}</Pill>
                <Pill>안부리포트 {report.anbuScore}점</Pill>
                <Pill>{report.reportDate}</Pill>
              </div>

              <h2 className="mt-5 text-4xl font-black tracking-[-0.07em]">{report.parentName} 오늘 안부리포트</h2>

              <p className="mt-4 text-lg font-black leading-9">{report.summaryText}</p>

              <div className="mt-5 rounded-2xl bg-white/80 p-4 text-sm font-black leading-7 ring-1 ring-current/10">
                {report.recommendedAction}
              </div>
            </article>

            <section className="grid gap-3 md:grid-cols-2">
              {report.cards.map((card) => (
                <article key={card.key} className={'rounded-2xl p-4 ring-1 ' + toneClass(card.status)}>
                  <div className="flex flex-wrap gap-2">
                    <Pill tone={card.status}>{statusLabel(card.status)}</Pill>
                  </div>
                  <h3 className="mt-3 text-xl font-black">{card.title}</h3>
                  <p className="mt-2 text-sm font-black leading-7">{card.value}</p>
                  <p className="mt-1 text-sm font-bold leading-7 opacity-75">{card.detail}</p>
                </article>
              ))}
            </section>

            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">오늘 할 일</h2>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <a href="tel:" className="rounded-2xl bg-[#247A71] px-5 py-4 text-center text-sm font-black text-white">
                  전화 확인하기
                </a>
                <Link href="/guardian/proxy-checkin" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                  확인 결과 기록
                </Link>
                <button onClick={copyReport} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                  가족에게 공유
                </button>
              </div>
            </section>
          </section>
        ) : null}
      </section>
    </main>
  )
}

export default GuardianRingReportPanel
