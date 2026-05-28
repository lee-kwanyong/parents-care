'use client'

import { useEffect, useMemo, useState } from 'react'

type Row = Record<string, any>

function text(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function dateLabel(value: unknown) {
  const raw = text(value)

  if (!raw) return '-'

  const date = new Date(raw)

  if (!Number.isFinite(date.getTime())) return raw

  return date.toLocaleString('ko-KR')
}

function serviceTypeLabel(value: unknown) {
  const raw = text(value)

  const map: Record<string, string> = {
    hospital: '병원동행',
    medication: '복약확인',
    meal: '식사확인',
    life: '생활확인',
    visit: '방문확인'
  }

  return map[raw] || raw || '-'
}

export function OpsCareRequestsScreen() {
  const [requests, setRequests] = useState<Row[]>([])
  const [result, setResult] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)

    const response = await fetch('/api/anbu-matching/requests/list', { cache: 'no-store' })
    const data = await response.json().catch(() => ({}))

    setRequests(Array.isArray(data.requests) ? data.requests : [])
    setResult(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const summary = useMemo(() => {
    return {
      total: requests.length,
      matched: requests.filter((item) => Array.isArray(item.matches) && item.matches.length > 0).length,
      reported: requests.filter((item) =>
        Array.isArray(item.matches) &&
        item.matches.some((match: Row) => Array.isArray(match.reports) && match.reports.length > 0)
      ).length
    }
  }, [requests])

  return (
    <PageShell
      eyebrow="운영실 · 케어 요청 관리"
      title="보호자 요청부터 파트너 리포트까지 추적합니다."
      desc="케어 요청, 파트너 배정, 업무 리포트 제출 상태를 한 화면에서 확인합니다."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Summary label="전체 요청" value={summary.total} />
        <Summary label="파트너 배정" value={summary.matched} />
        <Summary label="리포트 제출" value={summary.reported} />
      </div>

      <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black tracking-[-0.05em]">케어 요청 목록</h2>
            <p className="mt-2 text-sm font-bold text-[#637B76]">최근 요청과 배정 상태를 확인하세요.</p>
          </div>

          <button
            onClick={load}
            disabled={loading}
            className="rounded-2xl bg-[#193B38] px-5 py-3 text-sm font-black text-white disabled:opacity-60"
          >
            새로고침
          </button>
        </div>

        <div className="mt-5 grid gap-3">
          {requests.length === 0 ? (
            <Empty message="아직 케어 요청이 없습니다." />
          ) : (
            requests.map((request) => (
              <article key={text(request.id)} className="rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8]">
                <div className="flex flex-wrap gap-2">
                  <Badge text={text(request.status) || 'requested'} />
                  <Badge text={serviceTypeLabel(request.request_type)} />
                  <Badge text={text(request.region) || '-'} />
                  <Badge text={text(request.family_code) || '가족코드 없음'} />
                </div>

                <h3 className="mt-3 text-xl font-black tracking-[-0.04em]">{text(request.parent_name) || '부모님'}</h3>
                <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                  보호자: {text(request.guardian_name) || '-'} · {text(request.guardian_phone) || '-'}
                </p>
                <p className="mt-1 text-sm font-bold leading-7 text-[#637B76]">
                  희망: {text(request.preferred_date) || '-'} {text(request.preferred_time) || ''}
                </p>
                <p className="mt-2 whitespace-pre-line text-sm font-bold leading-7 text-[#4E6D69]">
                  {text(request.details) || '요청 내용 없음'}
                </p>

                <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-[#D8EEE8]">
                  <div className="text-sm font-black text-[#11977F]">배정/리포트</div>

                  {Array.isArray(request.matches) && request.matches.length > 0 ? (
                    <div className="mt-3 space-y-3">
                      {request.matches.map((match: Row) => (
                        <div key={text(match.id)} className="rounded-xl bg-[#F8FCFB] p-3">
                          <p className="text-sm font-black">
                            파트너: {text(match.partner?.applicant_name) || '-'} · 상태: {text(match.match_status) || '-'}
                          </p>
                          <p className="mt-1 text-xs font-bold text-[#637B76]">
                            리포트 {Array.isArray(match.reports) ? match.reports.length : 0}건
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm font-bold text-[#637B76]">아직 파트너가 배정되지 않았습니다.</p>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <RawBox result={result} />
    </PageShell>
  )
}

export function PartnerTasksScreen() {
  const [tasks, setTasks] = useState<Row[]>([])
  const [selectedTask, setSelectedTask] = useState<Row | null>(null)
  const [result, setResult] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)

    const response = await fetch('/api/anbu-partner/tasks', { cache: 'no-store' })
    const data = await response.json().catch(() => ({}))

    setTasks(Array.isArray(data.tasks) ? data.tasks : [])
    setResult(data)
    setLoading(false)
  }

  async function submitReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedTask?.match?.id) {
      setResult({ ok: false, message: '먼저 업무를 선택해주세요.' })
      return
    }

    setLoading(true)

    const form = new FormData(event.currentTarget)
    const payload = Object.fromEntries(form.entries())

    const response = await fetch('/api/anbu-partner/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        matchId: selectedTask.match.id,
        requestId: selectedTask.request?.id,
        partnerId: selectedTask.partner?.id
      })
    })

    const data = await response.json().catch(() => ({}))
    setResult(data)

    if (data.ok) {
      event.currentTarget.reset()
      await load()
    }

    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <PageShell
      eyebrow="케어파트너 · 배정 업무"
      title="배정된 업무를 확인하고 보호자 리포트를 작성합니다."
      desc="케어파트너는 의료 판단이 아니라 생활확인, 병원동행, 식사·복약 확인 결과를 사실 중심으로 기록합니다."
    >
      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black tracking-[-0.05em]">배정 업무</h2>
              <p className="mt-2 text-sm font-bold text-[#637B76]">업무를 선택하면 리포트를 작성할 수 있습니다.</p>
            </div>

            <button
              onClick={load}
              disabled={loading}
              className="rounded-2xl bg-[#193B38] px-4 py-3 text-xs font-black text-white disabled:opacity-60"
            >
              새로고침
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {tasks.length === 0 ? (
              <Empty message="아직 배정된 업무가 없습니다." />
            ) : (
              tasks.map((task) => (
                <button
                  key={text(task.match?.id)}
                  type="button"
                  onClick={() => setSelectedTask(task)}
                  className={
                    'w-full rounded-2xl p-4 text-left ring-1 transition ' +
                    (selectedTask?.match?.id === task.match?.id
                      ? 'bg-[#EFFFF9] ring-[#BEEFE3]'
                      : 'bg-[#F8FCFB] ring-[#D8EEE8]')
                  }
                >
                  <div className="flex flex-wrap gap-2">
                    <Badge text={text(task.match?.match_status) || 'assigned'} />
                    <Badge text={serviceTypeLabel(task.request?.request_type)} />
                    <Badge text={text(task.request?.region) || '-'} />
                  </div>
                  <h3 className="mt-3 text-lg font-black">{text(task.request?.parent_name) || '부모님'}</h3>
                  <p className="mt-1 text-sm font-bold text-[#637B76]">
                    보호자: {text(task.request?.guardian_name) || '-'} · 파트너: {text(task.partner?.applicant_name) || '-'}
                  </p>
                  <p className="mt-1 text-xs font-bold text-[#7A9692]">
                    기존 리포트 {Array.isArray(task.reports) ? task.reports.length : 0}건
                  </p>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">업무 리포트 작성</h2>

          {!selectedTask ? (
            <Empty message="왼쪽에서 업무를 선택해주세요." />
          ) : (
            <form onSubmit={submitReport} className="mt-5 grid gap-4">
              <InfoBox
                title={text(selectedTask.request?.parent_name) || '부모님'}
                desc={`${serviceTypeLabel(selectedTask.request?.request_type)} · ${text(selectedTask.request?.region) || '-'} · ${text(selectedTask.request?.details) || ''}`}
              />

              <Input label="수행 일시" name="performedAt" type="datetime-local" />
              <TextArea label="오늘 수행한 일" name="serviceSummary" placeholder="예: 병원 접수 동행, 약국 방문, 귀가 확인" required />
              <TextArea label="부모님 상태" name="parentCondition" placeholder="예: 보행 가능, 통증 호소 없음, 피곤해 보임" />
              <Input label="식사 상태" name="mealStatus" placeholder="예: 점심 식사 완료 / 식사 미확인" />
              <Input label="복약 상태" name="medicationStatus" placeholder="예: 아침약 복용 확인 / 약 미지참" />
              <TextArea label="병원/방문 결과" name="hospitalResult" placeholder="예: 다음 예약일, 처방 변경 없음, 검사 대기" />
              <TextArea label="다음 할 일" name="nextAction" placeholder="예: 다음 주 수요일 재방문, 처방약 확인" />
              <TextArea label="사진/서류 메모" name="photoNote" placeholder="사진을 찍었다면 무엇을 찍었는지, 개인정보 주의사항" />
              <TextArea label="보호자에게 전달할 말" name="guardianMessage" placeholder="보호자에게 짧고 정확하게 전달할 내용" />

              <button
                disabled={loading}
                className="rounded-2xl bg-[#193B38] px-5 py-4 text-base font-black text-white disabled:opacity-60"
              >
                {loading ? '저장 중...' : '리포트 제출'}
              </button>
            </form>
          )}
        </section>
      </div>

      <RawBox result={result} />
    </PageShell>
  )
}

export function ChildCareReportsScreen() {
  const [reports, setReports] = useState<Row[]>([])
  const [result, setResult] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)

    const response = await fetch('/api/anbu-care-reports/list', { cache: 'no-store' })
    const data = await response.json().catch(() => ({}))

    setReports(Array.isArray(data.reports) ? data.reports : [])
    setResult(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <PageShell
      eyebrow="보호자 · 케어 리포트"
      title="케어파트너가 작성한 부모님 확인 리포트를 봅니다."
      desc="병원동행, 복약확인, 식사확인, 생활확인 결과를 보호자가 한눈에 볼 수 있게 정리합니다."
    >
      <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black tracking-[-0.05em]">최근 리포트</h2>
            <p className="mt-2 text-sm font-bold text-[#637B76]">파트너 업무 완료 후 작성된 리포트입니다.</p>
          </div>

          <button
            onClick={load}
            disabled={loading}
            className="rounded-2xl bg-[#193B38] px-5 py-3 text-sm font-black text-white disabled:opacity-60"
          >
            새로고침
          </button>
        </div>

        <div className="mt-5 grid gap-3">
          {reports.length === 0 ? (
            <Empty message="아직 제출된 케어 리포트가 없습니다." />
          ) : (
            reports.map((report) => (
              <article key={text(report.id)} className="rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8]">
                <div className="flex flex-wrap gap-2">
                  <Badge text={text(report.report_status) || 'submitted'} />
                  <Badge text={serviceTypeLabel(report.request?.request_type)} />
                  <Badge text={text(report.partner?.applicant_name) || '파트너'} />
                </div>

                <h3 className="mt-3 text-xl font-black tracking-[-0.04em]">
                  {text(report.request?.parent_name) || '부모님'} 케어 리포트
                </h3>

                <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                  수행일시: {dateLabel(report.performed_at)} · 지역: {text(report.request?.region) || '-'}
                </p>

                <ReportSection title="수행한 일" value={text(report.service_summary)} />
                <ReportSection title="부모님 상태" value={text(report.parent_condition)} />
                <ReportSection title="식사 상태" value={text(report.meal_status)} />
                <ReportSection title="복약 상태" value={text(report.medication_status)} />
                <ReportSection title="병원/방문 결과" value={text(report.hospital_result)} />
                <ReportSection title="다음 할 일" value={text(report.next_action)} />
                <ReportSection title="보호자 전달사항" value={text(report.guardian_message)} />
              </article>
            ))
          )}
        </div>
      </section>

      <RawBox result={result} />
    </PageShell>
  )
}

function PageShell({
  eyebrow,
  title,
  desc,
  children
}: {
  eyebrow: string
  title: string
  desc: string
  children: React.ReactNode
}) {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-5 py-8 text-[#173B36]">
      <section className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            {eyebrow}
          </div>
          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#637B76] sm:text-lg sm:leading-8">
            {desc}
          </p>
        </section>
        {children}
      </section>
    </main>
  )
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8]">
      <div className="text-sm font-black text-[#7A9692]">{label}</div>
      <div className="mt-2 text-4xl font-black tracking-[-0.06em] text-[#11977F]">{value}</div>
    </section>
  )
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#4E6D69] ring-1 ring-[#D8EEE7]">
      {text}
    </span>
  )
}

function Empty({ message }: { message: string }) {
  return (
    <p className="rounded-2xl bg-[#F8FCFB] p-4 text-sm font-bold text-[#637B76] ring-1 ring-[#D8EEE8]">
      {message}
    </p>
  )
}

function InfoBox({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl bg-[#EFFFF9] p-4 ring-1 ring-[#CDEFE5]">
      <div className="text-lg font-black text-[#116D5F]">{title}</div>
      <p className="mt-2 text-sm font-bold leading-7 text-[#4E6D69]">{desc}</p>
    </div>
  )
}

function Input({
  label,
  name,
  type = 'text',
  placeholder = '',
  required = false
}: {
  label: string
  name: string
  type?: string
  placeholder?: string
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

function TextArea({
  label,
  name,
  placeholder = '',
  required = false
}: {
  label: string
  name: string
  placeholder?: string
  required?: boolean
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-[#55736E]">{label}</span>
      <textarea
        name={name}
        rows={4}
        required={required}
        placeholder={placeholder}
        className="rounded-2xl border border-[#D8EEE8] bg-white px-4 py-3 text-sm font-bold leading-6 outline-none focus:ring-4 focus:ring-[#D6F6EC]"
      />
    </label>
  )
}

function ReportSection({ title, value }: { title: string; value: string }) {
  if (!value) return null

  return (
    <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-[#D8EEE8]">
      <div className="text-xs font-black text-[#11977F]">{title}</div>
      <p className="mt-2 whitespace-pre-line text-sm font-bold leading-7 text-[#4E6D69]">{value}</p>
    </div>
  )
}

function RawBox({ result }: { result: unknown }) {
  return (
    <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
      <h2 className="text-2xl font-black tracking-[-0.05em]">처리 결과 원본</h2>
      <pre className="mt-4 max-h-[24rem] overflow-auto rounded-2xl bg-[#123F38] p-4 text-xs font-bold leading-6 text-[#E7FFF7]">
        {JSON.stringify(result, null, 2)}
      </pre>
    </section>
  )
}
