'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type PolicyRow = {
  table_name: string
  rls_enabled: boolean
  force_rls: boolean
  anon_select: boolean
  anon_insert: boolean
  anon_update: boolean
  anon_delete: boolean
  authenticated_select: boolean
  authenticated_insert: boolean
  authenticated_update: boolean
  authenticated_delete: boolean
  permissive_policy_count: number
  policies: unknown[]
}

type ProbeItem = {
  table: string
  ok: boolean
  status: number
  exposed: boolean
  message: string
  error?: unknown
}

type SecurityData = {
  ok: boolean
  status: 'ok' | 'warning' | 'critical'
  generatedAt: string
  metrics: Record<string, number>
  policyRows: PolicyRow[]
  unsafeRows: PolicyRow[]
  probe: {
    ok: boolean
    skipped?: boolean
    message?: string
    items?: ProbeItem[]
  }
  runs: Array<Record<string, unknown>>
  config: Record<string, unknown>
}

function statusClass(status?: string) {
  if (status === 'ok') return 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]'
  if (status === 'warning') return 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]'
  if (status === 'critical') return 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]'
  return 'bg-[#FAFFFD] text-[#637B76] ring-[#D6EDE7]'
}

function statusText(status?: string) {
  if (status === 'ok') return '안전'
  if (status === 'warning') return '주의'
  if (status === 'critical') return '위험'
  return '확인'
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

function boolLabel(value: boolean) {
  return value ? '열림' : '차단'
}

function isUnsafe(row: PolicyRow) {
  return Boolean(
    row.anon_select ||
    row.anon_insert ||
    row.anon_update ||
    row.anon_delete ||
    row.authenticated_select ||
    row.authenticated_insert ||
    row.authenticated_update ||
    row.authenticated_delete ||
    Number(row.permissive_policy_count || 0) > 0 ||
    !row.rls_enabled
  )
}

export function OpsSecurityCenterPanel() {
  const [data, setData] = useState<SecurityData | null>(null)
  const [message, setMessage] = useState('')
  const [debug, setDebug] = useState('')
  const [loading, setLoading] = useState(false)

  const exposedProbes = useMemo(() => {
    return data?.probe?.items?.filter((item) => item.exposed) || []
  }, [data])

  async function load() {
    setLoading(true)

    try {
      const response = await fetch('/api/ops-security-center', { cache: 'no-store' })
      const next = await response.json().catch(() => ({}))

      if (!response.ok || !next.ok) {
        setMessage(next.message || '권한 상태를 불러오지 못했습니다.')
        setDebug(JSON.stringify(next.detail || next, null, 2))
        return
      }

      setData(next)
      setMessage('')
      setDebug('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '권한 상태를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function saveSnapshot() {
    setLoading(true)
    setMessage('')
    setDebug('')

    try {
      const response = await fetch('/api/ops-security-center', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveAuditSnapshot' })
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || !result.ok) {
        setMessage(result.message || '스냅샷 저장에 실패했습니다.')
        setDebug(JSON.stringify(result.detail || result, null, 2))
        await load()
        return
      }

      setMessage(result.message || '스냅샷을 저장했습니다.')
      setDebug(JSON.stringify(result, null, 2))
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '스냅샷 저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const metrics = data?.metrics || {}

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-7 text-[#17443F] sm:px-5 sm:py-10">
      <section className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-white/95 p-5 shadow-[0_18px_52px_rgba(49,151,136,0.08)] ring-1 ring-[#D6EDE7] sm:rounded-[2.5rem] sm:p-8">
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#2AA897]">
            RLS·권한 점검센터
          </div>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
                운영 데이터는
                <br />
                서버 API로만 접근합니다.
              </h1>

              <p className="mt-4 max-w-4xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
                사건, 문자, 개인정보, 요양보호사 배치, 지자체 제출 데이터가 공개 키로 직접 조회되지 않는지 확인합니다.
              </p>
            </div>

            <div className={'rounded-[2rem] px-6 py-5 text-center ring-1 ' + statusClass(data?.status)}>
              <div className="text-sm font-black opacity-70">권한 상태</div>
              <div className="mt-2 text-4xl font-black tracking-[-0.08em]">{statusText(data?.status)}</div>
              <div className="mt-2 text-xs font-bold">
                {data?.generatedAt || '조회 전'}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
            이번 하드닝은 직접 DB 접근을 차단하고 서버 API 중심으로 접근을 정리합니다. SQL 실행 후 특정 페이지가 401/403을 보이면, 그 페이지가 아직 직접 DB 접근을 하고 있다는 뜻이므로 해당 페이지를 API 방식으로 바꾸면 됩니다.
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={load} disabled={loading} className="rounded-2xl bg-[#247A71] px-5 py-4 text-sm font-black text-white disabled:opacity-50">
              새로고침
            </button>

            <button onClick={saveSnapshot} disabled={loading || !data} className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7] disabled:opacity-50">
              권한 점검 스냅샷 저장
            </button>

            <Link href="/ops/control-center" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              운영실 상태판
            </Link>

            <Link href="/ops/privacy-audit" className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]">
              개인정보 감사
            </Link>
          </div>

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#EFFFFA] p-4 text-sm font-black leading-7 text-[#247A71] ring-1 ring-[#CDEFE7]">
              {message}
            </div>
          ) : null}

          {debug ? (
            <details className="mt-4 rounded-2xl bg-[#247A71] p-4 text-xs font-bold leading-6 text-white" open>
              <summary className="cursor-pointer text-sm font-black">처리 결과 보기</summary>
              <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap">{debug}</pre>
            </details>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
          <MetricCard title="점검 테이블" value={`${metrics.tables || 0}개`} desc="권한 점검 대상" />
          <MetricCard title="하드닝 완료" value={`${metrics.hardened || 0}개`} desc="직접 접근 차단" />
          <MetricCard title="점검 필요" value={`${metrics.unsafe || 0}개`} desc="권한 확인 필요" danger={Number(metrics.unsafe || 0) > 0} />
          <MetricCard title="RLS 꺼짐" value={`${metrics.rlsDisabled || 0}개`} desc="RLS 비활성" danger={Number(metrics.rlsDisabled || 0) > 0} />
          <MetricCard title="anon 권한" value={`${metrics.anonGranted || 0}개`} desc="공개 키 권한" danger={Number(metrics.anonGranted || 0) > 0} />
          <MetricCard title="auth 권한" value={`${metrics.authenticatedGranted || 0}개`} desc="로그인 사용자 권한" danger={Number(metrics.authenticatedGranted || 0) > 0} />
          <MetricCard title="완화 정책" value={`${metrics.permissivePolicies || 0}개`} desc="using true 등" danger={Number(metrics.permissivePolicies || 0) > 0} />
          <MetricCard title="공개 노출" value={`${metrics.exposedProbe || 0}개`} desc="anon 테스트" danger={Number(metrics.exposedProbe || 0) > 0} />
        </section>

        {data ? (
          <section className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
            <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
              <h2 className="text-3xl font-black tracking-[-0.06em]">테이블별 권한 상태</h2>

              <div className="mt-5 space-y-3">
                {data.policyRows.map((row) => {
                  const unsafe = isUnsafe(row)

                  return (
                    <article key={row.table_name} className={'rounded-2xl p-4 ring-1 ' + (unsafe ? 'bg-[#FFF9EE] text-[#795C22] ring-[#F3DEB5]' : 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]')}>
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-current">
                              {unsafe ? '점검 필요' : '차단됨'}
                            </span>
                            <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black ring-1 ring-current">
                              RLS {row.rls_enabled ? 'ON' : 'OFF'}
                            </span>
                          </div>

                          <h3 className="mt-3 text-xl font-black tracking-[-0.05em]">{row.table_name}</h3>
                        </div>

                        <div className="grid gap-1 text-xs font-black lg:min-w-72">
                          <div>anon: 조회 {boolLabel(row.anon_select)} · 생성 {boolLabel(row.anon_insert)} · 수정 {boolLabel(row.anon_update)} · 삭제 {boolLabel(row.anon_delete)}</div>
                          <div>auth: 조회 {boolLabel(row.authenticated_select)} · 생성 {boolLabel(row.authenticated_insert)} · 수정 {boolLabel(row.authenticated_update)} · 삭제 {boolLabel(row.authenticated_delete)}</div>
                          <div>완화 정책: {row.permissive_policy_count || 0}개</div>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>

            <section className="space-y-5">
              <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
                <h2 className="text-3xl font-black tracking-[-0.06em]">공개 접근 테스트</h2>

                <div className="mt-5 space-y-3">
                  {data.probe.skipped ? (
                    <div className="rounded-2xl bg-[#FFF9EE] p-5 text-sm font-bold text-[#795C22] ring-1 ring-[#F3DEB5]">
                      {data.probe.message || '공개 접근 테스트를 건너뛰었습니다.'}
                    </div>
                  ) : (
                    (data.probe.items || []).map((item) => (
                      <article key={item.table} className={'rounded-2xl p-4 ring-1 ' + (item.exposed ? 'bg-[#FFF4F4] text-[#8A3030] ring-[#F3C8C8]' : 'bg-[#EFFFFA] text-[#247A71] ring-[#CDEFE7]')}>
                        <div className="text-xs font-black">{item.exposed ? '노출됨' : '차단됨'} · HTTP {item.status}</div>
                        <h3 className="mt-2 text-lg font-black tracking-[-0.04em]">{item.table}</h3>
                        <p className="mt-2 text-sm font-bold leading-7 opacity-80">{item.message}</p>
                      </article>
                    ))
                  )}

                  {exposedProbes.length > 0 ? (
                    <div className="rounded-2xl bg-[#FFF4F4] p-4 text-sm font-black leading-7 text-[#8A3030] ring-1 ring-[#F3C8C8]">
                      anon key로 직접 조회되는 테이블이 있습니다. SQL 하드닝이 실행되었는지 확인하세요.
                    </div>
                  ) : null}
                </div>
              </section>

              <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-6">
                <h2 className="text-3xl font-black tracking-[-0.06em]">최근 하드닝 기록</h2>

                <div className="mt-5 space-y-3">
                  {data.runs.length === 0 ? (
                    <div className="rounded-2xl bg-[#FAFFFD] p-5 text-sm font-bold text-[#637B76] ring-1 ring-[#D6EDE7]">
                      아직 하드닝 기록이 없습니다.
                    </div>
                  ) : (
                    data.runs.slice(0, 10).map((run, index) => (
                      <article key={String(run.id || index)} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#D6EDE7]">
                        <div className="text-xs font-black text-[#2AA897]">{String(run.action_type || 'security')}</div>
                        <h3 className="mt-2 text-lg font-black tracking-[-0.04em]">{String(run.status || 'recorded')}</h3>
                        <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">{String(run.summary || '-')}</p>
                        <p className="mt-1 text-xs font-bold text-[#637B76]">{String(run.created_at || '')}</p>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </section>
          </section>
        ) : null}
      </section>
    </main>
  )
}

export default OpsSecurityCenterPanel
