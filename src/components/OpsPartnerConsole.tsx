'use client'

import { useMemo, useState } from 'react'

type PartnerApplication = {
  id: string
  applicant_name?: string | null
  phone?: string | null
  email?: string | null
  region?: string | null
  available_time?: string | null
  has_caregiver_license?: boolean | null
  can_hospital_accompany?: boolean | null
  can_medication_check?: boolean | null
  can_meal_check?: boolean | null
  can_drive?: boolean | null
  verification_status?: string | null
  verification_memo?: string | null
  memo?: string | null
  created_at?: string | null
}

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
  pending: '대기',
  approved: '승인',
  rejected: '거절',
  hold: '보류'
}

const assignmentStatusLabels: Record<string, string> = {
  assigned: '배정됨',
  confirmed: '확정',
  in_progress: '진행 중',
  completed: '완료',
  cancelled: '취소',
  hold: '보류'
}

export function OpsPartnerConsole({ mode = 'partners' }: { mode?: 'partners' | 'assignments' }) {
  const [adminCode, setAdminCode] = useState('')
  const [applications, setApplications] = useState<PartnerApplication[]>([])
  const [assignments, setAssignments] = useState<CareAssignment[]>([])
  const [selectedPartner, setSelectedPartner] = useState<PartnerApplication | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const approvedPartners = useMemo(
    () => applications.filter((item) => item.verification_status === 'approved'),
    [applications]
  )

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const [appsResponse, assignmentsResponse] = await Promise.all([
        fetch('/api/care-partners/applications?adminCode=' + encodeURIComponent(adminCode), { cache: 'no-store' }),
        fetch('/api/care-assignments?adminCode=' + encodeURIComponent(adminCode), { cache: 'no-store' })
      ])

      const appsData = await appsResponse.json() as { ok?: boolean; applications?: PartnerApplication[]; message?: string }
      const assignmentsData = await assignmentsResponse.json() as { ok?: boolean; assignments?: CareAssignment[]; message?: string }

      if (!appsResponse.ok || !appsData.ok) throw new Error(appsData.message || '파트너 목록을 불러오지 못했습니다.')
      if (!assignmentsResponse.ok || !assignmentsData.ok) throw new Error(assignmentsData.message || '배정 목록을 불러오지 못했습니다.')

      setApplications(appsData.applications || [])
      setAssignments(assignmentsData.assignments || [])
      setMessage('목록을 불러왔습니다.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '불러오기 실패')
    } finally {
      setLoading(false)
    }
  }

  async function updatePartnerStatus(id: string, status: string) {
    setMessage('')

    const memo = window.prompt('운영실 메모를 입력하세요.', status === 'approved' ? '승인 완료' : '') || ''

    try {
      const response = await fetch('/api/care-partners/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_status',
          adminCode,
          id,
          status,
          verificationMemo: memo
        })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) throw new Error(data.message || '상태 변경 실패')

      setMessage('파트너 상태가 변경되었습니다.')
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '상태 변경 실패')
    }
  }

  async function createAssignment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedPartner) {
      setMessage('배정할 케어파트너를 먼저 선택해주세요.')
      return
    }

    const form = new FormData(event.currentTarget)

    try {
      const response = await fetch('/api/care-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminCode,
          partnerApplicationId: selectedPartner.id,
          familyCode: String(form.get('familyCode') || ''),
          taskType: String(form.get('taskType') || ''),
          taskTitle: String(form.get('taskTitle') || ''),
          taskDescription: String(form.get('taskDescription') || ''),
          scheduledAt: String(form.get('scheduledAt') || ''),
          opsMemo: String(form.get('opsMemo') || '')
        })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) throw new Error(data.message || '배정 저장 실패')

      event.currentTarget.reset()
      setSelectedPartner(null)
      setMessage('케어파트너 배정이 생성되었습니다.')
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '배정 저장 실패')
    }
  }

  async function updateAssignmentStatus(id: string, status: string) {
    const reportSummary = status === 'completed'
      ? window.prompt('완료 리포트 요약을 입력하세요.', '케어 확인 완료') || ''
      : ''

    try {
      const response = await fetch('/api/care-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_status',
          adminCode,
          id,
          status,
          reportSummary
        })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) throw new Error(data.message || '배정 상태 변경 실패')

      setMessage('배정 상태가 변경되었습니다.')
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '배정 상태 변경 실패')
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-5 py-8 text-[#173B36]">
      <div className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:p-8">
        <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
          안부웍스 운영실
        </div>

        <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
          {mode === 'partners' ? '케어파트너 승인/검증' : '케어파트너 배정 관리'}
        </h1>

        <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#637B76] sm:text-lg sm:leading-8">
          신청한 요양보호사·동행 파트너를 검토하고, 승인된 파트너를 부모님 연결코드에 배정합니다.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input
            value={adminCode}
            onChange={(event) => setAdminCode(event.target.value)}
            placeholder="관리자 코드"
            className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-[#D6F6EC]"
          />
          <button
            onClick={load}
            disabled={loading}
            className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white disabled:opacity-60"
          >
            {loading ? '불러오는 중...' : '목록 불러오기'}
          </button>
        </div>

        {message ? (
          <div className="mt-5 rounded-2xl bg-[#EFFFF9] p-4 text-sm font-black leading-7 text-[#116D5F] ring-1 ring-[#CDEFE5]">
            {message}
          </div>
        ) : null}
      </div>

      {mode === 'assignments' ? (
        <AssignmentsView
          assignments={assignments}
          approvedPartners={approvedPartners}
          selectedPartner={selectedPartner}
          setSelectedPartner={setSelectedPartner}
          createAssignment={createAssignment}
          updateAssignmentStatus={updateAssignmentStatus}
        />
      ) : (
        <PartnersView
          applications={applications}
          updatePartnerStatus={updatePartnerStatus}
          setSelectedPartner={setSelectedPartner}
        />
      )}
    </section>
  )
}

