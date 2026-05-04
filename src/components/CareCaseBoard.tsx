'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  buildCaseSummaryFromCases,
  labelCareCaseStatus,
  labelCareCaseType,
  labelCaseLinkType,
  type CareCase,
  type CareCaseLink,
  type CareCaseStatus,
  type CareCaseTimelineEvent,
  type CareCaseType
} from '@/lib/care-case-engine'

export function CareCaseBoard({ mode = 'family' }: { mode?: 'family' | 'ops' }) {
  const [cases, setCases] = useState<CareCase[]>([])
  const [links, setLinks] = useState<CareCaseLink[]>([])
  const [timeline, setTimeline] = useState<CareCaseTimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/care-cases', { cache: 'no-store' })
      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '통합 케어 케이스를 불러오지 못했습니다.')
      }

      setCases(data.cases || [])
      setLinks(data.links || [])
      setTimeline(data.timeline || [])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '통합 케어 케이스를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function createCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    const formData = new FormData(event.currentTarget)

    try {
      const response = await fetch('/api/care-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: formData.get('action') || 'create_from_latest',
          elderName: formData.get('elderName'),
          guardianName: formData.get('guardianName'),
          guardianPhone: formData.get('guardianPhone'),
          caseTitle: formData.get('caseTitle'),
          caseType: formData.get('caseType')
        })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '통합 케어 케이스 생성 실패')
      }

      setMessage(`통합 케어 케이스가 생성됐습니다. 연결된 항목: ${data.linked || 0}개`)
      event.currentTarget.reset()
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '통합 케어 케이스 생성 실패')
    }
  }

  async function updateCase(id: string, status: CareCaseStatus) {
    setMessage('')

    try {
      const response = await fetch('/api/care-cases', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '케이스 상태 변경 실패')
      }

      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '케이스 상태 변경 실패')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const summary = useMemo(() => buildCaseSummaryFromCases(cases), [cases])

  const linksByCase = useMemo(() => {
    const map = new Map<string, CareCaseLink[]>()

    for (const link of links) {
      const current = map.get(link.care_case_id) || []
      current.push(link)
      map.set(link.care_case_id, current)
    }

    return map
  }, [links])

  const timelineByCase = useMemo(() => {
    const map = new Map<string, CareCaseTimelineEvent[]>()

    for (const item of timeline) {
      const current = map.get(item.care_case_id) || []
      current.push(item)
      map.set(item.care_case_id, current)
    }

    return map
  }, [timeline])

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
        <p className="text-sm font-black text-slate-600">통합 케어 안심판</p>
        <div className="mt-2 text-5xl font-black">{summary.reassuranceState}</div>

        <div className="mt-5 grid gap-3 md:grid-cols-5">
          <Stat label="전체 케이스" value={summary.total} />
          <Stat label="진행 중" value={summary.open} />
          <Stat label="긴급" value={summary.urgent} />
          <Stat label="확인 필요" value={summary.attention} />
          <Stat label="완료" value={summary.completed} />
        </div>
      </div>

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black">가족이 볼 안내</h2>
        <div className="mt-4 space-y-3">
          {summary.familyNextActions.map((action, index) => (
            <div key={action} className="rounded-2xl bg-slate-50 p-4 text-lg font-black">
              {index + 1}. {action}
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={load} className="rounded-2xl bg-slate-900 px-5 py-4 font-black text-white">
          새로고침
        </button>
      </div>

      {message ? (
        <p className="mt-5 rounded-2xl bg-blue-50 p-4 font-bold text-blue-900">
          {message}
        </p>
      ) : null}

      {mode === 'ops' ? (
        <form onSubmit={createCase} className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black">통합 케어 케이스 만들기</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            최근 걱정 접수, 사진 접수, 케어패스포트, 식사, 약, 서류, 매니저, 비용승인, 30초 요약을 하나의 케이스로 묶습니다.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <input
              name="elderName"
              className="rounded-2xl border border-slate-200 p-4"
              placeholder="부모님"
              defaultValue="어머니"
            />
            <input
              name="guardianName"
              className="rounded-2xl border border-slate-200 p-4"
              placeholder="보호자 이름"
            />
            <input
              name="guardianPhone"
              className="rounded-2xl border border-slate-200 p-4"
              placeholder="010-1234-5678"
            />
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_220px_220px]">
            <input
              name="caseTitle"
              className="rounded-2xl border border-slate-200 p-4"
              placeholder="예: 어머니 5월 정형외과 케어"
              defaultValue="어머니 통합 케어 케이스"
            />
            <select name="caseType" className="rounded-2xl border border-slate-200 p-4">
              <option value="parent_care">부모님 통합 케어</option>
              <option value="hospital_day">병원 가는 날</option>
              <option value="meal_care">식사 케어</option>
              <option value="discharge">퇴원 후 케어</option>
              <option value="documents">서류·영수증</option>
              <option value="social_support">사회공헌 연결</option>
              <option value="custom">직접 만들기</option>
            </select>
            <select name="action" className="rounded-2xl border border-slate-200 p-4">
              <option value="create_from_latest">최근 데이터 자동 연결</option>
              <option value="create_empty">빈 케이스 만들기</option>
            </select>
          </div>

          <button className="mt-4 w-full rounded-3xl bg-emerald-600 px-6 py-5 text-xl font-black text-white">
            통합 케어 케이스 만들기
          </button>
        </form>
      ) : null}

      <section className="mt-8 space-y-5">
        {loading ? (
          <div className="rounded-3xl bg-white p-8 text-center font-black shadow-sm">
            불러오는 중...
          </div>
        ) : cases.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <div className="text-xl font-black">아직 통합 케어 케이스가 없습니다.</div>
            {mode === 'ops' ? (
              <p className="mt-2 text-slate-500">위에서 케이스를 만들어보세요.</p>
            ) : (
              <p className="mt-2 text-slate-500">운영실이 케이스를 만들면 여기에서 확인할 수 있습니다.</p>
            )}
          </div>
        ) : (
          cases.map((caseItem) => {
            const caseLinks = linksByCase.get(caseItem.id) || []
            const caseTimeline = timelineByCase.get(caseItem.id) || []

            return (
              <article key={caseItem.id} className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge text={labelCareCaseType(caseItem.case_type)} />
                      <Badge text={labelCareCaseStatus(caseItem.status)} />
                      <Badge text={caseItem.reassurance_state} />
                      <Badge text={caseItem.priority} />
                    </div>

                    <h3 className="mt-3 text-3xl font-black">{caseItem.case_title}</h3>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {caseItem.elder_name} · {caseItem.guardian_name || '보호자 미입력'} · {caseItem.guardian_phone || '연락처 미입력'}
                    </p>

                    {caseItem.summary_text ? (
                      <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-base leading-7 text-slate-700">
                        {caseItem.summary_text}
                      </p>
                    ) : null}

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <InfoBox title="가족 할 일" items={caseItem.family_next_actions || []} />
                      <InfoBox title="중요 메모" items={caseItem.important_notes || []} />
                    </div>
                  </div>

                  <div className="grid min-w-[180px] gap-2">
                    {mode === 'ops' ? (
                      <>
                        <button
                          onClick={() => updateCase(caseItem.id, 'waiting_family')}
                          className="rounded-2xl bg-amber-100 px-4 py-3 font-black text-amber-900"
                        >
                          가족 확인 대기
                        </button>
                        <button
                          onClick={() => updateCase(caseItem.id, 'in_progress')}
                          className="rounded-2xl bg-slate-100 px-4 py-3 font-black"
                        >
                          처리 중
                        </button>
                        <button
                          onClick={() => updateCase(caseItem.id, 'completed')}
                          className="rounded-2xl bg-emerald-600 px-4 py-3 font-black text-white"
                        >
                          완료
                        </button>
                        <button
                          onClick={() => updateCase(caseItem.id, 'archived')}
                          className="rounded-2xl bg-slate-900 px-4 py-3 font-black text-white"
                        >
                          보관
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => updateCase(caseItem.id, 'completed')}
                        className="rounded-2xl bg-emerald-600 px-4 py-3 font-black text-white"
                      >
                        확인했어요
                      </button>
                    )}
                  </div>
                </div>

                <section className="mt-6 rounded-3xl bg-slate-50 p-5">
                  <h4 className="text-xl font-black">연결된 케어 항목</h4>

                  {caseLinks.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500">아직 연결된 항목이 없습니다.</p>
                  ) : (
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {caseLinks.map((link) => (
                        <div key={link.id} className="rounded-2xl bg-white p-4">
                          <div className="flex flex-wrap gap-2">
                            <Badge text={labelCaseLinkType(link.link_type)} />
                            {link.source_status ? <Badge text={link.source_status} /> : null}
                          </div>
                          <div className="mt-3 font-black">{link.source_label}</div>
                          {link.source_url ? (
                            <Link href={link.source_url} className="mt-2 inline-block text-sm font-black text-emerald-700">
                              연결 화면 보기
                            </Link>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="mt-6 rounded-3xl bg-slate-900 p-5 text-white">
                  <h4 className="text-xl font-black">통합 타임라인</h4>

                  {caseTimeline.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-300">아직 타임라인이 없습니다.</p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {caseTimeline.slice(0, 10).map((event) => (
                        <div key={event.id} className="rounded-2xl bg-white/10 p-4">
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black">
                              {event.severity}
                            </span>
                            {event.event_status ? (
                              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black">
                                {event.event_status}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-2 font-black">{event.title}</div>
                          {event.description ? (
                            <p className="mt-1 text-sm leading-6 text-slate-200">{event.description}</p>
                          ) : null}
                          <p className="mt-2 text-xs text-slate-400">
                            {new Date(event.occurred_at).toLocaleString('ko-KR')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </article>
            )
          })
        )}
      </section>
    </div>
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
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
      {text}
    </span>
  )
}

function InfoBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <h4 className="font-black">{title}</h4>
      <div className="mt-2 space-y-1">
        {items.length > 0 ? (
          items.map((item) => (
            <p key={item} className="text-sm leading-6 text-slate-700">
              • {item}
            </p>
          ))
        ) : (
          <p className="text-sm text-slate-500">없음</p>
        )}
      </div>
    </div>
  )
}
