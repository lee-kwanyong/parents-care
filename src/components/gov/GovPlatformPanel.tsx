'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Tab = 'dashboard' | 'recipients' | 'cases' | 'reports' | 'audit' | 'export' | 'proposal'

type RecipientSummary = {
  familyCode: string
  recipientName: string
  region: string
  householdType: string
  assignedOrgName: string
  assignedStaffName: string
  guardianName: string
  consentStatus: string
  riskLevel: string
  todayState: string
  responseRate14: number
  todayMealMissing: number
  todayMedicationMissing: number
  todayHelp: number
  activeTasks: number
  recentRisk: number
  lastResponse: {
    label: string
    time: string
  }
}

type Metrics = {
  totalRecipients: number
  highRisk: number
  mediumRisk: number
  noResponse: number
  mealMissing: number
  medicationMissing: number
  helpRequests: number
  activeTasks: number
  completedTasks: number
  openCases: number
  completedCases: number
  familyCheckRate: number
  caseCompleteRate: number
}

type CaseNote = {
  id: string
  family_code?: string
  case_type?: string
  title?: string
  content?: string
  status?: string
  priority?: string
  actor_name?: string
  actor_role?: string
  org_name?: string
  next_action?: string
  created_at?: string
  completed_at?: string
}

type AuditLog = {
  id: string
  actor_name?: string
  actor_role?: string
  action_type?: string
  target_type?: string
  family_code?: string
  description?: string
  created_at?: string
}

type SuggestedCase = {
  familyCode: string
  recipientName: string
  title: string
  content: string
  priority: string
  caseType: string
}

type GovData = {
  metrics: Metrics
  recipientSummaries: RecipientSummary[]
  cases: CaseNote[]
  auditLogs: AuditLog[]
  suggestedCases: SuggestedCase[]
}

const tabs: Array<{ key: Tab; label: string; href: string }> = [
  { key: 'dashboard', label: '대시보드', href: '/gov/dashboard' },
  { key: 'recipients', label: '대상자', href: '/gov/recipients' },
  { key: 'cases', label: '사례관리', href: '/gov/cases' },
  { key: 'reports', label: '성과보고', href: '/gov/reports' },
  { key: 'audit', label: '감사로그', href: '/gov/audit' },
  { key: 'export', label: '내보내기', href: '/gov/export' },
  { key: 'proposal', label: 'R&D 제안', href: '/gov/proposal' }
]

function code6(value: string) {
  return value.replace(/[^\d]/g, '').slice(0, 6)
}

function riskClass(risk: string) {
  if (risk === 'high') return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  if (risk === 'medium') return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  return 'bg-[#EFFFFA] text-[#2AA897] ring-[#CDEFE7]'
}

function priorityClass(priority?: string) {
  if (priority === 'high') return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  if (priority === 'low') return 'bg-[#EFFFFA] text-[#2AA897] ring-[#CDEFE7]'
  return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
}

function statusClass(status?: string) {
  if (status === 'done') return 'bg-[#EFFFFA] text-[#2AA897] ring-[#CDEFE7]'
  if (status === 'open') return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  return 'bg-[#FAFFFD] text-[#637B76] ring-[#D6EDE7]'
}

function MetricCard({
  title,
  value,
  desc,
  tone = 'default'
}: {
  title: string
  value: string
  desc: string
  tone?: 'default' | 'danger' | 'warn' | 'good'
}) {
  const cls =
    tone === 'danger'
      ? 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
      : tone === 'warn'
        ? 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
        : tone === 'good'
          ? 'bg-[#EFFFFA] text-[#2AA897] ring-[#CDEFE7]'
          : 'bg-white text-[#17443F] ring-[#D6EDE7]'

  return (
    <article className={'rounded-[2rem] p-5 shadow-sm ring-1 ' + cls}>
      <div className="text-sm font-black opacity-70">{title}</div>
      <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{value}</div>
      <p className="mt-2 text-sm font-bold leading-6 opacity-75">{desc}</p>
    </article>
  )
}

