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
  source_key?: string
  created_at?: string
  sent_at?: string | null
  archived_at?: string | null
  archived_reason?: string | null
  cancelled_at?: string | null
  cancelled_reason?: string | null
  cleanup_bucket?: string
  is_test?: boolean
  is_stale_queued?: boolean
  is_archived?: boolean
}

type CleanupLog = {
  id: string
  action_type?: string
  affected_count?: number
  message?: string
  created_at?: string
}

type Metrics = {
  total: number
  active: number
  archived: number
  queued: number
  sent: number
  failed: number
  cancelled: number
  tests: number
  staleQueued: number
  cleanupNeeded: number
}

type FilterKey = 'active' | 'queued' | 'failed' | 'sent' | 'tests' | 'stale' | 'archived' | 'cancelled' | 'all'

function statusLabel(status?: string) {
  if (status === 'queued') return '발송 대기'
  if (status === 'sent') return '발송 완료'
  if (status === 'failed') return '실패'
  if (status === 'cancelled') return '취소'
  if (status === 'outbox-only') return '대기함 저장'
  return status || '기록'
}

function bucketLabel(bucket?: string) {
  if (bucket === 'archived') return '보관'
  if (bucket === 'cancelled') return '취소'
  if (bucket === 'test') return '테스트'
  if (bucket === 'stale') return '오래된 대기'
  if (bucket === 'queued') return '대기'
  if (bucket === 'failed') return '실패'
  if (bucket === 'sent') return '완료'
  return bucket || '기타'
}

