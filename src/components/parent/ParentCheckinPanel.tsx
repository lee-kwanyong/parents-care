'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Tone = 'safe' | 'watch' | 'danger' | 'neutral'

type ParentCheckinKind =
  | 'ok'
  | 'meal_ok'
  | 'medication_ok'
  | 'feeling_sick'
  | 'need_help'
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

type ParentData = {
  ok: boolean
  demo?: boolean
  message?: string
  generatedKst?: string
  family?: {
    familyCode: string
    parentName: string
    guardianName: string
    guardianPhoneMasked: string
  }
  recentRecords?: RecentRecord[]
  sourceErrors?: string[]
}

const presets: Array<{
  kind: ParentCheckinKind
  icon: string
  title: string
  desc: string
  tone: Tone
}> = [
  {
    kind: 'ok',
    icon: '✅',
    title: '괜찮아요',
    desc: '오늘은 큰 이상이 없어요.',
    tone: 'safe'
  },
  {
    kind: 'meal_ok',
    icon: '🍚',
    title: '밥 먹었어요',
    desc: '식사를 했어요.',
    tone: 'safe'
  },
  {
    kind: 'medication_ok',
    icon: '💊',
    title: '약 먹었어요',
    desc: '약을 챙겨 먹었어요.',
    tone: 'safe'
  },
  {
    kind: 'feeling_sick',
    icon: '🤒',
    title: '몸이 아파요',
    desc: '보호자가 확인해 주세요.',
    tone: 'watch'
  },
  {
    kind: 'need_help',
    icon: '🆘',
    title: '도움이 필요해요',
    desc: '보호자 확인이 필요해요.',
    tone: 'danger'
  },
  {
    kind: 'custom',
    icon: '✍️',
    title: '직접 남기기',
    desc: '하고 싶은 말을 적어요.',
    tone: 'neutral'
  }
]

const checklistItems = [
  ['meal', '식사했어요'],
  ['medication', '약 먹었어요'],
  ['water', '물 마셨어요'],
  ['sleep', '잠은 괜찮았어요'],
  ['pain', '아픈 곳이 있어요'],
  ['mood', '기분을 남겨요']
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
    window.localStorage.getItem('anbu-parent-family-code') ||
    window.localStorage.getItem('anbu-guardian-family-code') ||
    ''
  )
}