export function GovPlatformPanel({ initialTab }: { initialTab: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab)
  const [data, setData] = useState<GovData | null>(null)
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(true)

  const [recipientForm, setRecipientForm] = useState({
    familyCode: '',
    recipientName: '',
    birthYear: '',
    regionSido: '',
    regionSigungu: '',
    regionEupmyeondong: '',
    householdType: '독거',
    programType: '지역사회 통합돌봄',
    assignedOrgName: '',
    assignedStaffName: '',
    guardianName: '',
    consentStatus: 'pending',
    riskLevel: 'normal'
  })

  const [caseForm, setCaseForm] = useState({
    familyCode: '',
    title: '',
    content: '',
    priority: 'medium',
    caseType: 'phone_check',
    actorName: '',
    orgName: '',
    nextAction: ''
  })

  const highRiskRecipients = useMemo(
    () => (data?.recipientSummaries || []).filter((row) => row.riskLevel === 'high'),
    [data]
  )

  const mediumRiskRecipients = useMemo(
    () => (data?.recipientSummaries || []).filter((row) => row.riskLevel === 'medium'),
    [data]
  )

  async function load() {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/gov-platform', { cache: 'no-store' })
      const json = await response.json().catch(() => ({}))

      if (!response.ok || !json.ok) {
        setMessage(json.message || '지자체 운영실 데이터를 불러오지 못했습니다.')
        setDebug(JSON.stringify(json.detail || json, null, 2))
        return
      }

      setData(json)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '지자체 운영실 데이터를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function post(action: string, payload: Record<string, unknown>) {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/gov-platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload })
      })

      const json = await response.json().catch(() => ({}))

      if (!response.ok || !json.ok) {
        setMessage(json.message || '처리에 실패했습니다.')
        setDebug(JSON.stringify(json.detail || json, null, 2))
        return false
      }

      setMessage(json.message || '처리되었습니다.')
      await load()
      return true
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.')
      return false
    } finally {
      setLoading(false)
    }
  }

  async function createRecipient() {
    const ok = await post('createRecipient', recipientForm)

    if (ok) {
      setRecipientForm({
        familyCode: '',
        recipientName: '',
        birthYear: '',
        regionSido: '',
        regionSigungu: '',
        regionEupmyeondong: '',
        householdType: '독거',
        programType: '지역사회 통합돌봄',
        assignedOrgName: '',
        assignedStaffName: '',
        guardianName: '',
        consentStatus: 'pending',
        riskLevel: 'normal'
      })
    }
  }

  async function createCase(input?: Partial<typeof caseForm>) {
    const source = input ? { ...caseForm, ...input } : caseForm
    const ok = await post('createCase', source)

    if (ok && !input) {
      setCaseForm({
        familyCode: '',
        title: '',
        content: '',
        priority: 'medium',
        caseType: 'phone_check',
        actorName: '',
        orgName: '',
        nextAction: ''
      })
    }
  }

  async function updateCase(caseNote: CaseNote, status: string) {
    await post('updateCase', {
      id: caseNote.id,
      familyCode: caseNote.family_code || '',
      status,
      actorName: caseForm.actorName || '운영실'
    })
  }

  useEffect(() => {
    setTab(initialTab)
  }, [initialTab])

  useEffect(() => {
    load()
  }, [])

  const metrics = data?.metrics || {
    totalRecipients: 0,
    highRisk: 0,
    mediumRisk: 0,
    noResponse: 0,
    mealMissing: 0,
    medicationMissing: 0,
    helpRequests: 0,
    activeTasks: 0,
    completedTasks: 0,
    openCases: 0,
    completedCases: 0,
    familyCheckRate: 0,
    caseCompleteRate: 0
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-5 text-[#17443F] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            지자체 실증 운영실 v1
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            ICT 안부확인 데이터를
            <br />
            통합돌봄 운영 지표로 전환합니다.
          </h1>

          <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            부모님 안부 선택, 가족 실행, 사례관리, 성과보고, 감사로그를 한 곳에 묶어 지자체 실증·R&D 제안형 플랫폼 구조로 준비합니다.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {tabs.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setTab(item.key)}
                className={
                  'rounded-full px-4 py-2 text-sm font-black ring-1 ' +
                  (tab === item.key
                    ? 'bg-[#247A71] text-white ring-[#247A71]'
                    : 'bg-white text-[#17443F] ring-[#D6EDE7]')
                }
              >
                {item.label}
              </Link>
            ))}
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
              {message}
            </div>
          ) : null}

          {debug ? (
            <details className="mt-4 rounded-2xl bg-[#247A71] p-4 text-xs font-bold leading-6 text-[#E7FFF7]">
              <summary className="cursor-pointer text-sm font-black">상세 오류 보기</summary>
              <pre className="mt-3 max-h-60 overflow-auto whitespace-pre-wrap">{debug}</pre>
            </details>
          ) : null}
        </section>

        {tab === 'dashboard' ? (
          <>
            <section className="grid gap-4 md:grid-cols-4">
              <MetricCard title="전체 대상자" value={`${metrics.totalRecipients}명`} desc="실증 등록 또는 자동 감지 대상자" tone="default" />
              <MetricCard title="고위험" value={`${metrics.highRisk}명`} desc="도움 요청 또는 반복 위험 신호" tone="danger" />
              <MetricCard title="주의" value={`${metrics.mediumRisk}명`} desc="식사·복약 미확인 또는 미처리 실행" tone="warn" />
              <MetricCard title="가족 확인 완료율" value={`${metrics.familyCheckRate}%`} desc="가족 실행 보드 완료 기준" tone="good" />
            </section>

            <section className="grid gap-4 md:grid-cols-4">
              <MetricCard title="오늘 미응답" value={`${metrics.noResponse}명`} desc="오늘 안부 응답 없음" />
              <MetricCard title="식사 미확인" value={`${metrics.mealMissing}건`} desc="아침·점심·저녁 기준" />
              <MetricCard title="복약 미확인" value={`${metrics.medicationMissing}건`} desc="아침약·점심약·저녁약 기준" />
              <MetricCard title="도움 요청" value={`${metrics.helpRequests}건`} desc="오늘 도움 요청 신호" tone={metrics.helpRequests > 0 ? 'danger' : 'good'} />
            </section>

            <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
                <h2 className="text-2xl font-black tracking-[-0.05em]">위험 대상자</h2>
                <div className="mt-5 space-y-3">
                  {[...highRiskRecipients, ...mediumRiskRecipients].slice(0, 10).map((row) => (
                    <article key={row.familyCode} className={'rounded-2xl p-4 ring-1 ' + riskClass(row.riskLevel)}>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-xl font-black">{row.recipientName}</div>
                          <p className="mt-1 text-sm font-bold leading-6 opacity-80">
                            {row.region} · 담당 {row.assignedStaffName}
                          </p>
                        </div>
                        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-current">
                          {row.todayState}
                        </span>
                      </div>
                    </article>
                  ))}

                  {data && data.recipientSummaries.length === 0 ? (
                    <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                      아직 대상자 데이터가 없습니다. 대상자 관리에서 등록하세요.
                    </div>
                  ) : null}
                </div>
              </section>

              <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
                <h2 className="text-2xl font-black tracking-[-0.05em]">추천 사례관리</h2>
                <div className="mt-5 space-y-3">
                  {(data?.suggestedCases || []).length === 0 ? (
                    <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                      현재 추천 사례관리 항목이 없습니다.
                    </div>
                  ) : (
                    (data?.suggestedCases || []).map((item) => (
                      <article key={`${item.familyCode}-${item.title}`} className={'rounded-2xl p-4 ring-1 ' + priorityClass(item.priority)}>
                        <div className="text-xs font-black opacity-70">대상자 {item.recipientName}</div>
                        <h3 className="mt-2 text-xl font-black tracking-[-0.05em]">{item.title}</h3>
                        <p className="mt-2 text-sm font-bold leading-7">{item.content}</p>
                        <button
                          onClick={() =>
                            createCase({
                              familyCode: item.familyCode,
                              title: item.title,
                              content: item.content,
                              priority: item.priority,
                              caseType: item.caseType
                            })
                          }
                          disabled={loading}
                          className="mt-4 rounded-xl bg-white/80 px-4 py-3 text-sm font-black ring-1 ring-current disabled:opacity-50"
                        >
                          사례관리로 등록
                        </button>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </section>
          </>
        ) : null}

        {tab === 'recipients' ? (
          <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-2xl font-black tracking-[-0.05em]">대상자 등록</h2>
              <div className="mt-5 space-y-3">
                <Input label="가족코드 6자리" value={recipientForm.familyCode} onChange={(v) => setRecipientForm({ ...recipientForm, familyCode: code6(v) })} />
                <Input label="대상자명" value={recipientForm.recipientName} onChange={(v) => setRecipientForm({ ...recipientForm, recipientName: v })} />
                <Input label="출생연도" value={recipientForm.birthYear} onChange={(v) => setRecipientForm({ ...recipientForm, birthYear: v.replace(/[^\d]/g, '').slice(0, 4) })} />
                <Input label="시도" value={recipientForm.regionSido} onChange={(v) => setRecipientForm({ ...recipientForm, regionSido: v })} />
                <Input label="시군구" value={recipientForm.regionSigungu} onChange={(v) => setRecipientForm({ ...recipientForm, regionSigungu: v })} />
                <Input label="읍면동" value={recipientForm.regionEupmyeondong} onChange={(v) => setRecipientForm({ ...recipientForm, regionEupmyeondong: v })} />
                <Input label="담당 수행기관" value={recipientForm.assignedOrgName} onChange={(v) => setRecipientForm({ ...recipientForm, assignedOrgName: v })} />
                <Input label="담당자" value={recipientForm.assignedStaffName} onChange={(v) => setRecipientForm({ ...recipientForm, assignedStaffName: v })} />
                <Input label="보호자명" value={recipientForm.guardianName} onChange={(v) => setRecipientForm({ ...recipientForm, guardianName: v })} />

                <select
                  value={recipientForm.householdType}
                  onChange={(event) => setRecipientForm({ ...recipientForm, householdType: event.target.value })}
                  className="w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-[#D6F6EC]"
                >
                  <option value="독거">독거</option>
                  <option value="고령부부">고령부부</option>
                  <option value="조손">조손</option>
                  <option value="퇴원 후 관리">퇴원 후 관리</option>
                  <option value="기타">기타</option>
                </select>

                <button
                  onClick={createRecipient}
                  disabled={loading}
                  className="w-full rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
                >
                  대상자 등록
                </button>
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-2xl font-black tracking-[-0.05em]">대상자 목록</h2>
              <div className="mt-5 space-y-3">
                {(data?.recipientSummaries || []).map((row) => (
                  <article key={row.familyCode} className={'rounded-2xl p-4 ring-1 ' + riskClass(row.riskLevel)}>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-xl font-black">{row.recipientName}</h3>
                        <p className="mt-1 text-sm font-bold leading-6 opacity-80">
                          {row.region} · {row.householdType} · 담당 {row.assignedStaffName}
                        </p>
                        <p className="mt-1 text-xs font-black opacity-70">
                          가족코드 {row.familyCode} · 최근 응답률 {row.responseRate14}%
                        </p>
                      </div>
                      <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-current">
                        {row.todayState}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </section>
        ) : null}

        {tab === 'cases' ? (
          <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-2xl font-black tracking-[-0.05em]">사례관리 기록</h2>
              <div className="mt-5 space-y-3">
                <Input label="가족코드 6자리" value={caseForm.familyCode} onChange={(v) => setCaseForm({ ...caseForm, familyCode: code6(v) })} />
                <Input label="제목" value={caseForm.title} onChange={(v) => setCaseForm({ ...caseForm, title: v })} />
                <textarea
                  value={caseForm.content}
                  onChange={(event) => setCaseForm({ ...caseForm, content: event.target.value })}
                  placeholder="전화 확인, 가족 확인 요청, 방문 필요, 기관 연계 등"
                  className="min-h-32 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-[#D6F6EC]"
                />
                <Input label="처리자" value={caseForm.actorName} onChange={(v) => setCaseForm({ ...caseForm, actorName: v })} />
                <Input label="기관명" value={caseForm.orgName} onChange={(v) => setCaseForm({ ...caseForm, orgName: v })} />
                <Input label="다음 조치" value={caseForm.nextAction} onChange={(v) => setCaseForm({ ...caseForm, nextAction: v })} />

                <select
                  value={caseForm.priority}
                  onChange={(event) => setCaseForm({ ...caseForm, priority: event.target.value })}
                  className="w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-[#D6F6EC]"
                >
                  <option value="high">높음</option>
                  <option value="medium">중간</option>
                  <option value="low">낮음</option>
                </select>

                <button
                  onClick={() => createCase()}
                  disabled={loading || !caseForm.title.trim()}
                  className="w-full rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
                >
                  사례관리 저장
                </button>
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-2xl font-black tracking-[-0.05em]">사례관리 목록</h2>
              <div className="mt-5 space-y-3">
                {(data?.cases || []).map((item) => (
                  <article key={item.id} className={'rounded-2xl p-4 ring-1 ' + statusClass(item.status)}>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-current">
                            {item.status === 'done' ? '완료' : '미처리'}
                          </span>
                          <span className={'rounded-full px-3 py-1 text-xs font-black ring-1 ' + priorityClass(item.priority)}>
                            우선순위 {item.priority || 'medium'}
                          </span>
                        </div>
                        <h3 className="mt-3 text-xl font-black">{item.title || '사례관리 기록'}</h3>
                        <p className="mt-2 text-sm font-bold leading-7 opacity-80">{item.content || '-'}</p>
                        <p className="mt-2 text-xs font-black opacity-70">
                          가족코드 {item.family_code || '-'} · 처리자 {item.actor_name || '-'}
                        </p>
                      </div>

                      <div className="grid min-w-32 gap-2">
                        <button
                          onClick={() => updateCase(item, 'done')}
                          disabled={loading || item.status === 'done'}
                          className="rounded-xl bg-[#247A71] px-4 py-3 text-sm font-black text-white disabled:opacity-50"
                        >
                          완료
                        </button>
                        <button
                          onClick={() => updateCase(item, 'open')}
                          disabled={loading}
                          className="rounded-xl bg-white/70 px-4 py-3 text-sm font-black ring-1 ring-current disabled:opacity-50"
                        >
                          재개
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </section>
        ) : null}

        {tab === 'reports' ? (
          <>
            <section className="grid gap-4 md:grid-cols-4">
              <MetricCard title="월간 대상자" value={`${metrics.totalRecipients}명`} desc="등록 및 자동 감지 대상자" />
              <MetricCard title="고위험 대상자" value={`${metrics.highRisk}명`} desc="도움 요청 또는 반복 위험" tone="danger" />
              <MetricCard title="사례관리 완료율" value={`${metrics.caseCompleteRate}%`} desc="사례관리 완료 기준" tone="good" />
              <MetricCard title="가족 확인 완료율" value={`${metrics.familyCheckRate}%`} desc="가족 실행 보드 기준" tone="good" />
            </section>

            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">월간 성과 리포트 초안</h2>
              <div className="mt-5 grid gap-3">
                <ReportLine label="등록 대상자 수" value={`${metrics.totalRecipients}명`} />
                <ReportLine label="오늘 미응답 대상자" value={`${metrics.noResponse}명`} />
                <ReportLine label="식사 미확인" value={`${metrics.mealMissing}건`} />
                <ReportLine label="복약 미확인" value={`${metrics.medicationMissing}건`} />
                <ReportLine label="도움 요청" value={`${metrics.helpRequests}건`} />
                <ReportLine label="미처리 사례관리" value={`${metrics.openCases}건`} />
                <ReportLine label="완료 사례관리" value={`${metrics.completedCases}건`} />
                <ReportLine label="가족 확인 완료율" value={`${metrics.familyCheckRate}%`} />
              </div>
            </section>
          </>
        ) : null}

        {tab === 'audit' ? (
          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">접근·처리 감사 로그</h2>
            <div className="mt-5 space-y-3">
              {(data?.auditLogs || []).length === 0 ? (
                <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                  아직 감사 로그가 없습니다.
                </div>
              ) : (
                (data?.auditLogs || []).map((item) => (
                  <article key={item.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    <div className="text-lg font-black">{item.description || '처리 기록'}</div>
                    <p className="mt-1 text-sm font-bold leading-6 text-[#637B76]">
                      {item.actor_name || '-'} · {item.actor_role || '-'} · {item.action_type || '-'} · {item.created_at || '-'}
                    </p>
                  </article>
                ))
              )}
            </div>
          </section>
        ) : null}

        {tab === 'export' ? (
          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">CSV/PDF 내보내기 준비</h2>
            <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">
              현재는 대상자 CSV를 우선 제공합니다. 이후 월간 성과 PDF와 실증 결과보고 PDF로 확장합니다.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <a
                href="/api/gov-export"
                className="rounded-2xl bg-[#247A71] px-5 py-4 text-center text-sm font-black text-white"
              >
                대상자 CSV 다운로드
              </a>

              <Link
                href="/gov/reports"
                className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
              >
                월간 리포트 보기
              </Link>
            </div>
          </section>
        ) : null}

        {tab === 'proposal' ? (
          <section className="space-y-5">
            <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
                R&D 제안 패키지
              </div>
              <h2 className="mt-5 text-3xl font-black tracking-[-0.06em]">
                안부지문 기반 지역사회 통합돌봄 모니터링 플랫폼 개발 및 실증
              </h2>
              <p className="mt-4 text-sm font-bold leading-7 text-[#637B76]">
                고령자의 식사·복약·몸 상태·도움 요청 선택 데이터를 생활리듬 지표로 변환하고, 가족·수행기관·지자체가 위험 신호를 함께 확인·조치·보고할 수 있는 ICT 기반 통합돌봄 모니터링 플랫폼을 개발·실증합니다.
              </p>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <InfoCard title="정책 부합성" desc="스마트 사회서비스, 지역사회 통합돌봄, 노인맞춤돌봄 ICT 안전·안부확인, 고독사 예방사업과 연계합니다." />
              <InfoCard title="핵심 기술" desc="안부지문 알고리즘, 생활리듬 변화감지, 가족 실행 보드, 지자체 사례관리·성과보고 시스템." />
              <InfoCard title="실증 규모" desc="MVP 100명, 권장 200명. 1개 시군구 또는 수행기관 2~3곳으로 시작합니다." />
              <InfoCard title="성과지표" desc="응답률, 식사·복약 확인률, 도움 요청 감지, 가족 확인 완료율, 사례관리 완료율, 평균 확인 소요시간." />
            </section>

            <section className="rounded-[2rem] bg-[#247A71] p-5 text-white sm:p-6">
              <h3 className="text-2xl font-black tracking-[-0.05em]">준비된 문서</h3>
              <p className="mt-3 text-sm font-bold leading-7 text-[#E7FFF7]">
                docs 폴더에 R&D 제안서, 실증 계획, KPI 매트릭스, 보안 체크리스트 초안을 생성했습니다.
              </p>
            </section>
          </section>
        ) : null}
      </section>
    </main>
  )
}

function Input({
  label,
  value,
  onChange
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-[#637B76]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-[#D6F6EC]"
      />
    </label>
  )
}

function ReportLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
      <div className="text-sm font-black text-[#637B76]">{label}</div>
      <div className="text-lg font-black text-[#17443F]">{value}</div>
    </div>
  )
}

function InfoCard({ title, desc }: { title: string; desc: string }) {
  return (
    <article className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7]">
      <h3 className="text-2xl font-black tracking-[-0.05em]">{title}</h3>
      <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">{desc}</p>
    </article>
  )
}

export default GovPlatformPanel
