'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Household = {
  id: string
  family_code?: string
  parent_name?: string
  parent_phone?: string
  guardian_name?: string
  guardian_phone?: string
  service_area?: string
  address_hint?: string
  risk_group?: string
  risk_level?: string
  household_status?: string
  pilot_group?: string
  consent_status?: string
  notes?: string
  created_at?: string
  open_incident_count?: number
  urgent_incident_count?: number
  total_signal_count?: number
  last_signal_label?: string
  last_signal_at?: string
  derived_status?: string
}

type HouseholdLog = {
  id: string
  action_type?: string
  message?: string
  created_at?: string
}

type Metrics = {
  total: number
  active: number
  archived: number
  groupA: number
  groupB: number
  consentApproved: number
  consentPending: number
  openIncidents: number
  urgentIncidents: number
}

function phoneOnly(value: string) {
  return value.replace(/[^\d]/g, '')
}

function code6(value: string) {
  return value.replace(/[^\d]/g, '').slice(0, 6)
}

function statusClass(status?: string) {
  if (status === 'urgent') return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  if (status === 'attention') return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  if (status === 'consent_needed') return 'bg-[#F3F8FF] text-[#255B83] ring-[#D8EAFB]'
  return 'bg-[#EFFFFA] text-[#2AA897] ring-[#CDEFE7]'
}

function consentLabel(status?: string) {
  if (status === 'approved') return '동의 완료'
  if (status === 'rejected') return '동의 거부'
  if (status === 'expired') return '동의 만료'
  return '동의 대기'
}

function householdStatusLabel(status?: string) {
  if (status === 'active') return '운영 중'
  if (status === 'archived') return '보관'
  if (status === 'paused') return '중지'
  return status || '대기'
}

function derivedLabel(status?: string) {
  if (status === 'urgent') return '긴급'
  if (status === 'attention') return '확인 필요'
  if (status === 'consent_needed') return '동의 필요'
  return '정상'
}