function rowClass(item: OutboxItem) {
  if (item.is_archived) return 'bg-[#FAFFFD] text-[#637B76] ring-[#D6EDE7]'
  if (item.status === 'failed') return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  if (item.is_stale_queued) return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  if (item.is_test) return 'bg-[#F3F8FF] text-[#255B83] ring-[#D8EAFB]'
  if (item.status === 'queued') return 'bg-white text-[#17443F] ring-[#D6EDE7]'
  if (item.status === 'sent') return 'bg-[#EFFFFA] text-[#2AA897] ring-[#CDEFE7]'
  return 'bg-white text-[#17443F] ring-[#D6EDE7]'
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

export function NotificationCleanupPanel() {
  const [items, setItems] = useState<OutboxItem[]>([])
  const [logs, setLogs] = useState<CleanupLog[]>([])
  const [metrics, setMetrics] = useState<Metrics>({ total: 0, active: 0, archived: 0, queued: 0, sent: 0, failed: 0, cancelled: 0, tests: 0, staleQueued: 0, cleanupNeeded: 0 })
  const [filter, setFilter] = useState<FilterKey>('active')
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items
    if (filter === 'active') return items.filter((item) => !item.is_archived)
    if (filter === 'queued') return items.filter((item) => !item.is_archived && item.status === 'queued')
    if (filter === 'failed') return items.filter((item) => !item.is_archived && item.status === 'failed')
    if (filter === 'sent') return items.filter((item) => !item.is_archived && item.status === 'sent')
    if (filter === 'tests') return items.filter((item) => !item.is_archived && item.is_test)
    if (filter === 'stale') return items.filter((item) => !item.is_archived && item.is_stale_queued)
    if (filter === 'archived') return items.filter((item) => item.is_archived)
    if (filter === 'cancelled') return items.filter((item) => item.status === 'cancelled')
    return items
  }, [items, filter])

  async function load() {
    setLoading(true)

    try {
      const response = await fetch('/api/notifications/cleanup', { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '알림 기록을 불러오지 못했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      setItems(Array.isArray(data.items) ? data.items : [])
      setLogs(Array.isArray(data.logs) ? data.logs : [])
      setMetrics(data.metrics || { total: 0, active: 0, archived: 0, queued: 0, sent: 0, failed: 0, cancelled: 0, tests: 0, staleQueued: 0, cleanupNeeded: 0 })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '알림 기록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function post(action: string, payload: Record<string, unknown> = {}) {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/notifications/cleanup', {
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

  useEffect(() => {
    load()
  }, [])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-5 text-[#17443F] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            알림 기록 정리센터
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            테스트·실패·오래된 알림을
            <br />
            운영 화면에서 분리합니다.
          </h1>

          <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            실제 처리해야 할 발송 대기 알림만 남기고, 테스트 문자·과거 실패·발송 완료 기록은 보관 처리합니다.
          </p>

          <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            보관은 삭제가 아닙니다. /ops/notification-cleanup에서 언제든 보관 기록을 확인하고 복구할 수 있습니다.
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={() => post('archiveTests')} disabled={loading || metrics.tests === 0} className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50">
              테스트 기록 보관
            </button>
            <button onClick={() => post('archiveSent')} disabled={loading || metrics.sent === 0} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50">
              발송 완료 보관
            </button>
            <button onClick={() => post('archiveFailed')} disabled={loading || metrics.failed === 0} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#8A3030] ring-1 ring-[#F3C8C8] disabled:opacity-50">
              실패 기록 보관
            </button>
            <button onClick={() => post('cancelStaleQueued', { hours: 24 })} disabled={loading || metrics.staleQueued === 0} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#795C22] ring-1 ring-[#F3DEB5] disabled:opacity-50">
              24시간 초과 대기 취소
            </button>
            <button onClick={load} disabled={loading} className="rounded-2xl bg-[#FAFFFD] px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50">
              새로고침
            </button>
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

        <section className="grid gap-4 md:grid-cols-4 lg:grid-cols-9">
          <MetricCard title="전체" value={`${metrics.total}건`} desc="전체 기록" />
          <MetricCard title="활성" value={`${metrics.active}건`} desc="운영 화면 표시" />
          <MetricCard title="정리 필요" value={`${metrics.cleanupNeeded}건`} desc="테스트·실패·오래된 대기" danger={metrics.cleanupNeeded > 0} />
          <MetricCard title="대기" value={`${metrics.queued}건`} desc="발송 대기" danger={metrics.queued > 0} />
          <MetricCard title="완료" value={`${metrics.sent}건`} desc="발송 완료" />
          <MetricCard title="실패" value={`${metrics.failed}건`} desc="실패 기록" danger={metrics.failed > 0} />
          <MetricCard title="테스트" value={`${metrics.tests}건`} desc="테스트 알림" danger={metrics.tests > 0} />
          <MetricCard title="오래된 대기" value={`${metrics.staleQueued}건`} desc="24시간 초과" danger={metrics.staleQueued > 0} />
          <MetricCard title="보관" value={`${metrics.archived}건`} desc="숨김 기록" />
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-[-0.06em]">알림 기록</h2>
              <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
                운영용 알림과 보관 알림을 필터로 나눠 봅니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                ['active', '활성'],
                ['queued', '대기'],
                ['failed', '실패'],
                ['sent', '완료'],
                ['tests', '테스트'],
                ['stale', '오래된 대기'],
                ['archived', '보관'],
                ['cancelled', '취소'],
                ['all', '전체']
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key as FilterKey)}
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
            {filteredItems.length === 0 ? (
              <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                표시할 알림 기록이 없습니다.
              </div>
            ) : (
              filteredItems.slice(0, 200).map((item) => (
                <article key={item.id} className={'rounded-2xl p-4 ring-1 ' + rowClass(item)}>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-current">
                          {statusLabel(item.status)}
                        </span>
                        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-current">
                          {bucketLabel(item.cleanup_bucket)}
                        </span>
                        {item.is_test ? (
                          <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-current">
                            테스트
                          </span>
                        ) : null}
                        {item.is_archived ? (
                          <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-current">
                            보관됨
                          </span>
                        ) : null}
                      </div>

                      <h3 className="mt-3 text-xl font-black tracking-[-0.05em]">{item.title || '알림'}</h3>

                      <p className="mt-2 text-sm font-bold leading-7 opacity-80">
                        {item.to_name || '-'} · {item.to_phone || '-'} · {item.reason || '-'}
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-sm font-bold leading-7 opacity-80">
                        {item.body || '-'}
                      </p>

                      <p className="mt-2 text-xs font-bold opacity-60">
                        생성 {item.created_at || '-'} · 발송 {item.sent_at || '-'} · 보관 {item.archived_at || '-'}
                      </p>
                    </div>

                    <div className="grid min-w-44 gap-2">
                      {!item.is_archived ? (
                        <>
                          <button
                            onClick={() => post('archiveOne', { id: item.id, reason: '개별 알림 보관' })}
                            disabled={loading}
                            className="rounded-xl bg-white/80 px-4 py-3 text-sm font-black ring-1 ring-current disabled:opacity-50"
                          >
                            보관
                          </button>
                          {item.status === 'queued' ? (
                            <button
                              onClick={() => post('cancelOne', { id: item.id, reason: '개별 대기 알림 취소' })}
                              disabled={loading}
                              className="rounded-xl bg-white/80 px-4 py-3 text-sm font-black ring-1 ring-current disabled:opacity-50"
                            >
                              취소
                            </button>
                          ) : null}
                        </>
                      ) : (
                        <button
                          onClick={() => post('restoreOne', { id: item.id })}
                          disabled={loading}
                          className="rounded-xl bg-white/80 px-4 py-3 text-sm font-black ring-1 ring-current disabled:opacity-50"
                        >
                          복구
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">최근 정리 로그</h2>

          <div className="mt-5 space-y-3">
            {logs.length === 0 ? (
              <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                아직 정리 로그가 없습니다.
              </div>
            ) : (
              logs.slice(0, 20).map((log) => (
                <article key={log.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                  <div className="text-xs font-black text-[#2AA897]">{log.action_type || 'cleanup'}</div>
                  <div className="mt-2 text-sm font-black leading-7">{log.message || '-'} · {log.affected_count || 0}건</div>
                  <div className="mt-1 text-xs font-bold text-[#637B76]">{log.created_at || ''}</div>
                </article>
              ))
            )}
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-5">
          <Link href="/admin/ops/notification-dispatch" className="rounded-2xl bg-[#247A71] px-5 py-4 text-center text-sm font-black text-white">
            알림 발송센터
          </Link>
          <Link href="/admin/ops/autopilot" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
            오토파일럿
          </Link>
          <Link href="/admin/ops/incidents" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
            사건 타임라인
          </Link>
          <Link href="/gov/reports" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
            운영보고서
          </Link>
          <button onClick={load} className="rounded-2xl bg-[#FAFFFD] px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
            새로고침
          </button>
        </div>
      </section>
    </main>
  )
}

export default NotificationCleanupPanel
