'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Metrics = {
  queued: number
  sent: number
  failed: number
  openIncidents: number
  urgent: number
}

type HeartbeatRun = {
  id: string
  run_source?: string
  status?: string
  auto_send?: boolean
  autopilot_ok?: boolean
  escalation_ok?: boolean
  dispatch_ok?: boolean
  queued_before?: number
  queued_after?: number
  sent_before?: number
  sent_after?: number
  failed_before?: number
  failed_after?: number
  open_incidents_before?: number
  open_incidents_after?: number
  urgent_before?: number
  urgent_after?: number
  message?: string
  duration_ms?: number
  started_at?: string
  finished_at?: string
  created_at?: string
}

type HeartbeatLog = {
  id: string
  action_type?: string
  message?: string
  created_at?: string
}

function statusClass(status?: string) {
  if (status === 'success') return 'bg-[#EFFFF9] text-[#116D5F] ring-[#CDEFE5]'
  if (status === 'partial_failed') return 'bg-[#FFF8E8] text-[#795313] ring-[#F4D8A5]'
  if (status === 'failed') return 'bg-[#FFF1F1] text-[#8A2525] ring-[#F3BBBB]'
  return 'bg-white text-[#173B36] ring-[#D8EEE8]'
}

function statusLabel(status?: string) {
  if (status === 'success') return '정상'
  if (status === 'partial_failed') return '일부 실패'
  if (status === 'failed') return '실패'
  if (status === 'running') return '실행 중'
  return status || '기록'
}

function MetricCard({ title, value, desc, danger }: { title: string; value: string; desc: string; danger?: boolean }) {
  return (
    <article className={'rounded-[2rem] p-5 shadow-sm ring-1 ' + (danger ? 'bg-[#FFF1F1] text-[#8A2525] ring-[#F3BBBB]' : 'bg-white text-[#173B36] ring-[#D8EEE8]')}>
      <div className="text-sm font-black opacity-70">{title}</div>
      <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{value}</div>
      <p className="mt-2 text-sm font-bold leading-6 opacity-75">{desc}</p>
    </article>
  )
}

