'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type EscalationFamily = {
  familyCode: string
  parentName: string
  guardianName: string
  guardianPhone: string
  stage: string
  stageLabel: string
  stageDesc: string
  severity: string
  elapsedHours: number | null
  lastCheckinAt: string | null
  lastEventAt: string | null
  lastActionType: string | null
  riskReasons: string[]
  activeCareRequests: number
  recommendedActions: Array<{
    actionType: string
    label: string
    desc: string
    priority: 'normal' | 'important' | 'urgent'
  }>
}

type Dashboard = {
  generatedAt: string
  cards: Array<{
    key: string
    label: string
    value: number
    help: string
  }>
  families: EscalationFamily[]
  rawCounts: Record<string, number>
}

function stageClass(severity: string) {
  if (severity === 'high') return 'bg-[#FFF1F1] text-[#8A2525] ring-[#F3BBBB]'
  if (severity === 'medium') return 'bg-[#FFF8E8] text-[#795313] ring-[#F4D8A5]'
  if (severity === 'low') return 'bg-[#F7FBFF] text-[#234B68] ring-[#DCEDE7]'
  return 'bg-[#EFFFF9] text-[#116D5F] ring-[#CDEFE5]'
}

function actionClass(priority: string) {
  if (priority === 'urgent') return 'bg-[#8A2525] text-white'
  if (priority === 'important') return 'bg-[#193B38] text-white'
  return 'bg-white text-[#173B36] ring-1 ring-[#D8EEE8]'
}

function timeLabel(value: string | null) {
  if (!value) return '-'

  const date = new Date(value)

  if (!Number.isFinite(date.getTime())) return value

  return date.toLocaleString('ko-KR')
}

export function AnbuEscalationOps() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [raw, setRaw] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [showRaw, setShowRaw] = useState(false)
  const [filter, setFilter] = useState('all')

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/anbu-ops/escalation', { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      setRaw(data)
      setDashboard(data.dashboard || null)

      if (!response.ok || data.ok === false) {
        setMessage(data.message || '무응답 에스컬레이션 데이터를 불러오지 못했습니다.')
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '무응답 에스컬레이션 데이터를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function recordAction(family: EscalationFamily, actionType: string, memo: string) {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/anbu-ops/escalation/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyCode: family.familyCode,
          actionType,
          stage: family.stage,
          memo
        })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || data.ok === false) {
        setMessage(data.message || '기록 저장에 실패했습니다.')
      } else {
        setMessage(data.message || '기록이 저장되었습니다.')
      }

      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '기록 저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const families = useMemo(() => {
    const rows = dashboard?.families || []

    if (filter === 'all') return rows

    if (filter === 'urgent') {
      return rows.filter((row) => ['help', 'stage3'].includes(row.stage))
    }

    return rows.filter((row) => row.stage === filter)
  }, [dashboard, filter])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-5 text-[#173B36] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            운영실 · 무응답 에스컬레이션
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            부모님 무응답을
            <br />
            단계별로 확인합니다.
          </h1>

          <p className="mt-4 max-w-3xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            3시간, 6시간, 12시간 이상 무응답을 단계별로 분류하고
            부모님 재확인, 보호자 확인, 가족 2차 확인, 케어파트너 방문확인으로 연결합니다.
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
              href="/ops/dashboard"
              className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
            >
              운영실 홈
            </Link>

            <Link
              href="/child/safety-loop"
              className="rounded-2xl bg-[#F8FCFB] px-5 py-4 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
            >
              안심루프
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

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-[-0.05em]">확인 대상</h2>
              <p className="mt-2 text-sm font-bold text-[#637B76]">
                실제 SMS 발송 없이 운영 기록만 남깁니다. 발송은 별도 알림 발송함에서 관리하세요.
              </p>
            </div>

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-3 text-sm font-bold"
            >
              <option value="all">전체</option>
              <option value="urgent">긴급/3단계</option>
              <option value="stage2">2단계</option>
              <option value="stage1">1단계</option>
              <option value="normal">정상</option>
              <option value="resolved">확인 완료</option>
            </select>
          </div>

          <div className="mt-5 grid gap-3">
            {families.length === 0 ? (
              <div className="rounded-2xl bg-[#F8FCFB] p-5 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D8EEE8]">
                표시할 대상이 없습니다.
              </div>
            ) : (
              families.map((family) => (
                <article key={family.familyCode} className="rounded-[2rem] bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8] sm:p-5">
                  <div className="flex flex-wrap gap-2">
                    <span className={'rounded-full px-3 py-1 text-xs font-black ring-1 ' + stageClass(family.severity)}>
                      {family.stageLabel}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#4E6D69] ring-1 ring-[#D8EEE7]">
                      코드 {family.familyCode || '-'}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#4E6D69] ring-1 ring-[#D8EEE7]">
                      마지막 안부 {family.elapsedHours === null ? '없음' : `${family.elapsedHours}시간 전`}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                    <div>
                      <h3 className="text-2xl font-black tracking-[-0.05em]">
                        {family.parentName}
                      </h3>
                      <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                        보호자: {family.guardianName || '-'} · {family.guardianPhone || '-'}
                      </p>
                      <p className="mt-2 text-sm font-bold leading-7 text-[#4E6D69]">
                        {family.stageDesc}
                      </p>

                      <div className="mt-4 grid gap-2 text-xs font-bold text-[#7A9692] sm:grid-cols-2">
                        <p>마지막 안부: {timeLabel(family.lastCheckinAt)}</p>
                        <p>마지막 조치: {timeLabel(family.lastEventAt)}</p>
                        <p>최근 조치: {family.lastActionType || '-'}</p>
                        <p>진행 케어요청: {family.activeCareRequests}건</p>
                      </div>

                      <div className="mt-4 space-y-2">
                        {family.riskReasons.map((reason) => (
                          <div key={reason} className="rounded-2xl bg-white p-3 text-sm font-bold leading-6 text-[#637B76] ring-1 ring-[#D8EEE8]">
                            {reason}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white p-4 ring-1 ring-[#D8EEE8]">
                      <h4 className="text-lg font-black tracking-[-0.04em]">운영 조치</h4>

                      <div className="mt-4 grid gap-2">
                        {family.recommendedActions.map((action) => (
                          <button
                            key={action.actionType}
                            onClick={() => recordAction(family, action.actionType, action.desc)}
                            disabled={loading}
                            className={'rounded-2xl px-4 py-3 text-left text-sm font-black disabled:opacity-60 ' + actionClass(action.priority)}
                          >
                            <div>{action.label}</div>
                            <p className="mt-1 text-xs font-bold leading-5 opacity-80">{action.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
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
