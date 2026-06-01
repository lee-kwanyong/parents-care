'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type PilotRisk = 'good' | 'watch' | 'risk'

type PilotFamily = {
  id: string
  familyCode: string
  parentName: string
  guardianName: string
  guardianPhone: string
  cohortName: string
  participantStatus: string
  targetDays: number
  startDate: string
  endDate: string
  elapsedDays: number
  progressRate: number
  responseRate: number
  checkinDays: number
  checkinCount: number
  noResponseCount: number
  closureCount: number
  closureRate: number
  riskActionCount: number
  careRequestCount: number
  reportCount: number
  approvedReportCount: number
  feedbackCount: number
  averageRating: number | null
  burdenRating: number | null
  trustRating: number | null
  burdenScore: number
  risk: PilotRisk
  insights: string[]
  nextActions: string[]
  reportText: string
}

type PilotDashboard = {
  generatedAt: string
  cards: Array<{
    key: string
    label: string
    value: string | number
    help: string
  }>
  families: PilotFamily[]
  systemInsights: string[]
  reportText: string
  rawCounts: Record<string, number>
}

function riskClass(risk: PilotRisk) {
  if (risk === 'risk') return 'bg-[#FFF1F1] text-[#8A2525] ring-[#F3BBBB]'
  if (risk === 'watch') return 'bg-[#FFF8E8] text-[#795313] ring-[#F4D8A5]'
  return 'bg-[#EFFFF9] text-[#116D5F] ring-[#CDEFE5]'
}

function statusLabel(status: string) {
  if (status === 'active') return '실증 중'
  if (status === 'completed') return '완료'
  if (status === 'paused') return '중지'
  if (status === 'virtual') return '자동 감지'
  return status || '-'
}

function normalizeCode(value: string) {
  return value.replace(/[^\d]/g, '').slice(0, 6)
}

