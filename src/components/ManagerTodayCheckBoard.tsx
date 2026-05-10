'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type AnyRow = Record<string, any>

type Step = {
  code: string
  title: string
  description: string
  checkinStatus: string
  assignmentStatus: string
  timeColumn: string
}

type TodayData = {
  manager: AnyRow | null
  assignment: AnyRow | null
  steps: Step[]
  events: AnyRow[]
  completedStepCodes: string[]
  summary: {
    progress: number
    expectedFee: number
    status: string
  }
}

function formatWon(value: number) {
  return `${Number(value || 0).toLocaleString('ko-KR')}원`
}

function labelStatus(status: string) {
  const map: Record<string, string> = {
    assigned: '배정됨',
    in_progress: '진행 중',
    completed: '완료',
    no_manager: '검증 매니저 없음',
    no_assignment: '배정 없음'
  }

  return map[status] || status
}

export function ManagerTodayCheckBoard() {
  const [data, setData] = useState<TodayData | null>(null)
  const [memo, setMemo] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/manager-field-check', { cache: 'no-store' })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '현장 체크 정보를 불러오지 못했습니다.')
      }

      setData(result)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '현장 체크 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function postAction(payload: Record<string, unknown>) {
    setMessage('')

    try {
      const response = await fetch('/api/manager-field-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '처리 중 오류가 발생했습니다.')
      }

      setMessage(result.message || '처리됐습니다.')
      setMemo('')
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const manager = data?.manager || null
  const assignment = data?.assignment || null
  const steps = data?.steps || []
  const completedStepCodes = new Set(data?.completedStepCodes || [])
  const progress = data?.summary?.progress || 0

  const nextStep = useMemo(() => {
    return steps.find((step) => !completedStepCodes.has(step.code)) || null
  }, [steps, data?.completedStepCodes])

  return (
    <main className="min-h-screen bg-[#F7FCFB] px-5 py-6 text-[#24423F]">
      <section className="mx-auto max-w-4xl">
        <header className="rounded-[2rem] bg-[linear-gradient(135deg,#EAFBF6_0%,#F4FAFF_100%)] p-6 shadow-[0_16px_44px_rgba(93,139,131,0.12)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-sm font-black text-[#19A98E]">현장 체크</div>
              <h1 className="mt-2 text-4xl font-black tracking-[-0.05em] md:text-6xl">
                오늘 케어 진행
              </h1>
              <p className="mt-4 max-w-2xl text-base font-bold leading-7 text-[#607D79]">
                큰 버튼만 순서대로 누르면 보호자에게 진행 상황을 공유하고, 완료 후 정산 예정에 반영됩니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={load} className="rounded-2xl bg-white px-5 py-4 font-black text-[#426C68] ring-1 ring-[#CFE7E2]">
                새로고침
              </button>
              <Link href="/manager" className="rounded-2xl bg-[#19B99A] px-5 py-4 font-black text-white">
                매니저 홈
              </Link>
            </div>
          </div>
        </header>

        {message ? (
          <div className="mt-5 rounded-2xl bg-[#FFF5DF] p-4 font-black text-[#886B35]">
            {message}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-6 rounded-[2rem] bg-white p-8 text-center text-xl font-black ring-1 ring-[#E3EFEC]">
            불러오는 중...
          </div>
        ) : !manager ? (
          <section className="mt-6 rounded-[2rem] bg-white p-6 ring-1 ring-[#E3EFEC] shadow-[0_14px_40px_rgba(93,139,131,0.09)]">
            <h2 className="text-3xl font-black">검증 완료 매니저가 없습니다.</h2>
            <p className="mt-3 text-base font-bold leading-7 text-[#607D79]">
              먼저 매니저 간단 등록과 단계별 검증을 완료해야 현장 체크를 사용할 수 있습니다.
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <Link href="/manager/apply" className="rounded-2xl bg-[#19B99A] px-5 py-4 text-center font-black text-white">
                매니저 간단 등록
              </Link>
              <button onClick={() => postAction({ action: 'create_demo_assignment' })} className="rounded-2xl bg-[#DCEFF7] px-5 py-4 font-black text-[#365E78]">
                테스트 배정 만들기
              </button>
            </div>
          </section>
        ) : !assignment ? (
          <section className="mt-6 rounded-[2rem] bg-white p-6 ring-1 ring-[#E3EFEC] shadow-[0_14px_40px_rgba(93,139,131,0.09)]">
            <h2 className="text-3xl font-black">오늘 배정된 일이 없습니다.</h2>
            <p className="mt-3 text-base font-bold leading-7 text-[#607D79]">
              테스트를 위해 배정을 만들거나, 매니저 홈에서 새 제안을 수락하세요.
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <button onClick={() => postAction({ action: 'create_demo_assignment' })} className="rounded-2xl bg-[#19B99A] px-5 py-4 font-black text-white">
                테스트 배정 만들기
              </button>
              <Link href="/manager" className="rounded-2xl bg-white px-5 py-4 text-center font-black text-[#426C68] ring-1 ring-[#CFE7E2]">
                매니저 홈
              </Link>
            </div>
          </section>
        ) : (
          <>
            <section className="mt-6 rounded-[2rem] border border-[#E3EFEC] bg-white p-6 shadow-[0_14px_40px_rgba(93,139,131,0.09)]">
              <div className="flex flex-wrap gap-2">
                <Badge text={labelStatus(assignment.status)} />
                <Badge text={assignment.checkin_status || 'not_started'} />
                <Badge text={formatWon(assignment.expected_fee)} />
                <Badge text={`${progress}% 진행`} />
              </div>

              <h2 className="mt-4 text-3xl font-black tracking-[-0.04em]">{assignment.title}</h2>

              <p className="mt-3 text-sm font-bold leading-6 text-[#607D79]">
                부모님: {assignment.elder_name} · 만남장소: {assignment.meeting_location || '협의'} · 만남암호: {assignment.meeting_code || '2580'}
              </p>

              <div className="mt-5 h-4 overflow-hidden rounded-full bg-[#EAF7F4]">
                <div className="h-full rounded-full bg-[#19B99A]" style={{ width: `${progress}%` }} />
              </div>

              {nextStep ? (
                <div className="mt-5 rounded-2xl bg-[#F6FCFA] p-5 ring-1 ring-[#E3EFEC]">
                  <div className="text-sm font-black text-[#19A98E]">다음 행동</div>
                  <div className="mt-2 text-2xl font-black">{nextStep.title}</div>
                  <p className="mt-2 text-sm font-bold leading-6 text-[#607D79]">{nextStep.description}</p>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl bg-[#EAFBF6] p-5 font-black text-[#2F756B] ring-1 ring-[#BDE7DD]">
                  모든 현장 체크가 완료됐습니다.
                </div>
              )}
            </section>

            <section className="mt-6 rounded-[2rem] border border-[#E3EFEC] bg-white p-6 shadow-[0_14px_40px_rgba(93,139,131,0.09)]">
              <h2 className="text-2xl font-black">현장 메모</h2>
              <p className="mt-2 text-sm font-bold leading-6 text-[#607D79]">
                보호자에게 공유할 특이사항이 있으면 짧게 적어주세요.
              </p>
              <textarea
                value={memo}
                onChange={(event) => setMemo(event.target.value)}
                className="mt-4 w-full rounded-2xl border border-[#DCEBE8] bg-white p-4 font-bold outline-none focus:border-[#19B99A]"
                rows={3}
                placeholder="예: 무릎 통증이 있어 계단 대신 엘리베이터를 이용했습니다."
              />
            </section>

            <section className="mt-6 space-y-3 pb-16">
              {steps.map((step) => {
                const done = completedStepCodes.has(step.code)

                return (
                  <button
                    key={step.code}
                    onClick={() => {
                      if (done) return
                      const ok = window.confirm(`${step.title}\n\n이 단계로 체크할까요?`)
                      if (!ok) return
                      postAction({
                        action: 'check_step',
                        assignmentId: assignment.id,
                        stepCode: step.code,
                        memo
                      })
                    }}
                    disabled={done}
                    className={
                      'w-full rounded-[1.75rem] p-5 text-left ring-1 transition ' +
                      (done
                        ? 'bg-[#EAFBF6] text-[#2F756B] ring-[#BDE7DD]'
                        : 'bg-white text-[#24423F] ring-[#E3EFEC] shadow-[0_10px_30px_rgba(93,139,131,0.08)]')
                    }
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-xl font-black">{step.title}</div>
                        <p className="mt-2 text-sm font-bold leading-6 text-[#607D79]">{step.description}</p>
                      </div>
                      <div className="shrink-0 rounded-full bg-[#F4FAF9] px-4 py-2 text-sm font-black ring-1 ring-[#E2EFEC]">
                        {done ? '완료' : '체크'}
                      </div>
                    </div>
                  </button>
                )
              })}
            </section>
          </>
        )}
      </section>
    </main>
  )
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-[#F4FAF9] px-3 py-1 text-xs font-black text-[#5B7774] ring-1 ring-[#E2EFEC]">
      {text}
    </span>
  )
}
