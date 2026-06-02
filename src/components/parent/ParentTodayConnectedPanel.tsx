'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { readParentSession, type ParentSession } from '@/components/auth/ParentSessionBridge'

type Option = {
  key: string
  groupKey: string
  label: string
  desc: string
  checkType: string
  checkSlot: string
  status: string
  tone: 'good' | 'warn' | 'danger'
}

type SlotGroup = {
  key: string
  title: string
  desc: string
  options: Option[]
}

type Section = {
  title: string
  desc: string
  groups: SlotGroup[]
}

const sections: Section[] = [
  {
    title: '식사 확인',
    desc: '아침, 점심, 저녁 식사 여부를 각각 선택해주세요.',
    groups: [
      {
        key: 'meal:breakfast',
        title: '아침 식사',
        desc: '아침 식사 여부',
        options: [
          { key: 'meal:breakfast:done', groupKey: 'meal:breakfast', label: '아침 식사했어요', desc: '아침 식사를 완료했어요', checkType: 'meal', checkSlot: 'breakfast', status: 'done', tone: 'good' },
          { key: 'meal:breakfast:not_done', groupKey: 'meal:breakfast', label: '아침 아직 못 먹었어요', desc: '아침 식사 확인이 필요해요', checkType: 'meal', checkSlot: 'breakfast', status: 'not_done', tone: 'warn' }
        ]
      },
      {
        key: 'meal:lunch',
        title: '점심 식사',
        desc: '점심 식사 여부',
        options: [
          { key: 'meal:lunch:done', groupKey: 'meal:lunch', label: '점심 식사했어요', desc: '점심 식사를 완료했어요', checkType: 'meal', checkSlot: 'lunch', status: 'done', tone: 'good' },
          { key: 'meal:lunch:not_done', groupKey: 'meal:lunch', label: '점심 아직 못 먹었어요', desc: '점심 식사 확인이 필요해요', checkType: 'meal', checkSlot: 'lunch', status: 'not_done', tone: 'warn' }
        ]
      },
      {
        key: 'meal:dinner',
        title: '저녁 식사',
        desc: '저녁 식사 여부',
        options: [
          { key: 'meal:dinner:done', groupKey: 'meal:dinner', label: '저녁 식사했어요', desc: '저녁 식사를 완료했어요', checkType: 'meal', checkSlot: 'dinner', status: 'done', tone: 'good' },
          { key: 'meal:dinner:not_done', groupKey: 'meal:dinner', label: '저녁 아직 못 먹었어요', desc: '저녁 식사 확인이 필요해요', checkType: 'meal', checkSlot: 'dinner', status: 'not_done', tone: 'warn' }
        ]
      }
    ]
  },
  {
    title: '복약 확인',
    desc: '아침약, 점심약, 저녁약 복용 여부를 각각 선택해주세요.',
    groups: [
      {
        key: 'medication:morning',
        title: '아침약',
        desc: '아침약 복용 여부',
        options: [
          { key: 'medication:morning:done', groupKey: 'medication:morning', label: '아침약 먹었어요', desc: '아침약 복용을 완료했어요', checkType: 'medication', checkSlot: 'morning', status: 'done', tone: 'good' },
          { key: 'medication:morning:not_done', groupKey: 'medication:morning', label: '아침약 아직 안 먹었어요', desc: '아침약 확인이 필요해요', checkType: 'medication', checkSlot: 'morning', status: 'not_done', tone: 'warn' }
        ]
      },
      {
        key: 'medication:noon',
        title: '점심약',
        desc: '점심약 복용 여부',
        options: [
          { key: 'medication:noon:done', groupKey: 'medication:noon', label: '점심약 먹었어요', desc: '점심약 복용을 완료했어요', checkType: 'medication', checkSlot: 'noon', status: 'done', tone: 'good' },
          { key: 'medication:noon:not_done', groupKey: 'medication:noon', label: '점심약 아직 안 먹었어요', desc: '점심약 확인이 필요해요', checkType: 'medication', checkSlot: 'noon', status: 'not_done', tone: 'warn' }
        ]
      },
      {
        key: 'medication:evening',
        title: '저녁약',
        desc: '저녁약 복용 여부',
        options: [
          { key: 'medication:evening:done', groupKey: 'medication:evening', label: '저녁약 먹었어요', desc: '저녁약 복용을 완료했어요', checkType: 'medication', checkSlot: 'evening', status: 'done', tone: 'good' },
          { key: 'medication:evening:not_done', groupKey: 'medication:evening', label: '저녁약 아직 안 먹었어요', desc: '저녁약 확인이 필요해요', checkType: 'medication', checkSlot: 'evening', status: 'not_done', tone: 'warn' }
        ]
      }
    ]
  },
  {
    title: '몸 상태',
    desc: '오늘 몸 상태를 하나만 선택해주세요.',
    groups: [
      {
        key: 'condition:day',
        title: '오늘 몸 상태',
        desc: '현재 몸 상태',
        options: [
          { key: 'condition:day:done', groupKey: 'condition:day', label: '괜찮아요', desc: '오늘 몸 상태가 괜찮아요', checkType: 'condition', checkSlot: 'day', status: 'done', tone: 'good' },
          { key: 'condition:day:needs_help', groupKey: 'condition:day', label: '몸이 불편해요', desc: '보호자 확인이 필요해요', checkType: 'condition', checkSlot: 'day', status: 'needs_help', tone: 'warn' }
        ]
      }
    ]
  },
  {
    title: '도움 요청',
    desc: '도움이 필요한지 하나만 선택해주세요.',
    groups: [
      {
        key: 'emergency:day',
        title: '도움 요청',
        desc: '현재 도움 필요 여부',
        options: [
          { key: 'emergency:day:done', groupKey: 'emergency:day', label: '도움 필요 없어요', desc: '지금은 도움이 필요 없어요', checkType: 'emergency', checkSlot: 'day', status: 'done', tone: 'good' },
          { key: 'emergency:day:needs_help', groupKey: 'emergency:day', label: '도움이 필요해요', desc: '빠른 확인이 필요해요', checkType: 'emergency', checkSlot: 'day', status: 'needs_help', tone: 'danger' }
        ]
      }
    ]
  }
]