function PartnersView({
  applications,
  updatePartnerStatus,
  setSelectedPartner
}: {
  applications: PartnerApplication[]
  updatePartnerStatus: (id: string, status: string) => void
  setSelectedPartner: (partner: PartnerApplication) => void
}) {
  return (
    <div className="mt-5 grid gap-4">
      {applications.length === 0 ? (
        <EmptyCard text="아직 불러온 케어파트너 신청이 없습니다. 관리자 코드를 입력하고 목록을 불러오세요." />
      ) : null}

      {applications.map((app) => (
        <article key={app.id} className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge text={statusLabels[app.verification_status || 'pending'] || app.verification_status || '대기'} />
                {app.region ? <Badge text={app.region} /> : null}
                {app.has_caregiver_license ? <Badge text="요양보호사 자격" /> : null}
              </div>

              <h2 className="mt-4 text-2xl font-black tracking-[-0.05em]">
                {app.applicant_name || '이름 없음'}
              </h2>

              <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                연락처: {app.phone || '-'} · 이메일: {app.email || '-'} · 가능시간: {app.available_time || '-'}
              </p>

              <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                가능 업무:
                {[
                  app.can_hospital_accompany ? ' 병원동행' : '',
                  app.can_medication_check ? ' 복약확인' : '',
                  app.can_meal_check ? ' 식사확인' : '',
                  app.can_drive ? ' 차량이동' : ''
                ].join('') || ' 미입력'}
              </p>

              {app.memo ? (
                <p className="mt-3 rounded-2xl bg-[#F8FCFB] p-4 text-sm font-bold leading-7 text-[#5F7772] ring-1 ring-[#D8EEE8]">
                  {app.memo}
                </p>
              ) : null}

              {app.verification_memo ? (
                <p className="mt-3 rounded-2xl bg-[#FFF8E8] p-4 text-sm font-bold leading-7 text-[#795313] ring-1 ring-[#F4D8A5]">
                  운영실 메모: {app.verification_memo}
                </p>
              ) : null}
            </div>

            <div className="grid min-w-[14rem] gap-2">
              <button onClick={() => updatePartnerStatus(app.id, 'approved')} className="rounded-2xl bg-[#20C5A8] px-4 py-3 text-sm font-black text-white">
                승인
              </button>
              <button onClick={() => updatePartnerStatus(app.id, 'hold')} className="rounded-2xl bg-[#FFF8E8] px-4 py-3 text-sm font-black text-[#795313]">
                보류
              </button>
              <button onClick={() => updatePartnerStatus(app.id, 'rejected')} className="rounded-2xl bg-[#FFF1F1] px-4 py-3 text-sm font-black text-[#8A2525]">
                거절
              </button>
              {app.verification_status === 'approved' ? (
                <button onClick={() => setSelectedPartner(app)} className="rounded-2xl bg-[#193B38] px-4 py-3 text-sm font-black text-white">
                  이 파트너 배정
                </button>
              ) : null}
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

function AssignmentsView({
  assignments,
  approvedPartners,
  selectedPartner,
  setSelectedPartner,
  createAssignment,
  updateAssignmentStatus
}: {
  assignments: CareAssignment[]
  approvedPartners: PartnerApplication[]
  selectedPartner: PartnerApplication | null
  setSelectedPartner: (partner: PartnerApplication | null) => void
  createAssignment: (event: React.FormEvent<HTMLFormElement>) => void
  updateAssignmentStatus: (id: string, status: string) => void
}) {
  return (
    <div className="mt-5 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
        <h2 className="text-2xl font-black tracking-[-0.05em]">새 배정 만들기</h2>

        <div className="mt-4 grid gap-2">
          {approvedPartners.length === 0 ? (
            <p className="rounded-2xl bg-[#FFF8E8] p-4 text-sm font-black leading-7 text-[#795313] ring-1 ring-[#F4D8A5]">
              승인된 케어파트너가 없습니다. 먼저 파트너를 승인하세요.
            </p>
          ) : null}

          {approvedPartners.map((partner) => (
            <button
              key={partner.id}
              onClick={() => setSelectedPartner(partner)}
              className={
                'rounded-2xl p-4 text-left text-sm font-black ring-1 ' +
                (selectedPartner?.id === partner.id
                  ? 'bg-[#EFFFF9] text-[#116D5F] ring-[#CDEFE5]'
                  : 'bg-[#F8FCFB] text-[#173B36] ring-[#D8EEE8]')
              }
            >
              {partner.applicant_name} · {partner.region || '지역 미입력'} · {partner.phone || '-'}
            </button>
          ))}
        </div>

        <form onSubmit={createAssignment} className="mt-5 grid gap-3">
          <Input name="familyCode" label="부모님 연결코드" placeholder="예: 462015" required />
          <Input name="taskType" label="업무 유형" placeholder="예: 생활확인, 병원동행, 복약확인" required />
          <Input name="taskTitle" label="배정 제목" placeholder="예: 어머니 점심 약 확인" required />
          <Input name="scheduledAt" label="예정 시간" placeholder="선택 입력" type="datetime-local" />
          <label className="grid gap-2">
            <span className="text-sm font-black text-[#55736E]">업무 설명</span>
            <textarea name="taskDescription" className="min-h-24 rounded-2xl border border-[#D8EEE8] bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-[#D6F6EC]" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-black text-[#55736E]">운영실 메모</span>
            <textarea name="opsMemo" className="min-h-24 rounded-2xl border border-[#D8EEE8] bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-[#D6F6EC]" />
          </label>

          <button className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white">
            배정 생성
          </button>
        </form>
      </section>

      <section className="grid gap-3">
        {assignments.length === 0 ? (
          <EmptyCard text="아직 생성된 배정이 없습니다." />
        ) : null}

        {assignments.map((assignment) => (
          <article key={assignment.id} className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
            <div className="flex flex-wrap gap-2">
              <Badge text={assignmentStatusLabels[assignment.assignment_status || 'assigned'] || assignment.assignment_status || '배정됨'} />
              <Badge text={assignment.task_type || '생활확인'} />
              <Badge text={'코드 ' + (assignment.family_code || '-')} />
            </div>

            <h2 className="mt-4 text-2xl font-black tracking-[-0.05em]">
              {assignment.task_title}
            </h2>

            <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
              파트너: {assignment.partner_name || '-'} · {assignment.partner_region || '-'} · {assignment.partner_phone || '-'}
            </p>

            {assignment.scheduled_at ? (
              <p className="mt-1 text-sm font-bold text-[#637B76]">
                예정: {new Date(assignment.scheduled_at).toLocaleString('ko-KR')}
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

            <div className="mt-4 flex flex-wrap gap-2">
              {['confirmed', 'in_progress', 'completed', 'cancelled', 'hold'].map((status) => (
                <button
                  key={status}
                  onClick={() => updateAssignmentStatus(assignment.id, status)}
                  className="rounded-2xl bg-[#F2FAF8] px-3 py-2 text-xs font-black text-[#537875] ring-1 ring-[#DDEEEA]"
                >
                  {assignmentStatusLabels[status]}
                </button>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-[#EFFFF9] px-3 py-1 text-xs font-black text-[#116D5F] ring-1 ring-[#CDEFE5]">
      {text}
    </span>
  )
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="rounded-[2rem] bg-white p-6 text-sm font-black leading-7 text-[#637B76] shadow-sm ring-1 ring-[#D8EEE8]">
      {text}
    </div>
  )
}

function Input({
  name,
  label,
  placeholder,
  type = 'text',
  required = false
}: {
  name: string
  label: string
  placeholder: string
  type?: string
  required?: boolean
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-[#55736E]">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-[#D6F6EC]"
      />
    </label>
  )
}
