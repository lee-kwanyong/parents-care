'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  buildCommunicationSummary,
  contactTypeOptions,
  labelChannel,
  labelContactStatus,
  labelContactType,
  type Care30SecSummary,
  type CareContactTask,
  type CareContactTemplate,
  type ContactStatus,
  type ContactType,
  type ReassuranceState,
  type SummaryStatus
} from '@/lib/communication-care-engine'

export function CommunicationCareBoard({ mode = 'family' }: { mode?: 'family' | 'ops' }) {
  const [tasks, setTasks] = useState<CareContactTask[]>([])
  const [summaries, setSummaries] = useState<Care30SecSummary[]>([])
  const [templates, setTemplates] = useState<CareContactTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/communication-care', { cache: 'no-store' })
      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '연락/요약 정보를 불러오지 못했습니다.')
      }

      setTasks(data.tasks || [])
      setSummaries(data.summaries || [])
      setTemplates(data.templates || [])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '연락/요약 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    const formData = new FormData(event.currentTarget)

    try {
      const response = await fetch('/api/communication-care', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_contact_task',
          elderName: formData.get('elderName'),
          guardianName: formData.get('guardianName'),
          guardianPhone: formData.get('guardianPhone'),
          contactType: formData.get('contactType'),
          channel: formData.get('channel'),
          audience: formData.get('audience'),
          priority: formData.get('priority'),
          memo: formData.get('memo')
        })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '연락 작업 생성 실패')
      }

      setMessage('연락 작업이 만들어졌습니다.')
      event.currentTarget.reset()
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '연락 작업 생성 실패')
    }
  }

  async function createSummary(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    const formData = new FormData(event.currentTarget)

    try {
      const response = await fetch('/api/communication-care', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_summary',
          elderName: formData.get('elderName'),
          reassuranceState: formData.get('reassuranceState'),
          memo: formData.get('memo'),
          familyNextActions: String(formData.get('familyNextActions') || '')
            .split('\n')
            .map((item) => item.trim())
            .filter(Boolean),
          importantNotes: String(formData.get('importantNotes') || '')
            .split('\n')
            .map((item) => item.trim())
            .filter(Boolean)
        })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '30초 요약 생성 실패')
      }

      setMessage('30초 요약이 만들어졌습니다.')
      event.currentTarget.reset()
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '30초 요약 생성 실패')
    }
  }

  async function updateTask(id: string, status: ContactStatus) {
    setMessage('')

    try {
      const response = await fetch('/api/communication-care', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'task', id, status })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '연락 상태 변경 실패')
      }

      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '연락 상태 변경 실패')
    }
  }

  async function updateSummary(id: string, status: SummaryStatus) {
    setMessage('')

    try {
      const response = await fetch('/api/communication-care', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'summary', id, status })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '요약 상태 변경 실패')
      }

      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '요약 상태 변경 실패')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const summary = useMemo(() => buildCommunicationSummary(tasks, summaries), [tasks, summaries])

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
        <p className="text-sm font-black text-[#63807C]">연락·요약 안심판</p>
        <div className="mt-2 text-5xl font-black">{summary.reassuranceState}</div>

        <div className="mt-5 grid gap-3 md:grid-cols-5">
          <Stat label="연락 작업" value={summary.taskTotal} />
          <Stat label="열린 연락" value={summary.openTaskTotal} />
          <Stat label="재연락" value={summary.retryTaskTotal} />
          <Stat label="요약" value={summary.summaryTotal} />
          <Stat label="확인할 요약" value={summary.readySummaryTotal} />
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
        <button onClick={load} className="rounded-2xl bg-[#5F7C92] px-5 py-4 font-black text-[#2E504D]">
          새로고침
        </button>
      </div>

      {message ? (
        <p className="mt-5 rounded-2xl bg-blue-50 p-4 font-bold text-blue-900">
          {message}
        </p>
      ) : null}

      {mode === 'ops' ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <form onSubmit={createTask} className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">연락 작업 만들기</h2>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <input name="elderName" className="rounded-2xl border border-[#E0EFEC] p-4" placeholder="부모님 성함" defaultValue="어머니" />
              <input name="guardianName" className="rounded-2xl border border-[#E0EFEC] p-4" placeholder="보호자 이름" />
              <input name="guardianPhone" className="rounded-2xl border border-[#E0EFEC] p-4" placeholder="010-1234-5678" />
              <select name="contactType" className="rounded-2xl border border-[#E0EFEC] p-4">
                {contactTypeOptions.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select name="channel" className="rounded-2xl border border-[#E0EFEC] p-4">
                <option value="phone">전화</option>
                <option value="kakao">카톡</option>
                <option value="app">앱</option>
                <option value="sms">문자</option>
              </select>
              <select name="audience" className="rounded-2xl border border-[#E0EFEC] p-4">
                <option value="guardian">보호자</option>
                <option value="parent">부모님</option>
                <option value="manager">매니저</option>
                <option value="ops">운영실</option>
              </select>
              <select name="priority" className="rounded-2xl border border-[#E0EFEC] p-4">
                <option value="normal">보통</option>
                <option value="high">중요</option>
                <option value="urgent">긴급</option>
                <option value="low">낮음</option>
              </select>
            </div>

            <textarea
              name="memo"
              rows={4}
              className="mt-4 w-full rounded-2xl border border-[#E0EFEC] p-4"
              placeholder="예: 내일 병원동행 전 부모님께 담당자와 만남 암호를 안내해주세요."
            />

            <button className="mt-4 w-full rounded-3xl bg-[#8CCFC3] px-6 py-5 text-xl font-black text-[#2E504D]">
              연락 작업 만들기
            </button>
          </form>

          <form onSubmit={createSummary} className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">30초 요약 만들기</h2>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <input name="elderName" className="rounded-2xl border border-[#E0EFEC] p-4" placeholder="부모님 성함" defaultValue="어머니" />
              <select name="reassuranceState" className="rounded-2xl border border-[#E0EFEC] p-4">
                <option value="안심">안심</option>
                <option value="확인 필요">확인 필요</option>
                <option value="긴급">긴급</option>
              </select>
            </div>

            <textarea
              name="memo"
              rows={4}
              className="mt-4 w-full rounded-2xl border border-[#E0EFEC] p-4"
              placeholder="예: 오늘 진료는 잘 끝났고, 약이 추가되었습니다. 가족은 저녁 약 복용 여부와 다음 예약을 확인하면 됩니다."
            />

            <textarea
              name="familyNextActions"
              rows={3}
              className="mt-4 w-full rounded-2xl border border-[#E0EFEC] p-4"
              placeholder={"가족 할 일\n예: 저녁 약 복용 확인\n예: 다음 예약 날짜 확인"}
            />

            <textarea
              name="importantNotes"
              rows={3}
              className="mt-4 w-full rounded-2xl border border-[#E0EFEC] p-4"
              placeholder={"중요 메모\n예: 알러지 확인 필요\n예: 무릎 통증 지속"}
            />

            <button className="mt-4 w-full rounded-3xl bg-[#5F7C92] px-6 py-5 text-xl font-black text-[#2E504D]">
              30초 요약 만들기
            </button>
          </form>
        </div>
      ) : null}

      <section className="mt-8">
        <h2 className="text-2xl font-black">30초 요약</h2>

        {loading ? (
          <div className="mt-4 rounded-3xl bg-white p-8 text-center font-black shadow-sm">
            불러오는 중...
          </div>
        ) : summaries.length === 0 ? (
          <div className="mt-4 rounded-3xl bg-white p-8 text-center shadow-sm">
            <div className="text-xl font-black">아직 30초 요약이 없습니다.</div>
            <p className="mt-2 text-[#7A9692]">운영실에서 요약을 만들어보세요.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {summaries.map((item) => (
              <article
                key={item.id}
                className={
                  'rounded-3xl p-5 shadow-sm ' +
                  (item.reassurance_state === '긴급'
                    ? 'bg-red-50'
                    : item.reassurance_state === '확인 필요'
                      ? 'bg-amber-50'
                      : 'bg-emerald-50')
                }
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge text={item.reassurance_state} />
                      <Badge text={item.status} />
                      <Badge text={item.source_type} />
                    </div>

                    <h3 className="mt-3 text-2xl font-black">{item.summary_title}</h3>
                    <p className="mt-3 text-lg leading-8 text-[#4E6D69]">{item.summary_text}</p>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <InfoBox title="가족이 할 일" items={item.family_next_actions} />
                      <InfoBox title="중요 메모" items={item.important_notes} />
                    </div>
                  </div>

                  <div className="grid min-w-[160px] gap-2">
                    {mode === 'ops' ? (
                      <>
                        <button onClick={() => updateSummary(item.id, 'sent')} className="rounded-2xl bg-[#8CCFC3] px-4 py-3 font-black text-[#2E504D]">
                          가족에게 보냄
                        </button>
                        <button onClick={() => updateSummary(item.id, 'archived')} className="rounded-2xl bg-slate-100 px-4 py-3 font-black">
                          보관
                        </button>
                      </>
                    ) : (
                      <button onClick={() => updateSummary(item.id, 'read')} className="rounded-2xl bg-[#8CCFC3] px-4 py-3 font-black text-[#2E504D]">
                        확인했어요
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-black">연락 작업</h2>

        {tasks.length === 0 ? (
          <div className="mt-4 rounded-3xl bg-white p-8 text-center shadow-sm">
            <div className="text-xl font-black">아직 연락 작업이 없습니다.</div>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {tasks.map((task) => (
              <article key={task.id} className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge text={labelContactType(task.contact_type)} />
                      <Badge text={labelChannel(task.channel)} />
                      <Badge text={labelContactStatus(task.status)} />
                      <Badge text={task.priority} />
                    </div>
                    <h3 className="mt-3 text-2xl font-black">{task.title}</h3>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#4E6D69]">{task.script}</p>
                    <p className="mt-3 text-xs font-bold text-[#7A9692]">
                      보호자: {task.guardian_name || '미입력'} · {task.guardian_phone || '미입력'}
                    </p>
                  </div>

                  {mode === 'ops' ? (
                    <div className="grid min-w-[170px] gap-2">
                      <button onClick={() => updateTask(task.id, 'scheduled')} className="rounded-2xl bg-slate-100 px-4 py-3 font-black">
                        예약됨
                      </button>
                      <button onClick={() => updateTask(task.id, 'completed')} className="rounded-2xl bg-[#8CCFC3] px-4 py-3 font-black text-[#2E504D]">
                        연락 완료
                      </button>
                      <button onClick={() => updateTask(task.id, 'no_answer')} className="rounded-2xl bg-amber-100 px-4 py-3 font-black text-amber-900">
                        부재중
                      </button>
                      <button onClick={() => updateTask(task.id, 'retry_needed')} className="rounded-2xl bg-blue-50 px-4 py-3 font-black text-blue-900">
                        재연락
                      </button>
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {mode === 'ops' && templates.length > 0 ? (
        <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black">운영실 연락 템플릿</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {templates.map((template) => (
              <div key={template.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="font-black">{template.title}</div>
                <p className="mt-2 text-sm leading-6 text-[#63807C]">{template.easy_summary}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <div className="text-sm font-black text-[#7A9692]">{label}</div>
      <div className="mt-1 text-3xl font-black">{value}</div>
    </div>
  )
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#4E6D69]">
      {text}
    </span>
  )
}

function InfoBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl bg-white/70 p-4">
      <h4 className="font-black">{title}</h4>
      <div className="mt-2 space-y-1">
        {items.length > 0 ? (
          items.map((item) => (
            <p key={item} className="text-sm leading-6 text-[#4E6D69]">
              • {item}
            </p>
          ))
        ) : (
          <p className="text-sm text-[#7A9692]">없음</p>
        )}
      </div>
    </div>
  )
}
