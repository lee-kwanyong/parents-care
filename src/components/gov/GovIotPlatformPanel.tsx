'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type Metrics = {
  totalDevices: number
  radarDevices: number
  pillboxDevices: number
  installedDevices: number
  plannedDevices: number
  highRiskEvents: number
  mediumRiskEvents: number
  noActivityEvents: number
  missedMedicationEvents: number
  fallSignalEvents: number
  pilotSites: number
  targetHouseholds: number
  highRiskHouseholds: number
  generalHouseholds: number
}

type Device = {
  id: string
  family_code?: string
  recipient_name?: string
  device_type?: string
  serial_no?: string
  install_group?: string
  install_status?: string
  assigned_org_name?: string
  assigned_staff_name?: string
  created_at?: string
}

type EventRow = {
  id: string
  family_code?: string
  device_type?: string
  event_type?: string
  event_label?: string
  risk_level?: string
  occurred_at?: string
}

type PilotSite = {
  id: string
  site_name?: string
  sido?: string
  sigungu?: string
  target_households?: number
  high_risk_households?: number
  general_households?: number
  pilot_phase?: string
  partner_org_name?: string
}

type Milestone = {
  phase: string
  title: string
  period: string
  desc: string
}

type Data = {
  metrics: Metrics
  devices: Device[]
  events: EventRow[]
  pilotSites: PilotSite[]
  milestones: Milestone[]
}

function code6(value: string) {
  return value.replace(/[^\d]/g, '').slice(0, 6)
}

