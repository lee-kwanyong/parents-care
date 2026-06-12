'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type AuditLog = {
  id?: string
  actor_role?: string
  actor_name?: string
  action?: string
  target_type?: string
  target_id?: string
  status?: string
  severity?: string
  ip_address?: string
  user_agent?: string
  memo?: string
  metadata?: unknown
  created_at?: string
}

function timeLabel(value?: string) {
  if (!value) return '-'

  const date = new Date(value)

  if (!Number.isFinite(date.getTime())) return value

  return date.toLocaleString('ko-KR')
}

function severityClass(severity?: string) {
  if (severity === 'critical') return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  if (severity === 'warning') return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  return 'bg-[#EFFFFA] text-[#2AA897] ring-[#CDEFE7]'
}

export function AnbuAuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [result, setResult] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)
  const [showRaw, setShowRaw] = useState(false)
  const [severity, setSeverity] = useState('')
  const [actorName, setActorName] = useState('운영실')
  const [memo, setMemo] = useState('')
  const [manualSeverity, setManualSeverity] = useState('info')

  async function load() {
    setLoading(true)

    const query = severity ? `?severity=${encodeURIComponent(severity)}` : ''
    const response = await fetch('/api/anbu-ops/audit/list' + query, { cache: 'no-store' })
    const data = await response.json().catch(() => ({}))

    setLogs(Array.isArray(data.logs) ? data.logs : [])
    setResult(data)
    setLoading(false)
  }

  async function writeMemo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    const response = await fetch('/api/anbu-ops/audit/write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actorName,
        memo,
        severity: manualSeverity,
        action: 'ops_manual_memo'
      })
    })

    const data = await response.json().catch(() => ({}))
    setResult(data)

    if (data.ok) {
      setMemo('')
      await load()
    }

    setLoading(false)
  }

  async function logout() {
    await fetch('/api/ops-logout', { method: 'POST' })
    window.location.href = '/admin/ops/login'
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [severity])

  const summary = useMemo(() => {
    return {
      total: logs.length,
      info: logs.filter((item) => item.severity === 'info').length,
      warning: logs.filter((item) => item.severity === 'warning').length,
      critical: logs.filter((item) => item.severity === 'critical').length,
      failed: logs.filter((item) => item.status === 'failed').length
    }
  }, [logs])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-5 py-8 text-[#17443F]">
      <section className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            운영실 · 감사 로그
          </div>

          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            운영실 접근과 주요 작업을 기록합니다.
          </h1>

          <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#637B76] sm:text-lg sm:leading-8">
            로그인 성공/실패, 로그아웃, 리포트 검수, 운영실 수동 메모를 남겨 보안과 운영 이력을 관리합니다.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={load}
              disabled={loading}
              className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-60"
            >
              {loading ? '불러오는 중...' : '새로고침'}
            </button>

            <button
              onClick={() => setShowRaw((value) => !value)}
              className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
            >
              {showRaw ? '원본 숨기기' : '원본 보기'}
            </button>

            <button
              onClick={logout}
              className="rounded-2xl bg-[#FFF4F4] px-5 py-4 text-sm font-black text-[#8A3030] ring-1 ring-[#F3C8C8]"
            >
              운영실 로그아웃
            </button>

            <Link
              href="/admin/ops/dashboard"
              className="rounded-2xl bg-[#FAFFFD] px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
            >
              운영실 홈
            </Link>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-5">
          <Summary label="전체" value={summary.total} />
          <Summary label="정보" value={summary.info} />
          <Summary label="주의" value={summary.warning} />
          <Summary label="긴급" value={summary.critical} />
          <Summary label="실패" value={summary.failed} />
        </div>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-[-0.05em]">필터</h2>
              <p className="mt-2 text-sm font-bold text-[#637B76]">심각도별로 운영 기록을 확인합니다.</p>
            </div>

            <select
              value={severity}
              onChange={(event) => setSeverity(event.target.value)}
              className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold"
            >
              <option value="">전체</option>
              <option value="info">정보</option>
              <option value="warning">주의</option>
              <option value="critical">긴급</option>
            </select>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">운영 메모 기록</h2>

          <form onSubmit={writeMemo} className="mt-5 grid gap-3 md:grid-cols-[12rem_10rem_1fr_10rem]">
            <label className="grid gap-2">
              <span className="text-sm font-black text-[#637B76]">작성자</span>
              <input
                value={actorName}
                onChange={(event) => setActorName(event.target.value)}
                className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-[#637B76]">심각도</span>
              <select
                value={manualSeverity}
                onChange={(event) => setManualSeverity(event.target.value)}
                className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold"
              >
                <option value="info">정보</option>
                <option value="warning">주의</option>
                <option value="critical">긴급</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black text-[#637B76]">메모</span>
              <input
                value={memo}
                onChange={(event) => setMemo(event.target.value)}
                placeholder="예: 오늘 테스트 SMS 발송 중지 상태 유지"
                className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold"
              />
            </label>

            <div className="flex items-end">
              <button
                disabled={loading || !memo.trim()}
                className="w-full rounded-2xl bg-[#20C5A8] px-5 py-3 text-sm font-black text-white disabled:opacity-60"
              >
                기록
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">최근 로그</h2>

          <div className="mt-5 grid gap-3">
            {logs.length === 0 ? (
              <p className="rounded-2xl bg-[#FAFFFD] p-4 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                표시할 감사 로그가 없습니다. Supabase SQL을 먼저 실행했는지 확인해주세요.
              </p>
            ) : (
              logs.map((log) => (
                <article key={log.id} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                  <div className="flex flex-wrap gap-2">
                    <Badge text={log.severity || 'info'} className={severityClass(log.severity)} />
                    <Badge text={log.status || 'ok'} />
                    <Badge text={log.actor_name || log.actor_role || '운영실'} />
                    <Badge text={log.action || '-'} />
                  </div>

                  <h3 className="mt-3 text-xl font-black tracking-[-0.04em]">{log.action || '운영 기록'}</h3>

                  <p className="mt-2 whitespace-pre-line text-sm font-bold leading-7 text-[#637B76]">
                    {log.memo || '메모 없음'}
                  </p>

                  <div className="mt-4 grid gap-2 text-xs font-bold text-[#7A9692] md:grid-cols-2">
                    <p>시간: {timeLabel(log.created_at)}</p>
                    <p>IP: {log.ip_address || '-'}</p>
                    <p>대상: {log.target_type || '-'} / {log.target_id || '-'}</p>
                    <p>User-Agent: {log.user_agent ? log.user_agent.slice(0, 90) : '-'}</p>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        {showRaw ? (
          <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
            <h2 className="text-2xl font-black tracking-[-0.05em]">원본 데이터</h2>
            <pre className="mt-4 max-h-[30rem] overflow-auto rounded-2xl bg-[#247A71] p-4 text-xs font-bold leading-6 text-[#E7FFF7]">
              {JSON.stringify(result, null, 2)}
            </pre>
          </section>
        ) : null}
      </section>
    </main>
  )
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D6EDE7]">
      <div className="text-sm font-black text-[#7A9692]">{label}</div>
      <div className="mt-2 text-4xl font-black tracking-[-0.06em] text-[#2AA897]">{value}</div>
    </section>
  )
}

function Badge({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span className={'rounded-full bg-white px-3 py-1 text-xs font-black text-[#4E6D69] ring-1 ring-[#D8EEE7] ' + className}>
      {text}
    </span>
  )
}
