'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, KeyboardEvent } from 'react'

type TimeSlot = 'morning' | 'lunch' | 'dinner'
type RoutineAction =
  | 'all_done'
  | 'meal_only'
  | 'medication_only'
  | 'snooze'
  | 'feeling_sick'
  | 'need_help'

type Tone = 'safe' | 'neutral' | 'watch' | 'danger'

type RecentRecord = {
  id: string
  label: string
  signalType: string
  riskLevel: string
  status: string
  createdAt: string
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
  } | null
  recentRecords?: RecentRecord[]
  sourceErrors?: string[]
}

type ReminderState = {
  familyCode: string
  slot: TimeSlot
  slotLabel: string
  dueAt: string
  eventId: string
}

type ParentRoutineCheckinProps = {
  initialFamilyCode?: string
  lockFamilyCode?: boolean
}

const slotLabels: Record<TimeSlot, string> = {
  morning: '아침',
  lunch: '점심',
  dinner: '저녁'
}

const slotIcons: Record<TimeSlot, string> = {
  morning: '🌅',
  lunch: '☀️',
  dinner: '🌙'
}

function getKstHour() {
  const value = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    hour12: false
  }).format(new Date())

  const hour = Number(value)
  return hour === 24 ? 0 : hour
}

function currentTimeSlot(): TimeSlot {
  const hour = getKstHour()
  if (hour < 11) return 'morning'
  if (hour < 16) return 'lunch'
  return 'dinner'
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

function reminderStorageKey(familyCode: string) {
  return `anbu-parent-routine-reminder-${familyCode || 'no-family'}`
}

function historyStorageKey(familyCode: string) {
  return `anbu-parent-routine-history-${familyCode || 'no-family'}`
}

function medicationStorageKey(familyCode: string) {
  return `anbu-parent-medication-slots-${familyCode || 'no-family'}`
}

function readLocalHistory(familyCode: string): RecentRecord[] {
  if (typeof window === 'undefined') return []

  try {
    return JSON.parse(window.localStorage.getItem(historyStorageKey(familyCode)) || '[]') as RecentRecord[]
  } catch {
    return []
  }
}

function writeLocalHistory(familyCode: string, records: RecentRecord[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(historyStorageKey(familyCode), JSON.stringify(records.slice(0, 20)))
}

function readMedicationSlots(familyCode: string): Record<TimeSlot, boolean> {
  const fallback: Record<TimeSlot, boolean> = {
    morning: true,
    lunch: true,
    dinner: true
  }

  if (typeof window === 'undefined') return fallback

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(medicationStorageKey(familyCode)) || '{}'
    ) as Partial<Record<TimeSlot, boolean>>

    return {
      morning: parsed.morning ?? true,
      lunch: parsed.lunch ?? true,
      dinner: parsed.dinner ?? true
    }
  } catch {
    return fallback
  }
}

function toneClass(tone: Tone) {
  if (tone === 'danger') return 'bg-[#FFF1F1] text-[#8A3030] ring-[#F3C8C8]'
  if (tone === 'watch') return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  if (tone === 'neutral') return 'bg-white text-[#17443F] ring-[#D6EDE7]'
  return 'bg-[#EFFFFA] text-[#197D6F] ring-[#CDEFE7]'
}

function riskTone(risk: string): Tone {
  if (risk === 'high' || risk === 'danger') return 'danger'
  if (risk === 'medium' || risk === 'watch') return 'watch'
  if (risk === 'low' || risk === 'safe') return 'safe'
  return 'neutral'
}

