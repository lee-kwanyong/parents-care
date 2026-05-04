'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  assignmentTypeOptions,
  labelAssignmentType,
  labelManagerStatus,
  labelTransportMode,
  managerStatusFlow,
  transportModeOptions,
  type ManagerAssignmentStatus,
  type ManagerFieldAssignment,
  type ManagerFieldChecklistItem,
  type ManagerProgressEvent
} from '@/lib/manager-field-engine'

type ReportDraft = {
  id: string
  assignment_id: string
  visit_summary: string | null
  doctor_guidance: string | null
  medication_summary: string | null
  document_summary: string | null
  meal_condition_summary: string | null
  parent_condition: string | null
  family_next_actions: string[]
  reassurance_state: string
  status: string
  created_at: string
}

export function ManagerFieldConsole({ mode = 'manager' }: { mode?: 'manager' | 'ops' }) {
  const [assignments, setAssignments] = useState<ManagerFieldAssignment[]>([])
  const [checklist, setChecklist] = useState<ManagerFieldChecklistItem[]>([])
  const [events, setEvents] = useState<ManagerProgressEvent[]>([])
  const [reports, setReports] = useState<ReportDraft[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/manager-field', { cache: 'no-store' })
      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '매니저 현장 정보를 불러오지 못했습니다.')
      }

      setAssignments(data.assignments || [])
      setChecklist(data.checklist || [])
      setEvents(data.events || [])
      setReports(data.reports || [])

      if (!selectedId && data.assignments?.[0]) {
        setSelectedId(data.assignments[0].id)
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '매니저 현장 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function createAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    const formData = new FormData(event.currentTarget)

    try {
      const response = await fetch('/api/manager-field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_assignment',
          elderName: formData.get('elderName'),
          managerName: formData.get('managerName'),
          managerPhone: formData.get('managerPhone'),
          title: formData.get('title'),
          assignmentType: formData.get('assignmentType'),
          appointmentDate: formData.get('appointmentDate'),
          appointmentTime: formData.get('appointmentTime'),
          meetingLocation: formData.get('meetingLocation'),
          meetingCode: formData.get('meetingCode'),
          transportMode: formData.get('transportMode'),
          vehicleOwned: formData.get('vehicleOwned') === 'on',
          guardianQuestions: String(formData.get('guardianQuestions') || '')
            .split('\n')
            .map((item) => item.trim())
            .filter(Boolean),
          requiredDocuments: String(formData.get('requiredDocuments') || '')
            .split('\n')
            .map((item) => item.trim())
            .filter(Boolean),
          opsMemo: formData.get('opsMemo')
        })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '배정 생성 실패')
      }

      setMessage('매니저 현장 배정이 만들어졌습니다.')
      event.currentTarget.reset()
      setSelectedId(data.assignment.id)
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '배정 생성 실패')
    }
  }

  async function updateAssignment(id: string, status: ManagerAssignmentStatus) {
    setMessage('')

    try {
      const response = await fetch('/api/manager-field', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'assignment',
          id,
          status,
          transportPolicyAcknowledged: true
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

  async function updateChecklist(item: ManagerFieldChecklistItem, status: 'done' | 'issue' | 'skipped') {
    setMessage('')

    const issueNote = status === 'issue' ? window.prompt('이슈 내용을 적어주세요.', '') || '' : ''

    try {
      const response = await fetch('/api/manager-field', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'checklist',
          id: item.id,
          assignmentId: item.assignment_id,
          status,
          issueNote
        })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '체크리스트 변경 실패')
      }

      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '체크리스트 변경 실패')
    }
  }

  async function createReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    const formData = new FormData(event.currentTarget)
    const assignmentId = String(formData.get('assignmentId') || '')

    if (!assignmentId) {
      setMessage('배정을 먼저 선택해주세요.')
      return
    }

    try {
      const response = await fetch('/api/manager-field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_report_draft',
          assignmentId,
          reassuranceState: formData.get('reassuranceState'),
          visitSummary: formData.get('visitSummary'),
          doctorGuidance: formData.get('doctorGuidance'),
          medicationSummary: formData.get('medicationSummary'),
          documentSummary: formData.get('documentSummary'),
          mealConditionSummary: formData.get('mealConditionSummary'),
          parentCondition: formData.get('parentCondition'),
          familyNextActions: String(formData.get('familyNextActions') || '')
            .split('\n')
            .map((item) => item.trim())
            .filter(Boolean)
        })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '리포트 초안 저장 실패')
      }

      setMessage('보호자 리포트 초안이 저장됐습니다.')
      event.currentTarget.reset()
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '리포트 초안 저장 실패')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const selected = useMemo(() => {
    return assignments.find((assignment) => assignment.id === selectedId) || assignments[0] || null
  }, [assignments, selectedId])

  const selectedChecklist = useMemo(() => {
    if (!selected) return []
    return checklist.filter((item) => item.assignment_id === selected.id).sort((a, b) => a.sort_order - b.sort_order)
  }, [checklist, selected])

  const selectedEvents = useMemo(() => {
    if (!selected) return []
    return events.filter((event) => event.assignment_id === selected.id)
  }, [events, selected])

  const selectedReports = useMemo(() => {
    if (!selected) return []
    return reports.filter((report) => report.assignment_id === selected.id)
  }, [reports, selected])

  const checklistSummary = useMemo(() => {
    return {
      total: selectedChecklist.length,
      done: selectedChecklist.filter((item) => item.status === 'done').length,
      issue: selectedChecklist.filter((item) => item.status === 'issue').length,
      pending: selectedChecklist.filter((item) => item.status === 'pending').length
    }
  }, [selectedChecklist])

  return (
    <div>
      <div
        className={
          'rounded-3xl p-6 ' +
          (checklistSummary.issue > 0 || selected?.status === 'issue'
            ? 'bg-red-50'
            : selected?.status === 'completed'
              ? 'bg-emerald-50'
              : 'bg-amber-50')
        }
      >
        <p className="text-sm font-black text-slate-600">매니저 현장 안심판</p>
        <div className="mt-2 text-5xl font-black">
          {checklistSummary.issue > 0 || selected?.status === 'issue'
            ? '긴급'
            : selected?.status === 'completed'
              ? '안심'
              : '확인 필요'}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <Stat label="배정" value={assignments.length} />
          <Stat label="체크 완료" value={checklistSummary.done} />
          <Stat label="대기" value={checklistSummary.pending} />
          <Stat label="이슈" value={checklistSummary.issue} />
        </div>
      </div>

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
        <form onSubmit={createAssignment} className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black">매니저 현장 배정 만들기</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <input name="elderName" className="rounded-2xl border border-slate-200 p-4" placeholder="부모님" defaultValue="어머니" />
            <input name="managerName" className="rounded-2xl border border-slate-200 p-4" placeholder="매니저 이름" defaultValue="김OO 매니저" />
            <input name="managerPhone" className="rounded-2xl border border-slate-200 p-4" placeholder="매니저 연락처" />
            <input name="title" className="rounded-2xl border border-slate-200 p-4" placeholder="예: 정형외과 병원동행" defaultValue="병원동행 현장 케어" />
            <input name="appointmentDate" className="rounded-2xl border border-slate-200 p-4" type="date" />
            <input name="appointmentTime" className="rounded-2xl border border-slate-200 p-4" placeholder="예: 오전 9시" />
            <input name="meetingLocation" className="rounded-2xl border border-slate-200 p-4" placeholder="예: 병원 정문" />
            <input name="meetingCode" className="rounded-2xl border border-slate-200 p-4" placeholder="2580" defaultValue="2580" />
            <select name="assignmentType" className="rounded-2xl border border-slate-200 p-4">
              {assignmentTypeOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
            <select name="transportMode" className="rounded-2xl border border-slate-200 p-4 md:col-span-2">
              {transportModeOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 font-black">
              <input name="vehicleOwned" type="checkbox" />
              차량 보유 표시
            </label>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <textarea name="guardianQuestions" rows={4} className="rounded-2xl border border-slate-200 p-4" placeholder={"보호자 질문 리스트\n예: 무릎 통증 원인 확인\n예: 약 변경 여부 확인"} />
            <textarea name="requiredDocuments" rows={4} className="rounded-2xl border border-slate-200 p-4" placeholder={"요청 서류\n예: 진료비 영수증\n예: 진료비 세부내역서"} />
          </div>

          <textarea name="opsMemo" rows={3} className="mt-4 w-full rounded-2xl border border-slate-200 p-4" placeholder="운영실 메모" />

          <button className="mt-4 w-full rounded-3xl bg-emerald-600 px-6 py-5 text-xl font-black text-white">
            현장 배정 만들기
          </button>
        </form>
      ) : null}

      <section className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-3">
          <h2 className="text-2xl font-black">오늘 배정</h2>

          {loading ? (
            <div className="rounded-3xl bg-white p-6 text-center font-black shadow-sm">불러오는 중...</div>
          ) : assignments.length === 0 ? (
            <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
              <div className="text-xl font-black">배정된 일정이 없습니다.</div>
              {mode === 'ops' ? <p className="mt-2 text-slate-500">위에서 현장 배정을 만들어보세요.</p> : null}
            </div>
          ) : (
            assignments.map((assignment) => (
              <button
                key={assignment.id}
                onClick={() => setSelectedId(assignment.id)}
                className={
                  'w-full rounded-3xl border p-5 text-left shadow-sm ' +
                  (selected?.id === assignment.id ? 'border-emerald-500 bg-emerald-50' : 'border-transparent bg-white')
                }
              >
                <div className="flex flex-wrap gap-2">
                  <Badge text={labelAssignmentType(assignment.assignment_type)} />
                  <Badge text={labelManagerStatus(assignment.status)} />
                </div>
                <h3 className="mt-3 text-xl font-black">{assignment.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {assignment.elder_name} · {assignment.appointment_date || '날짜 미정'} · {assignment.appointment_time || '시간 미정'}
                </p>
              </button>
            ))
          )}
        </aside>

        <section>
          {!selected ? (
            <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
              <div className="text-xl font-black">선택된 배정이 없습니다.</div>
            </div>
          ) : (
            <div className="space-y-6">
              <article className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge text={labelAssignmentType(selected.assignment_type)} />
                      <Badge text={labelManagerStatus(selected.status)} />
                      <Badge text={labelTransportMode(selected.transport_mode)} />
                      {selected.vehicle_owned ? <Badge text="차량 보유" /> : null}
                      <Badge text={selected.direct_transport_included ? '직접 운송 포함' : '직접 운송 미포함'} />
                    </div>

                    <h2 className="mt-3 text-3xl font-black">{selected.title}</h2>
                    <p className="mt-3 text-lg leading-8 text-slate-700">
                      만남 장소: {selected.meeting_location || '미정'} · 만남 암호: {selected.meeting_code}
                    </p>

                    <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900">
                      차량 보유 여부는 참고 정보입니다. 매니저 개인차량 직접 유상운송은 기본 서비스에 포함되지 않습니다.
                      기본 이동은 병원 앞 만남, 집 앞 만남 후 택시 동행, 이동지원 제휴 기준입니다.
                    </p>
                  </div>

                  <div className="grid min-w-[180px] gap-2">
                    {managerStatusFlow.map((flow) => (
                      <button
                        key={flow.status}
                        onClick={() => updateAssignment(selected.id, flow.status)}
                        className={
                          'rounded-2xl px-4 py-3 font-black ' +
                          (flow.status === 'issue'
                            ? 'bg-red-600 text-white'
                            : flow.status === 'completed'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-900')
                        }
                      >
                        {flow.label}
                      </button>
                    ))}
                  </div>
                </div>
              </article>

              <article className="rounded-3xl bg-white p-6 shadow-sm">
                <h3 className="text-2xl font-black">부모님 상태 주의사항</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {(selected.safety_notes || []).length > 0 ? (
                    selected.safety_notes.map((note) => (
                      <div key={note} className="rounded-2xl bg-blue-50 p-4 text-sm font-bold leading-6 text-blue-950">
                        {note}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm font-bold">주의사항 없음</div>
                  )}
                </div>
              </article>

              <article className="rounded-3xl bg-white p-6 shadow-sm">
                <h3 className="text-2xl font-black">현장 체크리스트</h3>
                <div className="mt-4 space-y-3">
                  {selectedChecklist.map((item) => (
                    <div
                      key={item.id}
                      className={
                        'rounded-3xl p-4 ' +
                        (item.status === 'issue'
                          ? 'bg-red-50'
                          : item.status === 'done'
                            ? 'bg-emerald-50'
                            : 'bg-slate-50')
                      }
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap gap-2">
                            <Badge text={item.priority} />
                            <Badge text={item.status} />
                          </div>
                          <h4 className="mt-2 text-xl font-black">{item.title}</h4>
                          {item.description ? <p className="mt-2 text-sm leading-6 text-slate-700">{item.description}</p> : null}
                          {item.issue_note ? <p className="mt-2 text-sm font-bold text-red-700">이슈: {item.issue_note}</p> : null}
                        </div>

                        <div className="grid min-w-[150px] gap-2">
                          <button onClick={() => updateChecklist(item, 'done')} className="rounded-2xl bg-emerald-600 px-4 py-3 font-black text-white">
                            확인 완료
                          </button>
                          <button onClick={() => updateChecklist(item, 'issue')} className="rounded-2xl bg-red-600 px-4 py-3 font-black text-white">
                            이슈
                          </button>
                          <button onClick={() => updateChecklist(item, 'skipped')} className="rounded-2xl bg-slate-100 px-4 py-3 font-black">
                            건너뜀
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-3xl bg-white p-6 shadow-sm">
                <h3 className="text-2xl font-black">보호자 리포트 초안</h3>

                <form onSubmit={createReport} className="mt-4 space-y-3">
                  <input type="hidden" name="assignmentId" value={selected.id} />
                  <select name="reassuranceState" className="w-full rounded-2xl border border-slate-200 p-4">
                    <option value="안심">안심</option>
                    <option value="확인 필요">확인 필요</option>
                    <option value="긴급">긴급</option>
                  </select>
                  <textarea name="visitSummary" rows={3} className="w-full rounded-2xl border border-slate-200 p-4" placeholder="진행 요약" />
                  <textarea name="doctorGuidance" rows={3} className="w-full rounded-2xl border border-slate-200 p-4" placeholder="의료진 안내사항" />
                  <textarea name="medicationSummary" rows={3} className="w-full rounded-2xl border border-slate-200 p-4" placeholder="약/처방 내용" />
                  <textarea name="documentSummary" rows={3} className="w-full rounded-2xl border border-slate-200 p-4" placeholder="서류/영수증" />
                  <textarea name="mealConditionSummary" rows={3} className="w-full rounded-2xl border border-slate-200 p-4" placeholder="식사/컨디션" />
                  <textarea name="parentCondition" rows={3} className="w-full rounded-2xl border border-slate-200 p-4" placeholder="부모님 컨디션" />
                  <textarea name="familyNextActions" rows={4} className="w-full rounded-2xl border border-slate-200 p-4" placeholder={"가족이 해야 할 일\n예: 저녁 약 확인\n예: 다음 예약 확인"} />
                  <button className="w-full rounded-3xl bg-slate-900 px-6 py-5 text-xl font-black text-white">
                    리포트 초안 제출
                  </button>
                </form>

                {selectedReports.length > 0 ? (
                  <div className="mt-6 space-y-3">
                    {selectedReports.map((report) => (
                      <div key={report.id} className="rounded-2xl bg-slate-50 p-4">
                        <div className="flex flex-wrap gap-2">
                          <Badge text={report.reassurance_state} />
                          <Badge text={report.status} />
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-700">{report.visit_summary}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>

              <article className="rounded-3xl bg-white p-6 shadow-sm">
                <h3 className="text-2xl font-black">진행 로그</h3>
                <div className="mt-4 space-y-3">
                  {selectedEvents.length > 0 ? (
                    selectedEvents.map((event) => (
                      <div key={event.id} className="rounded-2xl bg-slate-50 p-4">
                        <div className="font-black">{event.title}</div>
                        {event.description ? <p className="mt-2 text-sm text-slate-600">{event.description}</p> : null}
                        <p className="mt-2 text-xs text-slate-500">{new Date(event.created_at).toLocaleString('ko-KR')}</p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl bg-slate-50 p-4 text-slate-500">아직 진행 로그가 없습니다.</div>
                  )}
                </div>
              </article>
            </div>
          )}
        </section>
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
