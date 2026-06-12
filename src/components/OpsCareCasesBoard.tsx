'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type CareCase = Record<string, any>
type Task = Record<string, any>
type MatchingRequest = Record<string, any>

function typeLabel(type: string) {
  const map: Record<string, string> = {
    hospital_visit: '병원동행',
    meal_check: '식사 확인',
    medication_check: '복약 확인',
    discharge_check: '퇴원 후 케어',
    document_pickup: '서류 챙김',
    wellbeing_check: '안부 확인'
  }

  return map[type] || type
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString('ko-KR')
  } catch {
    return value
  }
}

export function OpsCareCasesBoard() {
  const [cases, setCases] = useState<CareCase[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [matchingRequests, setMatchingRequests] = useState<MatchingRequest[]>([])
  const [summary, setSummary] = useState({
    total: 0,
    created: 0,
    inProgress: 0,
    completed: 0,
    matchingRequests: 0
  })
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/ops/care-cases', { cache: 'no-store' })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '케어 케이스를 불러오지 못했습니다.')
      }

      setCases(result.cases || [])
      setTasks(result.tasks || [])
      setMatchingRequests(result.matchingRequests || [])
      setSummary(result.summary)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '케어 케이스를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const tasksByCase = useMemo(() => {
    const map = new Map<string, Task[]>()

    for (const task of tasks) {
      const list = map.get(task.care_case_id) || []
      list.push(task)
      map.set(task.care_case_id, list)
    }

    return map
  }, [tasks])

  const matchingById = useMemo(() => {
    const map = new Map<string, MatchingRequest>()
    for (const request of matchingRequests) map.set(request.id, request)
    return map
  }, [matchingRequests])

  return (
    <main className="min-h-screen bg-[#F7FCFB] px-5 py-8 text-[#24423F]">
      <section className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-black text-[#19A98E]">운영실</div>
            <h1 className="mt-2 text-4xl font-black tracking-[-0.05em] md:text-6xl">
              케어 케이스
            </h1>
            <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#607D79]">
              접수함에서 정리된 부모님 걱정이 실제 케어 케이스와 매칭 요청으로 생성되는지 확인합니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={load}
              className="rounded-2xl bg-[#DCEFF7] px-5 py-4 font-black text-[#365E78] ring-1 ring-[#C2DDEA]"
            >
              새로고침
            </button>
            <Link
              href="/admin/ops/intake-inbox"
              className="rounded-2xl bg-[#19B99A] px-5 py-4 font-black text-white"
            >
              접수함으로
            </Link>
            <Link
              href="/admin/ops/manager-offers"
              className="rounded-2xl bg-white px-5 py-4 font-black text-[#426C68] ring-1 ring-[#CFE7E2]"
            >
              매니저 알림
            </Link>
          </div>
        </header>

        <section className="rounded-[2rem] border border-[#D5EEE8] bg-[#EAFBF6] p-6 shadow-[0_16px_44px_rgba(93,139,131,0.10)]">
          <div className="text-sm font-black text-[#3F706B]">케어 케이스 안심판</div>
          <h2 className="mt-2 text-5xl font-black tracking-[-0.04em]">
            {summary.total > 0 ? '운영 중' : '대기'}
          </h2>

          <div className="mt-6 grid gap-3 md:grid-cols-5">
            <Stat label="전체 케이스" value={summary.total} />
            <Stat label="생성됨" value={summary.created} />
            <Stat label="진행 중" value={summary.inProgress} />
            <Stat label="완료" value={summary.completed} />
            <Stat label="매칭 요청" value={summary.matchingRequests} />
          </div>
        </section>

        {message ? (
          <p className="mt-6 rounded-2xl bg-[#FFF5DF] p-4 font-black text-[#886B35]">
            {message}
          </p>
        ) : null}

        <section className="mt-8 space-y-5">
          {loading ? (
            <div className="rounded-[2rem] bg-white p-8 text-center text-xl font-black shadow-[0_12px_34px_rgba(93,139,131,0.08)]">
              케어 케이스를 불러오는 중...
            </div>
          ) : cases.length === 0 ? (
            <div className="rounded-[2rem] bg-white p-10 text-center shadow-[0_12px_34px_rgba(93,139,131,0.08)]">
              <h3 className="text-2xl font-black">아직 생성된 케어 케이스가 없습니다.</h3>
              <p className="mt-3 text-sm font-bold text-[#607D79]">
                /ops/intake-inbox에서 “케어 요청으로 정리”를 눌러보세요.
              </p>
            </div>
          ) : (
            cases.map((careCase) => {
              const caseTasks = tasksByCase.get(careCase.id) || []
              const matching = careCase.matching_request_id ? matchingById.get(careCase.matching_request_id) : null

              return (
                <article
                  key={careCase.id}
                  className="rounded-[2rem] border border-[#E3EFEC] bg-white p-6 shadow-[0_14px_40px_rgba(93,139,131,0.09)]"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Badge text={typeLabel(careCase.care_case_type)} />
                        <Badge text={careCase.case_status} />
                        <Badge text={careCase.priority} />
                        {matching ? <Badge text="매칭 요청 생성됨" /> : null}
                      </div>

                      <h3 className="mt-4 text-3xl font-black tracking-[-0.03em]">
                        {careCase.case_title}
                      </h3>

                      <p className="mt-3 text-sm font-bold leading-6 text-[#607D79]">
                        부모님: {careCase.elder_name} · 보호자: {careCase.guardian_name || '미입력'} · 연락처: {careCase.guardian_phone || '미입력'}
                      </p>

                      <p className="mt-2 text-xs font-bold text-[#8AA29E]">
                        생성일: {formatDate(careCase.created_at)}
                      </p>

                      {careCase.recommended_next_action ? (
                        <div className="mt-5 rounded-2xl bg-[#F6FCFA] p-5 text-base font-bold leading-8 text-[#385A56]">
                          다음 액션: {careCase.recommended_next_action}
                        </div>
                      ) : null}
                    </div>

                    <div className="grid min-w-[210px] gap-2">
                      {matching ? (
                        <Link
                          href="/admin/ops/manager-offers"
                          className="rounded-2xl bg-[#19B99A] px-5 py-4 text-center font-black text-white"
                        >
                          매니저 알림 보내기
                        </Link>
                      ) : null}

                      <Link
                        href="/admin/ops/intake-inbox"
                        className="rounded-2xl bg-white px-5 py-4 text-center font-black text-[#426C68] ring-1 ring-[#CFE7E2]"
                      >
                        접수함 확인
                      </Link>
                    </div>
                  </div>

                  <section className="mt-6 rounded-[1.5rem] bg-[#F6FCFA] p-5 ring-1 ring-[#E3EFEC]">
                    <h4 className="text-xl font-black">운영실 할 일</h4>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {caseTasks.length === 0 ? (
                        <p className="text-sm font-bold text-[#607D79]">등록된 할 일이 없습니다.</p>
                      ) : (
                        caseTasks.map((task) => (
                          <div key={task.id} className="rounded-2xl bg-white p-4 ring-1 ring-[#E3EFEC]">
                            <div className="flex flex-wrap gap-2">
                              <Badge text={task.assigned_to_role} />
                              <Badge text={task.task_status} />
                            </div>
                            <div className="mt-3 text-lg font-black">{task.task_title}</div>
                            <p className="mt-2 text-sm font-bold leading-6 text-[#607D79]">
                              {task.task_description}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                </article>
              )
            })
          )}
        </section>
      </section>
    </main>
  )
}

function Stat({ label, value }: { label: string | number; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <div className="text-sm font-black text-[#718A87]">{label}</div>
      <div className="mt-1 text-3xl font-black">{value}</div>
    </div>
  )
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-[#F4FAF9] px-3 py-1 text-xs font-black text-[#5B7774] ring-1 ring-[#E2EFEC]">
      {text}
    </span>
  )
}
