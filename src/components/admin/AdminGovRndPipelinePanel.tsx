'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Lead = {
  id: string
  leadType: string
  organizationName: string
  department: string
  contactName: string
  email: string
  phone: string
  channel: string
  stage: string
  priority: string
  focusArea: string
  region: string
  expectedUnits: number
  monthlyFee: number
  hardwareModel: string
  sampleCount: number
  nextAction: string
  nextActionDate: string
  memo: string
  createdAt: string
  updatedAt: string
}

type Metrics = {
  total: number
  municipality: number
  supplier: number
  rnd: number
  proposal: number
  sample: number
  dueToday: number
  expectedUnits: number
  sampleCount: number
}

type FormState = {
  leadType: string
  organizationName: string
  department: string
  contactName: string
  email: string
  phone: string
  channel: string
  stage: string
  priority: string
  focusArea: string
  region: string
  expectedUnits: string
  monthlyFee: string
  hardwareModel: string
  sampleCount: string
  nextAction: string
  nextActionDate: string
  memo: string
}

type Template = {
  key: string
  title: string
  desc: string
  defaults: Partial<FormState>
}

type PipelineData = {
  ok: boolean
  message?: string
  stages?: string[]
  leads?: Lead[]
  metrics?: Metrics
  templates?: Template[]
  sourceErrors?: string[]
}

const DEFAULT_STAGES = ['발굴', '문의/자료요청', '샘플/견적', '실증협의', '제안서', '보류/완료']

const initialForm: FormState = {
  leadType: 'municipality',
  organizationName: '',
  department: '',
  contactName: '',
  email: '',
  phone: '',
  channel: '직접제안',
  stage: '발굴',
  priority: 'medium',
  focusArea: '3~5가구 예비 실증',
  region: '',
  expectedUnits: '5',
  monthlyFee: '4500',
  hardwareModel: '안부완료 리포트',
  sampleCount: '2',
  nextAction: '자료 요청',
  nextActionDate: '',
  memo: ''
}

function typeLabel(type: string) {
  if (type === 'municipality') return '지자체'
  if (type === 'smart-ring-supplier') return '안부리포트'
  if (type === 'rnd') return 'R&D'
  if (type === 'investor') return '투자'
  if (type === 'partner') return '파트너'
  return type || '리드'
}

function priorityClass(priority: string) {
  if (priority === 'high') return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  if (priority === 'medium') return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  return 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'
}

function typeClass(type: string) {
  if (type === 'smart-ring-supplier') return 'bg-[#F6F4FF] text-[#4A3A8A] ring-[#DED8FF]'
  if (type === 'rnd') return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  if (type === 'municipality') return 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'
  return 'bg-white text-[#17443F] ring-[#D6EDE7]'
}

function localKey() {
  return 'anbu-gov-rnd-local-leads'
}

function readLocalLeads(): Lead[] {
  if (typeof window === 'undefined') return []

  try {
    return JSON.parse(window.localStorage.getItem(localKey()) || '[]') as Lead[]
  } catch {
    return []
  }
}

function writeLocalLeads(leads: Lead[]) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(localKey(), JSON.stringify(leads.slice(0, 100)))
}

function formatDate(value: string) {
  if (!value) return '날짜 없음'

  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return value

  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(parsed))
}

function isDue(date: string) {
  if (!date) return false

  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date())

  return date <= today
}

function makeLocalLead(form: FormState): Lead {
  const now = new Date().toISOString()

  return {
    id: `local-${Date.now()}`,
    leadType: form.leadType,
    organizationName: form.organizationName || '이름 없음',
    department: form.department,
    contactName: form.contactName,
    email: form.email,
    phone: form.phone,
    channel: form.channel,
    stage: form.stage,
    priority: form.priority,
    focusArea: form.focusArea,
    region: form.region,
    expectedUnits: Number(form.expectedUnits) || 0,
    monthlyFee: Number(form.monthlyFee) || 0,
    hardwareModel: form.hardwareModel,
    sampleCount: Number(form.sampleCount) || 0,
    nextAction: form.nextAction,
    nextActionDate: form.nextActionDate,
    memo: form.memo,
    createdAt: now,
    updatedAt: now
  }
}

