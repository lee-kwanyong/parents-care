'use client'

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { readParentSession } from '@/components/auth/ParentSessionBridge'

type SlotKey = 'morning' | 'lunch' | 'evening'
type StatusValue = 'done' | 'not_done' | 'unknown' | 'not_applicable' | 'needs_help'
type RoutineAction =
  | 'all_done'
  | 'meal_only'
  | 'medication_only'
  | 'meal_done'
  | 'medication_done'
  | 'meal_not_done'
  | 'medication_not_done'
  | 'later'
  | 'condition_issue'
  | 'need_help'

type Schedule = {
  breakfastTime: string
  lunchTime: string
  dinnerTime: string
  morningMedication: boolean
  noonMedication: boolean
  eveningMedication: boolean
  reminderDelayMinutes: number
  escalationDelayMinutes: number
}

type SlotState = {
  slot: SlotKey
  mealStatus: StatusValue
  medicationStatus: StatusValue
  conditionStatus: StatusValue
  emergency: boolean
  complete: boolean
  needsAttention: boolean
  responded: boolean
  lastAction: string
  lastLabel: string
  lastAt: string | null
  snoozedUntil: string | null
}

type SlotInfo = {
  key: SlotKey
  label: string
  time: string
  medicationEnabled: boolean
}

type RoutineData = {
  ok: boolean
  message?: string
  date: string
  generatedKst: string
  family: {
    familyCode: string
    parentName: string
    guardianName: string
  }
  schedule: Schedule
  scheduleSource: 'saved' | 'default'
  currentSlot: SlotInfo | null
  nextSlot: SlotInfo
  slots: Record<SlotKey, SlotState>
  currentState: SlotState | null
  sourceErrors?: string[]
}

type ButtonTone = 'safe' | 'watch' | 'danger' | 'neutral'

type ButtonItem = {
  action: RoutineAction
  title: string
  desc: string
  tone: ButtonTone
  wide?: boolean
}

const DEFAULT_SCHEDULE: Schedule = {
  breakfastTime: '08:00',
  lunchTime: '12:30',
  dinnerTime: '18:30',
  morningMedication: true,
  noonMedication: false,
  eveningMedication: true,
  reminderDelayMinutes: 30,
  escalationDelayMinutes: 90
}

function buttonClass(tone: ButtonTone) {
  if (tone === 'danger') {
    return 'bg-[#FFF1F1] text-[#8A3030] ring-[#F1C7C7] hover:bg-[#FFE8E8]'
  }

  if (tone === 'watch') {
    return 'bg-[#FFF8E9] text-[#795C22] ring-[#EFD9A8] hover:bg-[#FFF2D2]'
  }

  if (tone === 'neutral') {
    return 'bg-white text-[#315E58] ring-[#D6EDE7] hover:bg-[#F7FFFC]'
  }

  return 'bg-[#EFFFFA] text-[#176F62] ring-[#BFEBDD] hover:bg-[#DFFFF5]'
}

function localReminderKey(familyCode: string, slot: SlotKey) {
  return `anbu-routine-reminder-${familyCode}-${slot}`
}

function formatShort(value: string | null) {
  if (!value) return ''
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return ''

  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(parsed))
}

function getInitialFamilyCode() {
  if (typeof window === 'undefined') return ''

  const fromQuery = new URLSearchParams(window.location.search).get('familyCode') || ''
  if (fromQuery) return fromQuery

  const session = readParentSession()
  if (session?.familyCode) return session.familyCode

  return (
    window.localStorage.getItem('anbu-parent-family-code') ||
    window.localStorage.getItem('anbu-guardian-family-code') ||
    ''
  )
}

function statusText(value: StatusValue, type: 'meal' | 'medication') {
  if (value === 'done') return type === 'meal' ? '식사 완료' : '복약 완료'
  if (value === 'not_done') return type === 'meal' ? '식사 확인 필요' : '복약 확인 필요'
  if (value === 'not_applicable') return '해당 없음'
  return '아직 미확인'
}

