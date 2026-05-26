'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type CareAssignment = {
  id: string
  family_code?: string | null
  partner_name?: string | null
  partner_phone?: string | null
  partner_region?: string | null
  task_type?: string | null
  task_title?: string | null
  task_description?: string | null
  scheduled_at?: string | null
  assignment_status?: string | null
  report_summary?: string | null
  created_at?: string | null
}

const statusLabels: Record<string, string> = {
  assigned: '배정됨',
  confirmed: '확정',
  in_progress: '진행 중',
  completed: '완료',
  cancelled: '취소',
  hold: '보류'
}

export function ChildAssignmentsPanel() {
  const [assignments, setAssignments] = useState<CareAssignment[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/care-assignments', { cache: 'no-store' })
      const data = await response.json() as { ok?: boolean; assignments?: CareAssignment[]; message?: string }

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '배정 목록을 불러오지 못했습니다.')
      }

      setAssignments(data.assignments || [])
      if (data.message) setMessage(data.message)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '배정 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <section className="mx-auto max-w-6xl px-5 py-8 text-[#173B36]">
      <div className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:p-8">
        <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
          보호자 배정 현황
        </div>

        <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
          배정된 케어파트너를
          <br />
          한눈에 확인하세요.
        </h1>

        <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#637B76] sm:text-lg sm:leading-8">
          운영실이 승인된 케어파트너를 배정하면 보호자는 예정 시간, 업무 내용, 진행 상태, 완료 리포트를 확인할 수 있습니다.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={load} className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white">
            새로고침
          </button>
          <Link href="/care-request" className="rounded-2xl bg-[#20C5A8] px-5 py-4 text-sm font-black text-white">
            케어 요청하기
          </Link>
        </div>
      </div>

      {message ? (
        <div className="mt-5 rounded-2xl bg-[#FFF8E8] p-4 text-sm font-black leading-7 text-[#795313] ring-1 ring-[#F4D8A5]">
          {message}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-5 rounded-[2rem] bg-white p-6 text-center font-black shadow-sm ring-1 ring-[#D8EEE8]">
          불러오는 중...
        </div>
      ) : null}

      <div className="mt-5 grid gap-4">
        {!loading && assignments.length === 0 ? (
          <div className="rounded-[2rem] bg-white p-6 text-sm font-black leading-7 text-[#637B76] shadow-sm ring-1 ring-[#D8EEE8]">
            아직 배정된 케어파트너가 없습니다. 부모님 연결 후 운영실에 케어 요청을 남겨주세요.
          </div>
        ) : null}

        {assignments.map((assignment) => (
          <article key={assignment.id} className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
            <div className="flex flex-wrap gap-2">
              <Badge text={statusLabels[assignment.assignment_status || 'assigned'] || assignment.assignment_status || '배정됨'} />
              <Badge text={assignment.task_type || '생활확인'} />
            </div>

            <h2 className="mt-4 text-2xl font-black tracking-[-0.05em]">
              {assignment.task_title}
            </h2>

            <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
              케어파트너: {assignment.partner_name || '-'} · 활동지역: {assignment.partner_region || '-'}
            </p>

            {assignment.scheduled_at ? (
              <p className="mt-1 text-sm font-bold text-[#637B76]">
                예정 시간: {new Date(assignment.scheduled_at).toLocaleString('ko-KR')}
              </p>
            ) : null}

            {assignment.task_description ? (
              <p className="mt-3 rounded-2xl bg-[#F8FCFB] p-4 text-sm font-bold leading-7 text-[#5F7772] ring-1 ring-[#D8EEE8]">
                {assignment.task_description}
              </p>
            ) : null}

            {assignment.report_summary ? (
              <p className="mt-3 rounded-2xl bg-[#EFFFF9] p-4 text-sm font-bold leading-7 text-[#116D5F] ring-1 ring-[#CDEFE5]">
                완료 리포트: {assignment.report_summary}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-[#EFFFF9] px-3 py-1 text-xs font-black text-[#116D5F] ring-1 ring-[#CDEFE5]">
      {text}
    </span>
  )
}
