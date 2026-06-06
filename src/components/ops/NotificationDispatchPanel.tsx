'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type OutboxItem = {
  id: string
  family_code?: string | null
  channel?: string
  to_name?: string
  to_phone?: string
  title?: string
  body?: string
  template_code?: string
  reason?: string
  target_url?: string
  status?: string
  provider?: string
  provider_message_id?: string | null
  created_at?: string
  sent_at?: string | null
}

type MessageTemplate = {
  code: string
  category: string
  title: string
  body: string
  default_target_url: string
  sort_order: number
  is_active: boolean
}

type Metrics = {
  total: number
  queued: number
  sent: number
  failed: number
  outboxOnly: number
}

type Config = {
  hasApiKey: boolean
  hasApiSecret: boolean
  hasSender: boolean
  senderMasked: string
}

function phoneOnly(value: string) {
  return value.replace(/[^\d]/g, '')
}

function statusClass(status?: string) {
  if (status === 'sent') return 'bg-[#EFFFFA] text-[#2AA897] ring-[#CDEFE7]'
  if (status === 'failed') return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  if (status === 'outbox-only') return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  return 'bg-white text-[#17443F] ring-[#D6EDE7]'
}

function statusLabel(status?: string) {
  if (status === 'sent') return '발송 완료'
  if (status === 'failed') return '실패'
  if (status === 'outbox-only') return '대기함만 저장'
  if (status === 'queued') return '발송 대기'
  return status || '대기'
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

export function NotificationDispatchPanel() {
  const [items, setItems] = useState<OutboxItem[]>([])
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [selectedTemplateCode, setSelectedTemplateCode] = useState('ops-test')
  const [metrics, setMetrics] = useState<Metrics>({ total: 0, queued: 0, sent: 0, failed: 0, outboxOnly: 0 })
  const [config, setConfig] = useState<Config>({ hasApiKey: false, hasApiSecret: false, hasSender: false, senderMasked: '' })
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)
  const [testPhone, setTestPhone] = useState('')
  const [testName, setTestName] = useState('이관용')
  const [testTitle, setTestTitle] = useState('[안부웍스] 테스트 문자')
  const [testBody, setTestBody] = useState('안부웍스 알림 발송 테스트입니다.')

  const recentItems = useMemo(() => items.slice(0, 80), [items])
  const ready = config.hasApiKey && config.hasApiSecret && config.hasSender

  const selectedTemplate = useMemo(
    () => templates.find((item) => item.code === selectedTemplateCode) || templates[0],
    [templates, selectedTemplateCode]
  )

  function applyTemplate(code: string) {
    const template = templates.find((item) => item.code === code)

    setSelectedTemplateCode(code)

    if (template) {
      setTestTitle(template.title)
      setTestBody(template.body)
    }
  }

  async function load() {
    setLoading(true)

    try {
      const response = await fetch('/api/notifications/dispatch', { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '알림 발송함을 불러오지 못했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        setItems([])
        return
      }

      const nextTemplates = Array.isArray(data.templates) ? data.templates : []

      setItems(Array.isArray(data.items) ? data.items : [])
      setTemplates(nextTemplates)
      setMetrics(data.metrics || { total: 0, queued: 0, sent: 0, failed: 0, outboxOnly: 0 })
      setConfig(data.config || { hasApiKey: false, hasApiSecret: false, hasSender: false, senderMasked: '' })

      if (nextTemplates.length > 0 && !nextTemplates.some((item: MessageTemplate) => item.code === selectedTemplateCode)) {
        setSelectedTemplateCode(nextTemplates[0].code)
        setTestTitle(nextTemplates[0].title)
        setTestBody(nextTemplates[0].body)
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '알림 발송함을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function post(action: string, payload: Record<string, unknown> = {}) {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/notifications/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '처리에 실패했습니다.')
        setDebug(JSON.stringify(data.detail || data.result || data.results || data, null, 2))
        await load()
        return
      }

      setMessage(data.message || '처리되었습니다.')
      setDebug(data.result || data.results ? JSON.stringify(data.result || data.results, null, 2) : '')
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
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
            알림 발송센터
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            문자 초안을 선택해서
            <br />
            바로 보냅니다.
          </h1>

          <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            상황별 문자 초안을 선택하고, 필요한 부분만 수정한 뒤 대기열에 넣거나 바로 발송할 수 있습니다.
          </p>

          <div className={'mt-5 rounded-2xl p-4 text-sm font-black leading-7 ring-1 ' + (ready ? 'bg-[#EFFFFA] text-[#2AA897] ring-[#CDEFE7]' : 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]')}>
            {ready ? (
              <>SOLAPI 환경변수가 준비되었습니다. 발신번호: {config.senderMasked}</>
            ) : (
              <>SOLAPI_API_KEY, SOLAPI_API_SECRET, SOLAPI_SENDER 환경변수를 확인해주세요.</>
            )}
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
              {message}
            </div>
          ) : null}

          {debug ? (
            <details className="mt-4 rounded-2xl bg-[#247A71] p-4 text-xs font-bold leading-6 text-[#E7FFF7]" open>
              <summary className="cursor-pointer text-sm font-black">처리 결과 보기</summary>
              <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap">{debug}</pre>
            </details>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-5">
          <MetricCard title="발송 대기" value={`${metrics.queued}개`} desc="아직 보내지 않은 알림" danger={metrics.queued > 0} />
          <MetricCard title="발송 완료" value={`${metrics.sent}개`} desc="SOLAPI 발송 성공" />
          <MetricCard title="실패" value={`${metrics.failed}개`} desc="재시도 또는 설정 확인 필요" danger={metrics.failed > 0} />
          <MetricCard title="대기함만 저장" value={`${metrics.outboxOnly}개`} desc="환경변수 없이 저장만 됨" danger={metrics.outboxOnly > 0} />
          <MetricCard title="전체" value={`${metrics.total}개`} desc="최근 알림 기록" />
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">발송 실행</h2>

            <div className="mt-5 grid gap-3">
              <button
                onClick={() => post('dispatchQueued', { limit: 30 })}
                disabled={loading}
                className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
              >
                발송 대기 30건 보내기
              </button>

              <button
                onClick={() => post('retryFailed', { limit: 20 })}
                disabled={loading}
                className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50"
              >
                실패 20건 재시도
              </button>

              <button
                onClick={load}
                disabled={loading}
                className="rounded-2xl bg-[#FAFFFD] px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50"
              >
                새로고침
              </button>
            </div>

            <div className="mt-6 rounded-2xl bg-[#FAFFFD] p-4 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D6EDE7]">
              대량 발송 전에는 반드시 내 번호로 초안 1건을 테스트해주세요.
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">문자 초안 선택</h2>

            <div className="mt-5 grid gap-3">
              <select
                value={selectedTemplateCode}
                onChange={(event) => applyTemplate(event.target.value)}
                className="w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-[#D6F6EC]"
              >
                {templates.map((template) => (
                  <option key={template.code} value={template.code}>
                    {template.category} · {template.title}
                  </option>
                ))}
              </select>

              <div className="rounded-2xl bg-[#FAFFFD] p-4 text-sm font-bold leading-7 text-[#637B76] ring-1 ring-[#D6EDE7]">
                선택된 초안: {selectedTemplate?.category || '-'} · {selectedTemplate?.code || '-'}
              </div>

              <input
                value={testPhone}
                onChange={(event) => setTestPhone(phoneOnly(event.target.value))}
                inputMode="tel"
                placeholder="수신번호 예: 01012345678"
                className="w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-[#D6F6EC]"
              />

              <input
                value={testName}
                onChange={(event) => setTestName(event.target.value)}
                placeholder="수신자 이름"
                className="w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-[#D6F6EC]"
              />

              <input
                value={testTitle}
                onChange={(event) => setTestTitle(event.target.value)}
                placeholder="문자 제목"
                className="w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black outline-none focus:ring-4 focus:ring-[#D6F6EC]"
              />

              <textarea
                value={testBody}
                onChange={(event) => setTestBody(event.target.value)}
                placeholder="문자 내용"
                className="min-h-40 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-4 text-sm font-black leading-7 outline-none focus:ring-4 focus:ring-[#D6F6EC]"
              />

              <div className="grid gap-3 md:grid-cols-2">
                <button
                  onClick={() => post('enqueueTemplate', {
                    toPhone: testPhone,
                    toName: testName,
                    title: testTitle,
                    body: testBody,
                    templateCode: selectedTemplateCode
                  })}
                  disabled={loading || !testPhone}
                  className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
                >
                  선택한 초안 대기열에 넣기
                </button>

                <button
                  onClick={() => post('enqueueAndSendTemplate', {
                    toPhone: testPhone,
                    toName: testName,
                    title: testTitle,
                    body: testBody,
                    templateCode: selectedTemplateCode
                  })}
                  disabled={loading || !testPhone}
                  className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50"
                >
                  선택한 초안 바로 발송
                </button>
              </div>
            </div>
          </section>
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <h2 className="text-3xl font-black tracking-[-0.06em]">초안 빠른 선택</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <button
                key={template.code}
                onClick={() => applyTemplate(template.code)}
                className={'rounded-2xl p-4 text-left ring-1 ' + (selectedTemplateCode === template.code ? 'bg-[#247A71] text-white ring-[#247A71]' : 'bg-[#FAFFFD] text-[#17443F] ring-[#D6EDE7]')}
              >
                <div className="text-xs font-black opacity-75">{template.category}</div>
                <div className="mt-2 text-lg font-black tracking-[-0.05em]">{template.title}</div>
                <p className="mt-2 line-clamp-3 text-xs font-bold leading-6 opacity-75">
                  {template.body}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <h2 className="text-3xl font-black tracking-[-0.06em]">최근 알림 기록</h2>

          <div className="mt-5 space-y-3">
            {recentItems.length === 0 ? (
              <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                아직 알림 기록이 없습니다.
              </div>
            ) : (
              recentItems.map((item) => (
                <article key={item.id} className={'rounded-2xl p-4 ring-1 ' + statusClass(item.status)}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-current">
                          {statusLabel(item.status)}
                        </span>
                        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-current">
                          {item.template_code || item.reason || '알림'}
                        </span>
                      </div>

                      <h3 className="mt-3 text-xl font-black tracking-[-0.05em]">{item.title || '알림'}</h3>
                      <p className="mt-2 text-sm font-bold leading-7 opacity-80">
                        {item.to_name || '-'} · {item.to_phone || '-'}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm font-bold leading-7 opacity-80">
                        {item.body || '-'}
                      </p>
                    </div>

                    <button
                      onClick={() => post('dispatchOne', { id: item.id })}
                      disabled={loading || item.status === 'sent'}
                      className="rounded-xl bg-white/80 px-4 py-3 text-sm font-black ring-1 ring-current disabled:opacity-50"
                    >
                      이 건 발송
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-4">
          <Link href="/response?scope=ops" className="rounded-2xl bg-[#247A71] px-5 py-4 text-center text-sm font-black text-white">
            후속조치 관제
          </Link>
          <Link href="/provider/requests" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
            지역 도움망 요청함
          </Link>
          <Link href="/ops" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
            운영실
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

export default NotificationDispatchPanel
