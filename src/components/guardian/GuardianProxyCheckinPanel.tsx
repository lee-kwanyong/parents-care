'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Tone = 'safe' | 'watch' | 'danger' | 'neutral'

type CheckinKind =
  | 'ok'
  | 'meal_checked'
  | 'medication_checked'
  | 'body_ok'
  | 'feeling_sick'
  | 'no_answer'
  | 'urgent_help'
  | 'custom'

type RecentRecord = {
  id: string
  label: string
  signalType: string
  riskLevel: string
  status: string
  createdAt: string
  note?: string
  local?: boolean
}

type ProxyData = {
  ok: boolean
  demo?: boolean
  message?: string
  generatedKst?: string
  family?: {
    familyCode: string
    parentName: string
    guardianName: string
    parentPhoneMasked: string
    guardianPhoneMasked: string
  }
  recentRecords?: RecentRecord[]
  sourceErrors?: string[]
}

const presets: Array<{
  kind: CheckinKind
  title: string
  desc: string
  tone: Tone
}> = [
  {
    kind: 'ok',
    title: '괜찮아요',
    desc: '통화했고 오늘은 큰 이상이 없습니다.',
    tone: 'safe'
  },
  {
    kind: 'meal_checked',
    title: '식사 확인',
    desc: '식사 여부를 확인했습니다.',
    tone: 'safe'
  },
  {
    kind: 'medication_checked',
    title: '복약 확인',
    desc: '복약 여부를 확인했습니다.',
    tone: 'safe'
  },
  {
    kind: 'body_ok',
    title: '몸 상태 괜찮음',
    desc: '몸 상태가 괜찮다고 확인했습니다.',
    tone: 'safe'
  },
  {
    kind: 'feeling_sick',
    title: '몸이 불편함',
    desc: '컨디션 확인과 후속 연락이 필요합니다.',
    tone: 'watch'
  },
  {
    kind: 'no_answer',
    title: '전화를 안 받음',
    desc: '시간을 두고 재확인이 필요합니다.',
    tone: 'watch'
  },
  {
    kind: 'urgent_help',
    title: '도움 필요',
    desc: '즉시 가족 또는 주변 확인이 필요합니다.',
    tone: 'danger'
  },
  {
    kind: 'custom',
    title: '직접 메모',
    desc: '상황을 직접 기록합니다.',
    tone: 'neutral'
  }
]

const checklistItems = [
  ['called', '전화 연결됨'],
  ['meal', '식사 확인'],
  ['medication', '복약 확인'],
  ['body', '몸 상태 확인'],
  ['mood', '기분 확인'],
  ['next', '다음 확인 필요']
] as const

function toneClass(tone: Tone) {
  if (tone === 'safe') return 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'
  if (tone === 'watch') return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  if (tone === 'danger') return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  return 'bg-white text-[#17443F] ring-[#D6EDE7]'
}

function riskTone(risk: string): Tone {
  if (risk === 'high' || risk === 'danger') return 'danger'
  if (risk === 'medium' || risk === 'watch') return 'watch'
  if (risk === 'low' || risk === 'safe') return 'safe'
  return 'neutral'
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

function localHistoryKey(familyCode: string) {
  return `anbu-proxy-checkin-history-${familyCode || 'no-family'}`
}

function readLocalHistory(familyCode: string): RecentRecord[] {
  if (typeof window === 'undefined') return []

  try {
    return JSON.parse(window.localStorage.getItem(localHistoryKey(familyCode)) || '[]') as RecentRecord[]
  } catch {
    return []
  }
}

function writeLocalHistory(familyCode: string, items: RecentRecord[]) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(localHistoryKey(familyCode), JSON.stringify(items.slice(0, 20)))
}