function Pill({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${className || 'bg-white text-[#17443F] ring-[#D6EDE7]'}`}>
      {children}
    </span>
  )
}

function LeadCard({
  lead,
  stages,
  onMove,
  onQuickMemo
}: {
  lead: Lead
  stages: string[]
  onMove: (id: string, stage: string) => void
  onQuickMemo: (lead: Lead) => void
}) {
  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#D6EDE7]">
      <div className="flex flex-wrap gap-2">
        <Pill className={typeClass(lead.leadType)}>{typeLabel(lead.leadType)}</Pill>
        <Pill className={priorityClass(lead.priority)}>
          {lead.priority === 'high' ? '높음' : lead.priority === 'medium' ? '보통' : '낮음'}
        </Pill>
        {isDue(lead.nextActionDate) && lead.stage !== '보류/완료' ? (
          <Pill className="bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]">오늘 처리</Pill>
        ) : null}
      </div>

      <h3 className="mt-3 text-xl font-black tracking-[-0.05em]">{lead.organizationName}</h3>

      <p className="mt-2 text-sm font-bold leading-6 text-[#637B76]">
        {lead.focusArea || '관리 목적 미입력'}
      </p>

      <div className="mt-4 grid gap-2 text-xs font-black text-[#17443F]">
        {lead.contactName || lead.department ? (
          <div className="rounded-xl bg-[#FAFFFD] px-3 py-2 ring-1 ring-[#D6EDE7]">
            {lead.department || '부서 없음'} · {lead.contactName || '담당자 없음'}
          </div>
        ) : null}

        {lead.hardwareModel || lead.sampleCount ? (
          <div className="rounded-xl bg-[#FAFFFD] px-3 py-2 ring-1 ring-[#D6EDE7]">
            모델 {lead.hardwareModel || '-'} · 샘플 {lead.sampleCount || 0}개
          </div>
        ) : null}

        <div className="rounded-xl bg-[#FAFFFD] px-3 py-2 ring-1 ring-[#D6EDE7]">
          예상 {lead.expectedUnits || 0}가구 · 월 {Number(lead.monthlyFee || 0).toLocaleString()}원
        </div>

        <div className="rounded-xl bg-[#FAFFFD] px-3 py-2 ring-1 ring-[#D6EDE7]">
          다음: {lead.nextAction || '미정'} · {formatDate(lead.nextActionDate)}
        </div>
      </div>

      {lead.memo ? (
        <p className="mt-3 rounded-xl bg-[#FFF9EE] p-3 text-xs font-bold leading-6 text-[#795C22] ring-1 ring-[#F3DEB5]">
          {lead.memo}
        </p>
      ) : null}

      <div className="mt-4 grid gap-2">
        <select
          value={lead.stage}
          onChange={(event) => onMove(lead.id, event.target.value)}
          className="rounded-xl border border-[#D6EDE7] bg-white px-3 py-3 text-xs font-black outline-none"
        >
          {stages.map((stage) => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </select>

        <button
          onClick={() => onQuickMemo(lead)}
          className="rounded-xl bg-[#EFFFFA] px-3 py-3 text-xs font-black text-[#247A71] ring-1 ring-[#CDEFE7]"
        >
          메모/다음액션 수정
        </button>
      </div>
    </article>
  )
}

export function AdminGovRndPipelinePanel() {
  const [data, setData] = useState<PipelineData | null>(null)
  const [form, setForm] = useState<FormState>(initialForm)
  const [localLeads, setLocalLeads] = useState<Lead[]>([])
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('전체')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [editLead, setEditLead] = useState<Lead | null>(null)

  const stages = data?.stages?.length ? data.stages : DEFAULT_STAGES
  const templates = data?.templates || []
  const sourceErrors = data?.sourceErrors || []

  const leads = useMemo(() => {
    const server = data?.leads || []
    const all = [...localLeads, ...server]
    const seen = new Set<string>()

    return all.filter((lead) => {
      const key = lead.id || `${lead.organizationName}-${lead.stage}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [data, localLeads])

  const filteredLeads = useMemo(() => {
    const textQuery = query.trim().toLowerCase()

    return leads.filter((lead) => {
      const haystack = [
        lead.organizationName,
        lead.department,
        lead.contactName,
        lead.email,
        lead.phone,
        lead.focusArea,
        lead.region,
        lead.hardwareModel,
        lead.memo,
        lead.nextAction,
        lead.leadType
      ].join(' ').toLowerCase()

      const queryOk = !textQuery || haystack.includes(textQuery)
      const typeOk = typeFilter === '전체' || lead.leadType === typeFilter

      return queryOk && typeOk
    })
  }, [leads, query, typeFilter])

  const metrics = useMemo(() => {
    const target = filteredLeads
    return {
      total: target.length,
      municipality: target.filter((lead) => lead.leadType === 'municipality').length,
      supplier: target.filter((lead) => lead.leadType === 'smart-ring-supplier').length,
      rnd: target.filter((lead) => lead.leadType === 'rnd').length,
      dueToday: target.filter((lead) => isDue(lead.nextActionDate) && lead.stage !== '보류/완료').length,
      expectedUnits: target.reduce((sum, lead) => sum + (lead.expectedUnits || 0), 0),
      sampleCount: target.reduce((sum, lead) => sum + (lead.sampleCount || 0), 0)
    }
  }, [filteredLeads])

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({
      ...prev,
      [key]: value
    }))
  }

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin-gov-rnd-pipeline', {
        cache: 'no-store',
        credentials: 'include'
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || result.ok === false) {
        setMessage(result.message || '지자체·R&D 파이프라인을 불러오지 못했습니다.')
        setData(result)
        return
      }

      setData(result)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '지자체·R&D 파이프라인을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function createLead() {
    if (!form.organizationName.trim()) {
      setMessage('기관/업체명을 입력해주세요.')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin-gov-rnd-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          action: 'create',
          ...form
        })
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || result.ok === false) {
        setMessage(result.message || '리드 저장에 실패했습니다.')
        return
      }

      if (!result.persisted) {
        const next = [result.lead || makeLocalLead(form), ...readLocalLeads()].slice(0, 100)
        writeLocalLeads(next)
        setLocalLeads(next)
      }

      setMessage(result.persisted ? '파이프라인에 저장했습니다.' : '서버 저장은 실패했지만 이 기기에 임시 저장했습니다.')
      setForm(initialForm)
      await load()
    } catch (error) {
      const next = [makeLocalLead(form), ...readLocalLeads()].slice(0, 100)
      writeLocalLeads(next)
      setLocalLeads(next)
      setMessage(error instanceof Error ? error.message : '서버 저장 실패. 이 기기에 임시 저장했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function updateLead(id: string, patch: Partial<Lead>) {
    const localUpdated = localLeads.map((lead) => (
      lead.id === id
        ? {
            ...lead,
            ...patch,
            updatedAt: new Date().toISOString()
          }
        : lead
    ))
    setLocalLeads(localUpdated)
    writeLocalLeads(localUpdated)

    try {
      await fetch('/api/admin-gov-rnd-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({
          action: 'update',
          id,
          ...patch
        })
      })
      await load()
    } catch {
      // 로컬 반영은 이미 완료했습니다.
    }
  }

  function fillTemplate(template: Template) {
    setForm((prev) => ({
      ...prev,
      ...template.defaults
    }))
    setMessage(`${template.title} 템플릿을 입력폼에 넣었습니다.`)
  }

  function openEdit(lead: Lead) {
    setEditLead(lead)
  }

  async function saveEdit() {
    if (!editLead) return

    await updateLead(editLead.id, {
      nextAction: editLead.nextAction,
      nextActionDate: editLead.nextActionDate,
      memo: editLead.memo,
      expectedUnits: editLead.expectedUnits,
      sampleCount: editLead.sampleCount
    })

    setEditLead(null)
    setMessage('다음 액션과 메모를 업데이트했습니다.')
  }

  async function copySummary() {
    const lines = [
      '[안부웍스] 지자체·R&D 파이프라인 요약',
      '',
      `전체 리드: ${metrics.total}건`,
      `지자체: ${metrics.municipality}건`,
      `안부리포트 공급사: ${metrics.supplier}건`,
      `R&D: ${metrics.rnd}건`,
      `오늘 처리할 액션: ${metrics.dueToday}건`,
      `예상 실증 가구: ${metrics.expectedUnits}가구`,
      `샘플 수량: ${metrics.sampleCount}개`,
      '',
      ...filteredLeads.slice(0, 20).map((lead) => {
        return `- ${lead.organizationName} / ${lead.stage} / ${lead.nextAction || '다음 액션 없음'} / ${lead.nextActionDate || '날짜 없음'}`
      })
    ]

    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      setMessage('파이프라인 요약을 복사했습니다.')
    } catch {
      setMessage('복사에 실패했습니다. 브라우저 권한을 확인해주세요.')
    }
  }

  useEffect(() => {
    setLocalLeads(readLocalLeads())
    load()
  }, [])

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#E7FFF7_0%,#F7FFFC_34%,#FFFFFF_72%)] px-4 py-8 text-[#17443F]">
      <section className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[2.5rem] bg-white/95 shadow-[0_24px_80px_rgba(49,151,136,0.10)] ring-1 ring-[#D6EDE7]">
          <div className="grid gap-0 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="p-6 sm:p-9">
              <div className="flex flex-wrap gap-2">
                <Pill className="bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]">지자체·R&D</Pill>
                <Pill className="bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]">B2G Pipeline</Pill>
                <Pill>안부리포트 공급망</Pill>
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.08em] sm:text-6xl">
                제안·샘플·실증을
                <br />
                한 화면에서 관리합니다.
              </h1>

              <p className="mt-5 max-w-3xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
                지자체, R&D 사업, 안부리포트 공급사, 투자사, 파트너 후속 연락을 단계별로 관리합니다.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  onClick={load}
                  disabled={loading}
                  className="rounded-2xl bg-[#EFFFFA] px-5 py-4 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7] disabled:opacity-50"
                >
                  {loading ? '새로고침 중' : '새로고침'}
                </button>

                <button
                  onClick={copySummary}
                  className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
                >
                  요약 복사
                </button>

                <Link
                  href="/admin/ops/proposal-reality-check"
                  className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
                >
                  제안 표현 점검
                </Link>

                <Link
                  href="/admin/ops"
                  className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
                >
                  Admin 운영실
                </Link>
              </div>
            </div>

            <aside className="bg-[linear-gradient(135deg,#FFF9EE_0%,#F7FFFC_50%,#FFFFFF_100%)] p-6 sm:p-9">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/90 p-5 ring-1 ring-[#D6EDE7]">
                  <div className="text-xs font-black text-[#637B76]">전체 리드</div>
                  <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{metrics.total}</div>
                </div>
                <div className="rounded-2xl bg-white/90 p-5 ring-1 ring-[#D6EDE7]">
                  <div className="text-xs font-black text-[#637B76]">오늘 처리</div>
                  <div className="mt-2 text-4xl font-black tracking-[-0.08em] text-[#8A3030]">{metrics.dueToday}</div>
                </div>
                <div className="rounded-2xl bg-white/90 p-5 ring-1 ring-[#D6EDE7]">
                  <div className="text-xs font-black text-[#637B76]">예상 실증 가구</div>
                  <div className="mt-2 text-4xl font-black tracking-[-0.08em] text-[#247A71]">{metrics.expectedUnits}</div>
                </div>
                <div className="rounded-2xl bg-white/90 p-5 ring-1 ring-[#D6EDE7]">
                  <div className="text-xs font-black text-[#637B76]">샘플 수량</div>
                  <div className="mt-2 text-4xl font-black tracking-[-0.08em] text-[#4A3A8A]">{metrics.sampleCount}</div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {message ? (
          <section className="rounded-[2rem] bg-[#FFF9EE] p-5 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            {message}
          </section>
        ) : null}

        <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Pill className="bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]">템플릿</Pill>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.07em]">빠른 입력 템플릿</h2>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {templates.map((template) => (
              <button
                key={template.key}
                onClick={() => fillTemplate(template)}
                className="rounded-2xl bg-[#FAFFFD] p-4 text-left ring-1 ring-[#D6EDE7] transition hover:-translate-y-0.5 hover:bg-white"
              >
                <div className="text-lg font-black tracking-[-0.05em]">{template.title}</div>
                <p className="mt-2 text-xs font-bold leading-6 text-[#637B76]">{template.desc}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-[2rem] bg-white/95 p-6 shadow-sm ring-1 ring-[#D6EDE7]">
            <Pill className="bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]">리드 추가</Pill>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.07em]">새 후속관리 항목</h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-black text-[#637B76]">유형</span>
                <select
                  value={form.leadType}
                  onChange={(event) => setField('leadType', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                >
                  <option value="municipality">지자체</option>
                  <option value="smart-ring-supplier">안부리포트 공급사</option>
                  <option value="rnd">R&D/공모</option>
                  <option value="investor">투자사</option>
                  <option value="partner">파트너</option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-black text-[#637B76]">단계</span>
                <select
                  value={form.stage}
                  onChange={(event) => setField('stage', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                >
                  {stages.map((stage) => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
              </label>

              <label className="block sm:col-span-2">
                <span className="text-sm font-black text-[#637B76]">기관/업체명</span>
                <input
                  value={form.organizationName}
                  onChange={(event) => setField('organizationName', event.target.value.slice(0, 80))}
                  placeholder="예: ○○군 복지과, eIoT, Goodway"
                  className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-[#637B76]">부서</span>
                <input
                  value={form.department}
                  onChange={(event) => setField('department', event.target.value.slice(0, 80))}
                  className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-[#637B76]">담당자</span>
                <input
                  value={form.contactName}
                  onChange={(event) => setField('contactName', event.target.value.slice(0, 60))}
                  className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-[#637B76]">이메일</span>
                <input
                  value={form.email}
                  onChange={(event) => setField('email', event.target.value.slice(0, 120))}
                  className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-[#637B76]">연락처/채널</span>
                <input
                  value={form.phone}
                  onChange={(event) => setField('phone', event.target.value.slice(0, 60))}
                  placeholder="전화, WhatsApp, 카카오 등"
                  className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-[#637B76]">우선순위</span>
                <select
                  value={form.priority}
                  onChange={(event) => setField('priority', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                >
                  <option value="high">높음</option>
                  <option value="medium">보통</option>
                  <option value="low">낮음</option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-black text-[#637B76]">지역</span>
                <input
                  value={form.region}
                  onChange={(event) => setField('region', event.target.value.slice(0, 80))}
                  className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="text-sm font-black text-[#637B76]">초점</span>
                <input
                  value={form.focusArea}
                  onChange={(event) => setField('focusArea', event.target.value.slice(0, 140))}
                  placeholder="예: 3~5가구 예비 실증, 안부리포트 SDK, B2G 제안"
                  className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-[#637B76]">예상 가구 수</span>
                <input
                  value={form.expectedUnits}
                  onChange={(event) => setField('expectedUnits', event.target.value.replace(/[^\d]/g, '').slice(0, 8))}
                  className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-[#637B76]">월 관제료</span>
                <input
                  value={form.monthlyFee}
                  onChange={(event) => setField('monthlyFee', event.target.value.replace(/[^\d]/g, '').slice(0, 8))}
                  className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-[#637B76]">모델/제품</span>
                <input
                  value={form.hardwareModel}
                  onChange={(event) => setField('hardwareModel', event.target.value.slice(0, 80))}
                  placeholder="예: TM22, BCL603M1"
                  className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-[#637B76]">샘플 수량</span>
                <input
                  value={form.sampleCount}
                  onChange={(event) => setField('sampleCount', event.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                  className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-[#637B76]">다음 액션</span>
                <input
                  value={form.nextAction}
                  onChange={(event) => setField('nextAction', event.target.value.slice(0, 140))}
                  className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-[#637B76]">다음 연락일</span>
                <input
                  type="date"
                  value={form.nextActionDate}
                  onChange={(event) => setField('nextActionDate', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="text-sm font-black text-[#637B76]">메모</span>
                <textarea
                  value={form.memo}
                  onChange={(event) => setField('memo', event.target.value.slice(0, 1200))}
                  className="mt-2 min-h-[120px] w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-bold leading-7 outline-none"
                />
              </label>
            </div>

            <button
              onClick={createLead}
              disabled={saving}
              className="mt-5 w-full rounded-2xl bg-[#EFFFFA] px-5 py-5 text-base font-black text-[#247A71] ring-1 ring-[#CDEFE7] disabled:opacity-50"
            >
              {saving ? '저장 중...' : '파이프라인에 추가'}
            </button>
          </article>

          <article className="rounded-[2rem] bg-white/95 p-6 shadow-sm ring-1 ring-[#D6EDE7]">
            <Pill className="bg-[#FAFFFD] text-[#17443F] ring-[#D6EDE7]">검색/필터</Pill>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.07em]">현재 파이프라인</h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="기관, 담당자, 안부리포트, 지자체, R&D 검색"
                className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
              />

              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
              >
                <option value="전체">전체</option>
                <option value="municipality">지자체</option>
                <option value="smart-ring-supplier">안부리포트</option>
                <option value="rnd">R&D</option>
                <option value="investor">투자</option>
                <option value="partner">파트너</option>
              </select>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                <div className="text-xs font-black text-[#637B76]">지자체</div>
                <div className="mt-2 text-3xl font-black">{metrics.municipality}</div>
              </div>
              <div className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                <div className="text-xs font-black text-[#637B76]">안부리포트</div>
                <div className="mt-2 text-3xl font-black">{metrics.supplier}</div>
              </div>
              <div className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                <div className="text-xs font-black text-[#637B76]">R&D</div>
                <div className="mt-2 text-3xl font-black">{metrics.rnd}</div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
              고객 화면에는 보이지 않는 운영실 전용 파이프라인입니다. 지자체·R&D 제안에서는 비의료 안부 참고, 보호자 확인, 실증 데이터 표현을 우선 사용하세요.
            </div>

            {sourceErrors.length ? (
              <details className="mt-5 rounded-2xl bg-white p-4 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D6EDE7]">
                <summary className="cursor-pointer font-black text-[#795C22]">
                  데이터 연결 확인 필요 {sourceErrors.length}건
                </summary>
                <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-xl bg-[#FFF9EE] p-3 text-xs text-[#795C22]">
                  {sourceErrors.join('\n\n')}
                </pre>
              </details>
            ) : null}
          </article>
        </section>

        <section className="overflow-x-auto pb-4">
          <div className="grid min-w-[1200px] grid-cols-6 gap-4">
            {stages.map((stage) => {
              const column = filteredLeads.filter((lead) => lead.stage === stage)

              return (
                <section key={stage} className="rounded-[2rem] bg-white/90 p-4 shadow-sm ring-1 ring-[#D6EDE7]">
                  <div className="sticky top-3 z-10 rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    <div className="text-lg font-black tracking-[-0.05em]">{stage}</div>
                    <div className="mt-1 text-xs font-black text-[#637B76]">{column.length}건</div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {column.length ? (
                      column.map((lead) => (
                        <LeadCard
                          key={lead.id}
                          lead={lead}
                          stages={stages}
                          onMove={(id, nextStage) => updateLead(id, { stage: nextStage })}
                          onQuickMemo={openEdit}
                        />
                      ))
                    ) : (
                      <div className="rounded-2xl bg-[#FAFFFD] p-4 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D6EDE7]">
                        아직 항목이 없습니다.
                      </div>
                    )}
                  </div>
                </section>
              )
            })}
          </div>
        </section>

        {editLead ? (
          <section className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 px-4 py-4 backdrop-blur-sm sm:items-center">
            <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl ring-1 ring-[#D6EDE7]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Pill className={typeClass(editLead.leadType)}>{typeLabel(editLead.leadType)}</Pill>
                  <h2 className="mt-3 text-3xl font-black tracking-[-0.07em]">{editLead.organizationName}</h2>
                </div>

                <button
                  onClick={() => setEditLead(null)}
                  className="rounded-full bg-[#FAFFFD] px-4 py-2 text-sm font-black ring-1 ring-[#D6EDE7]"
                >
                  닫기
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-black text-[#637B76]">다음 액션</span>
                  <input
                    value={editLead.nextAction}
                    onChange={(event) => setEditLead({ ...editLead, nextAction: event.target.value.slice(0, 140) })}
                    className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-black text-[#637B76]">다음 연락일</span>
                  <input
                    type="date"
                    value={editLead.nextActionDate}
                    onChange={(event) => setEditLead({ ...editLead, nextActionDate: event.target.value })}
                    className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-black text-[#637B76]">예상 가구 수</span>
                  <input
                    value={String(editLead.expectedUnits || '')}
                    onChange={(event) => setEditLead({ ...editLead, expectedUnits: Number(event.target.value.replace(/[^\d]/g, '')) || 0 })}
                    className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-black text-[#637B76]">샘플 수량</span>
                  <input
                    value={String(editLead.sampleCount || '')}
                    onChange={(event) => setEditLead({ ...editLead, sampleCount: Number(event.target.value.replace(/[^\d]/g, '')) || 0 })}
                    className="mt-2 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="text-sm font-black text-[#637B76]">메모</span>
                  <textarea
                    value={editLead.memo}
                    onChange={(event) => setEditLead({ ...editLead, memo: event.target.value.slice(0, 1200) })}
                    className="mt-2 min-h-[140px] w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-bold leading-7 outline-none"
                  />
                </label>
              </div>

              <button
                onClick={saveEdit}
                className="mt-5 w-full rounded-2xl bg-[#EFFFFA] px-5 py-5 text-base font-black text-[#247A71] ring-1 ring-[#CDEFE7]"
              >
                수정 저장
              </button>
            </div>
          </section>
        ) : null}
      </section>
    </main>
  )
}

export default AdminGovRndPipelinePanel
