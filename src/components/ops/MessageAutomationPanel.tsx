'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Template = {
  id?: string
  template_code?: string
  title?: string
  audience?: string
  situation?: string
  severity?: string
  body?: string
  enabled?: boolean
}

type Rule = {
  id?: string
  rule_key?: string
  title?: string
  trigger_type?: string
  signal_type?: string
  template_code?: string
  audience?: string
  auto_queue?: boolean
  auto_dispatch?: boolean
  enabled?: boolean
  min_age_minutes?: number
  priority?: number
  notes?: string
}

type Run = {
  id?: string
  run_type?: string
  status?: string
  summary?: string
  metrics?: Record<string, unknown>
  created_by?: string
  created_at?: string
}

function statusClass(status?: string) {
  if (status === 'ok' || status === 'sent' || status === 'enabled') return 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'
  if (status === 'warning' || status === 'queued') return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  if (status === 'failed' || status === 'disabled') return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  return 'bg-[#FAFFFD] text-[#637B76] ring-[#D6EDE7]'
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

function groupTemplates(templates: Template[]) {
  return templates.reduce<Record<string, Template[]>>((acc, item) => {
    const key = item.audience || '기타'
    acc[key] = acc[key] || []
    acc[key].push(item)
    return acc
  }, {})
}

export function MessageAutomationPanel() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [rules, setRules] = useState<Rule[]>([])
  const [runs, setRuns] = useState<Run[]>([])
  const [config, setConfig] = useState<Record<string, unknown>>({})
  const [activeTab, setActiveTab] = useState<'rules' | 'templates' | 'runs'>('rules')
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)
  const [createdBy, setCreatedBy] = useState('운영실')

  const groupedTemplates = useMemo(() => groupTemplates(templates), [templates])
  const latestMetrics = runs[0]?.metrics || {}

  async function load() {
    setLoading(true)

    try {
      const response = await fetch('/api/message-automation', { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '자동문자 설정을 불러오지 못했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      setTemplates(Array.isArray(data.templates) ? data.templates : [])
      setRules(Array.isArray(data.rules) ? data.rules : [])
      setRuns(Array.isArray(data.runs) ? data.runs : [])
      setConfig(data.config || {})
      setMessage('')
      setDebug('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '자동문자 설정을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function post(action: string, payload: Record<string, unknown> = {}) {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/message-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, createdBy, ...payload })
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || result.ok === false) {
        setMessage(result.message || '처리에 실패했습니다.')
        setDebug(JSON.stringify(result.detail || result, null, 2))
        await load()
        return
      }

      setMessage(result.message || '처리되었습니다.')
      setDebug(JSON.stringify(result, null, 2))
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function toggleRule(rule: Rule, field: 'enabled' | 'auto_dispatch') {
    if (!rule.rule_key) return

    await post('updateRule', {
      ruleKey: rule.rule_key,
      patch: {
        [field]: !rule[field]
      }
    })
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-7 text-[#17443F] sm:px-5 sm:py-10">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-white/95 p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            상황별 문자 자동화센터
          </div>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
                필요한 상황에
                <br />
                필요한 문자를 자동으로 보냅니다.
              </h1>

              <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
                부모님 안부 신호, 주의 신호, 긴급 요청, 수락, 완료, 문자 실패, 실증 안부요청에 따라 문구를 자동 선택하고 대기열을 만듭니다.
              </p>
            </div>

            <div className="rounded-[2rem] bg-[#EFFFFA] px-6 py-5 text-center text-[#247A71] ring-1 ring-[#CDEFE7]">
              <div className="text-sm font-black opacity-70">최근 생성</div>
              <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{Number(latestMetrics.queued || 0)}건</div>
              <div className="mt-2 text-xs font-bold">문자 대기열</div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            첫 실증일에는 자동으로 대기열만 생성하고, 실제 발송은 알림 발송센터에서 확인 후 보내는 방식을 권장합니다.
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
            <input
              value={createdBy}
              onChange={(event) => setCreatedBy(event.target.value)}
              placeholder="실행자"
              className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-bold outline-none"
            />

            <button onClick={() => post('seedDefaults')} disabled={loading} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50">
              템플릿·규칙 초기화
            </button>

            <button onClick={() => post('runSituations')} disabled={loading} className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50">
              상황 문자 실행
            </button>

            <button onClick={() => post('runDaily')} disabled={loading} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50">
              오늘 안부요청 생성
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={load} disabled={loading} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50">
              새로고침
            </button>
            <Link href="/ops/notification-dispatch" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              알림 발송센터
            </Link>
            <Link href="/ops/private-pilot" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              자체 예비 실증
            </Link>
            <Link href="/ops/control-center" className="rounded-2xl bg-[#FAFFFD] px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              운영실 상태판
            </Link>
          </div>

          <div className="mt-4 rounded-2xl bg-[#FAFFFD] p-4 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D6EDE7]">
            자동발송 전체 설정: {config.autoDispatchGlobal ? 'ON' : 'OFF'} · 운영실 알림번호: {String(config.opsAlertPhone || '미설정')}
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

        <section className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">
          <MetricCard title="템플릿" value={`${templates.length}개`} desc="문자 문구" />
          <MetricCard title="규칙" value={`${rules.length}개`} desc="상황별 조건" />
          <MetricCard title="활성 규칙" value={`${rules.filter((item) => item.enabled).length}개`} desc="자동화 대상" />
          <MetricCard title="최근 생성" value={`${Number(latestMetrics.queued || 0)}건`} desc="대기열 생성" />
          <MetricCard title="최근 중복" value={`${Number(latestMetrics.skipped || 0)}건`} desc="중복/번호없음" />
          <MetricCard title="최근 실패" value={`${Number(latestMetrics.failed || 0)}건`} desc="생성 실패" danger={Number(latestMetrics.failed || 0) > 0} />
        </section>

        <section className="rounded-[2rem] bg-white/95 p-3 shadow-sm ring-1 ring-[#D6EDE7]">
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              ['rules', '자동화 규칙'],
              ['templates', '문자 문구'],
              ['runs', '실행 기록']
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

        {activeTab === 'rules' ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">자동화 규칙</h2>

            <div className="mt-5 space-y-3">
              {rules.length === 0 ? (
                <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                  규칙이 없습니다. 템플릿·규칙 초기화를 눌러주세요.
                </div>
              ) : (
                rules.map((rule) => (
                  <article key={rule.rule_key || rule.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span className={'rounded-full px-3 py-1 text-xs font-black ring-1 ' + statusClass(rule.enabled ? 'enabled' : 'disabled')}>
                            {rule.enabled ? '사용' : '중지'}
                          </span>
                          <span className={'rounded-full px-3 py-1 text-xs font-black ring-1 ' + statusClass(rule.auto_dispatch ? 'sent' : 'queued')}>
                            {rule.auto_dispatch ? '실제발송 허용' : '대기열만'}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#247A71] ring-1 ring-[#D6EDE7]">
                            {rule.trigger_type || '-'}
                          </span>
                        </div>

                        <h3 className="mt-3 text-xl font-black tracking-[-0.05em]">{rule.title || '자동화 규칙'}</h3>
                        <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                          signal: {rule.signal_type || '-'} · template: {rule.template_code || '-'} · audience: {rule.audience || '-'}
                          <br />
                          {rule.notes || ''}
                        </p>
                      </div>

                      <div className="grid gap-2 lg:min-w-44">
                        <button onClick={() => toggleRule(rule, 'enabled')} className="rounded-xl bg-white px-4 py-3 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                          {rule.enabled ? '규칙 끄기' : '규칙 켜기'}
                        </button>

                        <button onClick={() => toggleRule(rule, 'auto_dispatch')} className="rounded-xl bg-white px-4 py-3 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
                          {rule.auto_dispatch ? '발송 OFF' : '발송 ON'}
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        ) : null}

        {activeTab === 'templates' ? (
          <section className="space-y-5">
            {templates.length === 0 ? (
              <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
                <h2 className="text-3xl font-black tracking-[-0.06em]">문자 문구</h2>
                <div className="mt-5 rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                  문구가 없습니다. 템플릿·규칙 초기화를 눌러주세요.
                </div>
              </section>
            ) : (
              Object.entries(groupedTemplates).map(([group, items]) => (
                <section key={group} className="overflow-hidden rounded-[2rem] bg-white/95 shadow-sm ring-1 ring-[#D6EDE7]">
                  <div className="border-b border-[#D6EDE7] px-5 py-4">
                    <h2 className="text-2xl font-black tracking-[-0.05em]">{group}</h2>
                    <p className="mt-1 text-sm font-bold text-[#637B76]">{items.length}개 문구</p>
                  </div>

                  <div className="divide-y divide-[#D6EDE7]">
                    {items.map((template) => (
                      <article key={template.template_code || template.id} className="p-5">
                        <div className="flex flex-wrap gap-2">
                          <span className={'rounded-full px-3 py-1 text-xs font-black ring-1 ' + statusClass(template.enabled ? 'enabled' : 'disabled')}>
                            {template.enabled ? '사용' : '중지'}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#247A71] ring-1 ring-[#D6EDE7]">
                            {template.situation || '-'}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#247A71] ring-1 ring-[#D6EDE7]">
                            {template.severity || '-'}
                          </span>
                        </div>

                        <h3 className="mt-3 text-xl font-black tracking-[-0.05em]">{template.title || '문자 문구'}</h3>
                        <pre className="mt-3 whitespace-pre-wrap rounded-2xl bg-[#FAFFFD] p-4 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D6EDE7]">
                          {template.body || ''}
                        </pre>
                      </article>
                    ))}
                  </div>
                </section>
              ))
            )}
          </section>
        ) : null}

        {activeTab === 'runs' ? (
          <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-3xl font-black tracking-[-0.06em]">실행 기록</h2>

            <div className="mt-5 space-y-3">
              {runs.length === 0 ? (
                <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                  아직 실행 기록이 없습니다.
                </div>
              ) : (
                runs.map((run) => (
                  <article key={run.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                    <div className="flex flex-wrap gap-2">
                      <span className={'rounded-full px-3 py-1 text-xs font-black ring-1 ' + statusClass(run.status)}>
                        {run.status || 'recorded'}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#247A71] ring-1 ring-[#D6EDE7]">
                        {run.run_type || 'manual'}
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-black">{run.summary || '자동화 실행'}</h3>
                    <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                      생성 {String(run.metrics?.queued || 0)} · 중복/번호없음 {String(run.metrics?.skipped || 0)} · 실패 {String(run.metrics?.failed || 0)}
                      <br />
                      {run.created_by || '-'} · {run.created_at || ''}
                    </p>
                  </article>
                ))
              )}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  )
}

export default MessageAutomationPanel
