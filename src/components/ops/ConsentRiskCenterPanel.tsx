'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type RiskItem = {
  title: string
  risk: string
  control: string
}

type ConsentRecord = {
  id: string
  role: string
  familyCode: string
  name: string
  phone: string
  guardianName: string
  guardianPhone: string
  consentStatus: string
  consentVersion: string
  createdKst: string
}

type Snapshot = {
  id: string
  title: string
  status: string
  consentVersion: string
  createdBy: string
  createdKst: string
}

function toneClass(tone?: string) {
  if (tone === 'safe') return 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'
  if (tone === 'warning') return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  if (tone === 'danger') return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  return 'bg-white text-[#17443F] ring-[#D6EDE7]'
}

function MetricCard({ title, value, desc, tone }: { title: string; value: string; desc: string; tone?: string }) {
  return (
    <article className={'rounded-[1.6rem] p-5 shadow-sm ring-1 ' + toneClass(tone)}>
      <div className="text-sm font-black opacity-70">{title}</div>
      <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{value}</div>
      <p className="mt-2 text-sm font-bold leading-6 opacity-75">{desc}</p>
    </article>
  )
}

function Pill({ children, tone }: { children: React.ReactNode; tone?: string }) {
  return (
    <span className={'inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ' + toneClass(tone)}>
      {children}
    </span>
  )
}

