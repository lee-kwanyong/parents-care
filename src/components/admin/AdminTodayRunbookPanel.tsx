'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

type Tone = 'safe' | 'watch' | 'danger' | 'neutral'

type RunbookTask = {
  id: string
  group: string
  title: string
  desc: string
  tone: Tone
  countLabel: string
  href: string
  primaryAction: string
  owner: string
  due: string
  detail?: string
}

type RunbookData = {
  ok: boolean
  message?: string
  runDate?: string
  generatedKst?: string
  tasks?: RunbookTask[]
  summary?: {
    totalTasks: number
    dangerTasks: number
    watchTasks: number
    safeTasks: number
    careRisk: number
    messageRisk: number
    ringRisk: number
  }
  sourceErrors?: string[]
}

function todayKey() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date())
}

function toneClass(tone: Tone) {
  if (tone === 'safe') return 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'
  if (tone === 'watch') return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  if (tone === 'danger') return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  return 'bg-white text-[#17443F] ring-[#D6EDE7]'
}

function toneLabel(tone: Tone) {
  if (tone === 'safe') return '정상'
  if (tone === 'watch') return '주의'
  if (tone === 'danger') return '확인필요'
  return '대기'
}

function storageKeys(runDate: string) {
  return {
    checked: `anbu-runbook-checked-${runDate}`,
    notes: `anbu-runbook-notes-${runDate}`
  }
}

function readObject<T extends Record<string, unknown>>(key: string): T {
  if (typeof window === 'undefined') return {} as T

  try {
    return JSON.parse(window.localStorage.getItem(key) || '{}') as T
  } catch {
    return {} as T
  }
}

function writeObject(key: string, value: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${toneClass(tone)}`}>
      {children}
    </span>
  )
}

function TaskCard({
  task,
  checked,
  note,
  onToggle,
  onNote
}: {
  task: RunbookTask
  checked: boolean
  note: string
  onToggle: (next: boolean) => void
  onNote: (next: string) => void
}) {
  return (
    <article className={`rounded-[2rem] p-5 ring-1 transition ${checked ? 'bg-[#FAFFFD] text-[#637B76] ring-[#D6EDE7]' : 'bg-white text-[#17443F] ring-[#D6EDE7]'}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Pill tone={task.tone}>{toneLabel(task.tone)}</Pill>
          <Pill>{task.group}</Pill>
          <Pill>{task.due}</Pill>
        </div>

        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#FAFFFD] px-3 py-2 text-sm font-black ring-1 ring-[#D6EDE7]">
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => onToggle(event.target.checked)}
            className="h-5 w-5 accent-[#2AA897]"
          />
          처리완료
        </label>
      </div>

      <h3 className={`mt-4 text-2xl font-black tracking-[-0.06em] ${checked ? 'line-through decoration-[#BCEBE1] decoration-4' : ''}`}>
        {task.title}
      </h3>

      <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
        {task.desc}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
          <div className="text-xs font-black text-[#637B76]">현재 상태</div>
          <div className="mt-2 text-lg font-black text-[#17443F]">{task.countLabel}</div>
        </div>

        <div className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
          <div className="text-xs font-black text-[#637B76]">담당</div>
          <div className="mt-2 text-lg font-black text-[#17443F]">{task.owner}</div>
        </div>

        <Link
          href={task.href}
          className="rounded-2xl bg-[#EFFFFA] p-4 text-[#247A71] ring-1 ring-[#CDEFE7] hover:bg-white"
        >
          <div className="text-xs font-black opacity-70">바로가기</div>
          <div className="mt-2 text-lg font-black">{task.primaryAction}</div>
        </Link>
      </div>

      <label className="mt-4 block">
        <span className="text-xs font-black text-[#637B76]">운영 메모</span>
        <textarea
          value={note}
          onChange={(event) => onNote(event.target.value)}
          placeholder="전화 확인 결과, 미처리 사유, 내일 이어갈 내용 등을 적어두세요."
          className="mt-2 min-h-[88px] w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold leading-6 outline-none focus:border-[#2AA897] focus:ring-4 focus:ring-[#D8FFF3]"
        />
      </label>
    </article>
  )
}

