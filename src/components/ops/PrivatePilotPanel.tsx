'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Pilot = {
  id: string
  pilot_key: string
  title: string
  status?: string
  start_date?: string
  end_date?: string
  target_households?: number
  target_providers?: number
  owner_name?: string
  notes?: string
}

type Household = {
  id: string
  pilot_key?: string
  family_code: string
  parent_name?: string
  parent_phone?: string
  guardian_name?: string
  guardian_phone?: string
  guardian_email?: string
  service_area?: string
  address_hint?: string
  group_label?: string
  status?: string
  onboarding_url?: string
  notes?: string
}

type Report = {
  id: string
  title?: string
  summary?: string
  metrics?: Record<string, unknown>
  created_by?: string
  created_at?: string
}

type PrivatePilotData = {
  ok: boolean
  selectedPilot?: Pilot
  pilots: Pilot[]
  households: Household[]
  requests: Array<Record<string, unknown>>
  outbox: Array<Record<string, unknown>>
  matches: Array<Record<string, unknown>>
  providers: Array<Record<string, unknown>>
  reports: Report[]
  metrics: Record<string, number>
  generatedAt: string
}

function statusClass(status?: string) {
  if (status === 'active' || status === 'completed') return 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'
  if (status === 'onboarding' || status === 'draft') return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  if (status === 'paused' || status === 'cancelled') return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  return 'bg-[#FAFFFD] text-[#637B76] ring-[#D6EDE7]'
}