function riskClass(risk?: string) {
  if (risk === 'high') return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  if (risk === 'medium') return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  return 'bg-[#EFFFFA] text-[#2AA897] ring-[#CDEFE7]'
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

export function GovIotPlatformPanel() {
  const [data, setData] = useState<Data | null>(null)
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(true)

  const [deviceForm, setDeviceForm] = useState({
    familyCode: '',
    recipientName: '',
    deviceType: 'smart_pillbox',
    serialNo: '',
    installGroup: 'B그룹 일반관리',
    installStatus: 'planned',
    assignedOrgName: '',
    assignedStaffName: ''
  })

  const [eventForm, setEventForm] = useState({
    familyCode: '',
    deviceType: 'smart_pillbox',
    eventType: 'missed_medication',
    eventLabel: '복용 예정 30분 초과 미개봉',
    riskLevel: 'medium',
    eventValue: '',
    unit: '분'
  })

  const [siteForm, setSiteForm] = useState({
    siteName: '',
    sido: '',
    sigungu: '',
    targetHouseholds: '100',
    highRiskHouseholds: '30',
    generalHouseholds: '70',
    pilotPhase: 'planning',
    budgetEstimateKrw: '100000000',
    partnerOrgName: ''
  })

  async function load() {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/gov-iot', { cache: 'no-store' })
      const json = await response.json().catch(() => ({}))

      if (!response.ok || !json.ok) {
        setMessage(json.message || 'IoT 관제 데이터를 불러오지 못했습니다.')
        setDebug(JSON.stringify(json.detail || json, null, 2))
        return
      }

      setData(json)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'IoT 관제 데이터를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function post(action: string, payload: Record<string, unknown>) {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/gov-iot', {
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

  useEffect(() => {
    load()
  }, [])

  const metrics = data?.metrics || {
    totalDevices: 0,
    radarDevices: 0,
    pillboxDevices: 0,
    installedDevices: 0,
    plannedDevices: 0,
    highRiskEvents: 0,
    mediumRiskEvents: 0,
    noActivityEvents: 0,
    missedMedicationEvents: 0,
    fallSignalEvents: 0,
    pilotSites: 0,
    targetHouseholds: 0,
    highRiskHouseholds: 0,
    generalHouseholds: 0
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-5 text-[#17443F] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            IoT 스마트 실버 케어 준비
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            부모님 안부 데이터를
            <br />
            IoT 관제 인프라로 확장합니다.
          </h1>

          <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            현재 PWA 안부지문 리포트 위에 스마트 복약통과 UWB 비접촉 센서 이벤트를 얹어 지자체 실증·R&D 제안형 관제 구조를 준비합니다.
          </p>

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

        <section className="grid gap-4 md:grid-cols-4">
          <MetricCard title="실증 가구 목표" value={`${metrics.targetHouseholds}가구`} desc="등록된 지자체 실증 목표 합계" />
          <MetricCard title="IoT 장비" value={`${metrics.totalDevices}대`} desc={`UWB ${metrics.radarDevices}대 · 복약통 ${metrics.pillboxDevices}대`} />
          <MetricCard title="설치 완료" value={`${metrics.installedDevices}대`} desc={`설치 예정 ${metrics.plannedDevices}대`} tone="good" />
          <MetricCard title="고위험 이벤트" value={`${metrics.highRiskEvents}건`} desc="UWB·복약통 이벤트 기준" tone={metrics.highRiskEvents > 0 ? 'danger' : 'good'} />
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard title="무반응 이벤트" value={`${metrics.noActivityEvents}건`} desc="12시간 무활동 등 비접촉 신호" tone={metrics.noActivityEvents > 0 ? 'warn' : 'good'} />
          <MetricCard title="복약 미개봉" value={`${metrics.missedMedicationEvents}건`} desc="복용 예정 시간 초과 미개봉" tone={metrics.missedMedicationEvents > 0 ? 'warn' : 'good'} />
          <MetricCard title="낙상 의심" value={`${metrics.fallSignalEvents}건`} desc="UWB 낙상 의심 이벤트" tone={metrics.fallSignalEvents > 0 ? 'danger' : 'good'} />
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">실증 지자체 등록</h2>
            <div className="mt-5 space-y-3">
              <Input label="실증 지자체/권역명" value={siteForm.siteName} onChange={(v) => setSiteForm({ ...siteForm, siteName: v })} />
              <Input label="시도" value={siteForm.sido} onChange={(v) => setSiteForm({ ...siteForm, sido: v })} />
              <Input label="시군구" value={siteForm.sigungu} onChange={(v) => setSiteForm({ ...siteForm, sigungu: v })} />
              <Input label="목표 가구" value={siteForm.targetHouseholds} onChange={(v) => setSiteForm({ ...siteForm, targetHouseholds: v.replace(/[^\d]/g, '') })} />
              <Input label="고위험 A그룹 가구" value={siteForm.highRiskHouseholds} onChange={(v) => setSiteForm({ ...siteForm, highRiskHouseholds: v.replace(/[^\d]/g, '') })} />
              <Input label="일반관리 B그룹 가구" value={siteForm.generalHouseholds} onChange={(v) => setSiteForm({ ...siteForm, generalHouseholds: v.replace(/[^\d]/g, '') })} />
              <Input label="수행기관/파트너" value={siteForm.partnerOrgName} onChange={(v) => setSiteForm({ ...siteForm, partnerOrgName: v })} />
              <Input label="예상 예산 원" value={siteForm.budgetEstimateKrw} onChange={(v) => setSiteForm({ ...siteForm, budgetEstimateKrw: v.replace(/[^\d]/g, '') })} />

              <button
                onClick={() => post('createPilotSite', siteForm)}
                disabled={loading}
                className="w-full rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
              >
                실증 지자체 등록
              </button>
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">실증 지자체 목록</h2>
            <div className="mt-5 space-y-3">
              {(data?.pilotSites || []).length === 0 ? (
                <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                  아직 등록된 실증 지자체가 없습니다.
                </div>
              ) : (
                (data?.pilotSites || []).map((site) => (
                  <article key={site.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    <h3 className="text-xl font-black">{site.site_name || '실증 지자체'}</h3>
                    <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                      {site.sido || '-'} {site.sigungu || ''} · 목표 {site.target_households || 0}가구 · A그룹 {site.high_risk_households || 0}가구 · B그룹 {site.general_households || 0}가구
                    </p>
                    <p className="mt-1 text-xs font-black text-[#7A9692]">
                      단계 {site.pilot_phase || 'planning'} · 수행기관 {site.partner_org_name || '-'}
                    </p>
                  </article>
                ))
              )}
            </div>
          </section>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">IoT 장비 등록</h2>
            <div className="mt-5 space-y-3">
              <Input label="가족코드 6자리" value={deviceForm.familyCode} onChange={(v) => setDeviceForm({ ...deviceForm, familyCode: code6(v) })} />
              <Input label="대상자명" value={deviceForm.recipientName} onChange={(v) => setDeviceForm({ ...deviceForm, recipientName: v })} />

              <select
                value={deviceForm.deviceType}
                onChange={(event) => setDeviceForm({ ...deviceForm, deviceType: event.target.value })}
                className="w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-[#D6F6EC]"
              >
                <option value="smart_pillbox">스마트 복약통</option>
                <option value="uwb_radar">UWB 비접촉 레이더</option>
              </select>

              <Input label="시리얼 번호" value={deviceForm.serialNo} onChange={(v) => setDeviceForm({ ...deviceForm, serialNo: v })} />

              <select
                value={deviceForm.installGroup}
                onChange={(event) => setDeviceForm({ ...deviceForm, installGroup: event.target.value })}
                className="w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-[#D6F6EC]"
              >
                <option value="A그룹 고위험">A그룹 고위험</option>
                <option value="B그룹 일반관리">B그룹 일반관리</option>
              </select>

              <select
                value={deviceForm.installStatus}
                onChange={(event) => setDeviceForm({ ...deviceForm, installStatus: event.target.value })}
                className="w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-[#D6F6EC]"
              >
                <option value="planned">설치 예정</option>
                <option value="installed">설치 완료</option>
              </select>

              <Input label="담당 수행기관" value={deviceForm.assignedOrgName} onChange={(v) => setDeviceForm({ ...deviceForm, assignedOrgName: v })} />
              <Input label="담당자" value={deviceForm.assignedStaffName} onChange={(v) => setDeviceForm({ ...deviceForm, assignedStaffName: v })} />

              <button
                onClick={() => post('createDevice', deviceForm)}
                disabled={loading}
                className="w-full rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
              >
                IoT 장비 등록
              </button>
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">IoT 이벤트 테스트</h2>
            <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
              실제 장비 연동 전, 이벤트 데이터 구조를 먼저 검증합니다.
            </p>

            <div className="mt-5 space-y-3">
              <Input label="가족코드 6자리" value={eventForm.familyCode} onChange={(v) => setEventForm({ ...eventForm, familyCode: code6(v) })} />

              <select
                value={eventForm.deviceType}
                onChange={(event) => setEventForm({ ...eventForm, deviceType: event.target.value })}
                className="w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-[#D6F6EC]"
              >
                <option value="smart_pillbox">스마트 복약통</option>
                <option value="uwb_radar">UWB 비접촉 레이더</option>
              </select>

              <select
                value={eventForm.eventType}
                onChange={(event) => {
                  const eventType = event.target.value
                  const label =
                    eventType === 'no_activity'
                      ? '12시간 연속 활동 없음'
                      : eventType === 'fall_signal'
                        ? '낙상 의심 신호'
                        : eventType === 'low_respiration'
                          ? '호흡 수 저하 의심'
                          : '복용 예정 30분 초과 미개봉'

                  setEventForm({
                    ...eventForm,
                    eventType,
                    eventLabel: label,
                    riskLevel: eventType === 'fall_signal' || eventType === 'low_respiration' ? 'high' : 'medium'
                  })
                }}
                className="w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-[#D6F6EC]"
              >
                <option value="missed_medication">복약 미개봉</option>
                <option value="no_activity">무활동</option>
                <option value="fall_signal">낙상 의심</option>
                <option value="low_respiration">호흡 저하 의심</option>
              </select>

              <Input label="이벤트 라벨" value={eventForm.eventLabel} onChange={(v) => setEventForm({ ...eventForm, eventLabel: v })} />

              <select
                value={eventForm.riskLevel}
                onChange={(event) => setEventForm({ ...eventForm, riskLevel: event.target.value })}
                className="w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-[#D6F6EC]"
              >
                <option value="normal">정상</option>
                <option value="medium">주의</option>
                <option value="high">확인 필요</option>
              </select>

              <Input label="값" value={eventForm.eventValue} onChange={(v) => setEventForm({ ...eventForm, eventValue: v.replace(/[^\d.]/g, '') })} />
              <Input label="단위" value={eventForm.unit} onChange={(v) => setEventForm({ ...eventForm, unit: v })} />

              <button
                onClick={() => post('createEvent', eventForm)}
                disabled={loading}
                className="w-full rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
              >
                IoT 이벤트 저장
              </button>
            </div>
          </section>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">최근 IoT 이벤트</h2>
            <div className="mt-5 space-y-3">
              {(data?.events || []).length === 0 ? (
                <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                  아직 IoT 이벤트가 없습니다.
                </div>
              ) : (
                (data?.events || []).slice(0, 12).map((event) => (
                  <article key={event.id} className={'rounded-2xl p-4 ring-1 ' + riskClass(event.risk_level)}>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-xl font-black">{event.event_label || 'IoT 이벤트'}</h3>
                        <p className="mt-1 text-sm font-bold leading-6 opacity-80">
                          {event.device_type || '-'} · {event.event_type || '-'} · 가족코드 {event.family_code || '-'}
                        </p>
                      </div>
                      <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-current">
                        {event.risk_level || 'normal'}
                      </span>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">R&D 단계 로드맵</h2>
            <div className="mt-5 space-y-3">
              {(data?.milestones || []).map((item) => (
                <article key={item.phase} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                  <div className="text-xs font-black text-[#2AA897]">{item.phase} · {item.period}</div>
                  <h3 className="mt-2 text-xl font-black">{item.title}</h3>
                  <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">{item.desc}</p>
                </article>
              ))}
            </div>
          </section>
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">등록된 IoT 장비</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {(data?.devices || []).length === 0 ? (
              <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                아직 등록된 IoT 장비가 없습니다.
              </div>
            ) : (
              (data?.devices || []).map((device) => (
                <article key={device.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                  <h3 className="text-xl font-black">
                    {device.device_type === 'uwb_radar' ? 'UWB 비접촉 레이더' : '스마트 복약통'}
                  </h3>
                  <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                    {device.recipient_name || '대상자'} · {device.install_group || '-'} · {device.install_status || '-'}
                  </p>
                  <p className="mt-1 text-xs font-black text-[#7A9692]">
                    가족코드 {device.family_code || '-'} · 시리얼 {device.serial_no || '-'}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            href="/gov/dashboard"
            className="rounded-2xl bg-[#247A71] px-5 py-4 text-center text-sm font-black text-white"
          >
            지자체 운영실
          </Link>

          <Link
            href="/gov/proposal"
            className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
          >
            R&D 제안 패키지
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

export default GovIotPlatformPanel
