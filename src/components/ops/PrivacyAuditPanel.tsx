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
  risk_group?: string
  consent_status?: string
  consent_at?: string
  consent_label?: string
  access_count?: number
  last_access_at?: string
  consent_record_count?: number
}

type AccessLog = {
  id: string
  actor_type?: string
  actor_name?: string
  action_type?: string
  target_type?: string
  target_id?: string
  family_code?: string
  target_name?: string
  purpose?: string
  legal_basis?: string
  fields_accessed?: string[]
  route_path?: string
  result_status?: string
  created_at?: string
}

type ConsentRecord = {
  id: string
  family_code?: string
  subject_name?: string
  consent_type?: string
  consent_status?: string
  consent_version?: string
  collected_by?: string
  collected_via?: string
  evidence_note?: string
  consented_at?: string
  revoked_at?: string
  created_at?: string
}

type Metrics = {
  households: number
  consentApproved: number
  consentPending: number
  accessLogs: number
  accessToday: number
  emergencyAccess: number
  providerAccess: number
  consentRecords: number
  revoked: number
}

type FieldKey =
  | 'parent_name'
  | 'parent_phone'
  | 'guardian_name'
  | 'guardian_phone'
  | 'service_area'
  | 'address_hint'
  | 'risk_group'
  | 'care_flags'

const fieldLabels: Record<FieldKey, string> = {
  parent_name: '대상자 이름',
  parent_phone: '대상자 연락처',
  guardian_name: '보호자 이름',
  guardian_phone: '보호자 연락처',
  service_area: '권역',
  address_hint: '주소 힌트',
  risk_group: '위험군',
  care_flags: '돌봄 항목'
}

function consentClass(status?: string) {
  if (status === 'approved') return 'bg-[#EFFFFA] text-[#2AA897] ring-[#CDEFE7]'
  if (status === 'revoked' || status === 'rejected') return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
}

function consentLabel(status?: string) {
  if (status === 'approved') return '동의 완료'
  if (status === 'revoked') return '동의 철회'
  if (status === 'rejected') return '동의 거부'
  if (status === 'expired') return '동의 만료'
  return '동의 대기'
}

