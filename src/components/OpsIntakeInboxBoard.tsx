'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type IntakeItem = {
  id: string
  source: 'care_assisted_intake_requests' | 'care_intake_entries'
  elder_name: string
  contact_name: string
  contact_phone: string
  channel: string
  summary_title: string
  raw_text: string
  status: string
  priority: string
  social_care_requested: boolean
  created_at: string
}

type InboxData = {
  ok: boolean
  items: IntakeItem[]
  summary: {
    total: number
    open: number
    urgent: number
    converted: number
    assisted_count: number
    care_intake_count: number
  }
  sources?: Record<string, { ok: boolean; error: unknown }>
}

function labelStatus(status: string) {
  const map: Record<string, string> = {
    received: '접수됨',
    open: '열린 접수',
    pending: '대기',
    processing: '정리 중',
    converted: '변환 완료',
    completed: '완료',
    done: '완료'
  }

  return map[status] || status
}

function labelChannel(channel: string) {
  const map: Record<string, string> = {
    phone: '전화',
    kakao: '카톡',
    photo: '사진',
    memo: '한 줄 메모',
    app: '앱'
  }

  return map[channel] || channel
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString('ko-KR')
  } catch {
    return value
  }
}

export function OpsIntakeInboxBoard() {
  const [data, setData] = useState<InboxData | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/ops/intake-inbox', { cache: 'no-store' })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '접수함을 불러오지 못했습니다.')
      }

      setData(result)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '접수함을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(item: IntakeItem, status: string) {
    setMessage('')

    try {
      const response = await fetch('/api/ops/intake-inbox', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          source: item.source,
          status
        })
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '상태 변경 실패')
      }

      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '상태 변경 실패')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const items = data?.items || []
  const summary = data?.summary || {
    total: 0,
    open: 0,
    urgent: 0,
    converted: 0,
    assisted_count: 0,
    care_intake_count: 0
  }

  const nextGuide = useMemo(() => {
    if (summary.total === 0) {
      return '아직 접수된 부모님 걱정이 없습니다.'
    }

    if (summary.urgent > 0) {
      return '긴급 또는 지원 요청 접수가 있습니다. 먼저 확인하세요.'
    }

    if (summary.open > 0) {
      return '열린 접수를 케어플랜으로 정리하세요.'
    }

    return '현재 접수함은 안정적입니다.'
  }, [summary])

  return (
    <main className="min-h-screen bg-[#F7FCFB] px-5 py-8 text-[#24423F]">
      <section className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-black text-[#19A98E]">운영실</div>
            <h1 className="mt-2 text-4xl font-black tracking-[-0.05em] md:text-6xl">
              부모님 걱정 접수함
            </h1>
            <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#607D79]">
              보호자가 남긴 전화·카톡·사진·한 줄 메모 접수를 확인하고 케어 요청으로 정리합니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={load}
              className="rounded-2xl bg-[#DCEFF7] px-5 py-4 font-black text-[#365E78] ring-1 ring-[#C2DDEA]"
            >
              새로고침
            </button>
            <Link
              href="/care-request"
              className="rounded-2xl bg-[#19B99A] px-5 py-4 font-black text-white"
            >
              테스트 접수
            </Link>
            <Link
              href="/ops"
              className="rounded-2xl bg-white px-5 py-4 font-black text-[#426C68] ring-1 ring-[#CFE7E2]"
            >
              운영실 홈
            </Link>
          </div>
        </header>

        <section className="rounded-[2rem] border border-[#D5EEE8] bg-[#EAFBF6] p-6 shadow-[0_16px_44px_rgba(93,139,131,0.10)]">
          <div className="text-sm font-black text-[#3F706B]">접수함 안심판</div>
          <h2 className="mt-2 text-5xl font-black tracking-[-0.04em]">
            {summary.total > 0 ? '확인 필요' : '안심'}
          </h2>

          <div className="mt-6 grid gap-3 md:grid-cols-5">
            <Stat label="전체" value={summary.total} />
            <Stat label="열린 접수" value={summary.open} />
            <Stat label="긴급" value={summary.urgent} />
            <Stat label="변환 완료" value={summary.converted} />
            <Stat label="걱정 접수" value={summary.assisted_count} />
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-[#E3EFEC] bg-white p-6 shadow-[0_12px_34px_rgba(93,139,131,0.08)]">
          <h2 className="text-2xl font-black">가족이 볼 안내</h2>
          <div className="mt-4 rounded-2xl bg-[#F6FCFA] p-4 text-lg font-black">
            1. {nextGuide}
          </div>
        </section>

        {message ? (
          <p className="mt-6 rounded-2xl bg-[#FFF5DF] p-4 font-black text-[#886B35]">
            {message}
          </p>
        ) : null}

        <section className="mt-8 space-y-4">
          {loading ? (
            <div className="rounded-[2rem] bg-white p-8 text-center text-xl font-black shadow-[0_12px_34px_rgba(93,139,131,0.08)]">
              접수함을 불러오는 중...
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-[2rem] bg-white p-10 text-center shadow-[0_12px_34px_rgba(93,139,131,0.08)]">
              <h3 className="text-2xl font-black">아직 접수된 부모님 걱정이 없습니다.</h3>
              <p className="mt-3 text-sm font-bold text-[#607D79]">
                /care-request 또는 /care-intake에서 먼저 접수해보세요.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <article
                key={`${item.source}-${item.id}`}
                className="rounded-[2rem] border border-[#E3EFEC] bg-white p-6 shadow-[0_14px_40px_rgba(93,139,131,0.09)]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge text={item.source === 'care_assisted_intake_requests' ? '걱정 접수' : '사진·카톡'} />
                      <Badge text={labelChannel(item.channel)} />
                      <Badge text={labelStatus(item.status)} />
                      <Badge text={item.priority === 'high' || item.priority === 'urgent' ? '우선 확인' : '보통'} />
                      {item.social_care_requested ? <Badge text="공공지원 안내 희망" /> : null}
                    </div>

                    <h3 className="mt-4 text-3xl font-black tracking-[-0.03em]">
                      {item.summary_title}
                    </h3>

                    <p className="mt-3 text-sm font-bold leading-6 text-[#607D79]">
                      부모님: {item.elder_name} · 보호자: {item.contact_name} · 연락처: {item.contact_phone || '미입력'}
                    </p>

                    <p className="mt-2 text-xs font-bold text-[#8AA29E]">
                      접수일: {formatDate(item.created_at)}
                    </p>

                    {item.raw_text ? (
                      <div className="mt-5 rounded-2xl bg-[#F6FCFA] p-5 text-base font-bold leading-8 text-[#385A56]">
                        {item.raw_text}
                      </div>
                    ) : null}
                  </div>

                  <div className="grid min-w-[200px] gap-2">
                    <button
                      onClick={() => updateStatus(item, 'processing')}
                      className="rounded-2xl bg-[#DCEFF7] px-5 py-4 font-black text-[#365E78]"
                    >
                      정리 중으로 표시
                    </button>
                    <button
                      onClick={() => updateStatus(item, 'converted')}
                      className="rounded-2xl bg-[#19B99A] px-5 py-4 font-black text-white"
                    >
                      케어 요청으로 정리
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </section>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <div className="text-sm font-black text-[#718A87]">{label}</div>
      <div className="mt-1 text-3xl font-black">{value}</div>
    </div>
  )
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-[#F4FAF9] px-3 py-1 text-xs font-black text-[#5B7774] ring-1 ring-[#E2EFEC]">
      {text}
    </span>
  )
}