export function AnbuPilotOps() {
  const [dashboard, setDashboard] = useState<PilotDashboard | null>(null)
  const [raw, setRaw] = useState<unknown>(null)
  const [selectedCode, setSelectedCode] = useState('')
  const [filter, setFilter] = useState('all')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [showRaw, setShowRaw] = useState(false)
  const [familyCode, setFamilyCode] = useState('')
  const [cohortName, setCohortName] = useState('1차 가족 실증')
  const [targetDays, setTargetDays] = useState(14)
  const [notes, setNotes] = useState('')
  const [feedbackRating, setFeedbackRating] = useState(5)
  const [burdenRating, setBurdenRating] = useState(3)
  const [trustRating, setTrustRating] = useState(5)
  const [feedbackComment, setFeedbackComment] = useState('')

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/anbu-ops/pilot', { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      setRaw(data)

      if (!response.ok || data.ok === false) {
        setMessage(data.message || '실증 데이터를 불러오지 못했습니다.')
        return
      }

      setDashboard(data.dashboard || null)

      if (!selectedCode && data.dashboard?.families?.[0]?.familyCode) {
        setSelectedCode(data.dashboard.families[0].familyCode)
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '실증 데이터를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function registerParticipant(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    const code = normalizeCode(familyCode)

    if (!/^\d{6}$/.test(code)) {
      setMessage('6자리 가족 연결코드를 입력해주세요.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/anbu-ops/pilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyCode: code,
          cohortName,
          targetDays,
          notes
        })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || data.ok === false) {
        setMessage(data.message || '실증 참여자 등록에 실패했습니다.')
      } else {
        setMessage(data.message || '실증 참여자가 등록되었습니다.')
        setFamilyCode('')
        setNotes('')
      }

      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '실증 참여자 등록 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function saveFeedback() {
    if (!selectedFamily) {
      setMessage('선택된 실증 가족이 없습니다.')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/anbu-ops/pilot/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyCode: selectedFamily.familyCode,
          respondentRole: 'guardian',
          rating: feedbackRating,
          burdenRating,
          trustRating,
          comment: feedbackComment
        })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || data.ok === false) {
        setMessage(data.message || '피드백 저장에 실패했습니다.')
      } else {
        setMessage(data.message || '피드백이 저장되었습니다.')
        setFeedbackComment('')
      }

      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '피드백 저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function recordEvent(eventType: string, memo = '') {
    if (!selectedFamily) {
      setMessage('선택된 실증 가족이 없습니다.')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/anbu-ops/pilot/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyCode: selectedFamily.familyCode,
          eventType,
          memo
        })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || data.ok === false) {
        setMessage(data.message || '이벤트 저장에 실패했습니다.')
      } else {
        setMessage(data.message || '이벤트가 저장되었습니다.')
      }

      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '이벤트 저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function copyText(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setMessage(`${label}이 복사되었습니다.`)
    } catch {
      setMessage('복사에 실패했습니다. 직접 선택해서 복사해주세요.')
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredFamilies = useMemo(() => {
    const rows = dashboard?.families || []

    if (filter === 'all') return rows
    if (filter === 'risk') return rows.filter((family) => family.risk === 'risk')
    if (filter === 'watch') return rows.filter((family) => family.risk === 'watch')
    if (filter === 'active') return rows.filter((family) => ['active', 'virtual'].includes(family.participantStatus))
    if (filter === 'completed') return rows.filter((family) => family.participantStatus === 'completed')

    return rows
  }, [dashboard, filter])

  const selectedFamily =
    filteredFamilies.find((family) => family.familyCode === selectedCode) ||
    filteredFamilies[0] ||
    null

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-5 text-[#173B36] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            Pilot Evidence OS™
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            실증 데이터를 쌓아
            <br />
            정부지원·기관제휴 근거를 만듭니다.
          </h1>

          <p className="mt-4 max-w-3xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            안부 응답률, 무응답 처리율, 확인 완료율, 부모님 부담도, 케어파트너 실행률,
            보호자 피드백을 실증 단위로 추적합니다.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={load}
              disabled={loading}
              className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white disabled:opacity-60"
            >
              {loading ? '불러오는 중...' : '새로고침'}
            </button>

            <Link
              href="/ops/anbu-graph"
              className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
            >
              AnbuGraph
            </Link>

            <Link
              href="/ops/risk-action"
              className="rounded-2xl bg-[#F8FCFB] px-5 py-4 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
            >
              Risk-to-Action
            </Link>

            <button
              onClick={() => setShowRaw((value) => !value)}
              className="rounded-2xl bg-[#F8FCFB] px-5 py-4 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
            >
              {showRaw ? '원본 숨기기' : '원본 보기'}
            </button>
          </div>
        </section>

        {message ? (
          <section className="rounded-2xl bg-[#FFF8E8] p-4 text-sm font-black leading-7 text-[#795313] ring-1 ring-[#F4D8A5]">
            {message}
          </section>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(dashboard?.cards || []).map((card) => (
            <section key={card.key} className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8]">
              <div className="text-sm font-black text-[#7A9692]">{card.label}</div>
              <div className="mt-2 text-4xl font-black tracking-[-0.06em] text-[#11977F]">{card.value}</div>
              <p className="mt-2 text-sm font-bold leading-6 text-[#637B76]">{card.help}</p>
            </section>
          ))}
        </div>

        <section className="rounded-[2rem] bg-[#123F38] p-5 text-white sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">기관 제출용 시스템 인사이트</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {(dashboard?.systemInsights || []).map((item) => (
              <div key={item} className="rounded-2xl bg-white/10 p-4 text-sm font-bold leading-7 text-[#E7FFF7] ring-1 ring-white/15">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">실증 참여 가족 등록</h2>

          <form onSubmit={registerParticipant} className="mt-5 grid gap-3 lg:grid-cols-[12rem_1fr_9rem_1fr_10rem]">
            <label className="grid gap-2">
              <span className="text-sm font-black text-[#55736E]">가족코드</span>
              <input
                value={familyCode}
                onChange={(event) => setFamilyCode(normalizeCode(event.target.value))}
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-3 text-center text-lg font-black tracking-[0.14em] outline-none focus:ring-4 focus:ring-[#D6F6EC]"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-[#55736E]">실증 그룹</span>
              <input
                value={cohortName}
                onChange={(event) => setCohortName(event.target.value)}
                className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-[#D6F6EC]"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-[#55736E]">목표 일수</span>
              <input
                value={targetDays}
                onChange={(event) => setTargetDays(Number(event.target.value || 14))}
                type="number"
                min={7}
                max={90}
                className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-[#D6F6EC]"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-[#55736E]">메모</span>
              <input
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="예: 1차 복지관 파일럿"
                className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-[#D6F6EC]"
              />
            </label>

            <div className="flex items-end">
              <button
                disabled={loading}
                className="w-full rounded-2xl bg-[#193B38] px-5 py-3 text-sm font-black text-white disabled:opacity-60"
              >
                등록
              </button>
            </div>
          </form>
        </section>

        <div className="grid gap-5 lg:grid-cols-[0.38fr_1fr]">
          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">실증 가족</h2>

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="mt-4 w-full rounded-2xl border border-[#D8EEE8] bg-white px-4 py-3 text-sm font-bold"
            >
              <option value="all">전체</option>
              <option value="active">실증 중</option>
              <option value="risk">중점관리</option>
              <option value="watch">관찰</option>
              <option value="completed">완료</option>
            </select>

            <div className="mt-5 space-y-3">
              {filteredFamilies.length === 0 ? (
                <div className="rounded-2xl bg-[#F8FCFB] p-4 text-sm font-bold text-[#637B76] ring-1 ring-[#D8EEE8]">
                  표시할 실증 가족이 없습니다.
                </div>
              ) : (
                filteredFamilies.map((family) => (
                  <button
                    key={family.id}
                    onClick={() => setSelectedCode(family.familyCode)}
                    className={
                      'w-full rounded-2xl p-4 text-left ring-1 transition ' +
                      (selectedFamily?.familyCode === family.familyCode
                        ? 'bg-[#EFFFF9] ring-[#CDEFE5]'
                        : 'bg-[#F8FCFB] ring-[#D8EEE8]')
                    }
                  >
                    <div className="flex flex-wrap gap-2">
                      <span className={'rounded-full px-3 py-1 text-xs font-black ring-1 ' + riskClass(family.risk)}>
                        {family.risk === 'risk' ? '중점관리' : family.risk === 'watch' ? '관찰' : '안정'}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#4E6D69] ring-1 ring-[#D8EEE7]">
                        {statusLabel(family.participantStatus)}
                      </span>
                    </div>

                    <h3 className="mt-3 text-xl font-black tracking-[-0.04em]">{family.parentName}</h3>
                    <p className="mt-1 text-sm font-bold leading-6 text-[#637B76]">
                      코드 {family.familyCode} · {family.cohortName}
                    </p>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <MiniMetric label="진행" value={`${family.progressRate}%`} />
                      <MiniMetric label="응답" value={`${family.responseRate}%`} />
                      <MiniMetric label="완료" value={`${family.closureRate}%`} />
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="space-y-5">
            {!selectedFamily ? (
              <section className="rounded-[2rem] bg-white p-8 text-center text-lg font-black shadow-sm ring-1 ring-[#D8EEE8]">
                선택된 실증 가족이 없습니다.
              </section>
            ) : (
              <>
                <section className={'rounded-[2rem] p-5 ring-1 sm:p-6 ' + riskClass(selectedFamily.risk)}>
                  <div className="grid gap-5 lg:grid-cols-[1fr_0.7fr]">
                    <div>
                      <p className="text-sm font-black opacity-75">
                        {selectedFamily.parentName} · 보호자 {selectedFamily.guardianName}
                      </p>
                      <h2 className="mt-3 text-4xl font-black tracking-[-0.07em]">
                        {selectedFamily.cohortName}
                      </h2>
                      <p className="mt-4 text-sm font-bold leading-7 opacity-90">
                        실증 기간 {selectedFamily.startDate} ~ {selectedFamily.endDate} · 목표 {selectedFamily.targetDays}일
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/75 p-5">
                      <div className="text-xs font-black opacity-70">진행률</div>
                      <div className="mt-2 text-5xl font-black tracking-[-0.08em]">{selectedFamily.progressRate}%</div>
                      <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/80">
                        <div
                          className="h-full rounded-full bg-[#20C5A8]"
                          style={{ width: `${selectedFamily.progressRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricCard label="안부 응답률" value={`${selectedFamily.responseRate}%`} help={`${selectedFamily.checkinDays}일 응답 / ${selectedFamily.elapsedDays}일 진행`} />
                  <MetricCard label="확인 완료율" value={`${selectedFamily.closureRate}%`} help={`무응답 ${selectedFamily.noResponseCount}건 / 완료 ${selectedFamily.closureCount}건`} />
                  <MetricCard label="Risk-to-Action" value={`${selectedFamily.riskActionCount}건`} help="위험신호 행동가이드 사용" />
                  <MetricCard label="피드백" value={`${selectedFamily.feedbackCount}건`} help={selectedFamily.averageRating === null ? '만족도 미수집' : `평균 ${selectedFamily.averageRating}/5`} />
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
                    <h2 className="text-2xl font-black tracking-[-0.05em]">실증 인사이트</h2>
                    <div className="mt-5 space-y-3">
                      {selectedFamily.insights.map((item) => (
                        <div key={item} className="rounded-2xl bg-[#F8FCFB] p-4 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D8EEE8]">
                          {item}
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
                    <h2 className="text-2xl font-black tracking-[-0.05em]">다음 조치</h2>
                    <div className="mt-5 space-y-3">
                      {selectedFamily.nextActions.map((item) => (
                        <div key={item} className="rounded-2xl bg-[#EFFFF9] p-4 text-sm font-bold leading-7 text-[#116D5F] ring-1 ring-[#CDEFE5]">
                          {item}
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
                  <h2 className="text-2xl font-black tracking-[-0.05em]">실증 운영 기록</h2>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <button onClick={() => recordEvent('started', '실증 시작 처리')} disabled={loading} className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white disabled:opacity-60">
                      실증 시작
                    </button>
                    <button onClick={() => recordEvent('resolved', '실증 중 확인 완료 처리')} disabled={loading} className="rounded-2xl bg-[#20C5A8] px-5 py-4 text-sm font-black text-white disabled:opacity-60">
                      확인 완료
                    </button>
                    <button onClick={() => recordEvent('issue_reported', '실증 중 문제 신고')} disabled={loading} className="rounded-2xl bg-[#FFF8E8] px-5 py-4 text-sm font-black text-[#795313] ring-1 ring-[#F4D8A5] disabled:opacity-60">
                      문제 신고
                    </button>
                    <button onClick={() => recordEvent('completed', '실증 완료 처리')} disabled={loading} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8] disabled:opacity-60">
                      실증 완료
                    </button>
                  </div>
                </section>

                <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
                  <h2 className="text-2xl font-black tracking-[-0.05em]">피드백 수집</h2>

                  <div className="mt-5 grid gap-3 lg:grid-cols-[8rem_8rem_8rem_1fr_9rem]">
                    <label className="grid gap-2">
                      <span className="text-sm font-black text-[#55736E]">만족도</span>
                      <input type="number" min={1} max={5} value={feedbackRating} onChange={(event) => setFeedbackRating(Number(event.target.value || 5))} className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-3 text-sm font-bold" />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-sm font-black text-[#55736E]">부담도</span>
                      <input type="number" min={1} max={5} value={burdenRating} onChange={(event) => setBurdenRating(Number(event.target.value || 3))} className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-3 text-sm font-bold" />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-sm font-black text-[#55736E]">신뢰도</span>
                      <input type="number" min={1} max={5} value={trustRating} onChange={(event) => setTrustRating(Number(event.target.value || 5))} className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-3 text-sm font-bold" />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-sm font-black text-[#55736E]">의견</span>
                      <input value={feedbackComment} onChange={(event) => setFeedbackComment(event.target.value)} placeholder="예: 알림은 좋지만 오전보다 점심 시간이 편합니다." className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-3 text-sm font-bold" />
                    </label>
                    <div className="flex items-end">
                      <button onClick={saveFeedback} disabled={loading} className="w-full rounded-2xl bg-[#193B38] px-5 py-3 text-sm font-black text-white disabled:opacity-60">
                        저장
                      </button>
                    </div>
                  </div>
                </section>

                <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-2xl font-black tracking-[-0.05em]">가족별 실증 리포트</h2>
                    <button onClick={() => copyText('가족별 실증 리포트', selectedFamily.reportText)} className="rounded-xl bg-[#F8FCFB] px-4 py-2 text-xs font-black text-[#173B36] ring-1 ring-[#D8EEE8]">
                      복사
                    </button>
                  </div>

                  <pre className="mt-4 max-h-[24rem] overflow-auto whitespace-pre-wrap rounded-2xl bg-[#F8FCFB] p-4 text-sm font-bold leading-7 text-[#4E6D69] ring-1 ring-[#D8EEE8]">
                    {selectedFamily.reportText}
                  </pre>
                </section>
              </>
            )}
          </section>
        </div>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-black tracking-[-0.05em]">기관 제출용 전체 요약</h2>
            <button onClick={() => copyText('기관 제출용 전체 요약', dashboard?.reportText || '')} className="rounded-xl bg-[#F8FCFB] px-4 py-2 text-xs font-black text-[#173B36] ring-1 ring-[#D8EEE8]">
              복사
            </button>
          </div>

          <pre className="mt-4 max-h-[24rem] overflow-auto whitespace-pre-wrap rounded-2xl bg-[#123F38] p-4 text-sm font-bold leading-7 text-[#E7FFF7]">
            {dashboard?.reportText || '실증 리포트 데이터가 없습니다.'}
          </pre>
        </section>

        {showRaw ? (
          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">원본 데이터</h2>
            <pre className="mt-4 max-h-[30rem] overflow-auto rounded-2xl bg-[#123F38] p-4 text-xs font-bold leading-6 text-[#E7FFF7]">
              {JSON.stringify(raw, null, 2)}
            </pre>
          </section>
        ) : null}
      </section>
    </main>
  )
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-2 ring-1 ring-[#D8EEE8]">
      <div className="text-[10px] font-black text-[#7A9692]">{label}</div>
      <div className="mt-1 text-sm font-black text-[#173B36]">{value}</div>
    </div>
  )
}

function MetricCard({ label, value, help }: { label: string; value: string; help: string }) {
  return (
    <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8]">
      <div className="text-sm font-black text-[#7A9692]">{label}</div>
      <div className="mt-2 text-4xl font-black tracking-[-0.06em] text-[#11977F]">{value}</div>
      <p className="mt-2 text-sm font-bold leading-6 text-[#637B76]">{help}</p>
    </section>
  )
}