export function AdminTodayRunbookPanel() {
  const [data, setData] = useState<RunbookData | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})

  const runDate = data?.runDate || todayKey()
  const tasks = useMemo(() => data?.tasks || [], [data])
  const keys = useMemo(() => storageKeys(runDate), [runDate])

  const groups = useMemo(() => {
    return Array.from(new Set(tasks.map((task) => task.group)))
  }, [tasks])

  const doneCount = useMemo(() => {
    return tasks.filter((task) => checked[task.id]).length
  }, [tasks, checked])

  const progress = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0

  const dangerLeft = useMemo(() => {
    return tasks.filter((task) => task.tone === 'danger' && !checked[task.id]).length
  }, [tasks, checked])

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin-today-runbook', {
        cache: 'no-store',
        credentials: 'include'
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || result.ok === false) {
        setMessage(result.message || '오늘 운영 체크리스트를 불러오지 못했습니다.')
        setData(result)
        return
      }

      setData(result)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '오늘 운영 체크리스트를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function postLog(task: RunbookTask, nextChecked: boolean, note: string) {
    try {
      await fetch('/api/admin-today-runbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          action: 'log',
          runDate,
          taskId: task.id,
          taskTitle: task.title,
          taskGroup: task.group,
          checked: nextChecked,
          note,
          payload: {
            tone: task.tone,
            countLabel: task.countLabel,
            href: task.href
          }
        })
      })
    } catch {
      // 브라우저 저장은 이미 했으므로 네트워크 실패는 조용히 넘어갑니다.
    }
  }

  function toggleTask(task: RunbookTask, next: boolean) {
    const updated = {
      ...checked,
      [task.id]: next
    }

    setChecked(updated)
    writeObject(keys.checked, updated)
    postLog(task, next, notes[task.id] || '')
  }

  function updateNote(task: RunbookTask, next: string) {
    const updated = {
      ...notes,
      [task.id]: next
    }

    setNotes(updated)
    writeObject(keys.notes, updated)
  }

  async function copySummary() {
    const lines = [
      `[안부웍스 운영실] ${runDate} 운영 체크`,
      '',
      `완료: ${doneCount}/${tasks.length} (${progress}%)`,
      `남은 확인필요: ${dangerLeft}건`,
      '',
      ...tasks.map((task) => {
        const done = checked[task.id] ? '완료' : '미처리'
        const note = notes[task.id] ? ` / 메모: ${notes[task.id]}` : ''
        return `- [${done}] ${task.title} (${task.countLabel})${note}`
      })
    ]

    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      setMessage('오늘 운영 체크 요약을 복사했습니다.')
    } catch {
      setMessage('복사에 실패했습니다. 브라우저 권한을 확인해주세요.')
    }
  }

  function resetToday() {
    setChecked({})
    setNotes({})
    writeObject(keys.checked, {})
    writeObject(keys.notes, {})
    setMessage('오늘 체크 상태를 초기화했습니다.')
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    setChecked(readObject<Record<string, boolean>>(keys.checked))
    setNotes(readObject<Record<string, string>>(keys.notes))
  }, [keys.checked, keys.notes])

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#E7FFF7_0%,#F7FFFC_34%,#FFFFFF_72%)] px-4 py-8 text-[#17443F]">
      <section className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[2.5rem] bg-white/95 shadow-[0_24px_80px_rgba(49,151,136,0.10)] ring-1 ring-[#D6EDE7]">
          <div className="grid gap-0 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="p-6 sm:p-9">
              <div className="flex flex-wrap gap-2">
                <Pill tone="safe">Today Runbook</Pill>
                <Pill>{runDate}</Pill>
                <Pill>{data?.generatedKst || '상태 확인'}</Pill>
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.08em] sm:text-6xl">
                오늘 운영은
                <br />
                이 순서대로 처리합니다.
              </h1>

              <p className="mt-5 max-w-3xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
                가입자, 가족 연결, 안부 신호, 문자 실패, 스마트링 리포트, 지자체·R&D 후속 액션까지 운영실이 하루에 확인해야 할 일을 체크합니다.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  onClick={load}
                  disabled={loading}
                  className="rounded-2xl bg-[#EFFFFA] px-5 py-4 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7] disabled:opacity-50"
                >
                  {loading ? '새로고침 중' : '상태 새로고침'}
                </button>

                <button
                  onClick={copySummary}
                  className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
                >
                  운영 요약 복사
                </button>

                <button
                  onClick={resetToday}
                  className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
                >
                  오늘 체크 초기화
                </button>

                <Link
                  href="/admin/ops"
                  className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
                >
                  Admin 운영실
                </Link>
              </div>
            </div>

            <aside className="bg-[linear-gradient(135deg,#EFFFFA_0%,#F7FFFC_50%,#FFFFFF_100%)] p-6 sm:p-9">
              <div className="rounded-[2rem] bg-white/90 p-5 ring-1 ring-[#D6EDE7]">
                <div className="text-sm font-black text-[#637B76]">오늘 완료율</div>
                <div className="mt-3 text-6xl font-black tracking-[-0.08em] text-[#247A71]">
                  {progress}%
                </div>
                <div className="mt-3 h-4 overflow-hidden rounded-full bg-[#EFFFFA] ring-1 ring-[#CDEFE7]">
                  <div
                    className="h-full rounded-full bg-[#2AA897]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-4 text-sm font-bold leading-7 text-[#637B76]">
                  {doneCount}/{tasks.length}개 완료 · 확인필요 미처리 {dangerLeft}건
                </p>

                <div className="mt-5 grid gap-3">
                  <div className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    <div className="text-xs font-black text-[#637B76]">확인필요</div>
                    <div className="mt-2 text-2xl font-black text-[#8A3030]">{data?.summary?.dangerTasks || 0}개</div>
                  </div>
                  <div className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    <div className="text-xs font-black text-[#637B76]">주의</div>
                    <div className="mt-2 text-2xl font-black text-[#795C22]">{data?.summary?.watchTasks || 0}개</div>
                  </div>
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

        {loading && tasks.length === 0 ? (
          <section className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <article key={index} className="rounded-[2rem] bg-white/95 p-5 ring-1 ring-[#D6EDE7]">
                <div className="h-5 w-32 rounded-full bg-[#EFFFFA]" />
                <div className="mt-5 h-8 w-2/3 rounded-xl bg-[#EFFFFA]" />
                <div className="mt-4 h-4 w-full rounded-full bg-[#F7FFFC]" />
                <div className="mt-2 h-4 w-4/5 rounded-full bg-[#F7FFFC]" />
              </article>
            ))}
          </section>
        ) : null}

        {groups.map((group) => (
          <section key={group} className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Pill>{group}</Pill>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.07em]">{group} 체크</h2>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {tasks
                .filter((task) => task.group === group)
                .map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    checked={Boolean(checked[task.id])}
                    note={notes[task.id] || ''}
                    onToggle={(next) => toggleTask(task, next)}
                    onNote={(next) => updateNote(task, next)}
                  />
                ))}
            </div>
          </section>
        ))}

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

export default AdminTodayRunbookPanel
