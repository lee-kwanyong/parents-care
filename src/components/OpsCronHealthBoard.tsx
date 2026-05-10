'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type CronData = Record<string, any>

function formatDate(value: string | null | undefined) {
  if (!value) return '없음'
  try {
    return new Date(value).toLocaleString('ko-KR')
  } catch {
    return value
  }
}

export function OpsCronHealthBoard() {
  const [data, setData] = useState<CronData | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/ops/cron-health', { cache: 'no-store' })
      const result = await response.json()

      if (!response.ok || !result.ok) throw new Error(result.message || '자동 발송 상태를 불러오지 못했습니다.')

      setData(result)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '자동 발송 상태를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function runWorker(dryRun: boolean) {
    setMessage('')

    try {
      const response = await fetch('/api/ops/cron-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 10, dryRun })
      })

      const result = await response.json()

      if (!response.ok || !result.ok) throw new Error(result.message || '자동 발송 실행 중 오류가 발생했습니다.')

      setMessage(result.cronResponse?.message || result.message || '실행됐습니다.')
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '자동 발송 실행 중 오류가 발생했습니다.')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const summary = data?.summary || { queued: 0, failed: 0, sent: 0, runCount: 0, logCount: 0 }

  return (
    <main className="min-h-screen bg-[#F7FCFB] px-5 py-8 text-[#24423F]">
      <section className="mx-auto max-w-7xl">
        <header className="rounded-[2rem] bg-[linear-gradient(135deg,#EAFBF6_0%,#F4FAFF_100%)] p-6 shadow-[0_16px_44px_rgba(93,139,131,0.12)]">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-sm font-black text-[#19A98E]">자동 발송 점검</div>
              <h1 className="mt-2 text-5xl font-black tracking-[-0.06em] md:text-7xl">{data?.healthState || '확인 중'}</h1>
              <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#607D79]">
                알림 큐 자동 발송 워커가 정상 실행되는지 확인합니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={load} className="rounded-2xl bg-white px-5 py-4 font-black text-[#426C68] ring-1 ring-[#CFE7E2]">
                새로고침
              </button>
              <button onClick={() => runWorker(true)} className="rounded-2xl bg-[#DCEFF7] px-5 py-4 font-black text-[#365E78] ring-1 ring-[#C2DDEA]">
                Dry Run
              </button>
              <button onClick={() => runWorker(false)} className="rounded-2xl bg-[#19B99A] px-5 py-4 font-black text-white">
                대기 10건 실행
              </button>
            </div>
          </div>
        </header>

        {message ? <div className="mt-5 rounded-2xl bg-[#FFF5DF] p-4 font-black text-[#886B35]">{message}</div> : null}

        {loading ? (
          <div className="mt-8 rounded-[2rem] bg-white p-8 text-center text-xl font-black ring-1 ring-[#E3EFEC]">불러오는 중...</div>
        ) : (
          <>
            <section className="mt-6 grid gap-3 md:grid-cols-5">
              <Stat label="대기" value={summary.queued || 0} />
              <Stat label="실패" value={summary.failed || 0} />
              <Stat label="완료" value={summary.sent || 0} />
              <Stat label="실행 기록" value={summary.runCount || 0} />
              <Stat label="발송 로그" value={summary.logCount || 0} />
            </section>

            <section className="mt-6 grid gap-5 lg:grid-cols-2">
              <div className="rounded-[2rem] border border-[#E3EFEC] bg-white p-6 shadow-[0_14px_40px_rgba(93,139,131,0.09)]">
                <h2 className="text-2xl font-black">설정</h2>
                <Info label="Cron path" value={data?.config?.vercelCronPath || '/api/cron/notifications'} />
                <Info label="발송 모드" value={data?.config?.notificationSendMode || 'simulation'} />
                <Info label="CRON_SECRET" value={data?.config?.hasCronSecret ? '설정됨' : '없음'} />
              </div>

              <div className="rounded-[2rem] border border-[#E3EFEC] bg-white p-6 shadow-[0_14px_40px_rgba(93,139,131,0.09)]">
                <h2 className="text-2xl font-black">마지막 실행</h2>
                {data?.lastRun ? (
                  <div className="mt-4 space-y-3">
                    <Info label="상태" value={String(data.lastRun.run_status || '')} />
                    <Info label="처리" value={`${data.lastRun.processed_count || 0}건`} />
                    <Info label="성공/실패" value={`${data.lastRun.sent_count || 0}건 / ${data.lastRun.failed_count || 0}건`} />
                    <Info label="시간" value={`${formatDate(data.lastRun.started_at)} → ${formatDate(data.lastRun.finished_at)}`} />
                  </div>
                ) : (
                  <p className="mt-4 rounded-2xl bg-[#F6FCFA] p-5 font-bold text-[#607D79]">아직 실행 기록이 없습니다.</p>
                )}
              </div>
            </section>

            <section className="mt-8 rounded-[2rem] bg-[linear-gradient(135deg,#EAFBF6_0%,#F4FAFF_100%)] p-6 shadow-[0_16px_44px_rgba(93,139,131,0.12)]">
              <h2 className="text-3xl font-black tracking-[-0.04em]">바로가기</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <Link href="/ops/notifications" className="rounded-2xl bg-white p-5 text-center font-black ring-1 ring-[#E3EFEC]">알림 큐</Link>
                <Link href="/ops" className="rounded-2xl bg-white p-5 text-center font-black ring-1 ring-[#E3EFEC]">운영실 홈</Link>
                <Link href="/deploy-readiness" className="rounded-2xl bg-white p-5 text-center font-black ring-1 ring-[#E3EFEC]">배포 점검</Link>
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-[#E3EFEC]">
      <div className="text-sm font-black text-[#718A87]">{label}</div>
      <div className="mt-1 text-3xl font-black">{value}</div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-3 rounded-2xl bg-[#F6FCFA] p-4 ring-1 ring-[#E3EFEC]">
      <div className="text-sm font-black text-[#718A87]">{label}</div>
      <div className="mt-1 text-lg font-black">{value}</div>
    </div>
  )
}
