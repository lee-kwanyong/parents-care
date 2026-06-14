'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Tone = 'safe' | 'watch' | 'danger' | 'neutral'

type ActionItem = {
  title: string
  desc: string
  href: string
  cta: string
}

type TimelineItem = {
  id: string
  label: string
  desc: string
  riskLevel: string
  status: string
  signalType: string
  createdAt: string
}

type RingInsight = {
  label: string
  value: string
  desc: string
  tone: Tone
}

type GuardianTodayData = {
  ok: boolean
  demo?: boolean
  message?: string
  generatedKst?: string
  family?: {
    familyCode: string
    parentName: string
    guardianName: string
  }
  status?: {
    level: Tone
    label: string
    title: string
    desc: string
  }
  todayLine?: string
  actions?: ActionItem[]
  timeline?: TimelineItem[]
  ringInsights?: RingInsight[]
  notice?: string
  sourceErrors?: string[]
}

function toneClass(tone: Tone) {
  if (tone === 'safe') return 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'
  if (tone === 'watch') return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  if (tone === 'danger') return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  return 'bg-white text-[#17443F] ring-[#D6EDE7]'
}

function statusEmoji(tone: Tone) {
  if (tone === 'safe') return '✅'
  if (tone === 'watch') return '🟡'
  if (tone === 'danger') return '🚨'
  return '🤍'
}

