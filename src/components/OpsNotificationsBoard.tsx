'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type NotificationItem = Record<string, any>

function formatDate(value: string | null | undefined) {
  if (!value) return ''
  try {
    return new Date(value).toLocaleString('ko-KR')
  } catch {
    return value
  }
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    queued: '대기',
    sent: '발송 완료',
    failed: '실패',
    cancelled: '취소'
  }
  return map[status] || status || '미확인'
}

function roleLabel(role: string | null) {
  const map: Record<string, string> = {
    guardian: '보호자',
    manager: '매니저',
    ops: '운영실',
    parent: '부모님'
  }
  return role ? map[role] || role : '미지정'
}

export function OpsNotificationsBoard() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [logs, setLogs] = useState<NotificationItem[]>([])
  const [summary, setSummary] = useState<Record<string, number>>({
    total: 0,
    queued: 0,
    sent: 0,
    failed: 0,
    guardian: 0,
    manager: 0,
    high: 0,
    logs: 0
  })
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [filter, setFilter] = useState<'all' | 'queued' | 'sent' | 'failed'>('all')

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/ops/notifications', { cache: 'no-store' })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '알림 큐를 불러오지 못했습니다.')
      }

      setItems(result.items || [])
      setLogs(result.logs || [])
      setSummary(result.summary || {})
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '알림 큐를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function postAction(payload: Record<string, unknown>) {
    setMessage('')

    try {
      const response = await fetch('/api/ops/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '처리 중 오류가 발생했습니다.')
      }

      setMessage(result.message || '처리됐습니다.')
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items
    return items.filter((item) => item.status === filter)
  }, [items, filter])

  return (
    <main className="min-h-screen bg-[#F7FCFB] px-5 py-8 text-[#24423F]">
      <section className="mx-auto max-w-7xl">
        <header className="rounded-[2rem] bg-[linear-gradient(135deg,#EAFBF6_0%,#F4FAFF_100%)] p-6 shadow-[0_16px_44px_rgba(93,139,131,0.12)]">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-sm font-black text-[#19A98E]">운영실</div>
              <h1 className="mt-2 text-5xl font-black tracking-[-0.06em] md:text-7xl">알림 큐</h1>
              <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#607D79]">
                보호자 리포트, 매니저 새 일감, 케어 케이스 생성 알림을 관리합니다. 현재는 simulation 발송 단계입니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={load} className="rounded-2xl bg-white px-5 py-4 font-black text-[#426C68] ring-1 ring-[#CFE7E2]">
                새로고침
              </button>
              <button onClick={() => postAction({ action: 'create_demo_notifications' })} className="rounded-2xl bg-[#DCEFF7] px-5 py-4 font-black text-[#365E78] ring-1 ring-[#C2DDEA]">
                테스트 알림 생성
              </button>
              <button onClick={() => postAction({ action: 'send_next_batch', limit: 10 })} className="rounded-2xl bg-[#19B99A] px-5 py-4 font-black text-white">
                대기 10건 발송
              </button>
              <Link href="/admin/ops/cron-health" className="rounded-2xl bg-white px-5 py-4 font-black text-[#426C68] ring-1 ring-[#CFE7E2]">
                자동 발송 점검
              </Link>
            </div>
          </div>
        </header>

        {message ? (
          <div className="mt-5 rounded-2xl bg-[#FFF5DF] p-4 font-black text-[#886B35]">{message}</div>
        ) : null}

        <section className="mt-6 grid gap-3 md:grid-cols-4 xl:grid-cols-8">
          <Stat label="전체" value={summary.total || 0} />
          <Stat label="대기" value={summary.queued || 0} tone="amber" />
          <Stat label="완료" value={summary.sent || 0} />
          <Stat label="실패" value={summary.failed || 0} tone="red" />
          <Stat label="보호자" value={summary.guardian || 0} />
          <Stat label="매니저" value={summary.manager || 0} />
          <Stat label="중요" value={summary.high || 0} tone="amber" />
          <Stat label="발송로그" value={summary.logs || logs.length || 0} />
        </section>

        <section className="mt-6 rounded-[2rem] border border-[#E3EFEC] bg-white p-5 shadow-[0_14px_40px_rgba(93,139,131,0.09)]">
          <div className="flex flex-wrap gap-2">
            {[
              ['all', '전체'],
              ['queued', '대기'],
              ['sent', '완료'],
              ['failed', '실패']
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter(value as typeof filter)}
                className={
                  'rounded-full px-4 py-2 text-sm font-black ring-1 transition ' +
                  (filter === value
                    ? 'bg-[#19B99A] text-white ring-[#19B99A]'
                    : 'bg-[#F4FAF9] text-[#5B7774] ring-[#E2EFEC]')
                }
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {loading ? (
          <div className="mt-8 rounded-[2rem] bg-white p-8 text-center text-xl font-black ring-1 ring-[#E3EFEC]">
            알림 큐를 불러오는 중...
          </div>
        ) : filteredItems.length === 0 ? (
          <section className="mt-8 rounded-[2rem] bg-white p-10 text-center ring-1 ring-[#E3EFEC] shadow-[0_14px_40px_rgba(93,139,131,0.09)]">
            <h2 className="text-3xl font-black">표시할 알림이 없습니다.</h2>
            <p className="mt-3 text-base font-bold leading-7 text-[#607D79]">테스트 알림을 생성해보세요.</p>
          </section>
        ) : (
          <section className="mt-8 space-y-4">
            {filteredItems.map((item) => (
              <article key={item.id} className="rounded-[2rem] border border-[#E3EFEC] bg-white p-6 shadow-[0_14px_40px_rgba(93,139,131,0.09)]">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge text={statusLabel(item.status)} tone={item.status === 'failed' ? 'red' : item.status === 'queued' ? 'amber' : 'green'} />
                      <Badge text={roleLabel(item.recipient_role)} />
                      <Badge text={item.channel || 'app'} />
                      <Badge text={item.template_code || 'template 없음'} />
                      <Badge text={`${item.delivery_attempts || 0}회 시도`} />
                    </div>

                    <h3 className="mt-4 text-2xl font-black tracking-[-0.03em] md:text-3xl">{item.title}</h3>
                    <p className="mt-3 text-base font-bold leading-7 text-[#607D79]">{item.body || '본문 없음'}</p>
                    <p className="mt-3 text-sm font-bold text-[#8AA29E]">
                      수신자: {item.recipient_name || '미지정'} · {item.recipient_phone || '연락처 없음'} · 생성일 {formatDate(item.created_at)}
                    </p>

                    {item.error_message ? (
                      <p className="mt-4 rounded-2xl bg-[#FFF0F1] p-4 text-sm font-black text-[#965D65]">오류: {item.error_message}</p>
                    ) : null}
                  </div>

                  <div className="grid min-w-[220px] gap-2">
                    {item.status !== 'sent' ? (
                      <button onClick={() => postAction({ action: 'mark_sent', id: item.id })} className="rounded-2xl bg-[#19B99A] px-5 py-4 font-black text-white">
                        발송 완료 처리
                      </button>
                    ) : null}
                    {item.status !== 'failed' ? (
                      <button onClick={() => postAction({ action: 'mark_failed', id: item.id })} className="rounded-2xl bg-[#FFF0F1] px-5 py-4 font-black text-[#965D65]">
                        실패 처리
                      </button>
                    ) : null}
                    {item.status !== 'queued' ? (
                      <button onClick={() => postAction({ action: 'requeue', id: item.id })} className="rounded-2xl bg-[#DCEFF7] px-5 py-4 font-black text-[#365E78]">
                        재시도 대기
                      </button>
                    ) : null}
                    {item.payload?.url ? (
                      <Link href={String(item.payload.url)} className="rounded-2xl bg-white px-5 py-4 text-center font-black text-[#426C68] ring-1 ring-[#CFE7E2]">
                        연결 화면 열기
                      </Link>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </section>
    </main>
  )
}

function Stat({ label, value, tone = 'green' }: { label: string; value: string | number; tone?: 'green' | 'amber' | 'red' }) {
  return (
    <div className={'rounded-2xl bg-white p-5 ring-1 ' + (tone === 'red' ? 'ring-[#F0D6D8]' : tone === 'amber' ? 'ring-[#F0DDB6]' : 'ring-[#E3EFEC]')}>
      <div className="text-sm font-black text-[#718A87]">{label}</div>
      <div className="mt-1 text-3xl font-black">{value}</div>
    </div>
  )
}

function Badge({ text, tone = 'green' }: { text: string; tone?: 'green' | 'amber' | 'red' }) {
  return (
    <span className={'rounded-full px-3 py-1 text-xs font-black ring-1 ' + (tone === 'red' ? 'bg-[#FFF0F1] text-[#965D65] ring-[#EFD2D6]' : tone === 'amber' ? 'bg-[#FFF5DF] text-[#886B35] ring-[#F0DDB6]' : 'bg-[#F4FAF9] text-[#5B7774] ring-[#E2EFEC]')}>
      {text}
    </span>
  )
}