export function GuardianProxyCheckinPanel() {
  const [familyCode, setFamilyCode] = useState('')
  const [data, setData] = useState<ProxyData | null>(null)
  const [kind, setKind] = useState<CheckinKind>('ok')
  const [contactMethod, setContactMethod] = useState('phone')
  const [note, setNote] = useState('')
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    called: true,
    meal: false,
    medication: false,
    body: false,
    mood: false,
    next: false
  })
  const [localHistory, setLocalHistory] = useState<RecentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const selectedPreset = presets.find((item) => item.kind === kind) || presets[0]

  const records = useMemo(() => {
    const server = data?.recentRecords || []
    const combined = [...localHistory, ...server]
    const seen = new Set<string>()

    return combined.filter((item) => {
      const key = item.id || `${item.label}-${item.createdAt}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }).slice(0, 12)
  }, [data, localHistory])

  async function load(nextCode = familyCode) {
    setLoading(true)
    setMessage('')

    const clean = nextCode.trim()
    const url = clean
      ? `/api/guardian-proxy-checkin?familyCode=${encodeURIComponent(clean)}`
      : '/api/guardian-proxy-checkin'

    try {
      const response = await fetch(url, {
        cache: 'no-store',
        credentials: 'include'
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || result.ok === false) {
        setMessage(result.message || '보호자 대리입력 정보를 불러오지 못했습니다.')
        setData(result)
        return
      }

      setData(result)

      if (clean && typeof window !== 'undefined') {
        window.localStorage.setItem('anbu-guardian-family-code', clean)
        const nextUrl = new URL(window.location.href)
        nextUrl.searchParams.set('familyCode', clean)
        window.history.replaceState(null, '', nextUrl.toString())
        setLocalHistory(readLocalHistory(clean))
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '보호자 대리입력 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function submit() {
    const clean = familyCode.trim()

    if (!clean) {
      setMessage('가족코드를 먼저 입력해주세요.')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const response = await fetch('/api/guardian-proxy-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          familyCode: clean,
          kind,
          contactMethod,
          note,
          checklist
        })
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || result.ok === false) {
        setMessage(result.message || '확인 결과 저장에 실패했습니다.')
        return
      }

      const record: RecentRecord = {
        ...(result.record || {}),
        local: !result.persisted,
        note
      }

      const updated = [record, ...readLocalHistory(clean)].slice(0, 20)
      writeLocalHistory(clean, updated)
      setLocalHistory(updated)

      setMessage(result.persisted ? '확인 결과를 저장했습니다.' : '서버 저장은 실패했지만 브라우저에 임시 기록했습니다.')
      setNote('')
      setChecklist({
        called: true,
        meal: false,
        medication: false,
        body: false,
        mood: false,
        next: false
      })

      await load(clean)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '확인 결과 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function copySummary() {
    const lines = [
      '[안부웍스] 보호자 확인 기록',
      '',
      `가족코드: ${familyCode || '-'}`,
      `부모님: ${data?.family?.parentName || '부모님'}`,
      `확인 결과: ${selectedPreset.title}`,
      `메모: ${note || '-'}`,
      '',
      '본 기록은 비의료 안부 확인 메모입니다.'
    ]

    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      setMessage('확인 기록 요약을 복사했습니다.')
    } catch {
      setMessage('복사에 실패했습니다. 브라우저 권한을 확인해주세요.')
    }
  }

  useEffect(() => {
    const code = initialFamilyCode()
    setFamilyCode(code)
    setLocalHistory(readLocalHistory(code))
    load(code)
  }, [])

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#E7FFF7_0%,#F7FFFC_34%,#FFFFFF_72%)] px-4 py-8 text-[#17443F]">
      <section className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[2.5rem] bg-white/95 shadow-[0_24px_80px_rgba(49,151,136,0.10)] ring-1 ring-[#D6EDE7]">
          <div className="grid gap-0 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="p-6 sm:p-9">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7]">
                  보호자 대리입력
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
                전화 확인 결과를
                <br />
                바로 기록합니다.
              </h1>

              <p className="mt-5 max-w-3xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
                보호자가 부모님께 전화하거나 메시지로 확인한 내용을 간단히 남기면 오늘 리포트와 운영실 확인 흐름에 반영됩니다.
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
                  {loading ? '불러오는 중' : '가족 불러오기'}
                </button>
              </div>
            </div>

            <aside className="bg-[linear-gradient(135deg,#EFFFFA_0%,#F7FFFC_50%,#FFFFFF_100%)] p-6 sm:p-9">
              <div className="rounded-[2rem] bg-white/90 p-6 ring-1 ring-[#D6EDE7]">
                <div className="text-sm font-black text-[#637B76]">현재 대상</div>
                <div className="mt-3 text-4xl font-black tracking-[-0.08em]">
                  {data?.family?.parentName || '부모님'}
                </div>
                <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">
                  보호자 {data?.family?.guardianName || '보호자'}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    <div className="text-xs font-black text-[#637B76]">부모님 번호</div>
                    <div className="mt-2 text-lg font-black">{data?.family?.parentPhoneMasked || '미등록'}</div>
                  </div>

                  <div className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    <div className="text-xs font-black text-[#637B76]">가족코드</div>
                    <div className="mt-2 text-lg font-black">{familyCode || '-'}</div>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
                  전화번호는 일부만 표시합니다. 실제 통화는 보호자 휴대폰에 저장된 연락처를 사용해 주세요.
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

        <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[2rem] bg-white/95 p-6 shadow-sm ring-1 ring-[#D6EDE7]">
            <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7]">
              확인 결과 선택
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-[-0.07em]">
              오늘 확인한 내용을 선택하세요.
            </h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {presets.map((preset) => {
                const active = kind === preset.kind

                return (
                  <button
                    key={preset.kind}
                    onClick={() => setKind(preset.kind)}
                    className={`rounded-2xl p-5 text-left ring-1 transition hover:-translate-y-0.5 ${
                      active
                        ? toneClass(preset.tone)
                        : 'bg-[#FAFFFD] text-[#17443F] ring-[#D6EDE7]'
                    }`}
                  >
                    <div className="text-xl font-black tracking-[-0.05em]">{preset.title}</div>
                    <p className="mt-2 text-sm font-bold leading-7 opacity-75">{preset.desc}</p>
                  </button>
                )
              })}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {['phone', 'message', 'visit'].map((method) => (
                <button
                  key={method}
                  onClick={() => setContactMethod(method)}
                  className={
                    contactMethod === method
                      ? 'rounded-2xl bg-[#EFFFFA] px-4 py-4 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7]'
                      : 'rounded-2xl bg-white px-4 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]'
                  }
                >
                  {method === 'phone' ? '전화 확인' : method === 'message' ? '문자/카톡 확인' : '방문 확인'}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] bg-white/95 p-6 shadow-sm ring-1 ring-[#D6EDE7]">
            <div className="inline-flex rounded-full bg-[#FAFFFD] px-4 py-2 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              체크 항목
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-[-0.07em]">
              확인한 항목
            </h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {checklistItems.map(([key, label]) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl bg-[#FAFFFD] p-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(checklist[key])}
                    onChange={(event) => {
                      setChecklist((prev) => ({
                        ...prev,
                        [key]: event.target.checked
                      }))
                    }}
                    className="h-5 w-5 accent-[#2AA897]"
                  />
                  {label}
                </label>
              ))}
            </div>

            <label className="mt-5 block">
              <span className="text-sm font-black text-[#637B76]">운영 메모</span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value.slice(0, 1000))}
                placeholder="예: 통화 완료. 점심은 드셨고 약은 저녁에 다시 확인 예정."
                className="mt-2 min-h-[140px] w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold leading-7 outline-none focus:border-[#2AA897] focus:ring-4 focus:ring-[#D8FFF3]"
              />
            </label>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                onClick={submit}
                disabled={saving}
                className="rounded-2xl bg-[#EFFFFA] px-5 py-5 text-base font-black text-[#247A71] ring-1 ring-[#CDEFE7] disabled:opacity-50"
              >
                {saving ? '저장 중...' : '확인 결과 저장'}
              </button>

              <button
                onClick={copySummary}
                className="rounded-2xl bg-white px-5 py-5 text-base font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
              >
                요약 복사
              </button>
            </div>
          </section>
        </section>

        <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-[2rem] bg-white/95 p-6 shadow-sm ring-1 ring-[#D6EDE7]">
            <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7]">
              다음 연결
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-[-0.07em]">
              기록 후 바로 확인할 곳
            </h2>

            <div className="mt-5 grid gap-3">
              <Link
                href={familyCode ? `/guardian/today?familyCode=${encodeURIComponent(familyCode)}` : '/guardian/today'}
                className="rounded-2xl bg-[#FAFFFD] p-5 ring-1 ring-[#D6EDE7]"
              >
                <div className="text-xl font-black">보호자 오늘 리포트</div>
                <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                  대리입력 결과가 오늘 상태와 다음 할 일에 반영되는지 확인합니다.
                </p>
              </Link>

              <Link
                href={familyCode ? `/guardian/ring-report?familyCode=${encodeURIComponent(familyCode)}` : '/guardian/ring-report'}
                className="rounded-2xl bg-[#FAFFFD] p-5 ring-1 ring-[#D6EDE7]"
              >
                <div className="text-xl font-black">스마트링 안부리듬 리포트</div>
                <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                  스마트링 참고 신호와 전화 확인 결과를 함께 봅니다.
                </p>
              </Link>

              <Link
                href={familyCode ? `/mobile/parent?familyCode=${encodeURIComponent(familyCode)}` : '/mobile/parent'}
                className="rounded-2xl bg-[#FAFFFD] p-5 ring-1 ring-[#D6EDE7]"
              >
                <div className="text-xl font-black">부모님 안부 앱</div>
                <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                  부모님이 직접 오늘 상태를 남길 수 있는 화면입니다.
                </p>
              </Link>
            </div>
          </article>

          <article className="rounded-[2rem] bg-white/95 p-6 shadow-sm ring-1 ring-[#D6EDE7]">
            <div className="inline-flex rounded-full bg-[#FAFFFD] px-4 py-2 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              최근 보호자 기록
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-[-0.07em]">
              최근 기록
            </h2>

            <div className="mt-5 space-y-3">
              {records.length ? (
                records.map((record) => (
                  <div
                    key={record.id || `${record.label}-${record.createdAt}`}
                    className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]"
                  >
                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${toneClass(riskTone(record.riskLevel))}`}>
                        {record.riskLevel || '기록'}
                      </span>

                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                        {formatDate(record.createdAt) || '방금'}
                      </span>

                      {record.local ? (
                        <span className="rounded-full bg-[#FFF9EE] px-3 py-1 text-xs font-black text-[#795C22] ring-1 ring-[#F3DEB5]">
                          임시저장
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-3 text-lg font-black">{record.label}</div>

                    {record.note ? (
                      <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">{record.note}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D6EDE7]">
                  아직 보호자 대리입력 기록이 없습니다. 가족코드를 입력하고 확인 결과를 저장해 주세요.
                </div>
              )}
            </div>
          </article>
        </section>

        <section className="rounded-[2rem] bg-[#FFF9EE] p-5 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
          본 화면은 비의료 안부 확인 기록용입니다. 진단·치료·응급 판단을 대체하지 않습니다.
          호흡곤란, 흉통, 의식저하, 낙상 등 응급상황이 의심되면 119 또는 의료기관에 연락하세요.
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

export default GuardianProxyCheckinPanel