export function ParentRoutineCheckin() {
  const [familyCode, setFamilyCode] = useState('')
  const [data, setData] = useState<RoutineData | null>(null)
  const [draftSchedule, setDraftSchedule] = useState<Schedule>(DEFAULT_SCHEDULE)
  const [loading, setLoading] = useState(true)
  const [savingAction, setSavingAction] = useState<RoutineAction | ''>('')
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [showCorrection, setShowCorrection] = useState(false)
  const [localReminderDue, setLocalReminderDue] = useState<string | null>(null)

  const load = useCallback(async (code: string) => {
    const clean = code.trim()

    if (!clean) {
      setLoading(false)
      setError('부모님 연결코드가 필요합니다.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        `/api/parent-routine-checkin?familyCode=${encodeURIComponent(clean)}`,
        {
          cache: 'no-store',
          credentials: 'include'
        }
      )

      const result = await response.json().catch(() => ({})) as RoutineData & { message?: string }

      if (!response.ok || result.ok === false) {
        throw new Error(result.message || '오늘 안부 화면을 불러오지 못했습니다.')
      }

      setData(result)
      setDraftSchedule(result.schedule)
      setShowCorrection(false)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : '오늘 안부 화면을 불러오지 못했습니다.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const code = getInitialFamilyCode()

    if (!code) {
      window.location.replace('/parent/login')
      return
    }

    setFamilyCode(code)
    window.localStorage.setItem('anbu-parent-family-code', code)
    void load(code)
  }, [load])

  useEffect(() => {
    if (!familyCode) return

    const interval = window.setInterval(() => {
      void load(familyCode)
    }, 60_000)

    return () => window.clearInterval(interval)
  }, [familyCode, load])

  useEffect(() => {
    if (!familyCode || !data?.currentSlot) return

    const activeSlot = data.currentSlot
    const activeState = data.currentState
    const key = localReminderKey(familyCode, activeSlot.key)

    function checkReminder() {
      const raw = window.localStorage.getItem(key)
      if (!raw) {
        setLocalReminderDue(null)
        return
      }

      const due = Date.parse(raw)
      if (!Number.isFinite(due)) {
        window.localStorage.removeItem(key)
        setLocalReminderDue(null)
        return
      }

      if (Date.now() >= due && !activeState?.complete) {
        setLocalReminderDue(raw)

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('안부웍스 확인 시간이에요', {
            body: activeSlot.medicationEnabled
              ? `${activeSlot.label} 식사와 약을 확인해주세요.`
              : `${activeSlot.label} 식사를 확인해주세요.`
          })
        }
      } else {
        setLocalReminderDue(null)
      }
    }

    checkReminder()
    const interval = window.setInterval(checkReminder, 30_000)
    return () => window.clearInterval(interval)
  }, [familyCode, data?.currentSlot, data?.currentState?.complete])

  async function scheduleBrowserReminder(slot: SlotKey, minutes: number) {
    const due = new Date(Date.now() + minutes * 60 * 1000).toISOString()
    window.localStorage.setItem(localReminderKey(familyCode, slot), due)

    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission()
      } catch {
        // 브라우저 알림 권한을 받을 수 없어도 서버 재알림은 계속 사용합니다.
      }
    }
  }

  async function submit(action: RoutineAction) {
    if (!data?.currentSlot || !familyCode) return

    if (action === 'need_help') {
      const confirmed = window.confirm(
        '보호자에게 도움 요청을 보낼까요? 응급상황이면 이 화면보다 먼저 119에 연락해주세요.'
      )
      if (!confirmed) return
    }

    setSavingAction(action)
    setMessage('')
    setError('')

    try {
      const response = await fetch('/api/parent-routine-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          familyCode,
          mode: 'checkin',
          slot: data.currentSlot.key,
          action
        })
      })

      const result = await response.json().catch(() => ({})) as RoutineData & { message?: string }

      if (!response.ok || result.ok === false) {
        throw new Error(result.message || '안부 확인 저장에 실패했습니다.')
      }

      if (action === 'later') {
        await scheduleBrowserReminder(
          data.currentSlot.key,
          result.schedule.reminderDelayMinutes
        )
      } else {
        window.localStorage.removeItem(
          localReminderKey(familyCode, data.currentSlot.key)
        )
        setLocalReminderDue(null)
      }

      setData(result)
      setDraftSchedule(result.schedule)
      setMessage(result.message || '안부 확인이 저장되었습니다.')
      setShowCorrection(false)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : '안부 확인 저장에 실패했습니다.'
      )
    } finally {
      setSavingAction('')
    }
  }

  async function saveSchedule() {
    if (!familyCode) return

    setSavingSchedule(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch('/api/parent-routine-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          familyCode,
          mode: 'save_schedule',
          schedule: draftSchedule
        })
      })

      const result = await response.json().catch(() => ({})) as RoutineData & { message?: string }

      if (!response.ok || result.ok === false) {
        throw new Error(result.message || '일정 저장에 실패했습니다.')
      }

      setData(result)
      setDraftSchedule(result.schedule)
      setMessage(result.message || '부모님별 일정이 저장되었습니다.')
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : '일정 저장에 실패했습니다.'
      )
    } finally {
      setSavingSchedule(false)
    }
  }

  const buttons = useMemo<ButtonItem[]>(() => {
    const slot = data?.currentSlot
    const state = data?.currentState

    if (!slot || !state) return []
    if (state.complete && !showCorrection) return []

    const items: ButtonItem[] = []
    const mealUnknown = state.mealStatus === 'unknown'
    const medicationUnknown = state.medicationStatus === 'unknown'
    const medicationEnabled = slot.medicationEnabled

    if (!medicationEnabled) {
      if (state.mealStatus !== 'done') {
        items.push({
          action: 'all_done',
          title: '식사했어요',
          desc: '한 번 누르면 식사 완료로 기록됩니다.',
          tone: 'safe',
          wide: true
        })
      }

      if (state.mealStatus === 'not_done') {
        items.push({
          action: 'meal_done',
          title: '방금 식사했어요',
          desc: '이전 확인 필요 상태를 완료로 바꿉니다.',
          tone: 'safe'
        })
      } else if (mealUnknown) {
        items.push({
          action: 'meal_not_done',
          title: '아직 못 먹었어요',
          desc: '보호자 확인 필요로 기록합니다.',
          tone: 'watch'
        })
      }
    } else if (mealUnknown && medicationUnknown) {
      items.push(
        {
          action: 'all_done',
          title: '식사와 약 모두 했어요',
          desc: '정상적인 날에는 이 버튼 한 번이면 끝납니다.',
          tone: 'safe',
          wide: true
        },
        {
          action: 'meal_only',
          title: '식사만 했어요',
          desc: '약만 다시 확인할 수 있게 남겨둡니다.',
          tone: 'neutral'
        },
        {
          action: 'medication_only',
          title: '약만 먹었어요',
          desc: '식사만 다시 확인할 수 있게 남겨둡니다.',
          tone: 'neutral'
        }
      )
    } else if (state.mealStatus === 'done' && medicationUnknown) {
      items.push(
        {
          action: 'medication_done',
          title: '약도 먹었어요',
          desc: '이 시간대 확인을 완료합니다.',
          tone: 'safe',
          wide: true
        },
        {
          action: 'medication_not_done',
          title: '약은 아직이에요',
          desc: '복약 확인 필요로 기록합니다.',
          tone: 'watch'
        }
      )
    } else if (mealUnknown && state.medicationStatus === 'done') {
      items.push(
        {
          action: 'meal_done',
          title: '식사도 했어요',
          desc: '이 시간대 확인을 완료합니다.',
          tone: 'safe',
          wide: true
        },
        {
          action: 'meal_not_done',
          title: '식사는 아직이에요',
          desc: '식사 확인 필요로 기록합니다.',
          tone: 'watch'
        }
      )
    } else {
      if (state.mealStatus !== 'done') {
        items.push({
          action: 'meal_done',
          title: '식사했어요',
          desc: '식사 상태를 완료로 바꿉니다.',
          tone: 'safe'
        })
      }

      if (medicationEnabled && state.medicationStatus !== 'done') {
        items.push({
          action: 'medication_done',
          title: '약 먹었어요',
          desc: '복약 상태를 완료로 바꿉니다.',
          tone: 'safe'
        })
      }
    }

    if (!state.complete) {
      items.push({
        action: 'later',
        title: `${data.schedule.reminderDelayMinutes}분 후 알려줘요`,
        desc: '지금은 넘기고 자동으로 다시 확인합니다.',
        tone: 'neutral'
      })
    }

    items.push(
      {
        action: 'condition_issue',
        title: '몸이 불편해요',
        desc: '보호자가 확인할 수 있도록 기록합니다.',
        tone: 'watch'
      },
      {
        action: 'need_help',
        title: '도움이 필요해요',
        desc: '보호자에게 빠른 확인이 필요하다고 알립니다.',
        tone: 'danger',
        wide: true
      }
    )

    return items
  }, [data, showCorrection])

  const prompt = useMemo(() => {
    const slot = data?.currentSlot
    const state = data?.currentState

    if (!slot || !state) return ''
    if (!slot.medicationEnabled) return `${slot.label} 식사는 하셨나요?`
    if (state.mealStatus === 'done' && state.medicationStatus === 'unknown') {
      return `${slot.label} 약은 챙기셨나요?`
    }
    if (state.mealStatus === 'unknown' && state.medicationStatus === 'done') {
      return `${slot.label} 식사는 하셨나요?`
    }
    return `${slot.label} 식사와 약을 챙기셨나요?`
  }, [data])

  if (loading && !data) {
    return (
      <main className="min-h-[100svh] bg-[#F7FFFC] px-4 py-10 text-[#17443F]">
        <section className="mx-auto max-w-2xl rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-[#D6EDE7]">
          <p className="text-2xl font-black">오늘 확인을 준비하고 있습니다.</p>
        </section>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="min-h-[100svh] bg-[#F7FFFC] px-4 py-10 text-[#17443F]">
        <section className="mx-auto max-w-2xl rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-[#D6EDE7]">
          <h1 className="text-3xl font-black">연결 정보를 확인해주세요.</h1>
          <p className="mt-4 font-bold leading-7 text-[#637B76]">{error}</p>
          <a
            href="/parent/login"
            className="mt-6 inline-flex rounded-2xl bg-[#2AA897] px-5 py-4 font-black text-white"
          >
            부모님 연결코드 입력
          </a>
        </section>
      </main>
    )
  }

  const currentState = data.currentState
  const currentSlot = data.currentSlot

  return (
    <main className="min-h-[100svh] bg-[radial-gradient(circle_at_top_left,#E9FFF7_0%,#F7FFFC_38%,#FFFFFF_76%)] px-4 py-5 text-[#17443F] sm:py-8">
      <section className="mx-auto max-w-3xl space-y-5">
        <header className="rounded-[2rem] bg-white p-5 shadow-[0_18px_56px_rgba(38,126,111,0.10)] ring-1 ring-[#D6EDE7] sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#247A71]">
              {data.family.parentName}님 오늘 안부
            </span>
            <span className="text-sm font-black text-[#637B76]">{data.generatedKst}</span>
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            지금 필요한 확인만
            <br />
            한 번 눌러주세요.
          </h1>

          <p className="mt-4 text-base font-bold leading-8 text-[#637B76]">
            정상적인 날에는 ‘모두 했어요’ 한 번으로 끝납니다. 정상 응답은 저녁 요약으로
            전달되고, 확인이 필요한 경우에만 보호자에게 바로 알려드립니다. 미응답은
            식사나 약을 하지 않은 것으로 단정하지 않고 ‘미확인’으로만 기록합니다.
          </p>
        </header>

        {message ? (
          <section className="rounded-[1.5rem] bg-[#EFFFFA] p-5 font-black leading-7 text-[#176F62] ring-1 ring-[#BFEBDD]">
            {message}
          </section>
        ) : null}

        {error ? (
          <section className="rounded-[1.5rem] bg-[#FFF1F1] p-5 font-black leading-7 text-[#8A3030] ring-1 ring-[#F1C7C7]">
            {error}
          </section>
        ) : null}

        {localReminderDue ? (
          <section className="rounded-[1.5rem] bg-[#FFF8E9] p-5 ring-1 ring-[#EFD9A8]">
            <p className="text-xl font-black text-[#795C22]">다시 확인할 시간이에요.</p>
            <p className="mt-2 font-bold text-[#795C22]">
              {formatShort(localReminderDue)}로 요청한 재알림입니다.
            </p>
          </section>
        ) : null}

        {!currentSlot ? (
          <section className="rounded-[2rem] bg-white p-7 text-center shadow-sm ring-1 ring-[#D6EDE7] sm:p-10">
            <div className="text-5xl">✅</div>
            <h2 className="mt-4 text-3xl font-black">지금은 확인 시간이 아닙니다.</h2>
            <p className="mt-4 text-lg font-bold text-[#637B76]">
              다음 확인은 {data.nextSlot.label} {data.nextSlot.time}입니다.
            </p>
          </section>
        ) : currentState?.complete && !showCorrection ? (
          <section className="rounded-[2rem] bg-white p-7 text-center shadow-sm ring-1 ring-[#D6EDE7] sm:p-10">
            <div className="text-6xl">✅</div>
            <h2 className="mt-5 text-4xl font-black">{currentSlot.label} 확인 완료</h2>
            <p className="mt-4 text-lg font-bold leading-8 text-[#637B76]">
              {currentState.lastLabel || '식사와 복약이 확인되었습니다.'}
              <br />
              다음 확인은 {data.nextSlot.label} {data.nextSlot.time}입니다.
            </p>
            <button
              type="button"
              onClick={() => setShowCorrection(true)}
              className="mt-6 rounded-xl bg-white px-4 py-3 text-sm font-black text-[#637B76] ring-1 ring-[#D6EDE7]"
            >
              잘못 눌렀거나 내용을 수정할게요
            </button>
          </section>
        ) : (
          <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_56px_rgba(38,126,111,0.08)] ring-1 ring-[#D6EDE7] sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-[#2AA897]">
                  {currentSlot.label} 확인 · 기준 {currentSlot.time}
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] sm:text-4xl">
                  {prompt}
                </h2>
              </div>
              <div className="rounded-2xl bg-[#F7FFFC] px-4 py-3 text-sm font-black text-[#637B76] ring-1 ring-[#D6EDE7]">
                식사: {statusText(currentState?.mealStatus || 'unknown', 'meal')}
                <br />
                약: {statusText(currentState?.medicationStatus || 'unknown', 'medication')}
              </div>
            </div>

            {currentState?.needsAttention ? (
              <div className="mt-5 rounded-2xl bg-[#FFF8E9] p-4 font-black leading-7 text-[#795C22] ring-1 ring-[#EFD9A8]">
                보호자 확인이 필요한 응답이 기록되었습니다. 이후 식사나 복약을 완료했다면
                아래 완료 버튼으로 상태를 바로 갱신할 수 있습니다.
              </div>
            ) : null}

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {buttons.map((button) => (
                <button
                  key={button.action}
                  type="button"
                  disabled={Boolean(savingAction)}
                  onClick={() => void submit(button.action)}
                  className={
                    `${button.wide ? 'sm:col-span-2 ' : ''}` +
                    `min-h-[112px] rounded-[1.5rem] p-5 text-left shadow-sm ring-1 transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60 ${buttonClass(button.tone)}`
                  }
                >
                  <span className="block text-2xl font-black leading-tight tracking-[-0.04em]">
                    {savingAction === button.action ? '저장하는 중...' : button.title}
                  </span>
                  <span className="mt-2 block text-sm font-bold leading-6 opacity-80">
                    {button.desc}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        <details className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-7">
          <summary className="cursor-pointer list-none text-lg font-black">
            보호자 설정 · 식사와 약 시간 바꾸기
          </summary>
          <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">
            보호자가 처음 한 번만 설정하면 부모님 화면에는 현재 필요한 질문만 나타납니다.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {([
              ['breakfastTime', '아침 시간'],
              ['lunchTime', '점심 시간'],
              ['dinnerTime', '저녁 시간']
            ] as const).map(([key, label]) => (
              <label key={key} className="font-black text-[#315E58]">
                {label}
                <input
                  type="time"
                  value={draftSchedule[key]}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setDraftSchedule((current) => ({
                      ...current,
                      [key]: event.target.value
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-[#D6EDE7] bg-white px-4 py-3 text-lg font-black outline-none focus:border-[#2AA897]"
                />
              </label>
            ))}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {([
              ['morningMedication', '아침약 있음'],
              ['noonMedication', '점심약 있음'],
              ['eveningMedication', '저녁약 있음']
            ] as const).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center gap-3 rounded-xl bg-[#F7FFFC] p-4 font-black ring-1 ring-[#D6EDE7]"
              >
                <input
                  type="checkbox"
                  checked={draftSchedule[key]}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setDraftSchedule((current) => ({
                      ...current,
                      [key]: event.target.checked
                    }))
                  }
                  className="h-5 w-5"
                />
                {label}
              </label>
            ))}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="font-black text-[#315E58]">
              첫 재알림(분)
              <input
                type="number"
                min={10}
                max={180}
                value={draftSchedule.reminderDelayMinutes}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setDraftSchedule((current) => ({
                    ...current,
                    reminderDelayMinutes: Number(event.target.value)
                  }))
                }
                className="mt-2 w-full rounded-xl border border-[#D6EDE7] bg-white px-4 py-3 text-lg font-black outline-none focus:border-[#2AA897]"
              />
            </label>

            <label className="font-black text-[#315E58]">
              보호자 확인 전환(분)
              <input
                type="number"
                min={30}
                max={360}
                value={draftSchedule.escalationDelayMinutes}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setDraftSchedule((current) => ({
                    ...current,
                    escalationDelayMinutes: Number(event.target.value)
                  }))
                }
                className="mt-2 w-full rounded-xl border border-[#D6EDE7] bg-white px-4 py-3 text-lg font-black outline-none focus:border-[#2AA897]"
              />
            </label>
          </div>

          <button
            type="button"
            disabled={savingSchedule}
            onClick={() => void saveSchedule()}
            className="mt-6 w-full rounded-2xl bg-[#2AA897] px-5 py-4 text-lg font-black text-white disabled:opacity-60"
          >
            {savingSchedule ? '일정 저장 중...' : '부모님별 일정 저장'}
          </button>
        </details>

        <footer className="px-2 pb-6 text-center text-xs font-bold leading-6 text-[#7B908C]">
          안부웍스 기록은 의료 진단이 아닌 일상 안부 확인을 돕는 참고 정보입니다.
          응급상황은 즉시 119 또는 의료기관에 연락해주세요.
        </footer>
      </section>
    </main>
  )
}