function actorLabel(actor?: string) {
  if (actor === 'ops') return '운영실'
  if (actor === 'provider') return '도움망'
  if (actor === 'careWorker') return '요양보호사'
  if (actor === 'gov') return '지자체'
  if (actor === 'guardian') return '보호자'
  return actor || '운영자'
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

export function PrivacyAuditPanel({
  title = '개인정보 동의·열람 감사센터',
  subtitle = '대상자 동의 상태와 운영실·도움망·지자체의 개인정보 열람 기록을 남깁니다.'
}: {
  title?: string
  subtitle?: string
}) {
  const [households, setHouseholds] = useState<Household[]>([])
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([])
  const [consentRecords, setConsentRecords] = useState<ConsentRecord[]>([])
  const [metrics, setMetrics] = useState<Metrics>({ households: 0, consentApproved: 0, consentPending: 0, accessLogs: 0, accessToday: 0, emergencyAccess: 0, providerAccess: 0, consentRecords: 0, revoked: 0 })
  const [selectedId, setSelectedId] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'revoked'>('all')
  const [actorType, setActorType] = useState('ops')
  const [actorName, setActorName] = useState('운영실')
  const [purpose, setPurpose] = useState('후속조치 운영 확인')
  const [legalBasis, setLegalBasis] = useState('service_operation')
  const [evidenceNote, setEvidenceNote] = useState('운영실에서 동의 확인')
  const [fields, setFields] = useState<FieldKey[]>(['parent_name', 'guardian_phone', 'service_area'])
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)

  const selected = useMemo(
    () => households.find((row) => row.id === selectedId) || households[0] || null,
    [households, selectedId]
  )

  const filteredHouseholds = useMemo(() => {
    if (filter === 'pending') return households.filter((row) => row.consent_status !== 'approved')
    if (filter === 'approved') return households.filter((row) => row.consent_status === 'approved')
    if (filter === 'revoked') return households.filter((row) => row.consent_status === 'revoked' || row.consent_status === 'rejected')
    return households
  }, [households, filter])

  const selectedLogs = useMemo(() => {
    if (!selected) return []
    return accessLogs.filter((log) => log.target_id === selected.id || log.family_code === selected.family_code)
  }, [accessLogs, selected])

  async function load() {
    setLoading(true)

    try {
      const response = await fetch('/api/ops-privacy', { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '개인정보 감사 데이터를 불러오지 못했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      const nextHouseholds = Array.isArray(data.households) ? data.households : []

      setHouseholds(nextHouseholds)
      setAccessLogs(Array.isArray(data.accessLogs) ? data.accessLogs : [])
      setConsentRecords(Array.isArray(data.consentRecords) ? data.consentRecords : [])
      setMetrics(data.metrics || { households: 0, consentApproved: 0, consentPending: 0, accessLogs: 0, accessToday: 0, emergencyAccess: 0, providerAccess: 0, consentRecords: 0, revoked: 0 })

      if (nextHouseholds.length > 0 && !nextHouseholds.some((row: Household) => row.id === selectedId)) {
        setSelectedId(nextHouseholds[0].id)
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '개인정보 감사 데이터를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function post(action: string, payload: Record<string, unknown> = {}) {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/ops-privacy', {
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
      setDebug(JSON.stringify(data, null, 2))
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  function toggleField(field: FieldKey) {
    if (fields.includes(field)) {
      setFields(fields.filter((item) => item !== field))
    } else {
      setFields([...fields, field])
    }
  }

  function recordAccess() {
    if (!selected) return

    post('recordAccess', {
      targetId: selected.id,
      familyCode: selected.family_code,
      targetName: selected.parent_name,
      actorType,
      actorName,
      purpose,
      legalBasis,
      fieldsAccessed: fields,
      routePath: '/ops/privacy-audit'
    })
  }

  function approveConsent() {
    if (!selected) return

    post('approveConsent', {
      householdId: selected.id,
      actorName,
      evidenceNote,
      collectedVia: 'ops'
    })
  }

  function revokeConsent() {
    if (!selected) return

    post('revokeConsent', {
      householdId: selected.id,
      actorName,
      evidenceNote: evidenceNote || '운영실 동의 철회 기록',
      collectedVia: 'ops'
    })
  }

  function downloadCsv() {
    const rows = [
      ['created_at', 'actor_type', 'actor_name', 'family_code', 'target_name', 'purpose', 'fields_accessed', 'route_path'],
      ...accessLogs.map((log) => [
        log.created_at || '',
        actorLabel(log.actor_type),
        log.actor_name || '',
        log.family_code || '',
        log.target_name || '',
        log.purpose || '',
        Array.isArray(log.fields_accessed) ? log.fields_accessed.join('|') : '',
        log.route_path || ''
      ])
    ]

    const csv = rows
      .map((row) => row.map((value) => '"' + String(value).replace(/"/g, '""') + '"').join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `anbu-privacy-audit-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-5 text-[#17443F] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            개인정보 감사
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            {title}
          </h1>

          <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            {subtitle}
          </p>

          <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            개인정보는 필요한 목적과 항목만 열람하고, 열람 이력은 반드시 남깁니다. IP는 원문이 아니라 해시값으로 저장합니다.
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
              disabled={accessLogs.length === 0}
              className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50"
            >
              열람 로그 CSV
            </button>

            <button
              onClick={() => post('seedPrivacyLogs', { actorName })}
              disabled={loading || households.length === 0}
              className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50"
            >
              테스트 열람 로그 생성
            </button>

            <Link href="/ops/households" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              대상자 관리
            </Link>

            <Link href="/gov/reports" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              운영보고서
            </Link>
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#EFFFFA] p-4 text-sm font-black leading-7 text-[#2AA897] ring-1 ring-[#CDEFE7]">
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
          <MetricCard title="대상자" value={`${metrics.households}명`} desc="등록 대상자" danger={metrics.households === 0} />
          <MetricCard title="동의 완료" value={`${metrics.consentApproved}명`} desc="개인정보 동의" />
          <MetricCard title="동의 대기" value={`${metrics.consentPending}명`} desc="확인 필요" danger={metrics.consentPending > 0} />
          <MetricCard title="열람 로그" value={`${metrics.accessLogs}건`} desc="전체 열람 기록" />
          <MetricCard title="오늘 열람" value={`${metrics.accessToday}건`} desc="금일 열람 기록" />
          <MetricCard title="응급 목적" value={`${metrics.emergencyAccess}건`} desc="응급·긴급 사유" danger={metrics.emergencyAccess > 0} />
          <MetricCard title="도움망 열람" value={`${metrics.providerAccess}건`} desc="외부 도움망 접근" danger={metrics.providerAccess > 0} />
          <MetricCard title="철회 기록" value={`${metrics.revoked}건`} desc="동의 철회" danger={metrics.revoked > 0} />
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-3xl font-black tracking-[-0.06em]">대상자 동의 상태</h2>
                <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                  대상자를 선택하면 열람 기록과 동의 기록을 남길 수 있습니다.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  ['all', '전체'],
                  ['pending', '동의 대기'],
                  ['approved', '동의 완료'],
                  ['revoked', '철회/거부']
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

            <div className="mt-5 space-y-3">
              {filteredHouseholds.length === 0 ? (
                <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                  표시할 대상자가 없습니다.
                </div>
              ) : (
                filteredHouseholds.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => setSelectedId(row.id)}
                    className={
                      'w-full rounded-2xl p-4 text-left ring-1 ' +
                      (selected?.id === row.id
                        ? 'bg-[#247A71] text-white ring-[#247A71]'
                        : 'bg-[#FAFFFD] text-[#17443F] ring-[#D6EDE7]')
                    }
                  >
                    <div className="flex flex-wrap gap-2">
                      <span className={'rounded-full px-3 py-1 text-xs font-black ring-1 ' + (selected?.id === row.id ? 'bg-white/10 text-white ring-white/20' : consentClass(row.consent_status))}>
                        {consentLabel(row.consent_status)}
                      </span>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black ring-1 ring-current">
                        가족코드 {row.family_code || '-'}
                      </span>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black ring-1 ring-current">
                        열람 {row.access_count || 0}건
                      </span>
                    </div>

                    <div className="mt-3 text-lg font-black tracking-[-0.05em]">{row.parent_name || '대상자'}</div>
                    <div className={'mt-2 text-sm font-bold leading-6 ' + (selected?.id === row.id ? 'text-white/70' : 'text-[#637B76]')}>
                      보호자 {row.guardian_name || '-'} · {row.service_area || '-'} · 위험군 {row.risk_group || '-'}
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            {selected ? (
              <>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <span className={'inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ' + consentClass(selected.consent_status)}>
                      {consentLabel(selected.consent_status)}
                    </span>

                    <h2 className="mt-4 text-3xl font-black tracking-[-0.06em]">{selected.parent_name || '대상자'}</h2>

                    <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">
                      가족코드 {selected.family_code || '-'} · 권역 {selected.service_area || '-'} · 위험군 {selected.risk_group || '-'}
                      <br />
                      보호자 {selected.guardian_name || '-'} · {selected.guardian_phone || '-'}
                    </p>
                  </div>

                  <div className="grid gap-2 lg:min-w-48">
                    <button
                      onClick={approveConsent}
                      disabled={loading}
                      className="rounded-xl bg-[#247A71] px-4 py-3 text-sm font-black text-white disabled:opacity-50"
                    >
                      동의 완료
                    </button>

                    <button
                      onClick={revokeConsent}
                      disabled={loading}
                      className="rounded-xl bg-[#FFF4F4] px-4 py-3 text-sm font-black text-[#8A3030] ring-1 ring-[#F3C8C8] disabled:opacity-50"
                    >
                      동의 철회
                    </button>
                  </div>
                </div>

                <section className="mt-5 rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                  <h3 className="text-xl font-black tracking-[-0.05em]">개인정보 열람 기록 남기기</h3>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-sm font-black text-[#637B76]">열람자 역할</span>
                      <select
                        value={actorType}
                        onChange={(event) => setActorType(event.target.value)}
                        className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none"
                      >
                        <option value="ops">운영실</option>
                        <option value="gov">지자체</option>
                        <option value="provider">도움망</option>
                        <option value="careWorker">요양보호사</option>
                        <option value="guardian">보호자</option>
                      </select>
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-black text-[#637B76]">열람자 이름</span>
                      <input
                        value={actorName}
                        onChange={(event) => setActorName(event.target.value)}
                        className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none"
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-black text-[#637B76]">열람 목적</span>
                      <input
                        value={purpose}
                        onChange={(event) => setPurpose(event.target.value)}
                        className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none"
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-sm font-black text-[#637B76]">근거</span>
                      <select
                        value={legalBasis}
                        onChange={(event) => setLegalBasis(event.target.value)}
                        className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none"
                      >
                        <option value="service_operation">서비스 운영</option>
                        <option value="consent">정보주체 동의</option>
                        <option value="emergency_response">응급 대응</option>
                        <option value="gov_pilot">지자체 실증</option>
                      </select>
                    </label>
                  </div>

                  <div className="mt-4">
                    <div className="text-sm font-black text-[#637B76]">열람 항목</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(Object.keys(fieldLabels) as FieldKey[]).map((field) => (
                        <button
                          key={field}
                          type="button"
                          onClick={() => toggleField(field)}
                          className={
                            'rounded-full px-4 py-2 text-sm font-black ring-1 ' +
                            (fields.includes(field)
                              ? 'bg-[#247A71] text-white ring-[#247A71]'
                              : 'bg-white text-[#17443F] ring-[#D6EDE7]')
                          }
                        >
                          {fieldLabels[field]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="mt-4 grid gap-2">
                    <span className="text-sm font-black text-[#637B76]">동의 증빙 메모</span>
                    <textarea
                      value={evidenceNote}
                      onChange={(event) => setEvidenceNote(event.target.value)}
                      className="min-h-20 rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none"
                    />
                  </label>

                  <button
                    onClick={recordAccess}
                    disabled={loading || fields.length === 0}
                    className="mt-4 w-full rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
                  >
                    열람 기록 저장
                  </button>
                </section>

                <section className="mt-5">
                  <h3 className="text-2xl font-black tracking-[-0.05em]">선택 대상자 열람 이력</h3>

                  <div className="mt-4 space-y-3">
                    {selectedLogs.length === 0 ? (
                      <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                        아직 열람 기록이 없습니다.
                      </div>
                    ) : (
                      selectedLogs.slice(0, 15).map((log) => (
                        <article key={log.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#2AA897] ring-1 ring-[#D6EDE7]">
                              {actorLabel(log.actor_type)}
                            </span>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                              {log.actor_name || '-'}
                            </span>
                          </div>

                          <h4 className="mt-3 text-lg font-black tracking-[-0.04em]">{log.purpose || '열람 기록'}</h4>
                          <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                            항목: {Array.isArray(log.fields_accessed) ? log.fields_accessed.join(', ') : '-'}
                            <br />
                            경로: {log.route_path || '-'} · {log.created_at || ''}
                          </p>
                        </article>
                      ))
                    )}
                  </div>
                </section>
              </>
            ) : (
              <div className="rounded-2xl bg-[#FAFFFD] p-8 text-center text-sm font-black text-[#637B76] ring-1 ring-[#D6EDE7]">
                대상자를 선택해주세요.
              </div>
            )}
          </section>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">최근 개인정보 열람 로그</h2>

            <div className="mt-5 space-y-3">
              {accessLogs.length === 0 ? (
                <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                  아직 열람 로그가 없습니다.
                </div>
              ) : (
                accessLogs.slice(0, 20).map((log) => (
                  <article key={log.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    <div className="text-xs font-black text-[#2AA897]">{actorLabel(log.actor_type)} · {log.actor_name || '-'}</div>
                    <div className="mt-2 text-sm font-black leading-7">{log.target_name || '-'} · {log.purpose || '-'}</div>
                    <div className="mt-1 text-xs font-bold text-[#637B76]">{log.created_at || ''}</div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">최근 동의 기록</h2>

            <div className="mt-5 space-y-3">
              {consentRecords.length === 0 ? (
                <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                  아직 동의 기록이 없습니다.
                </div>
              ) : (
                consentRecords.slice(0, 20).map((record) => (
                  <article key={record.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    <div className="text-xs font-black text-[#2AA897]">{consentLabel(record.consent_status)} · {record.consent_version || '-'}</div>
                    <div className="mt-2 text-sm font-black leading-7">{record.subject_name || '-'} · {record.evidence_note || '-'}</div>
                    <div className="mt-1 text-xs font-bold text-[#637B76]">{record.created_at || ''}</div>
                  </article>
                ))
              )}
            </div>
          </section>
        </section>

        <div className="grid gap-3 sm:grid-cols-5">
          <Link href="/ops/households" className="rounded-2xl bg-[#247A71] px-5 py-4 text-center text-sm font-black text-white">
            대상자 관리
          </Link>
          <Link href="/ops/incidents" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
            사건 타임라인
          </Link>
          <Link href="/gov/reports" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
            운영보고서
          </Link>
          <Link href="/ops/autopilot" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
            오토파일럿
          </Link>
          <button onClick={load} className="rounded-2xl bg-[#FAFFFD] px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
            새로고침
          </button>
        </div>
      </section>
    </main>
  )
}

export default PrivacyAuditPanel
