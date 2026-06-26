'use client'

import { useEffect, useMemo, useState } from 'react'

type Tone = 'safe' | 'watch' | 'danger' | 'neutral' | 'complete' | 'cancelled'
type CaseStatus =
  | 'detected'
  | 'opened'
  | 'notified'
  | 'accepted'
  | 'checking'
  | 'resolved'
  | 'unreachable'
  | 'escalated'
  | 'cancelled'

type CaseEvent = {
  id: string
  eventType: string
  actorName: string
  actorRole: string
  method: string
  resultType: string
  note: string
  createdAt: string
}

type AnbuCase = {
  id: string
  title: string
  reasonType: string
  riskLevel: string
  status: CaseStatus
  source: string
  openedBy: string
  assignedTo: string
  assignedRole: string
  assignedAt: string
  resolvedAt: string
  cancelledAt: string
  closeResult: string
  closeNote: string
  dataQuality: string
  createdAt: string
  timeline: CaseEvent[]
}

type DashboardData = {
  ok: boolean
  demo?: boolean
  message?: string
  generatedKst?: string
  family?: {
    familyCode: string
    parentName: string
    guardianName: string
  }
  dashboard?: {
    status: {
      key: string
      label: string
      title: string
      desc: string
      tone: Tone
    }
    todayLine: string
    nextAction: string
    activeCases: AnbuCase[]
    resolvedCases: AnbuCase[]
    cancelledCases: AnbuCase[]
    allCases: AnbuCase[]
    dailyOkCount: number
    metrics: {
      totalCases: number
      activeCount: number
      resolvedCount: number
      cancelledCount: number
      completionRate: number
      averageCloseMinutes: number | null
    }
    reportText: string
    notice: string
  }
  savedReport?: {
    ok: boolean
    shareUrl?: string
    shareToken?: string
    fallback?: boolean
  }
  sourceErrors?: string[]
}

const resultOptions = [
  ['same_as_usual', '평소와 같음'],
  ['meal_confirmed', '식사 확인 완료'],
  ['medication_confirmed', '복약 확인 완료'],
  ['device_issue', '기기·데이터 문제'],
  ['phone_missed', '휴대폰 미확인'],
  ['felt_unwell', '몸 상태 불편'],
  ['contact_failed', '연락 실패'],
  ['emergency_guided', '응급 연락 안내'],
  ['other', '기타']
] as const

const reasonOptions = [
  ['no_response', '미응답 확인'],
  ['condition', '몸 상태 확인'],
  ['meal', '식사 확인'],
  ['medication', '복약 확인'],
  ['data_gap', '데이터 부족'],
  ['manual', '수동 확인']
] as const

function toneClass(tone: Tone) {
  if (tone === 'danger') return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  if (tone === 'watch') return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  if (tone === 'complete') return 'bg-[#F0F7FF] text-[#245B8A] ring-[#C9E1F8]'
  if (tone === 'cancelled') return 'bg-[#F3F4F6] text-[#4B5563] ring-[#E5E7EB]'
  if (tone === 'safe') return 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'
  return 'bg-white text-[#17443F] ring-[#D6EDE7]'
}

function statusEmoji(tone: Tone) {
  if (tone === 'danger') return '🚨'
  if (tone === 'watch') return '🟡'
  if (tone === 'complete') return '📘'
  if (tone === 'cancelled') return '↩️'
  if (tone === 'safe') return '✅'
  return '🤍'
}

function caseTone(item: AnbuCase): Tone {
  if (item.status === 'cancelled') return 'cancelled'
  if (item.status === 'resolved') return 'complete'
  if (item.status === 'unreachable' || item.status === 'escalated') return 'danger'
  if (item.riskLevel === 'high') return 'danger'
  if (item.reasonType === 'data_gap') return 'neutral'
  return 'watch'
}

function statusLabel(status: CaseStatus) {
  const map: Record<CaseStatus, string> = {
    detected: '신호 감지',
    opened: '확인 필요',
    notified: '알림 발송',
    accepted: '담당자 지정',
    checking: '확인 중',
    resolved: '확인 완료',
    unreachable: '연락 실패',
    escalated: '이관됨',
    cancelled: '취소됨'
  }

  return map[status]
}

function resultLabel(value: string) {
  return resultOptions.find(([key]) => key === value)?.[1] || value || '확인 완료'
}

function formatDate(value: string) {
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return value || ''

  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(parsed))
}