export function OpsHeartbeatPanel() {
  const [metrics, setMetrics] = useState<Metrics>({ queued: 0, sent: 0, failed: 0, openIncidents: 0, urgent: 0 })
  const [runs, setRuns] = useState<HeartbeatRun[]>([])
  const [logs, setLogs] = useState<HeartbeatLog[]>([])
  const [lastRun, setLastRun] = useState<HeartbeatRun | null>(null)
  const [autoSendEnabled, setAutoSendEnabled] = useState(false)
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)
  const [autoSend, setAutoSend] = useState(false)

  const recentRuns = useMemo(() => runs.slice(0, 20), [runs])

  async function load() {
    setLoading(true)

    try {
      const response = await fetch('/api/ops-heartbeat', { cache: 'no-store' })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '자동운영 상태를 불러오지 못했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        return
      }

      setMetrics(data.metrics || { queued: 0, sent: 0, failed: 0, openIncidents: 0, urgent: 0 })
      setRuns(Array.isArray(data.runs) ? data.runs : [])
      setLogs(Array.isArray(data.logs) ? data.logs : [])
      setLastRun(data.lastRun || null)
      setAutoSendEnabled(Boolean(data.autoSendEnabled))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '자동운영 상태를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function runHeartbeat(nextAutoSend = autoSend) {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/ops-heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'runHeartbeat', source: 'manual', autoSend: nextAutoSend })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.ok) {
        setMessage(data.message || '자동운영 실행에 실패했습니다.')
        setDebug(JSON.stringify(data.detail || data, null, 2))
        await load()
        return
      }

      setMessage(data.message || '자동운영 Heartbeat를 실행했습니다.')
      setDebug(JSON.stringify(data, null, 2))
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '자동운영 실행 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-5 text-[#173B36] sm:px-5 sm:py-8">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-white p-5 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            운영실 자동운영 Heartbeat
          </div>

          <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            운영실이 깨어 있는지
            <br />
            자동으로 점검합니다.
          </h1>

          <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            오토파일럿, 에스컬레이션, 문자 대기열을 하나의 주기 작업으로 묶어 운영실이 놓친 사건을 자동으로 찾아냅니다.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <GuideCard number="1" title="오토파일럿 실행" desc="새 신호를 분석하고 보호자·도움망 요청 대기열을 만듭니다." />
            <GuideCard number="2" title="에스컬레이션 실행" desc="미수락·미완료 사건을 수동 연결 필요로 올립니다." />
            <GuideCard number="3" title="문자 대기열 점검" desc="발송 대기·실패·완료 수를 자동 기록합니다." />
            <GuideCard number="4" title="Cron 자동화" desc="Vercel Cron으로 주기 실행하고 운영 로그를 남깁니다." />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => runHeartbeat(false)}
              disabled={loading}
              className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white disabled:opacity-50"
            >
              자동운영 실행
            </button>

            <button
              onClick={() => runHeartbeat(true)}
              disabled={loading}
              className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8] disabled:opacity-50"
            >
              실행 + 문자 발송
            </button>

            <label className="flex items-center gap-2 rounded-2xl bg-[#F8FCFB] px-4 py-3 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]">
              <input
                type="checkbox"
                checked={autoSend}
                onChange={(event) => setAutoSend(event.target.checked)}
              />
              수동 실행 기본값 문자 발송
            </label>

            <button
              onClick={load}
              disabled={loading}
              className="rounded-2xl bg-[#F8FCFB] px-5 py-4 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8] disabled:opacity-50"
            >
              새로고침
            </button>
          </div>

          <div className={'mt-5 rounded-2xl p-4 text-sm font-black leading-7 ring-1 ' + (autoSendEnabled ? 'bg-[#FFF8E8] text-[#795313] ring-[#F4D8A5]' : 'bg-[#EFFFF9] text-[#116D5F] ring-[#CDEFE5]')}>
            Cron 문자 자동발송 설정: {autoSendEnabled ? '켜짐' : '꺼짐'}
            <br />
            실증 전에는 OPS_HEARTBEAT_AUTO_SEND=false를 유지하고, 운영자가 화면에서 확인 후 발송하는 방식이 안전합니다.
          </div>

          {lastRun ? (
            <div className={'mt-4 rounded-2xl p-4 text-sm font-black leading-7 ring-1 ' + statusClass(lastRun.status)}>
              마지막 실행: {statusLabel(lastRun.status)} · {lastRun.run_source || 'manual'} · {lastRun.message || '-'}
            </div>
          ) : null}

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#FFF8E8] p-4 text-sm font-black leading-7 text-[#795313] ring-1 ring-[#F4D8A5]">
              {message}
            </div>
          ) : null}

          {debug ? (
            <details className="mt-4 rounded-2xl bg-[#123F38] p-4 text-xs font-bold leading-6 text-[#E7FFF7]" open>
              <summary className="cursor-pointer text-sm font-black">실행 결과 보기</summary>
              <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap">{debug}</pre>
            </details>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-5">
          <MetricCard title="열린 사건" value={`${metrics.openIncidents}개`} desc="아직 완료되지 않은 사건" danger={metrics.openIncidents > 0} />
          <MetricCard title="긴급" value={`${metrics.urgent}개`} desc="즉시 확인 우선순위" danger={metrics.urgent > 0} />
          <MetricCard title="문자 대기" value={`${metrics.queued}개`} desc="발송 대기 알림" danger={metrics.queued > 0} />
          <MetricCard title="발송 완료" value={`${metrics.sent}개`} desc="누적 발송 완료" />
          <MetricCard title="실패" value={`${metrics.failed}개`} desc="재시도 필요" danger={metrics.failed > 0} />
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <h2 className="text-3xl font-black tracking-[-0.06em]">최근 Heartbeat 실행 기록</h2>

          <div className="mt-5 space-y-3">
            {recentRuns.length === 0 ? (
              <div className="rounded-2xl bg-[#F8FCFB] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D8EEE8]">
                아직 자동운영 실행 기록이 없습니다.
              </div>
            ) : (
              recentRuns.map((run) => (
                <article key={run.id} className={'rounded-2xl p-4 ring-1 ' + statusClass(run.status)}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-current">
                          {statusLabel(run.status)}
                        </span>
                        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-current">
                          {run.run_source || 'manual'}
                        </span>
                        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-current">
                          문자자동 {run.auto_send ? 'ON' : 'OFF'}
                        </span>
                      </div>

                      <h3 className="mt-3 text-lg font-black tracking-[-0.05em]">{run.message || '자동운영 실행'}</h3>

                      <p className="mt-2 text-sm font-bold leading-7 opacity-80">
                        열린 사건 {run.open_incidents_before || 0} → {run.open_incidents_after || 0} ·
                        긴급 {run.urgent_before || 0} → {run.urgent_after || 0} ·
                        대기 {run.queued_before || 0} → {run.queued_after || 0} ·
                        발송 {run.sent_before || 0} → {run.sent_after || 0}
                      </p>

                      <p className="mt-1 text-xs font-bold opacity-70">
                        {run.created_at || run.started_at || ''} · {run.duration_ms ? `${run.duration_ms}ms` : ''}
                      </p>
                    </div>

                    <div className="grid gap-2 text-xs font-black">
                      <span>오토파일럿 {run.autopilot_ok ? '성공' : '확인 필요'}</span>
                      <span>에스컬레이션 {run.escalation_ok ? '성공' : '확인 필요'}</span>
                      <span>문자발송 {run.dispatch_ok ? '성공' : run.auto_send ? '확인 필요' : '미실행'}</span>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <h2 className="text-3xl font-black tracking-[-0.06em]">자동운영 로그</h2>

          <div className="mt-5 space-y-3">
            {logs.length === 0 ? (
              <div className="rounded-2xl bg-[#F8FCFB] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D8EEE8]">
                아직 자동운영 로그가 없습니다.
              </div>
            ) : (
              logs.slice(0, 20).map((log) => (
                <article key={log.id} className="rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8]">
                  <div className="text-xs font-black text-[#11977F]">{log.action_type || 'ops_heartbeat'}</div>
                  <div className="mt-2 text-sm font-black leading-7">{log.message || '-'}</div>
                  <div className="mt-1 text-xs font-bold text-[#637B76]">{log.created_at || ''}</div>
                </article>
              ))
            )}
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-4">
          <Link href="/ops/autopilot" className="rounded-2xl bg-[#193B38] px-5 py-4 text-center text-sm font-black text-white">
            오토파일럿
          </Link>
          <Link href="/ops/notification-dispatch" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]">
            알림 발송센터
          </Link>
          <Link href="/response?scope=ops" className="rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]">
            후속조치 관제
          </Link>
          <button
            onClick={load}
            className="rounded-2xl bg-[#F8FCFB] px-5 py-4 text-sm font-black text-[#173B36] ring-1 ring-[#D8EEE8]"
          >
            새로고침
          </button>
        </div>
      </section>
    </main>
  )
}

function GuideCard({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <article className="rounded-2xl bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8]">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#193B38] text-xs font-black text-white">
        {number}
      </div>
      <h3 className="mt-3 text-base font-black tracking-[-0.04em]">{title}</h3>
      <p className="mt-1 text-xs font-bold leading-6 text-[#637B76]">{desc}</p>
    </article>
  )
}

export default OpsHeartbeatPanel
