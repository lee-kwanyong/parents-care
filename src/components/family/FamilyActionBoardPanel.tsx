'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type ActionTask = {
  id: string
  family_code: string
  task_type?: string
  title: string
  description?: string
  priority?: string
  status?: string
  assigned_to_name?: string
  created_by_name?: string
  source?: string
  source_key?: string
  completed_note?: string
  created_at?: string
  completed_at?: string
}

type Suggestion = {
  sourceKey: string
  taskType: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
}

function code6(value: string) {
  return value.replace(/[^\d]/g, '').slice(0, 6)
}

function readStoredFamilyCode() {
  if (typeof window === 'undefined') return ''

  const keys = [
    'anbu_guardian_family_code',
    'anbu_selected_family_code',
    'anbu_last_family_code',
    'anbu_family_code',
    'pc_parent_invite_code'
  ]

  for (const key of keys) {
    const code = code6(window.localStorage.getItem(key) || '')
    if (/^\d{6}$/.test(code)) return code
  }

  return ''
}

function statusLabel(status?: string) {
  if (status === 'doing') return '확인 중'
  if (status === 'done') return '완료'
  if (status === 'skipped') return '보류'
  return '대기'
}

function statusClass(status?: string) {
  if (status === 'done') return 'bg-[#EFFFF9] text-[#116D5F] ring-[#CDEFE5]'
  if (status === 'doing') return 'bg-[#FFF8E8] text-[#795313] ring-[#F4D8A5]'
  if (status === 'skipped') return 'bg-[#F8FCFB] text-[#637B76] ring-[#D8EEE8]'
  return 'bg-white text-[#173B36] ring-[#D8EEE8]'
}

function priorityClass(priority?: string) {
  if (priority === 'high') return 'bg-[#FFF1F1] text-[#8A2525] ring-[#F3BBBB]'
  if (priority === 'low') return 'bg-[#EFFFF9] text-[#116D5F] ring-[#CDEFE5]'
  return 'bg-[#FFF8E8] text-[#795313] ring-[#F4D8A5]'
}

function priorityLabel(priority?: string) {
  if (priority === 'high') return '높음'
  if (priority === 'low') return '낮음'
  return '중간'
}