function MetricCard({ title, value, desc, danger }: { title: string; value: string; desc: string; danger?: boolean }) {
  return (
    <article className={'rounded-[2rem] p-5 shadow-sm ring-1 ' + (danger ? 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]' : 'bg-white text-[#17443F] ring-[#D6EDE7]')}>
      <div className="text-sm font-black opacity-70">{title}</div>
      <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{value}</div>
      <p className="mt-2 text-sm font-bold leading-6 opacity-75">{desc}</p>
    </article>
  )
}

export function OpsHouseholdsPanel({
  title = '실증 대상자 관리',
  subtitle = '지자체 실증과 운영실 관제를 위한 관리 대상자, 보호자, 권역, 위험군, 동의 상태를 관리합니다.'
}: {
  title?: string
  subtitle?: string
}) {
  const [households, setHouseholds] = useState<Household[]>([])
  const [logs, setLogs] = useState<HouseholdLog[]>([])
  const [metrics, setMetrics] = useState<Metrics>({ total: 0, active: 0, archived: 0, groupA: 0, groupB: 0, consentApproved: 0, consentPending: 0, openIncidents: 0, urgentIncidents: 0 })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'urgent' | 'attention' | 'consent'>('all')
  const [testPhone, setTestPhone] = useState('')
  const [form, setForm] = useState({
    familyCode: '',
    parentName: '',
    parentPhone: '',
    guardianName: '',
    guardianPhone: '',
    serviceArea: '우리동네',
    addressHint: '',
    riskGroup: 'B',
    consentStatus: 'pending',
    notes: ''
  })

  const filteredHouseholds = useMemo(() => {
    if (filter === 'active') return households.filter((row) => row.household_status === 'active')
    if (filter === 'urgent') return households.filter((row) => row.derived_status === 'urgent')
    if (filter === 'attention') return households.filter((row) => row.derived_status === 'attention')
    if (filter === 'consent') return households.filter((row) => row.consent_status !== 'approved')
    return households
  }, [households, filter])

  async function load() {
    setLoading(true)

    try {
      const response = await fetch('/api/ops-households', { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '실증 대상자 목록을 불러오지 못했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      setHouseholds(Array.isArray(data.households) ? data.households : [])
      setLogs(Array.isArray(data.logs) ? data.logs : [])
      setMetrics(data.metrics || { total: 0, active: 0, archived: 0, groupA: 0, groupB: 0, consentApproved: 0, consentPending: 0, openIncidents: 0, urgentIncidents: 0 })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '실증 대상자 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function post(action: string, payload: Record<string, unknown>) {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/ops-households', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '처리에 실패했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        await load()
        return
      }

      setMessage(data.message || '처리되었습니다.')
      setDebug(data.households || data.household || data.request ? JSON.stringify(data.households || data.household || data.request, null, 2) : '')
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  function downloadCsv() {
    const headers = [
      'family_code',
      'parent_name',
      'parent_phone',
      'guardian_name',
      'guardian_phone',
      'service_area',
      'risk_group',
      'household_status',
      'consent_status',
      'open_incident_count',
      'urgent_incident_count',
      'last_signal_label',
      'last_signal_at'
    ]

    const csv = [
      headers.join(','),
      ...households.map((row) =>
        headers
          .map((key) => {
            const value = String((row as Record<string, unknown>)[key] ?? '')
            return '"' + value.replace(/"/g, '""') + '"'
          })
          .join(',')
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `anbu-households-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-5 text-[#17443F] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            실증 대상자
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            {title}
          </h1>

          <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            {subtitle}
          </p>

          <div className="mt-5 rounded-2xl bg-[#FAFFFD] p-4 text-sm font-black leading-7 text-[#637B76] ring-1 ring-[#D6EDE7]">
            A그룹은 고위험 취약 노인, B그룹은 일반 관리 노인으로 운영합니다. 운영 보고서와 지자체 제출 자료의 기준 데이터가 됩니다.
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={load}
              disabled={loading}
              className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
            >
              새로고침
            </button>

            <button
              onClick={downloadCsv}
              disabled={households.length === 0}
              className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50"
            >
              CSV 다운로드
            </button>

            <Link href="/admin/ops/autopilot" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              오토파일럿
            </Link>

            <Link href="/gov/reports" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              운영보고서
            </Link>
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
              {message}
            </div>
          ) : null}

          {debug ? (
            <details className="mt-4 rounded-2xl bg-[#247A71] p-4 text-xs font-bold leading-6 text-[#E7FFF7]" open>
              <summary className="cursor-pointer text-sm font-black">처리 결과 보기</summary>
              <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap">{debug}</pre>
            </details>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
          <MetricCard title="전체" value={`${metrics.total}명`} desc="등록 대상자" danger={metrics.total === 0} />
          <MetricCard title="운영 중" value={`${metrics.active}명`} desc="현재 관리" />
          <MetricCard title="보관" value={`${metrics.archived}명`} desc="운영 제외" />
          <MetricCard title="A그룹" value={`${metrics.groupA}명`} desc="고위험 취약" danger={metrics.groupA > 0} />
          <MetricCard title="B그룹" value={`${metrics.groupB}명`} desc="일반 관리" />
          <MetricCard title="동의 완료" value={`${metrics.consentApproved}명`} desc="개인정보 동의" />
          <MetricCard title="동의 대기" value={`${metrics.consentPending}명`} desc="확인 필요" danger={metrics.consentPending > 0} />
          <MetricCard title="긴급 사건" value={`${metrics.urgentIncidents}건`} desc="즉시 확인" danger={metrics.urgentIncidents > 0} />
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">테스트 대상자 5명 자동 등록</h2>

            <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
              내 번호 하나로 A그룹 2명, B그룹 3명을 생성합니다. 보고서와 오토파일럿 테스트에 바로 사용할 수 있습니다.
            </p>

            <div className="mt-5 grid gap-3">
              <input
                value={testPhone}
                onChange={(event) => setTestPhone(phoneOnly(event.target.value))}
                inputMode="tel"
                placeholder="테스트 보호자 연락처 예: 01012345678"
                className="w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-[#D6F6EC]"
              />

              <button
                onClick={() => post('seedDemoHouseholds', { testPhone, serviceArea: form.serviceArea })}
                disabled={loading || !testPhone}
                className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
              >
                테스트 대상자 5명 등록
              </button>
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">대상자 직접 등록</h2>

            <div className="mt-5 grid gap-3">
              <Input label="가족코드 6자리" value={form.familyCode} onChange={(v) => setForm({ ...form, familyCode: code6(v) })} />
              <Input label="대상자 이름" value={form.parentName} onChange={(v) => setForm({ ...form, parentName: v })} />
              <Input label="대상자 연락처" value={form.parentPhone} onChange={(v) => setForm({ ...form, parentPhone: phoneOnly(v) })} />
              <Input label="보호자 이름" value={form.guardianName} onChange={(v) => setForm({ ...form, guardianName: v })} />
              <Input label="보호자 연락처" value={form.guardianPhone} onChange={(v) => setForm({ ...form, guardianPhone: phoneOnly(v) })} />
              <Input label="권역/동네" value={form.serviceArea} onChange={(v) => setForm({ ...form, serviceArea: v })} />
              <Input label="주소 힌트" value={form.addressHint} onChange={(v) => setForm({ ...form, addressHint: v })} />

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-black text-[#637B76]">위험군</span>
                  <select
                    value={form.riskGroup}
                    onChange={(event) => setForm({ ...form, riskGroup: event.target.value })}
                    className="w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-[#D6F6EC]"
                  >
                    <option value="A">A그룹 · 고위험</option>
                    <option value="B">B그룹 · 일반관리</option>
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-black text-[#637B76]">동의 상태</span>
                  <select
                    value={form.consentStatus}
                    onChange={(event) => setForm({ ...form, consentStatus: event.target.value })}
                    className="w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-[#D6F6EC]"
                  >
                    <option value="pending">동의 대기</option>
                    <option value="approved">동의 완료</option>
                    <option value="rejected">동의 거부</option>
                  </select>
                </label>
              </div>

              <Input label="메모" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />

              <button
                onClick={() => post('createHousehold', {
                  ...form,
                  mealCare: true,
                  medicationCare: true,
                  conditionCare: true
                })}
                disabled={loading || !form.parentName.trim()}
                className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
              >
                대상자 등록
              </button>
            </div>
          </section>
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-[-0.06em]">대상자 목록</h2>
              <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                대상자별 최근 신호와 열린 사건 수를 기준으로 운영 우선순위를 확인합니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                ['all', '전체'],
                ['active', '운영 중'],
                ['urgent', '긴급'],
                ['attention', '확인 필요'],
                ['consent', '동의 대기']
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key as typeof filter)}
                  className={
                    'rounded-full px-4 py-2 text-sm font-black ring-1 ' +
                    (filter === key
                      ? 'bg-[#247A71] text-white ring-[#247A71]'
                      : 'bg-white text-[#17443F] ring-[#D6EDE7]')
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <div className="min-w-[1100px] overflow-hidden rounded-2xl ring-1 ring-[#D6EDE7]">
              <div className="grid grid-cols-[8rem_10rem_11rem_10rem_10rem_8rem_8rem_8rem_8rem_14rem] gap-3 bg-[#FAFFFD] px-4 py-3 text-xs font-black text-[#637B76]">
                <div>상태</div>
                <div>대상자</div>
                <div>가족코드</div>
                <div>보호자</div>
                <div>권역</div>
                <div>위험군</div>
                <div>동의</div>
                <div>열린</div>
                <div>긴급</div>
                <div>조치</div>
              </div>

              <div className="divide-y divide-[#D8EEE8] bg-white">
                {filteredHouseholds.length === 0 ? (
                  <div className="px-4 py-5 text-sm font-black text-[#637B76]">
                    표시할 대상자가 없습니다.
                  </div>
                ) : (
                  filteredHouseholds.map((row) => (
                    <HouseholdRow
                      key={row.id}
                      row={row}
                      loading={loading}
                      onAction={post}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">최근 대상자 로그</h2>

          <div className="mt-5 space-y-3">
            {logs.length === 0 ? (
              <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                아직 로그가 없습니다.
              </div>
            ) : (
              logs.slice(0, 20).map((log) => (
                <article key={log.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                  <div className="text-xs font-black text-[#2AA897]">{log.action_type || 'log'}</div>
                  <div className="mt-2 text-sm font-black leading-7">{log.message || '-'}</div>
                  <div className="mt-1 text-xs font-bold text-[#637B76]">{log.created_at || ''}</div>
                </article>
              ))
            )}
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-4">
          <Link href="/admin/ops/autopilot" className="rounded-2xl bg-[#247A71] px-5 py-4 text-center text-sm font-black text-white">
            오토파일럿
          </Link>
          <Link href="/admin/ops/heartbeat" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
            Heartbeat
          </Link>
          <Link href="/gov/reports" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
            운영보고서
          </Link>
          <button
            onClick={load}
            className="rounded-2xl bg-[#FAFFFD] px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
          >
            새로고침
          </button>
        </div>
      </section>
    </main>
  )
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
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

function HouseholdRow({
  row,
  loading,
  onAction
}: {
  row: Household
  loading: boolean
  onAction: (action: string, payload: Record<string, unknown>) => void
}) {
  return (
    <div className="grid grid-cols-[8rem_10rem_11rem_10rem_10rem_8rem_8rem_8rem_8rem_14rem] gap-3 px-4 py-4 text-sm font-bold text-[#17443F] hover:bg-[#FAFFFD]">
      <div>
        <span className={'rounded-full px-3 py-1 text-xs font-black ring-1 ' + statusClass(row.derived_status)}>
          {derivedLabel(row.derived_status)}
        </span>
      </div>

      <div className="min-w-0">
        <div className="truncate font-black">{row.parent_name || '-'}</div>
        <div className="mt-1 truncate text-xs text-[#637B76]">{householdStatusLabel(row.household_status)}</div>
      </div>

      <div className="font-black">{row.family_code || '-'}</div>
      <div className="truncate">{row.guardian_name || '-'}<br /><span className="text-xs text-[#637B76]">{row.guardian_phone || '-'}</span></div>
      <div className="truncate">{row.service_area || '-'}</div>
      <div>{row.risk_group === 'A' ? 'A · 고위험' : 'B · 일반'}</div>
      <div>{consentLabel(row.consent_status)}</div>
      <div>{row.open_incident_count || 0}건</div>
      <div>{row.urgent_incident_count || 0}건</div>

      <div className="grid gap-2">
        <select
          onChange={(event) => {
            if (!event.target.value) return
            onAction('createIncident', {
              id: row.id,
              requestType: event.target.value
            })
            event.target.value = ''
          }}
          disabled={loading}
          className="rounded-xl border border-[#D6EDE7] bg-white px-3 py-2 text-xs font-black outline-none"
        >
          <option value="">테스트 사건</option>
          <option value="urgent_neighbor_help">도움 요청</option>
          <option value="meal_delivery">식사 미확인</option>
          <option value="medication_reminder">복약 미확인</option>
          <option value="care_partner_check">몸 상태 확인</option>
        </select>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onAction('updateHousehold', {
              id: row.id,
              consentStatus: row.consent_status === 'approved' ? 'pending' : 'approved'
            })}
            disabled={loading}
            className="rounded-xl bg-white px-3 py-2 text-xs font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50"
          >
            동의
          </button>

          <button
            onClick={() => onAction(row.household_status === 'archived' ? 'updateHousehold' : 'archiveHousehold', {
              id: row.id,
              householdStatus: 'active'
            })}
            disabled={loading}
            className="rounded-xl bg-white px-3 py-2 text-xs font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50"
          >
            {row.household_status === 'archived' ? '복구' : '보관'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default OpsHouseholdsPanel
