'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type MessageRow = {
  id: string
  familyCode: string
  toName: string
  toPhone: string
  title: string
  body: string
  templateCode: string
  reason: string
  status: string
  provider: string
  createdKst: string
  sentKst: string
  reasons: string[]
  hardReasons: string[]
  shouldCancel: boolean
}

type RunRow = {
  id: string
  action?: string
  status?: string
  summary?: string
  metrics?: Record<string, unknown>
  created_by?: string
  created_at?: string
}

function toneClass(tone?: string) {
  if (['safe', 'sent', 'ok'].includes(tone || '')) return 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'
  if (['warning', 'queued'].includes(tone || '')) return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  if (['danger', 'failed'].includes(tone || '')) return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
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

export function SmsBudgetGuardPanel() {
  const [settings, setSettings] = useState<Record<string, any>>({})
  const [metrics, setMetrics] = useState<Record<string, any>>({})
  const [riskyQueued, setRiskyQueued] = useState<MessageRow[]>([])
  const [hardRiskQueued, setHardRiskQueued] = useState<MessageRow[]>([])
  const [queued, setQueued] = useState<MessageRow[]>([])
  const [recentItems, setRecentItems] = useState<MessageRow[]>([])
  const [runs, setRuns] = useState<RunRow[]>([])
  const [activeTab, setActiveTab] = useState<'summary' | 'settings' | 'risky' | 'queued' | 'runs'>('summary')
  const [createdBy, setCreatedBy] = useState('운영실')
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)

  const [dailyLimit, setDailyLimit] = useState('30')
  const [perFamilyDailyLimit, setPerFamilyDailyLimit] = useState('3')
  const [pointPerSms, setPointPerSms] = useState('18')
  const [pointBudget, setPointBudget] = useState('500')
  const [testMode, setTestMode] = useState(true)
  const [autoDispatchAllowed, setAutoDispatchAllowed] = useState(false)
  const [allowedTestPhones, setAllowedTestPhones] = useState('01046390336')
  const [notificationPhone, setNotificationPhone] = useState('01046390336')
  const [notes, setNotes] = useState('실증 초기 기본값: 테스트 번호만 허용, 자동발송 OFF')

  const guardTone = useMemo(() => {
    if (Number(metrics.hardRiskQueued || 0) > 0) return 'danger'
    if (metrics.overDailyLimit || metrics.overPointBudget || !settings.autoDispatchAllowed) return 'warning'
    return 'safe'
  }, [metrics, settings])

  function applySettings(nextSettings: Record<string, any>) {
    setSettings(nextSettings || {})
    setDailyLimit(String(nextSettings.dailyLimit ?? 30))
    setPerFamilyDailyLimit(String(nextSettings.perFamilyDailyLimit ?? 3))
    setPointPerSms(String(nextSettings.pointPerSms ?? 18))
    setPointBudget(String(nextSettings.pointBudget ?? 500))
    setTestMode(Boolean(nextSettings.testMode))
    setAutoDispatchAllowed(Boolean(nextSettings.autoDispatchAllowed))
    setAllowedTestPhones(Array.isArray(nextSettings.allowedTestPhones) ? nextSettings.allowedTestPhones.join(', ') : '')
    setNotificationPhone(nextSettings.notificationPhone || '')
    setNotes(nextSettings.notes || '')
  }

  async function load() {
    setLoading(true)

    try {
      const response = await fetch('/api/sms-budget-guard', { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '문자 비용 보호 정보를 불러오지 못했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      applySettings(data.settings || {})
      setMetrics(data.metrics || {})
      setRiskyQueued(Array.isArray(data.riskyQueued) ? data.riskyQueued : [])
      setHardRiskQueued(Array.isArray(data.hardRiskQueued) ? data.hardRiskQueued : [])
      setQueued(Array.isArray(data.queued) ? data.queued : [])
      setRecentItems(Array.isArray(data.recentItems) ? data.recentItems : [])
      setRuns(Array.isArray(data.runs) ? data.runs : [])
      setMessage('')
      setDebug('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '문자 비용 보호 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function saveSettings() {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/sms-budget-guard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveSettings',
          dailyLimit: Number(dailyLimit),
          perFamilyDailyLimit: Number(perFamilyDailyLimit),
          pointPerSms: Number(pointPerSms),
          pointBudget: Number(pointBudget),
          testMode,
          autoDispatchAllowed,
          allowedTestPhones,
          notificationPhone,
          notes,
          createdBy
        })
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || result.ok === false) {
        setMessage(result.message || '설정 저장에 실패했습니다.')
        setDebug(JSON.stringify(result.detail || result, null, 2))
        await load()
        return
      }

      setMessage(result.message || '문자 보호 설정을 저장했습니다.')
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '설정 저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function cancelRiskyQueued() {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/sms-budget-guard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancelRiskyQueued', createdBy })
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || result.ok === false) {
        setMessage(result.message || '위험 대기 문자 취소에 실패했습니다.')
        setDebug(JSON.stringify(result.detail || result, null, 2))
        await load()
        return
      }

      setMessage(result.message || '위험 대기 문자를 취소했습니다.')
      setDebug(JSON.stringify(result, null, 2))
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '위험 대기 문자 취소 중 오류가 발생했습니다.')
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
            문자 비용·자동발송 보호센터
          </div>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
                자동발송 전에
                <br />
                비용과 대기열을 막습니다.
              </h1>

              <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
                하루 문자 한도, 가구별 한도, 테스트 번호 모드, 예상 비용, 위험 대기열을 확인하고 실수 발송을 방지합니다.
              </p>
            </div>

            <div className={'rounded-[2rem] px-6 py-5 text-center ring-1 ' + toneClass(guardTone)}>
              <div className="text-sm font-black opacity-70">발송 위험도</div>
              <div className="mt-2 text-4xl font-black tracking-[-0.08em]">
                {guardTone === 'safe' ? '낮음' : guardTone === 'warning' ? '주의' : '위험'}
              </div>
              <div className="mt-2 text-xs font-bold">
                위험 대기 {Number(metrics.hardRiskQueued || 0)}건
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            실증 초기에는 테스트 번호만 허용하고 자동발송은 OFF로 두는 것을 권장합니다. 실제 발송은 알림 발송센터에서 대기열을 확인한 뒤 진행하세요.
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

            <button onClick={cancelRiskyQueued} disabled={loading || hardRiskQueued.length === 0} className="rounded-2xl bg-[#B43C3C] px-5 py-4 text-sm font-black text-white disabled:opacity-50">
              위험 대기 문자 취소
            </button>

            <Link href="/admin/ops/notification-dispatch" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              알림 발송센터
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/admin/ops/notification-safety" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              문자 안전정리
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
              <summary className="cursor-pointer text-sm font-black">상세 결과 보기</summary>
              <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap">{debug}</pre>
            </details>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
          <MetricCard title="오늘 발송" value={`${Number(metrics.sentToday || 0)}건`} desc="sent" tone="safe" />
          <MetricCard title="발송 대기" value={`${Number(metrics.queued || 0)}건`} desc="queued" tone={Number(metrics.queued || 0) > 0 ? 'warning' : 'normal'} />
          <MetricCard title="오늘 실패" value={`${Number(metrics.failedToday || 0)}건`} desc="failed" tone={Number(metrics.failedToday || 0) > 0 ? 'danger' : 'safe'} />
          <MetricCard title="위험 대기" value={`${Number(metrics.hardRiskQueued || 0)}건`} desc="취소 후보" tone={Number(metrics.hardRiskQueued || 0) > 0 ? 'danger' : 'safe'} />
          <MetricCard title="하루 한도" value={`${Number(metrics.dailyLimit || 0)}건`} desc="최대 발송" tone={metrics.overDailyLimit ? 'danger' : 'safe'} />
          <MetricCard title="예상 비용" value={`${Number(metrics.projectedCost || 0)}P`} desc="발송+대기" tone={metrics.overPointBudget ? 'danger' : 'safe'} />
          <MetricCard title="잔여 포인트" value={`${Number(metrics.remainingPoint || 0)}P`} desc="설정 기준" tone={Number(metrics.remainingPoint || 0) < 0 ? 'danger' : 'safe'} />
          <MetricCard title="자동발송" value={settings.autoDispatchAllowed ? 'ON' : 'OFF'} desc="전체 허용" tone={settings.autoDispatchAllowed ? 'warning' : 'safe'} />
        </section>

        <section className="rounded-[2rem] bg-white/95 p-3 shadow-sm ring-1 ring-[#D6EDE7]">
          <div className="grid gap-2 sm:grid-cols-5">
            {[
              ['summary', '요약'],
              ['settings', '보호 설정'],
              ['risky', '위험 대기열'],
              ['queued', '전체 대기열'],
              ['runs', '처리 기록']
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

        {activeTab === 'summary' ? (
          <section className="grid gap-5 xl:grid-cols-3">
            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">지금 상태</h2>
              <div className="mt-5 space-y-3">
                {[
                  [`테스트 모드 ${settings.testMode ? 'ON' : 'OFF'}`, settings.testMode ? '허용 번호 외 발송 대기열은 위험 처리됩니다.' : '실사용 번호 발송이 가능한 상태입니다.', settings.testMode ? 'safe' : 'warning'],
                  [`자동발송 ${settings.autoDispatchAllowed ? 'ON' : 'OFF'}`, settings.autoDispatchAllowed ? '실제 발송 전 대기열 확인이 필요합니다.' : '자동발송이 꺼져 있어 실수 발송 위험이 낮습니다.', settings.autoDispatchAllowed ? 'warning' : 'safe'],
                  [`위험 대기 ${Number(metrics.hardRiskQueued || 0)}건`, '수신번호 없음, 허용번호 외, 한도 초과, 중복 대기 문자입니다.', Number(metrics.hardRiskQueued || 0) > 0 ? 'danger' : 'safe']
                ].map(([title, desc, tone]) => (
                  <div key={String(title)} className={'rounded-2xl p-4 ring-1 ' + toneClass(String(tone))}>
                    <div className="text-lg font-black">{title}</div>
                    <p className="mt-1 text-sm font-bold leading-7 opacity-80">{desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">비용 계산</h2>
              <div className="mt-5 space-y-3">
                <div className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                  <div className="text-lg font-black">SMS 1건 기준</div>
                  <p className="mt-1 text-sm font-bold leading-7 text-[#637B76]">{Number(metrics.pointPerSms || 0)}포인트</p>
                </div>
                <div className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                  <div className="text-lg font-black">오늘 발송 비용</div>
                  <p className="mt-1 text-sm font-bold leading-7 text-[#637B76]">{Number(metrics.estimatedTodayCost || 0)}포인트</p>
                </div>
                <div className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                  <div className="text-lg font-black">대기열 예상 비용</div>
                  <p className="mt-1 text-sm font-bold leading-7 text-[#637B76]">{Number(metrics.estimatedQueuedCost || 0)}포인트</p>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">실증 운영 원칙</h2>
              <div className="mt-5 space-y-3">
                {[
                  ['1가구 1건부터', '실증 첫날은 보호자 1명에게만 실제 발송합니다.'],
                  ['대기열 먼저 확인', '발송센터에서 수신번호와 문구를 확인한 뒤 보냅니다.'],
                  ['실패 재시도 금지', '실패 문자는 문자 안전정리센터에서 테스트/실사용을 분리합니다.']
                ].map(([title, desc]) => (
                  <div key={title} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    <div className="text-lg font-black">{title}</div>
                    <p className="mt-1 text-sm font-bold leading-7 text-[#637B76]">{desc}</p>
                  </div>
                ))}
              </div>
            </section>
          </section>
        ) : null}

        {activeTab === 'settings' ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">문자 보호 설정</h2>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <Field label="하루 최대 문자 수" value={dailyLimit} onChange={setDailyLimit} />
              <Field label="가구/수신자당 하루 최대 문자 수" value={perFamilyDailyLimit} onChange={setPerFamilyDailyLimit} />
              <Field label="SMS 1건 포인트" value={pointPerSms} onChange={setPointPerSms} />
              <Field label="오늘 사용 가능 포인트" value={pointBudget} onChange={setPointBudget} />
              <Field label="허용 테스트 번호, 쉼표 구분" value={allowedTestPhones} onChange={setAllowedTestPhones} />
              <Field label="운영실 알림번호" value={notificationPhone} onChange={setNotificationPhone} />
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <label className="flex items-center gap-3 rounded-2xl bg-[#FAFFFD] p-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                <input type="checkbox" checked={testMode} onChange={(event) => setTestMode(event.target.checked)} />
                테스트 번호만 허용
              </label>

              <label className="flex items-center gap-3 rounded-2xl bg-[#FAFFFD] p-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                <input type="checkbox" checked={autoDispatchAllowed} onChange={(event) => setAutoDispatchAllowed(event.target.checked)} />
                자동발송 허용
              </label>
            </div>

            <label className="mt-5 grid gap-2">
              <span className="text-sm font-black text-[#637B76]">메모</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="min-h-28 rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-base font-bold leading-7 outline-none"
              />
            </label>

            <button onClick={saveSettings} disabled={loading} className="mt-5 rounded-2xl bg-[#247A71] px-6 py-4 text-sm font-black text-white disabled:opacity-50">
              설정 저장
            </button>
          </section>
        ) : null}

        {activeTab === 'risky' ? (
          <MessageList title="위험 대기열" items={riskyQueued} empty="위험 대기 문자가 없습니다." />
        ) : null}

        {activeTab === 'queued' ? (
          <MessageList title="전체 발송 대기열" items={queued} empty="발송 대기 문자가 없습니다." />
        ) : null}

        {activeTab === 'runs' ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">처리 기록</h2>
            <div className="mt-5 space-y-3">
              {runs.length ? (
                runs.map((run) => (
                  <article key={run.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    <div className="flex flex-wrap gap-2">
                      <Pill tone={run.status === 'ok' ? 'safe' : 'warning'}>{run.status || 'recorded'}</Pill>
                      <Pill>{run.action || '-'}</Pill>
                    </div>
                    <h3 className="mt-3 text-lg font-black">{run.summary || '문자 보호 실행'}</h3>
                    <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                      대상 {String(run.metrics?.target || 0)} · 성공 {String(run.metrics?.ok || 0)} · 실패 {String(run.metrics?.failed || 0)}
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
        ) : null}
      </section>
    </main>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-black text-[#637B76]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-base font-bold outline-none"
      />
    </label>
  )
}

function MessageList({ title, items, empty }: { title: string; items: MessageRow[]; empty: string }) {
  return (
    <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
      <h2 className="text-3xl font-black tracking-[-0.06em]">{title}</h2>

      <div className="mt-5 space-y-3">
        {items.length ? (
          items.map((item) => (
            <article key={item.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
              <div className="flex flex-wrap gap-2">
                <Pill tone={item.status === 'queued' ? 'warning' : item.status === 'failed' ? 'danger' : 'safe'}>{item.status}</Pill>
                {item.shouldCancel ? <Pill tone="danger">취소 후보</Pill> : null}
                {item.reasons.map((reason) => (
                  <Pill key={reason} tone={item.hardReasons.includes(reason) ? 'danger' : 'warning'}>{reason}</Pill>
                ))}
              </div>

              <h3 className="mt-3 text-lg font-black">{item.title || '안부웍스 알림'}</h3>

              <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                {item.toName || '-'} · {item.toPhone || '-'} · 가족코드 {item.familyCode || '-'}
                <br />
                template: {item.templateCode || '-'} · reason: {item.reason || '-'} · 생성 {item.createdKst || '-'}
              </p>

              <p className="mt-2 line-clamp-3 text-sm font-bold leading-7 text-[#637B76]">
                {item.body || '-'}
              </p>
            </article>
          ))
        ) : (
          <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
            {empty}
          </div>
        )}
      </div>
    </section>
  )
}

export default SmsBudgetGuardPanel