function formatDate(value: string) {
  if (!value) return ''

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

function initialFamilyCode() {
  if (typeof window === 'undefined') return ''

  const params = new URLSearchParams(window.location.search)
  return (
    params.get('familyCode') ||
    window.localStorage.getItem('anbu-guardian-family-code') ||
    ''
  )
}

export function GuardianTodayReportPanel() {
  const [familyCode, setFamilyCode] = useState('')
  const [data, setData] = useState<GuardianTodayData | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function load(nextCode = familyCode) {
    setLoading(true)
    setMessage('')

    const clean = nextCode.trim()
    const url = clean
      ? `/api/guardian-today-summary?familyCode=${encodeURIComponent(clean)}`
      : '/api/guardian-today-summary'

    try {
      const response = await fetch(url, {
        cache: 'no-store',
        credentials: 'include'
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || result.ok === false) {
        setMessage(result.message || '오늘 리포트를 불러오지 못했습니다.')
        setData(result)
        return
      }

      setData(result)

      if (clean && typeof window !== 'undefined') {
        window.localStorage.setItem('anbu-guardian-family-code', clean)
        const nextUrl = new URL(window.location.href)
        nextUrl.searchParams.set('familyCode', clean)
        window.history.replaceState(null, '', nextUrl.toString())
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '오늘 리포트를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function copySummary() {
    const status = data?.status
    const family = data?.family

    const lines = [
      '[안부웍스] 오늘 부모님 안부 리포트',
      '',
      `부모님: ${family?.parentName || '부모님'}`,
      `상태: ${status?.label || '확인 대기'}`,
      `요약: ${data?.todayLine || '기록된 안부 신호를 확인 중입니다.'}`,
      '',
      data?.notice || '본 리포트는 비의료 안부 참고 정보입니다.'
    ]

    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      setMessage('오늘 리포트 요약을 복사했습니다.')
    } catch {
      setMessage('복사에 실패했습니다. 브라우저 권한을 확인해주세요.')
    }
  }

  useEffect(() => {
    const code = initialFamilyCode()
    setFamilyCode(code)
    load(code)
  }, [])

  const status = data?.status || {
    level: 'neutral' as Tone,
    label: '확인 대기',
    title: '오늘 리포트를 불러오는 중입니다.',
    desc: '잠시만 기다려 주세요.'
  }

  const actions = useMemo(() => data?.actions || [], [data])
  const timeline = useMemo(() => data?.timeline || [], [data])
  const ringInsights = useMemo(() => data?.ringInsights || [], [data])

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#E7FFF7_0%,#F7FFFC_34%,#FFFFFF_72%)] px-4 py-8 text-[#17443F]">
      <section className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[2.5rem] bg-white/95 shadow-[0_24px_80px_rgba(49,151,136,0.10)] ring-1 ring-[#D6EDE7]">
          <div className="grid gap-0 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="p-6 sm:p-9">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7]">
                  보호자 오늘 리포트
                </span>
                <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                  {data?.generatedKst || '오늘'}
                </span>
                {data?.demo ? (
                  <span className="rounded-full bg-[#FFF9EE] px-4 py-2 text-sm font-black text-[#795C22] ring-1 ring-[#F3DEB5]">
                    가족코드 필요
                  </span>
                ) : null}
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.08em] sm:text-6xl">
                오늘 부모님 상태를
                <br />
                한눈에 확인합니다.
              </h1>

              <p className="mt-5 max-w-3xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
                복잡한 수치보다 보호자가 바로 움직일 수 있도록 오늘 상태, 한 줄 요약, 다음 할 일을 먼저 보여줍니다.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-[1fr_auto]">
                <input
                  value={familyCode}
                  onChange={(event) => setFamilyCode(event.target.value.replace(/[^\w-]/g, '').slice(0, 32))}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') load()
                  }}
                  placeholder="가족코드 입력"
                  className="rounded-2xl border border-[#D6EDE7] bg-white px-5 py-4 text-sm font-black text-[#17443F] outline-none focus:border-[#2AA897] focus:ring-4 focus:ring-[#D8FFF3]"
                />

                <button
                  onClick={() => load()}
                  disabled={loading}
                  className="rounded-2xl bg-[#EFFFFA] px-5 py-4 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7] disabled:opacity-50"
                >
                  {loading ? '불러오는 중' : '리포트 불러오기'}
                </button>
              </div>
            </div>

            <aside className="bg-[linear-gradient(135deg,#EFFFFA_0%,#F7FFFC_50%,#FFFFFF_100%)] p-6 sm:p-9">
              <div className={`rounded-[2rem] p-6 ring-1 ${toneClass(status.level)}`}>
                <div className="text-5xl">{statusEmoji(status.level)}</div>
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

        <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-[2rem] bg-white/95 p-6 shadow-sm ring-1 ring-[#D6EDE7]">
            <div className="rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7] inline-flex">
              오늘 한 줄
            </div>

            <h2 className="mt-5 text-3xl font-black leading-tight tracking-[-0.07em]">
              {data?.todayLine || '오늘 안부 신호를 확인 중입니다.'}
            </h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                <div className="text-xs font-black text-[#637B76]">부모님</div>
                <div className="mt-2 text-xl font-black">{data?.family?.parentName || '부모님'}</div>
              </div>

              <div className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                <div className="text-xs font-black text-[#637B76]">보호자</div>
                <div className="mt-2 text-xl font-black">{data?.family?.guardianName || '보호자'}</div>
              </div>
            </div>

            <button
              onClick={copySummary}
              className="mt-5 w-full rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
            >
              오늘 요약 복사
            </button>
          </article>

          <section className="grid gap-3 md:grid-cols-3">
            {actions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(49,151,136,0.08)]"
              >
                <div className="rounded-full bg-[#EFFFFA] px-3 py-1 text-xs font-black text-[#247A71] ring-1 ring-[#CDEFE7] inline-flex">
                  다음 할 일
                </div>
                <h3 className="mt-4 text-xl font-black tracking-[-0.05em]">{action.title}</h3>
                <p className="mt-2 min-h-[4.5rem] text-sm font-bold leading-7 text-[#637B76]">{action.desc}</p>
                <div className="mt-4 rounded-full bg-[#FAFFFD] px-3 py-2 text-center text-xs font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                  {action.cta}
                </div>
              </Link>
            ))}
          </section>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-[2rem] bg-white/95 p-6 shadow-sm ring-1 ring-[#D6EDE7]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7] inline-flex">
                  최근 안부 신호
                </div>
                <h2 className="mt-4 text-3xl font-black tracking-[-0.07em]">최근 기록</h2>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {timeline.length ? (
                timeline.map((item) => {
                  const tone: Tone = item.riskLevel === 'high' || item.status === 'manual_needed' ? 'danger' : item.riskLevel === 'medium' ? 'watch' : 'safe'

                  return (
                    <div key={item.id || `${item.label}-${item.createdAt}`} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${toneClass(tone)}`}>
                          {item.riskLevel || item.status || '기록'}
                        </span>
                        {item.createdAt ? (
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                            {formatDate(item.createdAt)}
                          </span>
                        ) : null}
                      </div>

                      <h3 className="mt-3 text-lg font-black">{item.label}</h3>
                      <p className="mt-1 text-sm font-bold leading-7 text-[#637B76]">{item.desc}</p>
                    </div>
                  )
                })
              ) : (
                <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D6EDE7]">
                  아직 표시할 안부 신호가 없습니다. 가족코드를 입력하거나 부모님 안부 앱에서 오늘 상태를 남겨주세요.
                </div>
              )}
            </div>
          </article>

          <article className="rounded-[2rem] bg-white/95 p-6 shadow-sm ring-1 ring-[#D6EDE7]">
            <div className="rounded-full bg-[#F6F4FF] px-4 py-2 text-sm font-black text-[#4A3A8A] ring-1 ring-[#DED8FF] inline-flex">
              스마트링 참고 신호
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-[-0.07em]">안부리듬</h2>

            <div className="mt-5 space-y-3">
              {ringInsights.map((item) => (
                <div key={item.label} className={`rounded-2xl p-4 ring-1 ${toneClass(item.tone)}`}>
                  <div className="text-xs font-black opacity-70">{item.label}</div>
                  <div className="mt-2 text-2xl font-black tracking-[-0.06em]">{item.value}</div>
                  <p className="mt-2 text-sm font-bold leading-7 opacity-75">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
              {data?.notice || '본 리포트는 비의료 안부 참고 정보입니다. 응급상황이 의심되면 119 또는 의료기관에 연락하세요.'}
            </div>
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

export default GuardianTodayReportPanel