function statusLabel(status?: string) {
  if (status === 'active') return '진행 중'
  if (status === 'draft') return '준비'
  if (status === 'onboarding') return '온보딩'
  if (status === 'completed') return '완료'
  if (status === 'paused') return '중지'
  return status || '기록'
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

function fullUrl(path?: string) {
  if (!path) return ''
  if (typeof window === 'undefined') return path
  return new URL(path, window.location.origin).toString()
}

function miniReportText(data: PrivatePilotData | null) {
  if (!data?.selectedPilot) return ''

  const m = data.metrics || {}

  return [
    `# ${data.selectedPilot.title} 미니 리포트`,
    '',
    `실증 기간: ${data.selectedPilot.start_date || '-'} ~ ${data.selectedPilot.end_date || '-'}`,
    `참여 가구: ${m.households || 0}가구`,
    `진행 일수: ${m.daysElapsed || 0}/${m.daysTotal || 0}일`,
    '',
    '## 핵심 지표',
    `- 안부 신호: ${m.requests || 0}건`,
    `- 긴급 요청: ${m.urgentRequests || 0}건`,
    `- 완료 사건: ${m.completedRequests || 0}건`,
    `- 열린 사건: ${m.openRequests || 0}건`,
    `- 문자 대기: ${m.queuedMessages || 0}건`,
    `- 문자 성공률: ${m.smsSuccessRate || 0}%`,
    `- 가용 도움망: ${m.availableProviders || 0}명`,
    `- 도움망 수락률: ${m.providerAcceptRate || 0}%`,
    '',
    '## 지자체 제안용 한 줄',
    '자체 예비 실증을 통해 부모님 안부 신호, 보호자 알림, 요양보호사 즉시 배치, 사건 타임라인, 운영보고서 생성 흐름을 검증하고 있습니다.'
  ].join('\n')
}

export function PrivatePilotPanel({
  title = '자체 예비 실증 관리센터',
  subtitle = '지자체 실증을 기다리지 않고, 5~10가구 규모로 먼저 작게 돌려 실제 작동 증거를 만듭니다.'
}: {
  title?: string
  subtitle?: string
}) {
  const [data, setData] = useState<PrivatePilotData | null>(null)
  const [selectedPilotKey, setSelectedPilotKey] = useState('')
  const [selectedHouseholdId, setSelectedHouseholdId] = useState('')
  const [activeTab, setActiveTab] = useState<'dashboard' | 'households' | 'signals' | 'report' | 'history'>('dashboard')
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)

  const [newPilot, setNewPilot] = useState({
    title: '안부웍스 14일 자체 예비 실증',
    targetHouseholds: '10',
    ownerName: '운영실',
    notes: '지자체 제안 전 자체 예비 실증'
  })

  const [seedCount, setSeedCount] = useState('10')
  const [seedGuardianPhone, setSeedGuardianPhone] = useState('')
  const [seedArea, setSeedArea] = useState('QA실증권역')

  const [householdForm, setHouseholdForm] = useState({
    familyCode: '',
    parentName: '',
    guardianName: '',
    guardianPhone: '',
    serviceArea: '',
    addressHint: '',
    groupLabel: 'mini'
  })

  const selectedHousehold = useMemo(() => {
    return data?.households.find((item) => item.id === selectedHouseholdId) || data?.households[0] || null
  }, [data, selectedHouseholdId])

  const reportText = useMemo(() => miniReportText(data), [data])

  async function load(pilotKey = selectedPilotKey) {
    setLoading(true)

    try {
      const params = new URLSearchParams()
      if (pilotKey) params.set('pilotKey', pilotKey)

      const response = await fetch('/api/private-pilot?' + params.toString(), { cache: 'no-store' })
      const next = await response.json().catch(() => ({}))

      if (!response.ok || !next.ok) {
        setMessage(next.message || '자체 예비 실증 데이터를 불러오지 못했습니다.')
        setDebug(JSON.stringify(next.detail || next, null, 2))
        return
      }

      setData(next)

      if (next.selectedPilot?.pilot_key) {
        setSelectedPilotKey(next.selectedPilot.pilot_key)
      }

      if (next.households?.length && !selectedHouseholdId) {
        setSelectedHouseholdId(next.households[0].id)
      }

      setMessage('')
      setDebug('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '데이터를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function post(action: string, payload: Record<string, unknown> = {}) {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/private-pilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload })
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || !result.ok) {
        setMessage(result.message || '처리에 실패했습니다.')
        setDebug(JSON.stringify(result.detail || result, null, 2))
        await load()
        return
      }

      setMessage(result.message || '처리되었습니다.')
      setDebug(JSON.stringify(result, null, 2))

      const nextPilotKey = result.pilot?.pilot_key || selectedPilotKey
      await load(nextPilotKey)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function copyText(value: string, label = '복사했습니다.') {
    try {
      await navigator.clipboard.writeText(value)
      setMessage(label)
    } catch {
      setMessage('클립보드 복사에 실패했습니다.')
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const metrics = data?.metrics || {}

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-7 text-[#17443F] sm:px-5 sm:py-10">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-white/95 p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            자체 예비 실증
          </div>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
                {title}
              </h1>

              <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
                {subtitle}
              </p>
            </div>

            <div className={'rounded-[2rem] px-6 py-5 text-center ring-1 ' + statusClass(data?.selectedPilot?.status)}>
              <div className="text-sm font-black opacity-70">현재 실증</div>
              <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{statusLabel(data?.selectedPilot?.status)}</div>
              <div className="mt-2 text-xs font-bold">{data?.selectedPilot?.pilot_key || '생성 전'}</div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            목표는 지자체 확정 전 “실제 작동 증거”를 만드는 것입니다. 5~10가구, 14일, 보호자 문자, 요양보호사 수락, 사건 타임라인, 미니 리포트까지 확인하세요.
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={() => load()} disabled={loading} className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50">
              새로고침
            </button>

            <button onClick={() => post('saveMiniReport', { pilotKey: selectedPilotKey })} disabled={loading || !data?.selectedPilot} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50">
              미니 리포트 저장
            </button>

            <button onClick={() => copyText(reportText, '미니 리포트를 복사했습니다.')} disabled={!reportText} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50">
              리포트 복사
            </button>

            <Link href="/mobile" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              모바일 앱
            </Link>

            <Link href="/ops/preflight-test" className="rounded-2xl bg-[#FAFFFD] px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              전체 테스트
            </Link>
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#EFFFFA] p-4 text-sm font-black leading-7 text-[#247A71] ring-1 ring-[#CDEFE7]">
              {message}
            </div>
          ) : null}

          {debug ? (
            <details className="mt-4 rounded-2xl bg-[#247A71] p-4 text-xs font-bold leading-6 text-white">
              <summary className="cursor-pointer text-sm font-black">처리 결과 보기</summary>
              <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap">{debug}</pre>
            </details>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
          <MetricCard title="가구" value={`${metrics.households || 0}가구`} desc="참여 대상" danger={Number(metrics.households || 0) === 0} />
          <MetricCard title="진행일" value={`${metrics.daysElapsed || 0}/${metrics.daysTotal || 0}일`} desc="실증 기간" />
          <MetricCard title="안부 신호" value={`${metrics.requests || 0}건`} desc="누적 신호" />
          <MetricCard title="긴급 요청" value={`${metrics.urgentRequests || 0}건`} desc="도움 필요" danger={Number(metrics.urgentRequests || 0) > 0} />
          <MetricCard title="완료" value={`${metrics.completedRequests || 0}건`} desc="완료 사건" />
          <MetricCard title="열린 사건" value={`${metrics.openRequests || 0}건`} desc="처리 중" danger={Number(metrics.openRequests || 0) > 0} />
          <MetricCard title="문자 성공률" value={`${metrics.smsSuccessRate || 0}%`} desc="대기열 기준" danger={Number(metrics.failedMessages || 0) > 0} />
          <MetricCard title="가용 도움망" value={`${metrics.availableProviders || 0}명`} desc="같은 권역" danger={Number(metrics.availableProviders || 0) === 0} />
        </section>

        <section className="rounded-[2rem] bg-white/95 p-3 shadow-sm ring-1 ring-[#D6EDE7]">
          <div className="grid gap-2 sm:grid-cols-5">
            {[
              ['dashboard', '실증 생성'],
              ['households', '가구·링크'],
              ['signals', '신호 테스트'],
              ['report', '미니 리포트'],
              ['history', '저장 기록']
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as typeof activeTab)}
                className={
                  'rounded-2xl px-5 py-4 text-sm font-black ring-1 ' +
                  (activeTab === key
                    ? 'bg-[#247A71] text-white ring-[#247A71]'
                    : 'bg-white text-[#17443F] ring-[#D6EDE7]')
                }
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {activeTab === 'dashboard' ? (
          <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">실증 생성</h2>

              <div className="mt-5 grid gap-3">
                <EditInput label="실증명" value={newPilot.title} onChange={(v) => setNewPilot({ ...newPilot, title: v })} />
                <EditInput label="목표 가구 수" value={newPilot.targetHouseholds} onChange={(v) => setNewPilot({ ...newPilot, targetHouseholds: v })} />
                <EditInput label="담당자" value={newPilot.ownerName} onChange={(v) => setNewPilot({ ...newPilot, ownerName: v })} />
                <label className="grid gap-2">
                  <span className="text-sm font-black text-[#637B76]">메모</span>
                  <textarea
                    value={newPilot.notes}
                    onChange={(event) => setNewPilot({ ...newPilot, notes: event.target.value })}
                    className="min-h-24 rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none"
                  />
                </label>

                <button
                  onClick={() => post('createPilot', newPilot)}
                  disabled={loading}
                  className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
                >
                  14일 자체 예비 실증 생성
                </button>
              </div>
            </section>

            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">현재 실증</h2>

              {data?.selectedPilot ? (
                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl bg-[#FAFFFD] p-5 ring-1 ring-[#D6EDE7]">
                    <span className={'inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ' + statusClass(data.selectedPilot.status)}>
                      {statusLabel(data.selectedPilot.status)}
                    </span>
                    <h3 className="mt-3 text-2xl font-black tracking-[-0.06em]">{data.selectedPilot.title}</h3>
                    <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                      {data.selectedPilot.start_date} ~ {data.selectedPilot.end_date}
                      <br />
                      목표 {data.selectedPilot.target_households || 0}가구 · 담당 {data.selectedPilot.owner_name || '-'}
                    </p>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3">
                    {data.pilots.map((pilot) => (
                      <button
                        key={pilot.pilot_key}
                        onClick={() => {
                          setSelectedPilotKey(pilot.pilot_key)
                          load(pilot.pilot_key)
                        }}
                        className="rounded-2xl bg-white px-4 py-3 text-left text-xs font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
                      >
                        {pilot.title}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                  아직 생성된 자체 예비 실증이 없습니다.
                </div>
              )}
            </section>
          </section>
        ) : null}

        {activeTab === 'households' ? (
          <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">가구 생성</h2>

              <div className="mt-5 grid gap-3">
                <EditInput label="생성 수" value={seedCount} onChange={setSeedCount} />
                <EditInput label="보호자 휴대폰, 공통" value={seedGuardianPhone} onChange={setSeedGuardianPhone} />
                <EditInput label="권역" value={seedArea} onChange={setSeedArea} />

                <button
                  onClick={() => post('seedHouseholds', { pilotKey: selectedPilotKey, count: seedCount, guardianPhone: seedGuardianPhone, serviceArea: seedArea })}
                  disabled={loading || !data?.selectedPilot}
                  className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
                >
                  실증 가구 자동 생성
                </button>
              </div>

              <div className="mt-6 border-t border-[#D6EDE7] pt-5">
                <h3 className="text-2xl font-black tracking-[-0.05em]">수동 추가</h3>

                <div className="mt-4 grid gap-3">
                  <EditInput label="가족코드, 비우면 자동" value={householdForm.familyCode} onChange={(v) => setHouseholdForm({ ...householdForm, familyCode: v })} />
                  <EditInput label="부모님 이름" value={householdForm.parentName} onChange={(v) => setHouseholdForm({ ...householdForm, parentName: v })} />
                  <EditInput label="보호자 이름" value={householdForm.guardianName} onChange={(v) => setHouseholdForm({ ...householdForm, guardianName: v })} />
                  <EditInput label="보호자 휴대폰" value={householdForm.guardianPhone} onChange={(v) => setHouseholdForm({ ...householdForm, guardianPhone: v })} />
                  <EditInput label="권역" value={householdForm.serviceArea} onChange={(v) => setHouseholdForm({ ...householdForm, serviceArea: v })} />
                  <EditInput label="주소 힌트" value={householdForm.addressHint} onChange={(v) => setHouseholdForm({ ...householdForm, addressHint: v })} />

                  <button
                    onClick={() => post('addHousehold', { pilotKey: selectedPilotKey, ...householdForm })}
                    disabled={loading || !data?.selectedPilot}
                    className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50"
                  >
                    가구 추가
                  </button>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">가구·앱 링크</h2>

              <div className="mt-5 space-y-3">
                {data?.households.length ? (
                  data.households.map((household) => (
                    <article key={household.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#247A71] ring-1 ring-[#D6EDE7]">
                              {household.family_code}
                            </span>
                            <span className={'rounded-full px-3 py-1 text-xs font-black ring-1 ' + statusClass(household.status)}>
                              {statusLabel(household.status)}
                            </span>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#247A71] ring-1 ring-[#D6EDE7]">
                              {household.group_label || 'mini'}
                            </span>
                          </div>

                          <h3 className="mt-3 text-xl font-black tracking-[-0.05em]">{household.parent_name || '부모님'}</h3>
                          <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                            보호자 {household.guardian_name || '-'} · {household.guardian_phone || '-'}
                            <br />
                            {household.service_area || '-'} · {household.address_hint || '-'}
                          </p>
                        </div>

                        <div className="grid gap-2 lg:min-w-44">
                          <button
                            onClick={() => setSelectedHouseholdId(household.id)}
                            className="rounded-xl bg-[#247A71] px-4 py-3 text-sm font-black text-white"
                          >
                            선택
                          </button>
                          <button
                            onClick={() => copyText(fullUrl(household.onboarding_url), '부모님 앱 링크를 복사했습니다.')}
                            className="rounded-xl bg-white px-4 py-3 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
                          >
                            앱 링크 복사
                          </button>
                          <Link
                            href={household.onboarding_url || '/mobile/parent'}
                            className="rounded-xl bg-white px-4 py-3 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
                          >
                            앱 열기
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                    등록된 실증 가구가 없습니다.
                  </div>
                )}
              </div>
            </section>
          </section>
        ) : null}

        {activeTab === 'signals' ? (
          <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">선택 가구</h2>

              {selectedHousehold ? (
                <div className="mt-5 rounded-2xl bg-[#FAFFFD] p-5 ring-1 ring-[#D6EDE7]">
                  <div className="text-xs font-black text-[#2AA897]">{selectedHousehold.family_code}</div>
                  <h3 className="mt-2 text-2xl font-black tracking-[-0.06em]">{selectedHousehold.parent_name}</h3>
                  <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                    {selectedHousehold.service_area} · {selectedHousehold.address_hint}
                    <br />
                    보호자 {selectedHousehold.guardian_name} · {selectedHousehold.guardian_phone}
                  </p>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                  가구를 먼저 선택해주세요.
                </div>
              )}

              <div className="mt-5 grid gap-2">
                {data?.households.map((household) => (
                  <button
                    key={household.id}
                    onClick={() => setSelectedHouseholdId(household.id)}
                    className={
                      'rounded-2xl px-4 py-3 text-left text-sm font-black ring-1 ' +
                      (selectedHousehold?.id === household.id
                        ? 'bg-[#247A71] text-white ring-[#247A71]'
                        : 'bg-white text-[#17443F] ring-[#D6EDE7]')
                    }
                  >
                    {household.family_code} · {household.parent_name}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">안부 신호 테스트</h2>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  ['ok', '괜찮아요', '정상 체크인'],
                  ['meal', '밥을 못 먹었어요', '식사 확인'],
                  ['medication', '약을 못 먹었어요', '복약 확인'],
                  ['sick', '몸이 아파요', '주의/긴급'],
                  ['urgent', '지금 도움이 필요해요', '즉시 배치 후보']
                ].map(([key, label, desc]) => (
                  <button
                    key={key}
                    onClick={() => selectedHousehold && post('createSignal', { householdId: selectedHousehold.id, signalKey: key })}
                    disabled={loading || !selectedHousehold}
                    className={
                      'rounded-[2rem] p-5 text-left shadow-sm ring-1 disabled:opacity-50 ' +
                      (key === 'urgent' || key === 'sick'
                        ? 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
                        : 'bg-[#FAFFFD] text-[#17443F] ring-[#D6EDE7]')
                    }
                  >
                    <div className="text-2xl font-black tracking-[-0.06em]">{label}</div>
                    <div className="mt-2 text-sm font-bold opacity-75">{desc}</div>
                  </button>
                ))}
              </div>

              <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
                “지금 도움이 필요해요”를 생성한 뒤에는 /ops/urgent-dispatch에서 가용 요양보호사 즉시 배치 흐름을 확인하세요.
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/ops/urgent-dispatch" className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white">
                  즉시 배치센터
                </Link>
                <Link href="/ops/notification-dispatch" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                  문자 대기열
                </Link>
                <Link href="/ops/state-machine" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                  상태 머신
                </Link>
              </div>
            </section>
          </section>
        ) : null}

        {activeTab === 'report' ? (
          <section className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">지자체 제출용 미니 리포트</h2>

              <textarea
                value={reportText}
                readOnly
                className="mt-5 min-h-[30rem] w-full rounded-2xl border border-[#D6EDE7] bg-[#FAFFFD] px-4 py-4 text-sm font-bold leading-7 outline-none"
              />

              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={() => copyText(reportText, '미니 리포트를 복사했습니다.')} className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white">
                  리포트 복사
                </button>
                <button onClick={() => post('saveMiniReport', { pilotKey: selectedPilotKey })} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                  리포트 저장
                </button>
                <Link href="/gov/one-page-proposal" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                  1페이지 제안서
                </Link>
              </div>
            </section>

            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">최근 신호</h2>

              <div className="mt-5 space-y-3">
                {data?.requests.length ? (
                  data.requests.slice(0, 15).map((request) => (
                    <article key={String(request.id)} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                      <div className="text-xs font-black text-[#2AA897]">{String(request.status || '-')}</div>
                      <h3 className="mt-2 text-lg font-black">{String(request.signal_label || request.request_type || '신호')}</h3>
                      <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                        {String(request.parent_name || '-')} · {String(request.family_code || '-')} · {String(request.created_at || '')}
                      </p>
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                    아직 안부 신호가 없습니다.
                  </div>
                )}
              </div>
            </section>
          </section>
        ) : null}

        {activeTab === 'history' ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">저장된 미니 리포트</h2>

            <div className="mt-5 space-y-3">
              {data?.reports.length ? (
                data.reports.map((report) => (
                  <article key={report.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    <div className="text-xs font-black text-[#2AA897]">{report.created_at || '-'}</div>
                    <h3 className="mt-2 text-lg font-black">{report.title || '미니 리포트'}</h3>
                    <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">{report.summary || '-'}</p>
                    <p className="mt-1 text-xs font-bold text-[#637B76]">{report.created_by || '-'}</p>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                  아직 저장된 리포트가 없습니다.
                </div>
              )}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  )
}

function EditInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-[#637B76]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold outline-none"
      />
    </label>
  )
}

export default PrivatePilotPanel
