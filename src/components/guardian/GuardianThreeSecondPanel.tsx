'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type KeyboardEvent } from 'react'

type AutoMode = 'simple' | 'standard' | 'intensive'
type Tone = 'safe' | 'watch' | 'danger' | 'neutral'

type Profile = {
  mode: AutoMode
  label: string
  description: string
}

type DashboardData = {
  ok: boolean
  message?: string
  generatedAt?: string
  family?: {
    familyCode: string
    parentName: string
    guardianName: string
    parentPhone: string
    parentPhoneMasked: string
    guardianPhoneMasked: string
  }
  profile?: Profile
  profiles?: Profile[]
  assessment?: {
    key: 'normal' | 'data_insufficient' | 'needs_check'
    tone: 'safe' | 'watch' | 'danger'
    label: string
    title: string
    reason: string
    nextAction: string
    confidence: number
    dataQuality: number
    battery: number | null
    lastSyncAt: string | null
    hoursSinceSync: number | null
    wearing: 'wearing' | 'not_wearing' | 'unknown'
    learningHint: string
  }
  ring?: {
    reportId: string
    reportDate: string
    score: number | null
    summary: string
    recommendedAction: string
    source: string
    metrics: Record<string, unknown>
  }
  incident?: {
    id: string
    status: string
    riskLevel: string
    title: string
    assignee: string
    delegatedTo: string
    createdAt: string
  } | null
  outcomes?: Array<{ key: string; label: string }>
  timeline?: Array<{
    id: string
    title: string
    createdAt: string
    tone: Tone
  }>
  sourceErrors?: string[]
  notice?: string
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

function toneClass(tone: Tone) {
  if (tone === 'danger') return 'bg-[#FFF1F1] text-[#8A3030] ring-[#F1C7C7]'
  if (tone === 'watch') return 'bg-[#FFF8E9] text-[#795C22] ring-[#EFD9A8]'
  if (tone === 'safe') return 'bg-[#EFFFFA] text-[#176F62] ring-[#BFEBDD]'
  return 'bg-white text-[#315E58] ring-[#D6EDE7]'
}

function toneEmoji(tone: Tone) {
  if (tone === 'danger') return '🚨'
  if (tone === 'watch') return '📡'
  if (tone === 'safe') return '✅'
  return '🤍'
}

function formatDate(value?: string | null) {
  if (!value) return '확인되지 않음'
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

export function GuardianThreeSecondPanel() {
  const [familyCode, setFamilyCode] = useState('')
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  const [showOutcomes, setShowOutcomes] = useState(false)

  const load = useCallback(async (nextCode: string) => {
    const clean = nextCode.trim()

    if (!clean) {
      setLoading(false)
      setMessage('가족코드를 입력해주세요.')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch(`/api/anbu-auto?familyCode=${encodeURIComponent(clean)}`, {
        cache: 'no-store',
        credentials: 'include'
      })
      const result = await response.json().catch(() => ({})) as DashboardData

      if (!response.ok || result.ok === false) {
        throw new Error(result.message || '안부 자동화 화면을 불러오지 못했습니다.')
      }

      setData(result)
      setFamilyCode(clean)
      window.localStorage.setItem('anbu-guardian-family-code', clean)

      const nextUrl = new URL(window.location.href)
      nextUrl.searchParams.set('familyCode', clean)
      window.history.replaceState(null, '', nextUrl.toString())
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '화면을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const code = initialFamilyCode()
    setFamilyCode(code)
    void load(code)
  }, [load])

  async function post(action: string, extra: Record<string, unknown> = {}) {
    if (!familyCode) return

    setBusy(action)
    setMessage('')

    try {
      const response = await fetch('/api/anbu-auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ familyCode, action, ...extra })
      })
      const result = await response.json().catch(() => ({})) as DashboardData

      if (!response.ok || result.ok === false) {
        throw new Error(result.message || '처리 중 오류가 발생했습니다.')
      }

      setData(result)
      setShowOutcomes(false)
      setMessage('저장되었습니다.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.')
    } finally {
      setBusy('')
    }
  }

  async function startCall() {
    await post('call', { incidentId: data?.incident?.id || '' })

    if (data?.family?.parentPhone) {
      window.location.href = `tel:${data.family.parentPhone}`
    } else {
      setMessage('부모님 전화번호가 등록되지 않았습니다.')
    }
  }

  async function delegate() {
    const name = window.prompt('확인을 부탁할 가족 이름을 입력해주세요.', '')
    if (!name?.trim()) return

    if (!data?.incident?.id) {
      await post('claim', {
        assignee: data?.family?.guardianName || '보호자'
      })
      setMessage('먼저 확인 사건을 만들었습니다. 다시 부탁하기를 눌러주세요.')
      return
    }

    await post('delegate', {
      incidentId: data.incident.id,
      delegatedTo: name.trim()
    })
  }

  const assessment = data?.assessment
  const tone = assessment?.tone || 'neutral'
  const profiles = data?.profiles || []
  const incident = data?.incident
  const outcomes = data?.outcomes || []
  const timeline = useMemo(() => data?.timeline || [], [data])

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#E7FFF7_0%,#F8FFFC_38%,#FFFFFF_76%)] px-4 py-6 text-[#17443F] sm:py-9">
      <section className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-[2.25rem] bg-white/95 p-5 shadow-[0_24px_80px_rgba(49,151,136,0.10)] ring-1 ring-[#D6EDE7] sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#176F62] ring-1 ring-[#BFEBDD]">
                보호자 3초 안부
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-[-0.07em] sm:text-5xl">
                지금 상태와 할 일만 봅니다.
              </h1>
            </div>

            <Link
              href={`/guardian/today?familyCode=${encodeURIComponent(familyCode)}`}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-black ring-1 ring-[#D6EDE7]"
            >
              상세 리포트 보기
            </Link>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              value={familyCode}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setFamilyCode(event.target.value.replace(/[^\w-]/g, '').slice(0, 48))}
              onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                if (event.key === 'Enter') void load(familyCode)
              }}
              placeholder="가족코드"
              className="rounded-2xl border border-[#D6EDE7] px-5 py-4 text-base font-black outline-none focus:border-[#2AA897] focus:ring-4 focus:ring-[#D8FFF3]"
            />
            <button
              type="button"
              onClick={() => void load(familyCode)}
              disabled={loading}
              className="rounded-2xl bg-[#EFFFFA] px-6 py-4 text-sm font-black text-[#176F62] ring-1 ring-[#BFEBDD] disabled:opacity-50"
            >
              {loading ? '불러오는 중' : '새로 확인'}
            </button>
          </div>
        </section>

        {message ? (
          <section className="rounded-2xl bg-[#FFF8E9] p-4 text-sm font-black text-[#795C22] ring-1 ring-[#EFD9A8]">
            {message}
          </section>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <article className={`rounded-[2.25rem] p-6 ring-1 sm:p-8 ${toneClass(tone)}`}>
            <div className="text-5xl">{toneEmoji(tone)}</div>
            <div className="mt-4 text-sm font-black opacity-70">지금 부모님 상태</div>
            <div className="mt-2 text-4xl font-black tracking-[-0.07em] sm:text-5xl">
              {assessment?.label || '확인 중'}
            </div>
            <h2 className="mt-5 text-2xl font-black tracking-[-0.04em]">
              {assessment?.title || '데이터를 확인하고 있습니다.'}
            </h2>
            <p className="mt-3 text-base font-bold leading-8 opacity-85">
              {assessment?.reason || '잠시만 기다려주세요.'}
            </p>
            <div className="mt-5 rounded-2xl bg-white/70 p-4 text-sm font-black leading-7 ring-1 ring-black/5">
              지금 할 일: {assessment?.nextAction || '별도 조치가 없습니다.'}
            </div>
          </article>

          <article className="rounded-[2.25rem] bg-white p-6 ring-1 ring-[#D6EDE7] sm:p-8">
            <div className="text-sm font-black text-[#637B76]">데이터 신뢰도</div>
            <div className="mt-3 flex items-end gap-2">
              <div className="text-5xl font-black tracking-[-0.08em]">
                {assessment?.dataQuality ?? 0}
              </div>
              <div className="pb-2 text-xl font-black text-[#637B76]">%</div>
            </div>

            <div className="mt-5 space-y-3 text-sm font-bold">
              <div className="flex justify-between gap-3 rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                <span className="text-[#637B76]">마지막 동기화</span>
                <span>{formatDate(assessment?.lastSyncAt)}</span>
              </div>
              <div className="flex justify-between gap-3 rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                <span className="text-[#637B76]">반지 배터리</span>
                <span>{assessment?.battery === null || assessment?.battery === undefined ? '확인되지 않음' : `${assessment.battery}%`}</span>
              </div>
              <div className="flex justify-between gap-3 rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                <span className="text-[#637B76]">착용 추정</span>
                <span>
                  {assessment?.wearing === 'wearing'
                    ? '착용 중'
                    : assessment?.wearing === 'not_wearing'
                      ? '미착용 추정'
                      : '판단 보류'}
                </span>
              </div>
            </div>

            <p className="mt-5 text-sm font-bold leading-7 text-[#637B76]">
              상태 이상과 데이터 부족을 분리해 불필요한 걱정을 줄입니다.
            </p>
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <article className="rounded-[2.25rem] bg-white p-6 ring-1 ring-[#D6EDE7] sm:p-8">
            <div className="text-sm font-black text-[#637B76]">확인 사건함</div>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.06em]">
              {incident ? '확인 진행 중' : assessment?.key === 'normal' ? '열린 사건 없음' : '확인 담당을 정해주세요'}
            </h2>

            {incident ? (
              <div className="mt-5 rounded-2xl bg-[#FAFFFD] p-5 ring-1 ring-[#D6EDE7]">
                <div className="text-sm font-black text-[#637B76]">사건 내용</div>
                <div className="mt-2 text-xl font-black">{incident.title}</div>
                <div className="mt-3 text-sm font-bold text-[#637B76]">
                  담당: {incident.assignee || incident.delegatedTo || '아직 정해지지 않음'} · 상태: {incident.status}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm font-bold leading-7 text-[#637B76]">
                가족 한 명이 확인을 맡으면 다른 가족의 중복 전화와 서로 미루는 상황을 줄일 수 있습니다.
              </p>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {assessment?.key !== 'normal' && !incident ? (
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() => void post('claim', { assignee: data?.family?.guardianName || '보호자' })}
                  className="rounded-2xl bg-[#176F62] px-5 py-4 text-base font-black text-white disabled:opacity-50 sm:col-span-2"
                >
                  {busy === 'claim' ? '지정 중...' : '제가 확인할게요'}
                </button>
              ) : null}

              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => void startCall()}
                className="rounded-2xl bg-[#EFFFFA] px-5 py-4 text-base font-black text-[#176F62] ring-1 ring-[#BFEBDD] disabled:opacity-50"
              >
                부모님께 전화
              </button>

              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => void delegate()}
                className="rounded-2xl bg-white px-5 py-4 text-base font-black text-[#315E58] ring-1 ring-[#D6EDE7] disabled:opacity-50"
              >
                다른 가족에게 부탁
              </button>

              {incident ? (
                <button
                  type="button"
                  onClick={() => setShowOutcomes((value) => !value)}
                  className="rounded-2xl bg-[#176F62] px-5 py-4 text-base font-black text-white sm:col-span-2"
                >
                  확인 결과 남기고 완료
                </button>
              ) : null}
            </div>

            {showOutcomes && incident ? (
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {outcomes.map((outcome) => (
                  <button
                    key={outcome.key}
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => void post('resolve', {
                      incidentId: incident.id,
                      outcome: outcome.key
                    })}
                    className="rounded-2xl bg-[#FAFFFD] px-4 py-4 text-left text-sm font-black ring-1 ring-[#D6EDE7] disabled:opacity-50"
                  >
                    {outcome.label}
                  </button>
                ))}
              </div>
            ) : null}
          </article>

          <article className="rounded-[2.25rem] bg-white p-6 ring-1 ring-[#D6EDE7] sm:p-8">
            <div className="text-sm font-black text-[#637B76]">안부 자동모드</div>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.06em]">
              부모님께 묻는 횟수를 조절합니다.
            </h2>

            <div className="mt-5 space-y-3">
              {profiles.map((profile) => {
                const selected = data?.profile?.mode === profile.mode

                return (
                  <button
                    key={profile.mode}
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => void post('save_mode', { mode: profile.mode })}
                    className={`w-full rounded-2xl p-4 text-left ring-1 transition disabled:opacity-50 ${
                      selected
                        ? 'bg-[#EFFFFA] text-[#176F62] ring-[#2AA897]'
                        : 'bg-[#FAFFFD] text-[#315E58] ring-[#D6EDE7]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-lg font-black">{profile.label}</span>
                      {selected ? <span className="text-sm font-black">사용 중</span> : null}
                    </div>
                    <p className="mt-2 text-sm font-bold leading-6 opacity-75">
                      {profile.description}
                    </p>
                  </button>
                )
              })}
            </div>

            <div className="mt-5 rounded-2xl bg-[#F7FBFF] p-4 text-sm font-bold leading-7 text-[#315E58] ring-1 ring-[#D8ECE8]">
              {assessment?.learningHint || '확인 결과를 기록하면 불필요한 알림을 줄이는 데 반영됩니다.'}
            </div>
          </article>
        </section>

        <section className="rounded-[2.25rem] bg-white p-6 ring-1 ring-[#D6EDE7] sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-sm font-black text-[#637B76]">최근 처리 기록</div>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.06em]">누가 무엇을 확인했는지 남습니다.</h2>
            </div>
            <div className="text-sm font-black text-[#637B76]">
              부모님 {data?.family?.parentName || '부모님'} · 보호자 {data?.family?.guardianName || '보호자'}
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {timeline.length ? timeline.map((item) => (
              <div key={`${item.id}-${item.createdAt}`} className="flex flex-col gap-2 rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7] sm:flex-row sm:items-center sm:justify-between">
                <div className="font-black">{item.title}</div>
                <div className="text-sm font-bold text-[#637B76]">{formatDate(item.createdAt)}</div>
              </div>
            )) : (
              <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                아직 처리 기록이 없습니다.
              </div>
            )}
          </div>
        </section>

        <p className="px-2 text-center text-xs font-bold leading-6 text-[#637B76]">
          {data?.notice || '스마트링 정보는 의료 진단이 아닌 안부 확인 참고 신호입니다.'}
        </p>
      </section>
    </main>
  )
}
