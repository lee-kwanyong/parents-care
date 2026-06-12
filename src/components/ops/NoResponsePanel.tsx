'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type FamilyRow = {
  id: string
  source: string
  familyCode: string
  pilotKey: string
  parentName: string
  parentPhone: string
  guardianName: string
  guardianPhone: string
  guardianEmail: string
  serviceArea: string
  status: string
  createdAt: string
  parentAppUrl: string
  guardianProxyUrl: string
  guardianReportUrl: string
  hasTodaySignal: boolean
  needsFollowup: boolean
  todaySignalCount: number
  signalCount: number
  lastSignalKst: string
  lastSignalAgeHours: number | null
  lastSignalLabel: string
  todayMessageCount: number
  todayNoResponseMessageCount: number
  reminderStatus: string
  reminderCreatedKst: string
  reminderSentKst: string
  guardianPhoneLast4: string
  parentPhoneLast4: string
}

type RunRow = {
  id: string
  action?: string
  status?: string
  summary?: string
  family_code?: string
  metrics?: Record<string, unknown>
  created_by?: string
  created_at?: string
}

function toneClass(tone?: string) {
  if (['safe', 'sent', 'ok', 'completed'].includes(tone || '')) return 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'
  if (['warning', 'queued', 'pending'].includes(tone || '')) return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  if (['danger', 'failed', 'urgent'].includes(tone || '')) return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
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

export function NoResponsePanel() {
  const [families, setFamilies] = useState<FamilyRow[]>([])
  const [noResponseFamilies, setNoResponseFamilies] = useState<FamilyRow[]>([])
  const [respondedFamilies, setRespondedFamilies] = useState<FamilyRow[]>([])
  const [runs, setRuns] = useState<RunRow[]>([])
  const [metrics, setMetrics] = useState<Record<string, any>>({})
  const [today, setToday] = useState('')
  const [activeTab, setActiveTab] = useState<'noResponse' | 'responded' | 'all' | 'runs'>('noResponse')
  const [createdBy, setCreatedBy] = useState('운영실')
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)

  const activeFamilies = useMemo(() => {
    if (activeTab === 'responded') return respondedFamilies
    if (activeTab === 'all') return families
    return noResponseFamilies
  }, [activeTab, families, noResponseFamilies, respondedFamilies])

  async function load() {
    setLoading(true)

    try {
      const response = await fetch('/api/no-response', { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '미응답 정보를 불러오지 못했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      setFamilies(Array.isArray(data.families) ? data.families : [])
      setNoResponseFamilies(Array.isArray(data.noResponseFamilies) ? data.noResponseFamilies : [])
      setRespondedFamilies(Array.isArray(data.respondedFamilies) ? data.respondedFamilies : [])
      setRuns(Array.isArray(data.runs) ? data.runs : [])
      setMetrics(data.metrics || {})
      setToday(data.today || '')
      setMessage('')
      setDebug('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '미응답 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function queueReminders(familyCode?: string) {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/no-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'queueReminders', familyCode: familyCode || '', createdBy })
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || result.ok === false) {
        setMessage(result.message || '미응답 확인 문자 생성에 실패했습니다.')
        setDebug(JSON.stringify(result.detail || result, null, 2))
        await load()
        return
      }

      setMessage(result.message || '미응답 확인 문자 대기열을 생성했습니다.')
      setDebug(JSON.stringify(result, null, 2))
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '미응답 확인 문자 생성 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
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
            미응답 자동 처리센터
          </div>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
                오늘 안부 신호가 없는
                <br />
                가구를 먼저 확인합니다.
              </h1>

              <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
                부모님이 직접 앱을 누르지 않았을 때 보호자 확인 문자와 대리입력으로 리포트 공백을 막습니다.
              </p>
            </div>

            <div className={'rounded-[2rem] px-6 py-5 text-center ring-1 ' + toneClass(Number(metrics.noResponseFamilies || 0) > 0 ? 'warning' : 'safe')}>
              <div className="text-sm font-black opacity-70">오늘 미응답</div>
              <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{Number(metrics.noResponseFamilies || 0)}가구</div>
              <div className="mt-2 text-xs font-bold">{today || '오늘'} 기준</div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            미응답은 응급상황으로 단정하지 않습니다. 먼저 보호자 전화 확인을 유도하고, 응급 의심 시 119 또는 의료기관 연락을 안내합니다.
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
            <input
              value={createdBy}
              onChange={(event) => setCreatedBy(event.target.value)}
              placeholder="처리자"
              className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-bold outline-none"
            />

            <button onClick={load} disabled={loading} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50">
              새로고침
            </button>

            <button onClick={() => queueReminders()} disabled={loading} className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50">
              미응답 보호자 문자 생성
            </button>

            <Link href="/admin/ops/notification-dispatch" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              알림 발송센터
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/guardian/proxy-checkin" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              보호자 대리입력
            </Link>

            <Link href="/admin/ops/proxy-checkin" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              운영실 대리입력
            </Link>

            <Link href="/admin/ops/message-automation" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              자동문자
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
              <summary className="cursor-pointer text-sm font-black">처리 결과 보기</summary>
              <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap">{debug}</pre>
            </details>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
          <MetricCard title="전체 가구" value={`${Number(metrics.totalFamilies || 0)}가구`} desc="운영 대상" tone="safe" />
          <MetricCard title="오늘 응답" value={`${Number(metrics.respondedFamilies || 0)}가구`} desc="안부 신호 있음" tone="safe" />
          <MetricCard title="오늘 미응답" value={`${Number(metrics.noResponseFamilies || 0)}가구`} desc="확인 필요" tone={Number(metrics.noResponseFamilies || 0) > 0 ? 'warning' : 'safe'} />
          <MetricCard title="응답률" value={`${Number(metrics.responseRate || 0)}%`} desc="오늘 기준" tone={Number(metrics.responseRate || 0) >= 70 ? 'safe' : 'warning'} />
          <MetricCard title="번호 없음" value={`${Number(metrics.noGuardianPhone || 0)}가구`} desc="문자 불가" tone={Number(metrics.noGuardianPhone || 0) > 0 ? 'danger' : 'safe'} />
          <MetricCard title="대기 문자" value={`${Number(metrics.remindersQueued || 0)}건`} desc="보호자 확인" tone={Number(metrics.remindersQueued || 0) > 0 ? 'warning' : 'normal'} />
          <MetricCard title="발송 완료" value={`${Number(metrics.remindersSent || 0)}건`} desc="미응답 알림" tone="safe" />
          <MetricCard title="발송 실패" value={`${Number(metrics.remindersFailed || 0)}건`} desc="재확인" tone={Number(metrics.remindersFailed || 0) > 0 ? 'danger' : 'safe'} />
        </section>

        <section className="rounded-[2rem] bg-white/95 p-3 shadow-sm ring-1 ring-[#D6EDE7]">
          <div className="grid gap-2 sm:grid-cols-4">
            {[
              ['noResponse', '미응답 가구'],
              ['responded', '응답 가구'],
              ['all', '전체 가구'],
              ['runs', '처리 기록']
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

        {activeTab === 'runs' ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">미응답 처리 기록</h2>

            <div className="mt-5 space-y-3">
              {runs.length ? (
                runs.map((run) => (
                  <article key={run.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    <div className="flex flex-wrap gap-2">
                      <Pill tone={run.status === 'ok' ? 'safe' : 'warning'}>{run.status || 'recorded'}</Pill>
                      <Pill>{run.action || '-'}</Pill>
                    </div>

                    <h3 className="mt-3 text-lg font-black">{run.summary || '미응답 처리 실행'}</h3>

                    <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                      대상 {String(run.metrics?.targets || 0)} · 생성 {String(run.metrics?.queued || 0)} · 스킵 {String(run.metrics?.skipped || 0)} · 실패 {String(run.metrics?.failed || 0)}
                      <br />
                      {run.created_by || '-'} · {run.created_at || ''}
                    </p>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                  아직 처리 기록이 없습니다.
                </div>
              )}
            </div>
          </section>
        ) : (
          <FamilyList
            title={
              activeTab === 'responded'
                ? '오늘 응답한 가구'
                : activeTab === 'all'
                  ? '전체 가구'
                  : '오늘 미응답 가구'
            }
            families={activeFamilies}
            queueOne={queueReminders}
            loading={loading}
          />
        )}

        <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <h2 className="text-3xl font-black tracking-[-0.06em]">미응답 운영 원칙</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              ['응급으로 단정하지 않기', '응답이 없다는 이유만으로 응급 판단을 하지 않습니다. 먼저 보호자 확인을 유도합니다.'],
              ['보호자 대리입력 유도', '보호자가 전화 확인 후 괜찮아요/밥/약/몸/도움 상태를 대신 기록하게 합니다.'],
              ['운영실 전화확인 목록화', '보호자 확인이 안 되면 운영실이 전화 확인 후 기록합니다.']
            ].map(([title, desc]) => (
              <div key={title} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                <div className="text-lg font-black">{title}</div>
                <p className="mt-1 text-sm font-bold leading-7 text-[#637B76]">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}

function FamilyList({
  title,
  families,
  queueOne,
  loading
}: {
  title: string
  families: FamilyRow[]
  queueOne: (familyCode?: string) => void
  loading: boolean
}) {
  return (
    <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
      <h2 className="text-3xl font-black tracking-[-0.06em]">{title}</h2>

      <div className="mt-5 space-y-3">
        {families.length ? (
          families.map((family) => (
            <article key={family.source + family.id + family.familyCode} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Pill tone={family.hasTodaySignal ? 'safe' : 'warning'}>
                      {family.hasTodaySignal ? '오늘 응답' : '오늘 미응답'}
                    </Pill>
                    <Pill>{family.source}</Pill>
                    {family.reminderStatus ? <Pill tone={family.reminderStatus}>{family.reminderStatus}</Pill> : null}
                    {!family.guardianPhone ? <Pill tone="danger">보호자 번호 없음</Pill> : null}
                  </div>

                  <h3 className="mt-3 text-lg font-black">
                    {family.familyCode} · {family.parentName}
                  </h3>

                  <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                    보호자 {family.guardianName || '-'} · {family.guardianPhone || '-'} · 권역 {family.serviceArea || '-'}
                    <br />
                    누적 안부 {family.signalCount}건 · 오늘 안부 {family.todaySignalCount}건 · 마지막 신호 {family.lastSignalKst || '없음'} {family.lastSignalAgeHours !== null ? `(${family.lastSignalAgeHours}시간 전)` : ''}
                    <br />
                    미응답 문자 {family.todayNoResponseMessageCount}건 · 문자 상태 {family.reminderStatus || '-'}
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[420px]">
                  <button
                    disabled={loading || !family.needsFollowup}
                    onClick={() => queueOne(family.familyCode)}
                    className="rounded-xl bg-[#247A71] px-4 py-3 text-xs font-black text-white disabled:opacity-50"
                  >
                    보호자 문자 생성
                  </button>

                  <Link href={family.guardianProxyUrl || '/guardian/proxy-checkin'} className="rounded-xl bg-white px-4 py-3 text-center text-xs font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                    보호자 대리입력
                  </Link>

                  <Link href={family.guardianReportUrl || '/guardian/today'} className="rounded-xl bg-white px-4 py-3 text-center text-xs font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                    오늘 리포트
                  </Link>

                  <Link href={family.parentAppUrl || '/mobile/parent'} className="rounded-xl bg-white px-4 py-3 text-center text-xs font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                    부모님 앱
                  </Link>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
            해당 가구가 없습니다.
          </div>
        )}
      </div>
    </section>
  )
}

export default NoResponsePanel