export function ConsentRiskCenterPanel() {
  const [metrics, setMetrics] = useState<Record<string, any>>({})
  const [consentVersion, setConsentVersion] = useState('')
  const [consentBlocks, setConsentBlocks] = useState<Record<string, string>>({})
  const [riskItems, setRiskItems] = useState<RiskItem[]>([])
  const [checklist, setChecklist] = useState<string[]>([])
  const [copyBlocks, setCopyBlocks] = useState<Record<string, string>>({})
  const [records, setRecords] = useState<ConsentRecord[]>([])
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'consent' | 'risk' | 'copy' | 'records' | 'snapshots'>('overview')
  const [createdBy, setCreatedBy] = useState('운영실')
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)

    try {
      const response = await fetch('/api/consent-risk-center', { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '동의·책임범위 정보를 불러오지 못했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      setMetrics(data.metrics || {})
      setConsentVersion(data.consentVersion || '')
      setConsentBlocks(data.consentBlocks || {})
      setRiskItems(Array.isArray(data.riskItems) ? data.riskItems : [])
      setChecklist(Array.isArray(data.checklist) ? data.checklist : [])
      setCopyBlocks(data.copyBlocks || {})
      setRecords(Array.isArray(data.consentRecords) ? data.consentRecords : [])
      setSnapshots(Array.isArray(data.snapshots) ? data.snapshots : [])
      setMessage('')
      setDebug('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '동의·책임범위 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function saveSnapshot() {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/consent-risk-center', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveSnapshot', createdBy })
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || result.ok === false) {
        setMessage(result.message || '스냅샷 저장에 실패했습니다.')
        setDebug(JSON.stringify(result.detail || result, null, 2))
        await load()
        return
      }

      setMessage(result.message || '스냅샷을 저장했습니다.')
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '스냅샷 저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setMessage('문구를 복사했습니다.')
    } catch {
      setMessage('복사에 실패했습니다. 문구를 직접 선택해서 복사해주세요.')
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-7 text-[#17443F] sm:px-5 sm:py-10">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-white/95 p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            개인정보·동의·책임범위 센터
          </div>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
                실증 전에 동의와
                <br />
                책임범위를 먼저 정리합니다.
              </h1>

              <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
                비의료 고지, 119 대체 아님 고지, 개인정보 수집 범위, 리포트 열람 권한, 생활확인 파트너 책임범위를 한 화면에서 관리합니다.
              </p>
            </div>

            <div className={'rounded-[2rem] px-6 py-5 text-center ring-1 ' + toneClass(Number(metrics.consentRecords || 0) > 0 ? 'safe' : 'warning')}>
              <div className="text-sm font-black opacity-70">동의 기록</div>
              <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{Number(metrics.consentRecords || 0)}건</div>
              <div className="mt-2 text-xs font-bold">{consentVersion || '버전 확인'}</div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            이 화면의 문구는 운영용 기본안입니다. 계약, IRB, 의료·개인정보 법률 판단이 필요한 경우에는 별도 전문가 검토가 필요합니다.
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
            <input
              value={createdBy}
              onChange={(event) => setCreatedBy(event.target.value)}
              placeholder="작성자"
              className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-bold outline-none"
            />

            <button onClick={load} disabled={loading} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50">
              새로고침
            </button>

            <button onClick={saveSnapshot} disabled={loading} className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50">
              점검 저장
            </button>

            <Link href="/consent" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              동의서 열기
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/admin/ops/proposal-reality-check" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              제안 표현 점검
            </Link>
            <Link href="/admin/ops/pilot-report" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              실증 리포트
            </Link>
            <Link href="/admin/ops" className="rounded-2xl bg-[#FAFFFD] px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              운영실 홈
            </Link>
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#EFFFFA] p-4 text-sm font-black leading-7 text-[#247A71] ring-1 ring-[#CDEFE7]">
              {message}
            </div>
          ) : null}

          {debug ? (
            <details className="mt-4 rounded-2xl bg-[#247A71] p-4 text-xs font-bold leading-6 text-white">
              <summary className="cursor-pointer text-sm font-black">상세 결과 보기</summary>
              <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap">{debug}</pre>
            </details>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <MetricCard title="전체 동의" value={`${Number(metrics.consentRecords || 0)}건`} desc="실증 참여 동의" tone={Number(metrics.consentRecords || 0) > 0 ? 'safe' : 'warning'} />
          <MetricCard title="보호자" value={`${Number(metrics.guardianConsents || 0)}건`} desc="보호자 동의" tone="safe" />
          <MetricCard title="부모님" value={`${Number(metrics.parentConsents || 0)}건`} desc="부모님 동의" />
          <MetricCard title="파트너" value={`${Number(metrics.providerConsents || 0)}건`} desc="생활확인 파트너" />
        </section>

        <section className="rounded-[2rem] bg-white/95 p-3 shadow-sm ring-1 ring-[#D6EDE7]">
          <div className="grid gap-2 sm:grid-cols-6">
            {[
              ['overview', '개요'],
              ['consent', '동의 문구'],
              ['risk', '위험·통제'],
              ['copy', '복사 문구'],
              ['records', '동의 기록'],
              ['snapshots', '저장 기록']
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as typeof activeTab)}
                className={
                  'rounded-2xl px-4 py-4 text-sm font-black ring-1 ' +
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

        {activeTab === 'overview' ? (
          <section className="grid gap-5 xl:grid-cols-2">
            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">실증 전 필수 체크</h2>
              <div className="mt-5 space-y-3">
                {checklist.map((item, index) => (
                  <div key={item} className="flex gap-3 rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#EFFFFA] text-sm font-black text-[#247A71]">
                      {index + 1}
                    </div>
                    <div className="text-sm font-black leading-7">{item}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">핵심 고지</h2>
              <div className="mt-5 space-y-3">
                {[
                  ['비의료', '안부웍스는 의료 진단·치료·응급구조를 대체하지 않습니다.'],
                  ['119', '응급상황이 의심되면 앱보다 먼저 119 또는 의료기관에 연락해야 합니다.'],
                  ['리포트 권한', '가족코드와 휴대폰 뒤 4자리로 리포트가 열리므로 공유에 주의해야 합니다.'],
                  ['대리입력', '보호자·운영실이 전화 확인 후 대신 기록할 수 있습니다.']
                ].map(([title, desc]) => (
                  <div key={title} className="rounded-2xl bg-[#FFF9EE] p-4 text-[#795C22] ring-1 ring-[#F3DEB5]">
                    <div className="text-lg font-black">{title}</div>
                    <p className="mt-1 text-sm font-bold leading-7 opacity-80">{desc}</p>
                  </div>
                ))}
              </div>
            </section>
          </section>
        ) : null}

        {activeTab === 'consent' ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">동의·고지 문구</h2>

            <div className="mt-5 grid gap-4">
              {Object.entries(consentBlocks).map(([key, value]) => (
                <article key={key} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-xl font-black tracking-[-0.05em]">{labelForBlock(key)}</h3>
                    <button onClick={() => copyText(value)} className="rounded-xl bg-[#247A71] px-4 py-3 text-xs font-black text-white">
                      복사
                    </button>
                  </div>
                  <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-white p-4 text-sm font-bold leading-7 text-[#17443F] ring-1 ring-[#D6EDE7]">
                    {value}
                  </pre>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === 'risk' ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">위험과 통제 방안</h2>

            <div className="mt-5 space-y-3">
              {riskItems.map((item) => (
                <article key={item.title} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                  <div className="flex flex-wrap gap-2">
                    <Pill tone="warning">주의</Pill>
                  </div>
                  <h3 className="mt-3 text-xl font-black tracking-[-0.05em]">{item.title}</h3>
                  <p className="mt-2 text-sm font-bold leading-7 text-[#795C22]">위험: {item.risk}</p>
                  <p className="mt-2 rounded-2xl bg-white p-4 text-sm font-black leading-7 text-[#247A71] ring-1 ring-[#D6EDE7]">
                    통제: {item.control}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === 'copy' ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">상황별 복사 문구</h2>

            <div className="mt-5 grid gap-4">
              {Object.entries(copyBlocks).map(([key, value]) => (
                <article key={key} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-xl font-black tracking-[-0.05em]">{labelForBlock(key)}</h3>
                    <button onClick={() => copyText(value)} className="rounded-xl bg-[#247A71] px-4 py-3 text-xs font-black text-white">
                      복사
                    </button>
                  </div>
                  <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-white p-4 text-sm font-bold leading-7 text-[#17443F] ring-1 ring-[#D6EDE7]">
                    {value}
                  </pre>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === 'records' ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">실증 참여 동의 기록</h2>

            <div className="mt-5 space-y-3">
              {records.length ? (
                records.map((record) => (
                  <article key={record.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    <div className="flex flex-wrap gap-2">
                      <Pill tone="safe">{record.consentStatus || 'agreed'}</Pill>
                      <Pill>{record.role || 'role'}</Pill>
                      <Pill>{record.consentVersion || consentVersion}</Pill>
                    </div>
                    <h3 className="mt-3 text-lg font-black">{record.name || '-'} · {record.familyCode || '-'}</h3>
                    <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                      연락처 {record.phone || '-'} · 보호자 {record.guardianName || '-'} · {record.createdKst || '-'}
                    </p>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                  아직 동의 기록이 없습니다. /consent 링크를 참여자에게 보내세요.
                </div>
              )}
            </div>
          </section>
        ) : null}

        {activeTab === 'snapshots' ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">저장 기록</h2>

            <div className="mt-5 space-y-3">
              {snapshots.length ? (
                snapshots.map((snapshot) => (
                  <article key={snapshot.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    <div className="flex flex-wrap gap-2">
                      <Pill tone="safe">{snapshot.status || 'saved'}</Pill>
                      <Pill>{snapshot.consentVersion || consentVersion}</Pill>
                    </div>
                    <h3 className="mt-3 text-lg font-black">{snapshot.title}</h3>
                    <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                      {snapshot.createdBy || '-'} · {snapshot.createdKst || '-'}
                    </p>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                  아직 저장한 점검 기록이 없습니다.
                </div>
              )}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  )
}

function labelForBlock(key: string) {
  const labels: Record<string, string> = {
    participantConsent: '실증 참여 동의서',
    privacyNotice: '개인정보 수집·이용 안내',
    nonMedicalNotice: '비의료 서비스 고지',
    guardianResponsibility: '보호자 책임 범위',
    providerResponsibility: '생활확인 파트너 책임 범위',
    reportAccess: '리포트 열람 권한',
    shortNotice: '짧은 고지문',
    consentMessage: '실증 참여자 안내 문자',
    careCenterNotice: '방문요양센터 안내문',
    partnerNotice: '생활확인 파트너 안내문'
  }

  return labels[key] || key
}

export default ConsentRiskCenterPanel