function localHistoryKey(familyCode: string) {
  return `anbu-parent-checkin-history-${familyCode || 'no-family'}`
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

export function ParentCheckinPanel() {
  const [familyCode, setFamilyCode] = useState('')
  const [data, setData] = useState<ParentData | null>(null)
  const [kind, setKind] = useState<ParentCheckinKind>('ok')
  const [note, setNote] = useState('')
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    meal: false,
    medication: false,
    water: false,
    sleep: false,
    pain: false,
    mood: false
  })
  const [localHistory, setLocalHistory] = useState<RecentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [savedRecord, setSavedRecord] = useState<RecentRecord | null>(null)

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
    }).slice(0, 8)
  }, [data, localHistory])

  async function load(nextCode = familyCode) {
    setLoading(true)
    setMessage('')

    const clean = nextCode.trim()
    const url = clean
      ? `/api/parent-checkin?familyCode=${encodeURIComponent(clean)}`
      : '/api/parent-checkin'

    try {
      const response = await fetch(url, {
        cache: 'no-store',
        credentials: 'include'
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || result.ok === false) {
        setMessage(result.message || '가족 정보를 불러오지 못했습니다.')
        setData(result)
        return
      }

      setData(result)

      if (clean && typeof window !== 'undefined') {
        window.localStorage.setItem('anbu-parent-family-code', clean)
        window.localStorage.setItem('anbu-guardian-family-code', clean)

        const nextUrl = new URL(window.location.href)
        nextUrl.searchParams.set('familyCode', clean)
        window.history.replaceState(null, '', nextUrl.toString())

        setLocalHistory(readLocalHistory(clean))
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '가족 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function submit(nextKind = kind) {
    const clean = familyCode.trim()

    if (!clean) {
      setMessage('가족코드를 먼저 입력해주세요.')
      return
    }

    setSaving(true)
    setMessage('')
    setSavedRecord(null)

    try {
      const response = await fetch('/api/parent-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          familyCode: clean,
          kind: nextKind,
          note,
          checklist
        })
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || result.ok === false) {
        setMessage(result.message || '안부 저장에 실패했습니다.')
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
      setSavedRecord(record)

      setMessage(result.persisted ? '안부가 저장되었습니다. 보호자가 확인할 수 있습니다.' : '서버 저장은 실패했지만 이 기기에 임시 기록했습니다.')
      setNote('')
      setChecklist({
        meal: false,
        medication: false,
        water: false,
        sleep: false,
        pain: false,
        mood: false
      })

      await load(clean)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '안부 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  function quickSubmit(nextKind: ParentCheckinKind) {
    setKind(nextKind)
    submit(nextKind)
  }

  useEffect(() => {
    const code = initialFamilyCode()
    setFamilyCode(code)
    setLocalHistory(readLocalHistory(code))
    load(code)
  }, [])

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#E7FFF7_0%,#F7FFFC_34%,#FFFFFF_72%)] px-4 py-6 text-[#17443F] sm:py-8">
      <section className="mx-auto max-w-5xl space-y-5">
        <section className="overflow-hidden rounded-[2.5rem] bg-white/95 shadow-[0_24px_80px_rgba(49,151,136,0.10)] ring-1 ring-[#D6EDE7]">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="p-6 sm:p-9">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7]">
                  부모님 안부 앱
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
                오늘 안부를
                <br />
                크게 눌러주세요.
              </h1>

              <p className="mt-5 max-w-2xl text-base font-bold leading-8 text-[#637B76]">
                복잡한 입력 없이 오늘 상태를 한 번만 눌러도 보호자가 확인할 수 있습니다.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-[1fr_auto]">
                <input
                  value={familyCode}
                  onChange={(event) => setFamilyCode(event.target.value.replace(/[^\w-]/g, '').slice(0, 32))}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') load()
                  }}
                  placeholder="가족코드 입력"
                  className="rounded-2xl border border-[#D6EDE7] bg-white px-5 py-5 text-lg font-black text-[#17443F] outline-none focus:border-[#2AA897] focus:ring-4 focus:ring-[#D8FFF3]"
                />

                <button
                  onClick={() => load()}
                  disabled={loading}
                  className="rounded-2xl bg-[#EFFFFA] px-6 py-5 text-base font-black text-[#247A71] ring-1 ring-[#CDEFE7] disabled:opacity-50"
                >
                  {loading ? '불러오는 중' : '가족 확인'}
                </button>
              </div>
            </div>

            <aside className="bg-[linear-gradient(135deg,#EFFFFA_0%,#F7FFFC_50%,#FFFFFF_100%)] p-6 sm:p-9">
              <div className="rounded-[2rem] bg-white/90 p-6 ring-1 ring-[#D6EDE7]">
                <div className="text-sm font-black text-[#637B76]">현재 화면</div>
                <div className="mt-3 text-4xl font-black tracking-[-0.08em]">
                  {data?.family?.parentName || '부모님'}
                </div>
                <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">
                  보호자 {data?.family?.guardianName || '보호자'}님이 확인할 수 있습니다.
                </p>

                <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
                  응급상황이 의심되면 앱 입력보다 먼저 119 또는 의료기관에 연락하세요.
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

        {savedRecord ? (
          <section className="rounded-[2rem] bg-[#EFFFFA] p-6 text-[#247A71] ring-1 ring-[#CDEFE7]">
            <div className="text-5xl">✅</div>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.07em]">안부가 기록되었습니다.</h2>
            <p className="mt-3 text-sm font-bold leading-7">
              보호자가 오늘 리포트에서 확인할 수 있습니다.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => setSavedRecord(null)}
                className="rounded-2xl bg-white/80 px-5 py-4 text-sm font-black ring-1 ring-[#CDEFE7]"
              >
                다른 상태 또 남기기
              </button>

              <Link
                href={familyCode ? `/guardian/today?familyCode=${encodeURIComponent(familyCode)}` : '/guardian/today'}
                className="rounded-2xl bg-white/80 px-5 py-4 text-center text-sm font-black ring-1 ring-[#CDEFE7]"
              >
                보호자 리포트 보기
              </Link>
            </div>
          </section>
        ) : null}

        <section className="rounded-[2.5rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7]">
            오늘 상태
          </div>

          <h2 className="mt-4 text-3xl font-black tracking-[-0.07em] sm:text-4xl">
            가장 가까운 상태를 눌러주세요.
          </h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {presets.map((preset) => {
              const active = kind === preset.kind

              return (
                <button
                  key={preset.kind}
                  onClick={() => {
                    setKind(preset.kind)
                    if (preset.kind !== 'custom') quickSubmit(preset.kind)
                  }}
                  disabled={saving}
                  className={`rounded-[2rem] p-6 text-left ring-1 transition hover:-translate-y-0.5 disabled:opacity-60 ${
                    active
                      ? toneClass(preset.tone)
                      : 'bg-[#FAFFFD] text-[#17443F] ring-[#D6EDE7]'
                  }`}
                >
                  <div className="text-5xl">{preset.icon}</div>
                  <div className="mt-4 text-3xl font-black tracking-[-0.07em]">{preset.title}</div>
                  <p className="mt-3 text-base font-bold leading-7 opacity-75">{preset.desc}</p>
                </button>
              )
            })}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-[2rem] bg-white/95 p-6 shadow-sm ring-1 ring-[#D6EDE7]">
            <div className="inline-flex rounded-full bg-[#FAFFFD] px-4 py-2 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              더 자세히 남기기
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-[-0.07em]">
              체크할 수 있는 것
            </h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {checklistItems.map(([key, label]) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl bg-[#FAFFFD] p-4 text-base font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
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
                    className="h-6 w-6 accent-[#2AA897]"
                  />
                  {label}
                </label>
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] bg-white/95 p-6 shadow-sm ring-1 ring-[#D6EDE7]">
            <div className="inline-flex rounded-full bg-[#FAFFFD] px-4 py-2 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              메모
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-[-0.07em]">
              하고 싶은 말을 남겨주세요.
            </h2>

            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value.slice(0, 1000))}
              placeholder="예: 오늘은 허리가 조금 아파요. 저녁에 다시 전화 주세요."
              className="mt-5 min-h-[150px] w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-base font-bold leading-8 outline-none focus:border-[#2AA897] focus:ring-4 focus:ring-[#D8FFF3]"
            />

            <button
              onClick={() => submit(kind)}
              disabled={saving}
              className="mt-4 w-full rounded-2xl bg-[#EFFFFA] px-5 py-5 text-lg font-black text-[#247A71] ring-1 ring-[#CDEFE7] disabled:opacity-50"
            >
              {saving ? '저장 중...' : '안부 저장하기'}
            </button>
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-[2rem] bg-white/95 p-6 shadow-sm ring-1 ring-[#D6EDE7]">
            <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7]">
              보호자가 볼 화면
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-[-0.07em]">
              안부가 이렇게 연결됩니다.
            </h2>

            <div className="mt-5 grid gap-3">
              <Link
                href={familyCode ? `/guardian/today?familyCode=${encodeURIComponent(familyCode)}` : '/guardian/today'}
                className="rounded-2xl bg-[#FAFFFD] p-5 ring-1 ring-[#D6EDE7]"
              >
                <div className="text-xl font-black">보호자 오늘 리포트</div>
                <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                  부모님이 남긴 안부를 보호자가 바로 확인합니다.
                </p>
              </Link>

              <Link
                href={familyCode ? `/guardian/ring-report?familyCode=${encodeURIComponent(familyCode)}` : '/guardian/ring-report'}
                className="rounded-2xl bg-[#FAFFFD] p-5 ring-1 ring-[#D6EDE7]"
              >
                <div className="text-xl font-black">스마트링 안부리듬</div>
                <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                  스마트링 참고 신호와 부모님 직접 입력을 함께 봅니다.
                </p>
              </Link>
            </div>
          </article>

          <article className="rounded-[2rem] bg-white/95 p-6 shadow-sm ring-1 ring-[#D6EDE7]">
            <div className="inline-flex rounded-full bg-[#FAFFFD] px-4 py-2 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              최근 안부 기록
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
                  아직 안부 기록이 없습니다. 오늘 상태를 한 번 눌러주세요.
                </div>
              )}
            </div>
          </article>
        </section>

        <section className="rounded-[2rem] bg-[#FFF9EE] p-5 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
          본 화면은 비의료 안부 확인용입니다. 진단·치료·응급 판단을 대체하지 않습니다.
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

export default ParentCheckinPanel