export function FamilyActionBoardPanel() {
  const [familyCode, setFamilyCode] = useState('')
  const [actorName, setActorName] = useState('')
  const [tasks, setTasks] = useState<ActionTask[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(true)

  const [manualTitle, setManualTitle] = useState('')
  const [manualDescription, setManualDescription] = useState('')
  const [manualPriority, setManualPriority] = useState('medium')

  const activeTasks = useMemo(() => tasks.filter((task) => task.status !== 'done'), [tasks])
  const doneTasks = useMemo(() => tasks.filter((task) => task.status === 'done'), [tasks])

  async function load(code?: string) {
    const targetCode = code6(code || familyCode || readStoredFamilyCode())

    if (targetCode) {
      setFamilyCode(targetCode)
      window.localStorage.setItem('anbu_selected_family_code', targetCode)
    }

    if (!/^\d{6}$/.test(targetCode)) {
      setLoading(false)
      setMessage('가족코드가 없습니다. 부모님 연결코드 또는 가족 초대코드로 먼저 연결해주세요.')
      return
    }

    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/family-actions?familyCode=' + encodeURIComponent(targetCode), {
        cache: 'no-store'
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '가족 실행 보드를 불러오지 못했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      setTasks(Array.isArray(data.tasks) ? data.tasks : [])
      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : [])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '가족 실행 보드를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function createTask(payload: {
    title: string
    description?: string
    priority?: string
    taskType?: string
    source?: string
    sourceKey?: string
  }) {
    const targetCode = code6(familyCode)

    if (!/^\d{6}$/.test(targetCode)) {
      setMessage('가족코드가 없습니다.')
      return
    }

    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/family-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyCode: targetCode,
          title: payload.title,
          description: payload.description || '',
          priority: payload.priority || 'medium',
          taskType: payload.taskType || 'check',
          source: payload.source || 'manual',
          sourceKey: payload.sourceKey || '',
          createdByName: actorName,
          assignedToName: ''
        })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '가족 실행을 추가하지 못했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      setMessage(data.message || '가족 실행이 추가되었습니다.')
      setManualTitle('')
      setManualDescription('')
      await load(targetCode)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '가족 실행 추가 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function updateTask(task: ActionTask, status: string) {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/family-actions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          status,
          assignedToName: status === 'doing' ? actorName : task.assigned_to_name || actorName,
          completedNote: status === 'done' ? `${actorName || '가족'} 확인 완료` : ''
        })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '상태 변경에 실패했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      setMessage(data.message || '상태가 변경되었습니다.')
      await load(familyCode)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '상태 변경 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const storedCode = readStoredFamilyCode()
    const storedName = window.localStorage.getItem('anbu_actor_name') || ''

    setFamilyCode(storedCode)
    setActorName(storedName)

    load(storedCode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (actorName) {
      window.localStorage.setItem('anbu_actor_name', actorName)
    }
  }, [actorName])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-5 text-[#173B36] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            가족 실행 보드
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            리포트에서 끝나지 않고
            <br />
            가족이 바로 확인합니다.
          </h1>

          <p className="mt-4 text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            부모님 상태 리포트에서 나온 확인 필요 신호를 가족이 나눠 맡고, 확인 중·완료 상태로 남깁니다.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_9rem]">
            <input
              value={familyCode}
              onChange={(event) => setFamilyCode(code6(event.target.value))}
              inputMode="numeric"
              maxLength={6}
              placeholder="가족코드 6자리"
              className="w-full rounded-2xl border border-[#D8EEE8] bg-white px-4 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-[#D6F6EC]"
            />

            <input
              value={actorName}
              onChange={(event) => setActorName(event.target.value)}
              placeholder="내 이름 예: 첫째, 동생"
              className="w-full rounded-2xl border border-[#D8EEE8] bg-white px-4 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-[#D6F6EC]"
            />

            <button
              onClick={() => load(familyCode)}
              disabled={loading}
              className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white disabled:opacity-60"
            >
              {loading ? '불러오는 중' : '조회'}
            </button>
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

        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">권장 실행</h2>
            <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
              부모님 선택 데이터를 보고 자동으로 제안되는 가족 확인 항목입니다.
            </p>

            <div className="mt-5 space-y-3">
              {suggestions.length === 0 ? (
                <div className="rounded-2xl bg-[#F8FCFB] p-4 text-sm font-bold text-[#637B76] ring-1 ring-[#D8EEE8]">
                  현재 추가 제안이 없습니다.
                </div>
              ) : (
                suggestions.map((suggestion) => (
                  <article key={suggestion.sourceKey} className={'rounded-2xl p-4 ring-1 ' + priorityClass(suggestion.priority)}>
                    <div className="text-xs font-black opacity-70">우선순위 {priorityLabel(suggestion.priority)}</div>
                    <h3 className="mt-2 text-xl font-black tracking-[-0.05em]">{suggestion.title}</h3>
                    <p className="mt-2 text-sm font-bold leading-7">{suggestion.description}</p>

                    <button
                      onClick={() =>
                        createTask({
                          title: suggestion.title,
                          description: suggestion.description,
                          priority: suggestion.priority,
                          taskType: suggestion.taskType,
                          source: 'suggestion',
                          sourceKey: suggestion.sourceKey
                        })
                      }
                      disabled={loading}
                      className="mt-4 rounded-xl bg-white/80 px-4 py-3 text-sm font-black ring-1 ring-current disabled:opacity-50"
                    >
                      실행 보드에 추가
                    </button>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">직접 실행 추가</h2>
            <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
              가족끼리 직접 확인할 일을 추가할 수 있습니다.
            </p>

            <div className="mt-5 space-y-3">
              <input
                value={manualTitle}
                onChange={(event) => setManualTitle(event.target.value)}
                placeholder="예: 저녁약 전화로 확인하기"
                className="w-full rounded-2xl border border-[#D8EEE8] bg-white px-4 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-[#D6F6EC]"
              />

              <textarea
                value={manualDescription}
                onChange={(event) => setManualDescription(event.target.value)}
                placeholder="예: 어머니가 저녁약을 드셨는지 동생이 전화로 확인"
                className="min-h-24 w-full rounded-2xl border border-[#D8EEE8] bg-white px-4 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-[#D6F6EC]"
              />

              <select
                value={manualPriority}
                onChange={(event) => setManualPriority(event.target.value)}
                className="w-full rounded-2xl border border-[#D8EEE8] bg-white px-4 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-[#D6F6EC]"
              >
                <option value="high">높음</option>
                <option value="medium">중간</option>
                <option value="low">낮음</option>
              </select>

              <button
                onClick={() =>
                  createTask({
                    title: manualTitle,
                    description: manualDescription,
                    priority: manualPriority,
                    taskType: 'manual',
                    source: 'manual'
                  })
                }
                disabled={loading || !manualTitle.trim()}
                className="w-full rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
              >
                직접 실행 추가
              </button>
            </div>
          </section>
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-[-0.06em]">진행 중인 가족 실행</h2>
              <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                누가 확인 중인지, 완료됐는지 가족이 함께 볼 수 있습니다.
              </p>
            </div>

            <div className="rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
              {activeTasks.length}개 진행 중
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {activeTasks.length === 0 ? (
              <div className="rounded-2xl bg-[#F8FCFB] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D8EEE8]">
                현재 진행 중인 가족 실행이 없습니다.
              </div>
            ) : (
              activeTasks.map((task) => (
                <article key={task.id} className={'rounded-[2rem] p-5 ring-1 ' + statusClass(task.status)}>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-current">
                          {statusLabel(task.status)}
                        </span>
                        <span className={'rounded-full px-3 py-1 text-xs font-black ring-1 ' + priorityClass(task.priority)}>
                          우선순위 {priorityLabel(task.priority)}
                        </span>
                      </div>

                      <h3 className="mt-3 text-2xl font-black tracking-[-0.05em]">{task.title}</h3>
                      <p className="mt-2 text-sm font-bold leading-7 opacity-80">{task.description || '설명 없음'}</p>
                      <p className="mt-2 text-xs font-black opacity-70">
                        담당: {task.assigned_to_name || '아직 없음'} · 작성: {task.created_by_name || '가족'}
                      </p>
                    </div>

                    <div className="grid min-w-48 gap-2">
                      <button
                        onClick={() => updateTask(task, 'doing')}
                        disabled={loading}
                        className="rounded-xl bg-white/80 px-4 py-3 text-sm font-black ring-1 ring-current disabled:opacity-50"
                      >
                        내가 확인할게요
                      </button>
                      <button
                        onClick={() => updateTask(task, 'done')}
                        disabled={loading}
                        className="rounded-xl bg-[#123F38] px-4 py-3 text-sm font-black text-white disabled:opacity-50"
                      >
                        확인 완료
                      </button>
                      <button
                        onClick={() => updateTask(task, 'skipped')}
                        disabled={loading}
                        className="rounded-xl bg-white/60 px-4 py-3 text-sm font-black ring-1 ring-current disabled:opacity-50"
                      >
                        보류
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">완료된 실행</h2>

          <div className="mt-5 space-y-3">
            {doneTasks.length === 0 ? (
              <div className="rounded-2xl bg-[#F8FCFB] p-4 text-sm font-bold text-[#637B76] ring-1 ring-[#D8EEE8]">
                아직 완료된 실행이 없습니다.
              </div>
            ) : (
              doneTasks.slice(0, 10).map((task) => (
                <article key={task.id} className="rounded-2xl bg-[#EFFFF9] p-4 text-[#116D5F] ring-1 ring-[#CDEFE5]">
                  <div className="text-lg font-black">{task.title}</div>
                  <p className="mt-1 text-sm font-bold leading-6">
                    담당: {task.assigned_to_name || '가족'} · {task.completed_note || '확인 완료'}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            href="/child/dashboard"
            className="rounded-2xl bg-[#193B38] px-5 py-4 text-center text-sm font-black text-white"
          >
            부모님 리포트
          </Link>

          <Link
            href="/family/invite"
            className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
          >
            다른 가족 초대
          </Link>

          <button
            onClick={() => load(familyCode)}
            className="rounded-2xl bg-[#F8FCFB] px-5 py-4 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
          >
            새로고침
          </button>
        </div>
      </section>
    </main>
  )
}

export default FamilyActionBoardPanel