function initialFamilyCode() {
  if (typeof window === 'undefined') return ''

  const params = new URLSearchParams(window.location.search)
  return (
    params.get('familyCode') ||
    window.localStorage.getItem('anbu-guardian-family-code') ||
    window.localStorage.getItem('anbu-parent-family-code') ||
    ''
  )
}

export function GuardianCompletionCarePanel() {
  const [familyCode, setFamilyCode] = useState('')
  const [actorName, setActorName] = useState('')
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  const [activeCaseId, setActiveCaseId] = useState('')
  const [closeResult, setCloseResult] = useState('same_as_usual')
  const [closeNote, setCloseNote] = useState('')
  const [manualReason, setManualReason] = useState('no_response')
  const [shareUrl, setShareUrl] = useState('')

  const dashboard = data?.dashboard
  const status = dashboard?.status || {
    key: 'waiting',
    label: '확인 대기',
    title: '안부완료 리포트를 불러오는 중입니다.',
    desc: '잠시만 기다려 주세요.',
    tone: 'neutral' as Tone
  }

  const activeCases = useMemo(() => dashboard?.activeCases || [], [dashboard])
  const resolvedCases = useMemo(() => dashboard?.resolvedCases || [], [dashboard])
  const cancelledCases = useMemo(() => dashboard?.cancelledCases || [], [dashboard])
  const reportText = dashboard?.reportText || '[안부웍스] 안부완료 리포트'

  async function load(nextCode = familyCode) {
    const clean = nextCode.trim()

    setLoading(true)
    setMessage('')

    try {
      const url = clean
        ? `/api/anbu-completion?familyCode=${encodeURIComponent(clean)}`
        : '/api/anbu-completion'

      const response = await fetch(url, {
        cache: 'no-store',
        credentials: 'include'
      })

      const result = await response.json().catch(() => ({})) as DashboardData

      if (!response.ok || result.ok === false) {
        throw new Error(result.message || '안부완료 리포트를 불러오지 못했습니다.')
      }

      setData(result)

      if (clean && typeof window !== 'undefined') {
        window.localStorage.setItem('anbu-guardian-family-code', clean)
        const nextUrl = new URL(window.location.href)
        nextUrl.searchParams.set('familyCode', clean)
        window.history.replaceState(null, '', nextUrl.toString())
      }

      if (!actorName && result.family?.guardianName) {
        setActorName(result.family.guardianName)
      }

      if (!activeCaseId && result.dashboard?.activeCases?.[0]) {
        setActiveCaseId(result.dashboard.activeCases[0].id)
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '안부완료 리포트를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function post(action: string, body: Record<string, unknown>) {
    const clean = familyCode.trim()

    if (!clean) {
      setMessage('가족코드를 먼저 입력해주세요.')
      return
    }

    setBusy(action)
    setMessage('')

    try {
      const response = await fetch('/api/anbu-completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          familyCode: clean,
          action,
          actorName: actorName || data?.family?.guardianName || '보호자',
          ...body
        })
      })

      const result = await response.json().catch(() => ({})) as DashboardData & { message?: string }

      if (!response.ok || result.ok === false) {
        throw new Error(result.message || '저장에 실패했습니다.')
      }

      setData(result)
      setMessage(result.message || '저장되었습니다.')
      setCloseNote('')

      if (result.savedReport?.shareUrl) {
        setShareUrl(result.savedReport.shareUrl)
      }

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('anbu-guardian-family-code', clean)
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '저장에 실패했습니다.')
    } finally {
      setBusy('')
    }
  }

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(reportText)
      setMessage('안부완료 리포트를 복사했습니다.')
    } catch {
      setMessage('복사에 실패했습니다. 브라우저 권한을 확인해주세요.')
    }
  }

  async function saveReport() {
    await post('save_report', {})
  }

  function printReport() {
    window.print()
  }

  useEffect(() => {
    const code = initialFamilyCode()
    setFamilyCode(code)
    void load(code)
  }, [])

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#E7FFF7_0%,#F7FFFC_36%,#FFFFFF_78%)] px-4 py-7 text-[#17443F]">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="overflow-hidden rounded-[2.4rem] bg-white/95 shadow-[0_24px_80px_rgba(49,151,136,0.10)] ring-1 ring-[#D6EDE7]">
          <div className="grid gap-0 xl:grid-cols-[1.08fr_0.92fr]">
            <div className="p-6 sm:p-9">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7]">
                  확인완료형 안부케어
                </span>
                <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                  안부완료 리포트
                </span>
                <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#637B76] ring-1 ring-[#D6EDE7]">
                  {data?.generatedKst || '오늘'}
                </span>
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.08em] sm:text-6xl">
                오늘 할 일부터
                <br />
                확인완료까지.
              </h1>

              <p className="mt-5 max-w-3xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
                안부웍스는 알림에서 멈추지 않습니다. 확인필요 사건을 만들고, 담당자를 지정하고, 전화·방문 결과가 입력되어야 안부완료 리포트가 완성됩니다.
              </p>

              <div className="mt-7 grid gap-3 lg:grid-cols-[1fr_0.7fr_auto]">
                <input
                  value={familyCode}
                  onChange={(event) => setFamilyCode(event.target.value.replace(/[^\w-]/g, '').slice(0, 64))}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') load()
                  }}
                  placeholder="가족코드 입력"
                  className="rounded-2xl border border-[#D6EDE7] bg-white px-5 py-4 text-sm font-black text-[#17443F] outline-none focus:border-[#2AA897] focus:ring-4 focus:ring-[#D8FFF3]"
                />

                <input
                  value={actorName}
                  onChange={(event) => setActorName(event.target.value.slice(0, 30))}
                  placeholder="확인자 이름"
                  className="rounded-2xl border border-[#D6EDE7] bg-white px-5 py-4 text-sm font-black text-[#17443F] outline-none focus:border-[#2AA897] focus:ring-4 focus:ring-[#D8FFF3]"
                />

                <button
                  onClick={() => load()}
                  disabled={loading}
                  className="rounded-2xl bg-[#EFFFFA] px-5 py-4 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7] disabled:opacity-50"
                >
                  {loading ? '불러오는 중' : '새로고침'}
                </button>
              </div>
            </div>

            <aside className="bg-[linear-gradient(135deg,#EFFFFA_0%,#F7FFFC_52%,#FFFFFF_100%)] p-6 sm:p-9">
              <div className={`rounded-[2rem] p-6 ring-1 ${toneClass(status.tone)}`}>
                <div className="text-5xl">{statusEmoji(status.tone)}</div>
                <div className="mt-4 text-sm font-black opacity-70">오늘 상태</div>
                <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{status.label}</div>
                <h2 className="mt-4 text-2xl font-black tracking-[-0.05em]">{status.title}</h2>
                <p className="mt-3 text-sm font-bold leading-7 opacity-80">{status.desc}</p>
              </div>
            </aside>
          </div>
        </section>

        {message ? (
          <section className="rounded-[2rem] bg-[#FFF9EE] p-5 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            {message}
          </section>
        ) : null}

        <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-[#D6EDE7]">
          <div className="rounded-full bg-[#FFF4F4] px-4 py-2 text-sm font-black text-[#8A3030] ring-1 ring-[#F3C8C8] inline-flex">
            오늘 할 일
          </div>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.07em]">
            {dashboard?.nextAction || '안부완료 리포트를 준비 중입니다.'}
          </h2>
          <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
            {dashboard?.todayLine || '가족코드를 입력하면 오늘 할 일이 표시됩니다.'}
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7]">
            <div className="text-xs font-black text-[#637B76]">미완료 사건</div>
            <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{dashboard?.metrics.activeCount ?? 0}</div>
          </div>

          <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7]">
            <div className="text-xs font-black text-[#637B76]">확인완료</div>
            <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{dashboard?.metrics.resolvedCount ?? 0}</div>
          </div>

          <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7]">
            <div className="text-xs font-black text-[#637B76]">취소</div>
            <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{dashboard?.metrics.cancelledCount ?? 0}</div>
          </div>

          <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7]">
            <div className="text-xs font-black text-[#637B76]">확인완료율</div>
            <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{dashboard?.metrics.completionRate ?? 0}%</div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-[#D6EDE7]">
            <div className="rounded-full bg-[#FFF4F4] px-4 py-2 text-sm font-black text-[#8A3030] ring-1 ring-[#F3C8C8] inline-flex">
              확인 사건함
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-[-0.07em]">미완료 확인건</h2>

            <div className="mt-5 space-y-4">
              {activeCases.length ? activeCases.map((caseItem) => (
                <div key={caseItem.id} className="rounded-[1.5rem] bg-[#FAFFFD] p-5 ring-1 ring-[#D6EDE7]">
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${toneClass(caseTone(caseItem))}`}>
                      {statusLabel(caseItem.status)}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#637B76] ring-1 ring-[#D6EDE7]">
                      {formatDate(caseItem.createdAt)}
                    </span>
                    {caseItem.assignedTo ? (
                      <span className="rounded-full bg-[#F0F7FF] px-3 py-1 text-xs font-black text-[#245B8A] ring-1 ring-[#C9E1F8]">
                        {caseItem.assignedTo} 확인 중
                      </span>
                    ) : null}
                    {caseItem.dataQuality && caseItem.dataQuality !== 'unknown' ? (
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#637B76] ring-1 ring-[#D6EDE7]">
                        데이터: {caseItem.dataQuality}
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-3 text-xl font-black">{caseItem.title}</h3>

                  <div className="mt-4 grid gap-2 sm:grid-cols-5">
                    <button
                      onClick={() => {
                        setActiveCaseId(caseItem.id)
                        post('accept_case', {
                          caseId: caseItem.id,
                          reasonType: caseItem.reasonType,
                          riskLevel: caseItem.riskLevel
                        })
                      }}
                      disabled={Boolean(busy)}
                      className="rounded-xl bg-[#EFFFFA] px-4 py-3 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7] disabled:opacity-50"
                    >
                      제가 확인
                    </button>

                    <button
                      onClick={() => {
                        setActiveCaseId(caseItem.id)
                        post('call_log', {
                          caseId: caseItem.id,
                          reasonType: caseItem.reasonType,
                          riskLevel: caseItem.riskLevel,
                          method: '전화'
                        })
                      }}
                      disabled={Boolean(busy)}
                      className="rounded-xl bg-white px-4 py-3 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50"
                    >
                      전화 기록
                    </button>

                    <button
                      onClick={() => setActiveCaseId(caseItem.id)}
                      className="rounded-xl bg-[#17443F] px-4 py-3 text-sm font-black text-white"
                    >
                      완료 준비
                    </button>

                    <button
                      onClick={() => {
                        setActiveCaseId(caseItem.id)
                        post('close_case', {
                          caseId: caseItem.id,
                          reasonType: caseItem.reasonType,
                          resultType: 'contact_failed',
                          method: '전화',
                          note: '전화했지만 연락이 되지 않았습니다.'
                        })
                      }}
                      disabled={Boolean(busy)}
                      className="rounded-xl bg-[#FFF9EE] px-4 py-3 text-sm font-black text-[#795C22] ring-1 ring-[#F3DEB5] disabled:opacity-50"
                    >
                      연락 실패
                    </button>

                    <button
                      onClick={() => {
                        setActiveCaseId(caseItem.id)
                        post('cancel_case', {
                          caseId: caseItem.id,
                          reasonType: caseItem.reasonType,
                          resultType: 'wrong_press',
                          note: '잘못 눌림 또는 오류로 취소했습니다.'
                        })
                      }}
                      disabled={Boolean(busy)}
                      className="rounded-xl bg-[#F3F4F6] px-4 py-3 text-sm font-black text-[#4B5563] ring-1 ring-[#E5E7EB] disabled:opacity-50"
                    >
                      취소
                    </button>
                  </div>

                  <div className="mt-4 space-y-2">
                    {caseItem.timeline.map((item) => (
                      <div key={item.id} className="rounded-xl bg-white p-3 text-xs font-bold leading-6 text-[#637B76] ring-1 ring-[#EDF6F3]">
                        {formatDate(item.createdAt)} · {item.eventType}
                        {item.actorName ? ` · ${item.actorName}` : ''}
                        {item.note ? ` · ${item.note}` : ''}
                      </div>
                    ))}
                  </div>
                </div>
              )) : (
                <div className="rounded-[1.5rem] bg-[#EFFFFA] p-6 text-sm font-black leading-7 text-[#247A71] ring-1 ring-[#CDEFE7]">
                  지금 미완료 확인건이 없습니다.
                </div>
              )}
            </div>
          </article>

          <article className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-[#D6EDE7]">
            <div className="rounded-full bg-[#F0F7FF] px-4 py-2 text-sm font-black text-[#245B8A] ring-1 ring-[#C9E1F8] inline-flex">
              결과 입력
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-[-0.07em]">안부완료 처리</h2>
            <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
              실제 전화·방문·앱 확인 결과를 입력해야 사건이 종료됩니다.
            </p>

            <div className="mt-5 space-y-3">
              <select
                value={activeCaseId}
                onChange={(event) => setActiveCaseId(event.target.value)}
                className="w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-black outline-none"
              >
                <option value="">완료 처리할 사건 선택</option>
                {activeCases.map((caseItem) => (
                  <option key={caseItem.id} value={caseItem.id}>
                    {caseItem.title}
                  </option>
                ))}
              </select>

              <select
                value={closeResult}
                onChange={(event) => setCloseResult(event.target.value)}
                className="w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-black outline-none"
              >
                {resultOptions.map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>

              <textarea
                value={closeNote}
                onChange={(event) => setCloseNote(event.target.value.slice(0, 500))}
                placeholder="확인 결과 메모 예: 전화 확인 완료. 평소와 같고 추가 조치 필요 없음."
                className="min-h-[120px] w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold leading-7 outline-none"
              />

              <button
                onClick={() => post('close_case', {
                  caseId: activeCaseId,
                  resultType: closeResult,
                  method: '전화',
                  note: closeNote
                })}
                disabled={!activeCaseId || Boolean(busy)}
                className="w-full rounded-2xl bg-[#17443F] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
              >
                안부 확인 완료 처리
              </button>

              <button
                onClick={() => post('escalate_case', {
                  caseId: activeCaseId,
                  note: '운영실 또는 다른 가족 확인이 필요합니다.'
                })}
                disabled={!activeCaseId || Boolean(busy)}
                className="w-full rounded-2xl bg-[#FFF9EE] px-5 py-4 text-sm font-black text-[#795C22] ring-1 ring-[#F3DEB5] disabled:opacity-50"
              >
                운영실·다른 담당자에게 이관
              </button>
            </div>

            <div className="mt-6">
              <div className="rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7] inline-flex">
                수동 사건 생성
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                <select
                  value={manualReason}
                  onChange={(event) => setManualReason(event.target.value)}
                  className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-black outline-none"
                >
                  {reasonOptions.map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>

                <button
                  onClick={() => post('open_case', { reasonType: manualReason })}
                  disabled={Boolean(busy)}
                  className="rounded-2xl bg-[#17443F] px-5 py-3 text-sm font-black text-white disabled:opacity-50"
                >
                  생성
                </button>
              </div>
            </div>
          </article>
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-[#D6EDE7]">
            <div className="rounded-full bg-[#F0F7FF] px-4 py-2 text-sm font-black text-[#245B8A] ring-1 ring-[#C9E1F8] inline-flex">
              최근 완료·취소
            </div>

            <div className="mt-5 space-y-3">
              {[...resolvedCases, ...cancelledCases].slice(0, 8).map((caseItem) => (
                <div key={caseItem.id} className={`rounded-2xl p-4 ring-1 ${toneClass(caseTone(caseItem))}`}>
                  <div className="text-xs font-black opacity-70">{statusLabel(caseItem.status)}</div>
                  <div className="mt-2 text-lg font-black">{caseItem.title}</div>
                  <div className="mt-2 text-sm font-bold opacity-80">
                    {caseItem.closeResult ? resultLabel(caseItem.closeResult) : ''}
                    {caseItem.resolvedAt ? ` · ${formatDate(caseItem.resolvedAt)}` : ''}
                    {caseItem.cancelledAt ? ` · ${formatDate(caseItem.cancelledAt)}` : ''}
                  </div>
                </div>
              ))}

              {[...resolvedCases, ...cancelledCases].length === 0 ? (
                <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-black text-[#637B76] ring-1 ring-[#D6EDE7]">
                  아직 완료 또는 취소된 사건이 없습니다.
                </div>
              ) : null}
            </div>
          </article>

          <article className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-[#D6EDE7]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7] inline-flex">
                  본상품
                </div>
                <h2 className="mt-4 text-3xl font-black tracking-[-0.07em]">안부완료 리포트</h2>
                <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                  확인필요 상황이 실제로 확인·조치·종료됐다는 기록입니다.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={copyReport}
                  className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
                >
                  복사
                </button>
                <button
                  onClick={saveReport}
                  disabled={Boolean(busy)}
                  className="rounded-2xl bg-[#EFFFFA] px-4 py-3 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7] disabled:opacity-50"
                >
                  저장·공유
                </button>
                <button
                  onClick={printReport}
                  className="rounded-2xl bg-[#17443F] px-4 py-3 text-sm font-black text-white"
                >
                  인쇄/PDF
                </button>
              </div>
            </div>

            {shareUrl ? (
              <div className="mt-4 rounded-2xl bg-[#F0F7FF] p-4 text-sm font-black leading-7 text-[#245B8A] ring-1 ring-[#C9E1F8]">
                공유 링크: {shareUrl}
              </div>
            ) : null}

            <pre className="mt-5 max-h-[520px] overflow-auto whitespace-pre-wrap rounded-[1.5rem] bg-[#F8FFFC] p-5 text-sm font-bold leading-7 text-[#315E58] ring-1 ring-[#D6EDE7]">
              {reportText}
            </pre>
          </article>
        </section>
      </section>
    </main>
  )
}