function baseToneClass(tone: Option['tone']) {
  if (tone === 'danger') return 'bg-[#FFF1F1] text-[#8A2525] ring-[#F3BBBB]'
  if (tone === 'warn') return 'bg-[#FFF8E8] text-[#795313] ring-[#F4D8A5]'
  return 'bg-[#EFFFF9] text-[#116D5F] ring-[#CDEFE5]'
}

function selectedToneClass(tone: Option['tone']) {
  if (tone === 'danger') return 'bg-[#8A2525] text-white ring-[#8A2525]'
  if (tone === 'warn') return 'bg-[#9A6A12] text-white ring-[#9A6A12]'
  return 'bg-[#116D5F] text-white ring-[#116D5F]'
}

function kstToday() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date())
}

export function ParentTodayConnectedPanel() {
  const [session, setSession] = useState<ParentSession | null>(null)
  const [careDate, setCareDate] = useState(kstToday())
  const [selected, setSelected] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [lastAction, setLastAction] = useState('')
  const [loadingKey, setLoadingKey] = useState('')

  useEffect(() => {
    const stored = readParentSession()

    if (!stored) {
      window.location.replace('/parent/login')
      return
    }

    setSession(stored)

    void loadToday(stored.familyCode)
  }, [])

  async function loadToday(familyCode: string) {
    const today = kstToday()
    setCareDate(today)

    try {
      const response = await fetch('/api/parent-checkin?familyCode=' + encodeURIComponent(familyCode), {
        cache: 'no-store'
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setSelected({})
        return
      }

      const next: Record<string, string> = {}

      for (const [key, row] of Object.entries(data.choices || {})) {
        if (row && typeof row === 'object' && 'care_label' in row) {
          next[key] = String((row as Record<string, unknown>).care_label || '')
        }
      }

      setSelected(next)
      window.localStorage.setItem(`anbu_today_choices_${familyCode}_${today}`, JSON.stringify(next))
    } catch {
      try {
        const raw = window.localStorage.getItem(`anbu_today_choices_${familyCode}_${today}`)
        setSelected(raw ? JSON.parse(raw) : {})
      } catch {
        setSelected({})
      }
    }
  }

  function saveSelected(next: Record<string, string>) {
    setSelected(next)

    if (session?.familyCode) {
      window.localStorage.setItem(`anbu_today_choices_${session.familyCode}_${careDate}`, JSON.stringify(next))
    }
  }

  async function submit(option: Option) {
    if (!session?.familyCode) {
      window.location.href = '/parent/login'
      return
    }

    const today = kstToday()

    if (today !== careDate) {
      setCareDate(today)
      setSelected({})
    }

    const previous = selected
    const next = {
      ...selected,
      [option.groupKey]: option.label
    }

    saveSelected(next)
    setLoadingKey(option.groupKey)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/parent-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyCode: session.familyCode,
          checkType: option.checkType,
          checkSlot: option.checkSlot,
          status: option.status,
          careLabel: option.label,
          memo: option.desc
        })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        saveSelected(previous)
        setMessage(data.message || '안부 저장에 실패했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      setCareDate(data.careDate || today)
      setLastAction(option.label)
      setMessage(data.message || `${option.label} 선택이 자녀 리포트에 반영되었습니다.`)
    } catch (error) {
      saveSelected(previous)
      setMessage('안부 저장에 실패했습니다. 네트워크 또는 배포 상태를 확인해주세요.')
      setDebug(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoadingKey('')
    }
  }

  if (!session) {
    return (
      <main className="min-h-[100svh] bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-8 text-[#173B36]">
        <section className="mx-auto max-w-xl rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-[#D8EEE8]">
          <div className="text-2xl font-black">부모님 연결 확인 중입니다.</div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-[100svh] bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-5 text-[#173B36] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-4xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            부모님 연결 완료
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            오늘 안부를
            <br />
            자녀에게 알려주세요.
          </h1>

          <p className="mt-4 text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            식사와 약은 아침·점심·저녁으로 나뉩니다. 날짜가 바뀌면 오늘 선택은 비워지고, 이전 기록은 자녀 리포트에 남습니다.
          </p>

          <div className="mt-5 rounded-2xl bg-[#EFFFF9] p-4 text-sm font-black leading-7 text-[#116D5F] ring-1 ring-[#CDEFE5]">
            보호자 {session.guardianName || '보호자'}님과 연결되었습니다.
          </div>

          <div className="mt-3 rounded-2xl bg-[#F8FCFB] p-4 text-sm font-black leading-7 text-[#637B76] ring-1 ring-[#D8EEE8]">
            오늘 날짜: {careDate}
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#FFF8E8] p-4 text-sm font-black leading-7 text-[#795313] ring-1 ring-[#F4D8A5]">
              {message}
            </div>
          ) : null}

          {debug ? (
            <details className="mt-4 rounded-2xl bg-[#123F38] p-4 text-xs font-bold leading-6 text-[#E7FFF7]">
              <summary className="cursor-pointer text-sm font-black">상세 오류 보기</summary>
              <pre className="mt-3 max-h-60 overflow-auto whitespace-pre-wrap">{debug}</pre>
            </details>
          ) : null}
        </section>

        <section className="space-y-5">
          {sections.map((section) => (
            <article key={section.title} className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">{section.title}</h2>
              <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">{section.desc}</p>

              <div className="mt-5 space-y-4">
                {section.groups.map((group) => (
                  <div key={group.key} className="rounded-[1.5rem] bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8]">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h3 className="text-xl font-black tracking-[-0.04em]">{group.title}</h3>
                        <p className="mt-1 text-sm font-bold leading-6 text-[#637B76]">{group.desc}</p>
                      </div>

                      {selected[group.key] ? (
                        <div className="rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
                          선택됨: {selected[group.key]}
                        </div>
                      ) : (
                        <div className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#7A9692] ring-1 ring-[#D8EEE8]">
                          아직 선택 없음
                        </div>
                      )}
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {group.options.map((option) => {
                        const isSelected = selected[group.key] === option.label
                        const isLoading = loadingKey === group.key

                        return (
                          <button
                            key={option.key}
                            onClick={() => submit(option)}
                            disabled={Boolean(loadingKey)}
                            className={
                              'rounded-[1.5rem] p-5 text-left shadow-sm ring-1 transition disabled:opacity-50 ' +
                              (isSelected ? selectedToneClass(option.tone) : baseToneClass(option.tone))
                            }
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-2xl font-black tracking-[-0.05em]">{option.label}</div>
                              {isSelected ? (
                                <div className="rounded-full bg-white/20 px-3 py-1 text-xs font-black">
                                  선택
                                </div>
                              ) : null}
                            </div>
                            <p className="mt-2 text-sm font-bold leading-6 opacity-80">
                              {isLoading ? '저장 중...' : option.desc}
                            </p>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>

        {lastAction ? (
          <section className="rounded-[2rem] bg-[#123F38] p-5 text-white">
            <div className="text-sm font-black text-[#A7F2E3]">방금 보낸 안부</div>
            <div className="mt-2 text-3xl font-black tracking-[-0.06em]">{lastAction}</div>
            <p className="mt-3 text-sm font-bold leading-7 text-[#E7FFF7]">
              자녀의 부모님 리포트에 반영됩니다.
            </p>
          </section>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/parent/consent"
            className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
          >
            안심동의
          </Link>

          <Link
            href="/install"
            className="rounded-2xl bg-[#F8FCFB] px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
          >
            홈 화면에 추가
          </Link>
        </div>
      </section>
    </main>
  )
}

export default ParentTodayConnectedPanel