export function ParentRoutineCheckin({
  initialFamilyCode: suppliedFamilyCode = '',
  lockFamilyCode = false
}: ParentRoutineCheckinProps) {
  const [familyCode, setFamilyCode] = useState(suppliedFamilyCode)
  const [slot, setSlot] = useState<TimeSlot>('morning')
  const [medicationSlots, setMedicationSlots] = useState<Record<TimeSlot, boolean>>({
    morning: true,
    lunch: true,
    dinner: true
  })
  const [data, setData] = useState<ParentData | null>(null)
  const [localHistory, setLocalHistory] = useState<RecentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [savingAction, setSavingAction] = useState<RoutineAction | ''>('')
  const [message, setMessage] = useState('')
  const [pendingReminder, setPendingReminder] = useState<ReminderState | null>(null)
  const [reminderDue, setReminderDue] = useState(false)
  const reminderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const medicationDue = medicationSlots[slot]
  const period = slotLabels[slot]

  const records = useMemo(() => {
    const server = data?.recentRecords || []
    const combined = [...localHistory, ...server]
    const seen = new Set<string>()

    return combined
      .filter((record) => {
        const key = record.id || `${record.label}-${record.createdAt}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .slice(0, 8)
  }, [data, localHistory])

  function clearReminderTimer() {
    if (reminderTimerRef.current) {
      clearTimeout(reminderTimerRef.current)
      reminderTimerRef.current = null
    }
  }

  function showBrowserNotification(reminder: ReminderState) {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    new Notification('부모님 안심케어', {
      body: `${reminder.slotLabel} 식사와 약을 확인할 시간입니다. 버튼 한 번만 눌러주세요.`,
      icon: '/icons/parents-care-icon-192.png',
      tag: `anbu-routine-${reminder.familyCode}-${reminder.slot}`
    })
  }

  function armReminder(reminder: ReminderState) {
    clearReminderTimer()
    setPendingReminder(reminder)

    const fire = () => {
      setReminderDue(true)
      setMessage(`${reminder.slotLabel} 확인 시간이 되었습니다. 아래 버튼을 한 번 눌러주세요.`)
      showBrowserNotification(reminder)
    }

    const delay = Date.parse(reminder.dueAt) - Date.now()

    if (!Number.isFinite(delay) || delay <= 0) {
      fire()
      return
    }

    reminderTimerRef.current = setTimeout(fire, Math.min(delay, 2_147_000_000))
  }

  function restoreReminder(nextFamilyCode: string) {
    if (typeof window === 'undefined' || !nextFamilyCode) return

    try {
      const raw = window.localStorage.getItem(reminderStorageKey(nextFamilyCode))
      if (!raw) {
        setPendingReminder(null)
        setReminderDue(false)
        return
      }

      const reminder = JSON.parse(raw) as ReminderState
      if (!reminder?.dueAt || !reminder?.familyCode) return
      armReminder(reminder)
    } catch {
      window.localStorage.removeItem(reminderStorageKey(nextFamilyCode))
    }
  }

  function clearReminder(nextFamilyCode = familyCode) {
    clearReminderTimer()
    setPendingReminder(null)
    setReminderDue(false)

    if (typeof window !== 'undefined' && nextFamilyCode) {
      window.localStorage.removeItem(reminderStorageKey(nextFamilyCode))
    }
  }

  async function load(nextCode = familyCode) {
    const clean = nextCode.trim()

    if (!clean) {
      setLoading(false)
      setData(null)
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        `/api/parent-routine-checkin?familyCode=${encodeURIComponent(clean)}`,
        {
          cache: 'no-store',
          credentials: 'include'
        }
      )

      const result = await response.json().catch(() => ({}))

      if (!response.ok || result.ok === false) {
        setMessage(result.message || '가족 정보를 불러오지 못했습니다.')
        setData(result)
        return
      }

      setData(result)
      setLocalHistory(readLocalHistory(clean))
      setMedicationSlots(readMedicationSlots(clean))
      restoreReminder(clean)

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('anbu-parent-family-code', clean)
        window.localStorage.setItem('anbu-guardian-family-code', clean)

        if (!lockFamilyCode) {
          const nextUrl = new URL(window.location.href)
          nextUrl.searchParams.set('familyCode', clean)
          window.history.replaceState(null, '', nextUrl.toString())
        }
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '가족 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  function toggleMedicationDue() {
    const next = {
      ...medicationSlots,
      [slot]: !medicationDue
    }

    setMedicationSlots(next)

    if (typeof window !== 'undefined' && familyCode) {
      window.localStorage.setItem(medicationStorageKey(familyCode), JSON.stringify(next))
    }
  }

  async function requestNotificationPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
    if (Notification.permission === 'granted') return 'granted'
    if (Notification.permission === 'denied') return 'denied'

    try {
      return await Notification.requestPermission()
    } catch {
      return 'denied'
    }
  }

  async function submit(action: RoutineAction) {
    const clean = familyCode.trim()

    if (!clean) {
      setMessage('가족코드를 먼저 입력해주세요.')
      return
    }

    if (action === 'snooze') {
      await requestNotificationPermission()
    }

    setSavingAction(action)
    setMessage('')

    try {
      const response = await fetch('/api/parent-routine-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          familyCode: clean,
          action,
          timeSlot: slot,
          medicationDue
        })
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || result.ok === false) {
        setMessage(result.message || '안부 저장에 실패했습니다.')
        return
      }

      const record: RecentRecord = {
        ...(result.record || {}),
        local: !result.persisted
      }

      const updated = [record, ...readLocalHistory(clean)].slice(0, 20)
      writeLocalHistory(clean, updated)
      setLocalHistory(updated)

      if (action === 'snooze') {
        const reminder: ReminderState = {
          familyCode: clean,
          slot,
          slotLabel: period,
          dueAt: result.reminderAt || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          eventId: result.eventId || `local-${Date.now()}`
        }

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(reminderStorageKey(clean), JSON.stringify(reminder))
        }

        setReminderDue(false)
        armReminder(reminder)
        setMessage('30분 후 다시 확인하도록 예약했습니다. 앱이 열려 있으면 알림이 표시됩니다.')
      } else {
        if (pendingReminder?.slot === slot) clearReminder(clean)

        if (action === 'all_done') {
          setMessage(`${period} 식사${medicationDue ? '·약' : ''}·몸 상태가 한 번에 기록되었습니다.`)
        } else if (action === 'need_help') {
          setMessage('도움 요청을 기록했습니다. 응급상황이면 앱보다 먼저 119에 연락하세요.')
        } else if (action === 'feeling_sick') {
          setMessage('몸이 불편하다는 신호를 기록했습니다. 보호자 확인이 필요합니다.')
        } else {
          setMessage('선택한 내용이 기록되었습니다. 누르지 않은 항목은 미확인으로 남습니다.')
        }
      }

      await load(clean)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '안부 저장에 실패했습니다.')
    } finally {
      setSavingAction('')
    }
  }

  useEffect(() => {
    const code = suppliedFamilyCode || initialFamilyCode()
    setSlot(currentTimeSlot())
    setFamilyCode(code)

    if (code) {
      setMedicationSlots(readMedicationSlots(code))
      setLocalHistory(readLocalHistory(code))
      void load(code)
    } else {
      setLoading(false)
    }

    return () => clearReminderTimer()
    // 최초 진입 시 한 번만 실행합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suppliedFamilyCode])

  return (
    <main className="min-h-[100svh] bg-[radial-gradient(circle_at_top_left,#E7FFF7_0%,#F7FFFC_38%,#FFFFFF_76%)] px-4 py-5 text-[#17443F] sm:px-6 sm:py-8">
      <section className="mx-auto max-w-4xl space-y-5">
        <header className="rounded-[2.2rem] bg-white/95 p-6 shadow-[0_24px_80px_rgba(49,151,136,0.10)] ring-1 ring-[#D6EDE7] sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7]">
              부모님 안부 앱
            </span>
            <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#637B76] ring-1 ring-[#D6EDE7]">
              {data?.generatedKst || '오늘'}
            </span>
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-6xl">
            한 번만 눌러서
            <br />
            오늘 안부를 알려주세요.
          </h1>

          <p className="mt-4 max-w-2xl text-base font-bold leading-8 text-[#637B76]">
            식사와 약을 따로 여섯 번 기록하지 않아도 됩니다. 아침·점심·저녁마다 가장 가까운 버튼 하나만 누르면 됩니다.
          </p>

          {!lockFamilyCode ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                value={familyCode}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setFamilyCode(event.target.value.replace(/[^\w-]/g, '').slice(0, 32))
                }
                onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                  if (event.key === 'Enter') void load()
                }}
                placeholder="가족코드 입력"
                className="min-h-14 rounded-2xl border border-[#D6EDE7] bg-white px-5 text-lg font-black outline-none focus:border-[#2AA897] focus:ring-4 focus:ring-[#D8FFF3]"
              />
              <button
                type="button"
                onClick={() => void load()}
                disabled={loading}
                className="min-h-14 rounded-2xl bg-[#247A71] px-7 text-base font-black text-white disabled:opacity-50"
              >
                {loading ? '확인 중' : '가족 연결'}
              </button>
            </div>
          ) : null}

          {data?.family ? (
            <p className="mt-5 text-sm font-black text-[#637B76]">
              {data.family.parentName} · 보호자 {data.family.guardianName}님과 연결됨
            </p>
          ) : null}
        </header>

        {message ? (
          <section className="rounded-[1.7rem] bg-[#FFF9EE] p-5 text-base font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            {message}
          </section>
        ) : null}

        {reminderDue && pendingReminder ? (
          <section className="rounded-[2rem] bg-[#FFF0F0] p-6 text-[#8A3030] ring-2 ring-[#ECAAAA]">
            <div className="text-sm font-black">다시 확인할 시간</div>
            <div className="mt-2 text-2xl font-black">
              {pendingReminder.slotLabel} 식사와 약을 확인해주세요.
            </div>
            <button
              type="button"
              onClick={() => {
                setSlot(pendingReminder.slot)
                setReminderDue(false)
                window.scrollTo({ top: 520, behavior: 'smooth' })
              }}
              className="mt-4 rounded-2xl bg-[#8A3030] px-5 py-3 text-base font-black text-white"
            >
              지금 확인하기
            </button>
          </section>
        ) : null}

        <section className="rounded-[2.2rem] bg-white p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black text-[#2AA897]">현재 시간대</p>
              <h2 className="mt-1 text-3xl font-black tracking-[-0.05em]">{slotIcons[slot]} {period} 확인</h2>
            </div>
            <p className="text-sm font-bold text-[#637B76]">시간대가 다르면 아래에서 바꿔주세요.</p>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {(Object.keys(slotLabels) as TimeSlot[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setSlot(item)}
                className={
                  'min-h-14 rounded-2xl px-3 text-base font-black ring-1 transition ' +
                  (slot === item
                    ? 'bg-[#247A71] text-white ring-[#247A71]'
                    : 'bg-[#F7FFFC] text-[#247A71] ring-[#CDEFE7]')
                }
              >
                {slotLabels[item]}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={toggleMedicationDue}
            className="mt-4 flex w-full items-center justify-between rounded-2xl bg-[#F7FBFF] px-5 py-4 text-left ring-1 ring-[#D8ECE8]"
          >
            <span>
              <span className="block text-base font-black">이 시간대 복용할 약</span>
              <span className="mt-1 block text-sm font-bold text-[#637B76]">한 번 설정하면 이 기기에 기억됩니다.</span>
            </span>
            <span
              className={
                'rounded-full px-4 py-2 text-sm font-black ' +
                (medicationDue ? 'bg-[#247A71] text-white' : 'bg-white text-[#637B76] ring-1 ring-[#D6EDE7]')
              }
            >
              {medicationDue ? '약 있음' : '약 없음'}
            </span>
          </button>

          <button
            type="button"
            disabled={Boolean(savingAction)}
            onClick={() => void submit('all_done')}
            className="mt-5 min-h-[132px] w-full rounded-[2rem] bg-[#EFFFFA] p-6 text-left text-[#197D6F] shadow-sm ring-2 ring-[#BCEBDD] transition active:scale-[0.99] disabled:opacity-60"
          >
            <span className="block text-3xl font-black leading-tight tracking-[-0.05em] sm:text-4xl">
              {savingAction === 'all_done'
                ? '기록하는 중...'
                : medicationDue
                  ? '✅ 식사·약·몸 모두 괜찮아요'
                  : '✅ 식사했고 몸도 괜찮아요'}
            </span>
            <span className="mt-3 block text-base font-bold leading-7 opacity-80">
              정상적인 날에는 이 버튼 한 번이면 끝납니다.
            </span>
          </button>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <ActionButton
              action="meal_only"
              icon="🍚"
              title="식사만 했어요"
              description={medicationDue ? '약은 아직 확인하지 않았어요.' : '식사 완료만 기록합니다.'}
              tone="neutral"
              savingAction={savingAction}
              onClick={submit}
            />

            {medicationDue ? (
              <ActionButton
                action="medication_only"
                icon="💊"
                title="약만 먹었어요"
                description="식사는 아직 확인하지 않았어요."
                tone="neutral"
                savingAction={savingAction}
                onClick={submit}
              />
            ) : null}

            <ActionButton
              action="snooze"
              icon="⏰"
              title="30분 뒤 알려줘요"
              description="확인 연기 이벤트를 남기고 다시 알려줍니다."
              tone="watch"
              savingAction={savingAction}
              onClick={submit}
            />

            <ActionButton
              action="feeling_sick"
              icon="🤒"
              title="몸이 불편해요"
              description="보호자가 확인할 신호로 기록합니다."
              tone="watch"
              savingAction={savingAction}
              onClick={submit}
            />

            <ActionButton
              action="need_help"
              icon="🆘"
              title="도움이 필요해요"
              description="빠른 보호자·운영실 확인이 필요합니다."
              tone="danger"
              savingAction={savingAction}
              onClick={submit}
              wide
            />
          </div>

          <div className="mt-5 rounded-2xl bg-[#F7FBFF] p-4 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D8ECE8]">
            버튼을 누르지 않은 항목은 “안 함”이 아니라 “미확인”으로 기록됩니다. 스마트링 데이터도 식사나 복약을 했다고 자동 단정하지 않습니다.
          </div>
        </section>

        <section className="rounded-[2.2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-8">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-black text-[#2AA897]">최근 기록</p>
              <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">버튼 클릭 이벤트</h2>
            </div>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading || !familyCode}
              className="rounded-xl bg-[#F7FFFC] px-4 py-2 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7] disabled:opacity-50"
            >
              새로고침
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {records.length ? (
              records.map((record) => (
                <article
                  key={`${record.id}-${record.createdAt}`}
                  className={`rounded-2xl p-4 ring-1 ${toneClass(riskTone(record.riskLevel))}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="text-base font-black">{record.label}</strong>
                    <span className="text-xs font-black opacity-70">{formatDate(record.createdAt)}</span>
                  </div>
                  {record.local ? (
                    <p className="mt-2 text-xs font-bold opacity-70">서버 확인 전 이 기기에 임시 저장됨</p>
                  ) : null}
                </article>
              ))
            ) : (
              <div className="rounded-2xl bg-[#F7FBFF] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D8ECE8]">
                아직 기록이 없습니다. 위 버튼을 누르면 여기에 이벤트가 생성됩니다.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[1.8rem] bg-[#FFF9EE] p-5 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
          안부웍스는 의료 진단이나 응급구조를 대신하지 않습니다. 호흡곤란, 의식저하, 낙상, 심한 통증 등 응급상황이 의심되면 즉시 119 또는 의료기관에 연락하세요.
        </section>
      </section>
    </main>
  )
}

function ActionButton({
  action,
  icon,
  title,
  description,
  tone,
  savingAction,
  onClick,
  wide = false
}: {
  action: RoutineAction
  icon: string
  title: string
  description: string
  tone: Tone
  savingAction: RoutineAction | ''
  onClick: (action: RoutineAction) => Promise<void>
  wide?: boolean
}) {
  const isSaving = savingAction === action

  return (
    <button
      type="button"
      disabled={Boolean(savingAction)}
      onClick={() => void onClick(action)}
      className={
        'min-h-[112px] rounded-[1.6rem] p-5 text-left shadow-sm ring-1 transition active:scale-[0.99] disabled:opacity-60 ' +
        toneClass(tone) +
        (wide ? ' sm:col-span-2' : '')
      }
    >
      <span className="block text-2xl font-black leading-tight tracking-[-0.04em]">
        {isSaving ? '기록하는 중...' : `${icon} ${title}`}
      </span>
      <span className="mt-2 block text-sm font-bold leading-6 opacity-80">{description}</span>
    </button>
  )
}
