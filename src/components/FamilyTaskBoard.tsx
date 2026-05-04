'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  buildTaskSummary,
  labelTaskCategory,
  labelTaskPriority,
  labelTaskStatus,
  type FamilyActionItem
} from '@/lib/family-task-engine'

export function FamilyTaskBoard({ mode = 'family' }: { mode?: 'family' | 'ops' }) {
  const [items, setItems] = useState<FamilyActionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [creating, setCreating] = useState(false)

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/family-tasks', { cache: 'no-store' })
      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '가족 할 일을 불러오지 못했습니다.')
      }

      setItems(data.items || [])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '가족 할 일을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function autoGenerate() {
    setCreating(true)
    setMessage('')

    try {
      const response = await fetch('/api/family-tasks/auto', {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '자동 생성 실패')
      }

      setMessage(`가족 할 일 후보 ${data.candidates || 0}개 중 ${data.inserted || 0}개를 새로 만들었습니다.`)
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '자동 생성 실패')
    } finally {
      setCreating(false)
    }
  }

  async function updateTask(id: string, action: 'claim' | 'complete' | 'delegate' | 'cancel') {
    setMessage('')

    let assigneeName = ''
    let memo = ''

    if (action === 'claim') {
      assigneeName = window.prompt('담당자 이름을 입력해주세요.', '나') || '나'
    }

    if (action === 'delegate') {
      assigneeName = window.prompt('넘길 가족 이름을 입력해주세요.', '') || ''
      memo = window.prompt('간단한 메모가 있으면 적어주세요.', '') || ''
    }

    if (action === 'complete') {
      memo = window.prompt('완료 메모가 있으면 적어주세요.', '') || ''
    }

    try {
      const response = await fetch('/api/family-tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          action,
          assigneeName,
          memo
        })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '상태 변경 실패')
      }

      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '상태 변경 실패')
    }
  }

  async function createManualTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const title = String(formData.get('title') || '').trim()
    const category = String(formData.get('category') || 'general')
    const priority = String(formData.get('priority') || 'normal')

    if (!title) return

    setCreating(true)
    setMessage('')

    try {
      const response = await fetch('/api/family-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, priority })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '할 일 생성 실패')
      }

      event.currentTarget.reset()
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '할 일 생성 실패')
    } finally {
      setCreating(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const summary = useMemo(() => buildTaskSummary(items), [items])
  const openItems = items.filter((item) => item.status !== 'done' && item.status !== 'cancelled')
  const doneItems = items.filter((item) => item.status === 'done')

  return (
    <div>
      <div
        className={
          'rounded-3xl p-6 ' +
          (summary.reassuranceState === '긴급'
            ? 'bg-red-50'
            : summary.reassuranceState === '확인 필요'
              ? 'bg-amber-50'
              : 'bg-emerald-50')
        }
      >
        <p className="text-sm font-black text-slate-600">가족 할 일 안심판</p>
        <div className="mt-2 text-5xl font-black">{summary.reassuranceState}</div>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <Stat label="열린 할 일" value={summary.open} />
          <Stat label="긴급" value={summary.urgent} />
          <Stat label="담당 중" value={summary.claimed} />
          <Stat label="완료" value={summary.done} />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={load}
          className="rounded-2xl bg-slate-900 px-5 py-4 font-black text-white"
        >
          새로고침
        </button>
        <button
          onClick={autoGenerate}
          disabled={creating}
          className="rounded-2xl bg-emerald-600 px-5 py-4 font-black text-white disabled:opacity-50"
        >
          {creating ? '생성 중...' : '식사·약·케어플랜에서 자동 생성'}
        </button>
      </div>

      {message ? (
        <p className="mt-5 rounded-2xl bg-blue-50 p-4 font-bold text-blue-900">
          {message}
        </p>
      ) : null}

      <form onSubmit={createManualTask} className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-black">직접 할 일 추가</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_160px_160px_auto]">
          <input
            name="title"
            className="rounded-2xl border border-slate-200 p-4 outline-none focus:border-emerald-500"
            placeholder="예: 저녁 약 복용 확인 전화하기"
          />
          <select name="category" className="rounded-2xl border border-slate-200 p-4">
            <option value="general">일반</option>
            <option value="meal">식사</option>
            <option value="medication">약</option>
            <option value="documents">서류</option>
            <option value="appointment">예약</option>
            <option value="social_support">사회공헌</option>
          </select>
          <select name="priority" className="rounded-2xl border border-slate-200 p-4">
            <option value="normal">보통</option>
            <option value="high">중요</option>
            <option value="urgent">긴급</option>
            <option value="low">낮음</option>
          </select>
          <button className="rounded-2xl bg-slate-900 px-5 py-4 font-black text-white">
            추가
          </button>
        </div>
      </form>

      <section className="mt-6">
        <h2 className="text-2xl font-black">해야 할 일</h2>

        {loading ? (
          <div className="mt-4 rounded-3xl bg-white p-8 text-center font-black shadow-sm">
            불러오는 중...
          </div>
        ) : openItems.length === 0 ? (
          <div className="mt-4 rounded-3xl bg-white p-8 text-center shadow-sm">
            <div className="text-xl font-black">열린 가족 할 일이 없습니다.</div>
            <p className="mt-2 text-slate-500">지금은 확인할 일이 없습니다.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {openItems.map((item) => (
              <TaskCard
                key={item.id}
                item={item}
                mode={mode}
                onClaim={() => updateTask(item.id, 'claim')}
                onComplete={() => updateTask(item.id, 'complete')}
                onDelegate={() => updateTask(item.id, 'delegate')}
                onCancel={() => updateTask(item.id, 'cancel')}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-black">완료된 일</h2>
        {doneItems.length === 0 ? (
          <p className="mt-3 rounded-3xl bg-white p-5 text-slate-500 shadow-sm">아직 완료된 일이 없습니다.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {doneItems.slice(0, 10).map((item) => (
              <TaskCard
                key={item.id}
                item={item}
                mode={mode}
                readonly
                onClaim={() => undefined}
                onComplete={() => undefined}
                onDelegate={() => undefined}
                onCancel={() => undefined}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function TaskCard({
  item,
  mode,
  readonly,
  onClaim,
  onComplete,
  onDelegate,
  onCancel
}: {
  item: FamilyActionItem
  mode: 'family' | 'ops'
  readonly?: boolean
  onClaim: () => void
  onComplete: () => void
  onDelegate: () => void
  onCancel: () => void
}) {
  const urgent = item.priority === 'urgent'
  const high = item.priority === 'high'

  return (
    <article
      className={
        'rounded-3xl p-5 shadow-sm ' +
        (urgent ? 'bg-red-50' : high ? 'bg-amber-50' : 'bg-white')
      }
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge text={labelTaskCategory(item.category)} />
            <Badge text={labelTaskPriority(item.priority)} />
            <Badge text={labelTaskStatus(item.status)} />
            {item.assigned_to_name ? <Badge text={`담당: ${item.assigned_to_name}`} /> : null}
          </div>

          <h3 className="mt-3 text-2xl font-black">{item.title}</h3>

          {item.description ? (
            <p className="mt-2 max-w-3xl text-base leading-7 text-slate-700">{item.description}</p>
          ) : null}

          <p className="mt-3 text-xs font-bold text-slate-500">
            생성: {new Date(item.created_at).toLocaleString('ko-KR')}
          </p>
        </div>

        {!readonly ? (
          <div className="grid min-w-[190px] gap-2">
            {item.status !== 'claimed' ? (
              <button onClick={onClaim} className="rounded-2xl bg-slate-900 px-4 py-3 font-black text-white">
                제가 할게요
              </button>
            ) : null}

            <button onClick={onComplete} className="rounded-2xl bg-emerald-600 px-4 py-3 font-black text-white">
              완료했어요
            </button>

            <button onClick={onDelegate} className="rounded-2xl bg-slate-100 px-4 py-3 font-black text-slate-900">
              다른 가족에게 넘기기
            </button>

            {mode === 'ops' ? (
              <button onClick={onCancel} className="rounded-2xl bg-red-50 px-4 py-3 font-black text-red-700">
                취소
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <div className="text-sm font-black text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-black">{value}</div>
    </div>
  )
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700">
      {text}
    </span>
  )
}
