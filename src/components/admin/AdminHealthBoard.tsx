'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CareCard } from '@/components/ui/CareCard'
import { StatusPill } from '@/components/ui/StatusPill'

type HealthData = {
  ok: boolean
  checkedAt: string
  siteUrl: string
  summary: {
    envOk: boolean
    supabaseOk: boolean
    tablesOk: boolean
    allOk: boolean
  }
  envChecks: Array<{
    name: string
    ok: boolean
    configured: boolean
    required: boolean
    valuePreview: string
  }>
  tableChecks: Array<{
    name: string
    label: string
    ok: boolean
    status: number
    message: string
    detail?: unknown
  }>
  routeChecks: Array<{
    path: string
    label: string
    url: string
  }>
  checklist: string[]
}

function statusLabel(ok: boolean) {
  return ok ? '정상' : '확인 필요'
}

function statusClass(ok: boolean) {
  return ok
    ? 'bg-[#EAFBF6] text-[#2F756B] ring-[#CBEAE4]'
    : 'bg-[#FFF5DF] text-[#886B35] ring-[#F0E0C4]'
}

export function AdminHealthBoard() {
  const [data, setData] = useState<HealthData | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  const failedTables = useMemo(() => {
    return data?.tableChecks.filter((item) => !item.ok) || []
  }, [data])

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin-health', { cache: 'no-store' })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || '시스템 점검 정보를 불러오지 못했습니다.')
      }

      setData(result)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '시스템 점검 정보를 불러오지 못했습니다.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text)
      setMessage(`${label}를 복사했습니다.`)
    } catch {
      setMessage(text)
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (loading) {
    return (
      <CareCard tone="white">
        <p className="text-lg font-black">시스템 상태를 확인하는 중입니다...</p>
      </CareCard>
    )
  }

  if (!data) {
    return (
      <CareCard tone="amber">
        <div className="flex flex-wrap gap-2">
          <StatusPill text="관리자 확인 필요" tone="blue" />
        </div>

        <h1 className="mt-4 text-3xl font-black">
          관리자 로그인이 필요합니다.
        </h1>

        <p className="mt-3 text-sm font-bold leading-6 text-[#6F5B31]">
          시스템 점검센터는 운영실 관리자만 볼 수 있습니다. 먼저 관리자 코드로 접속해주세요.
        </p>

        {message ? (
          <div className="mt-4 rounded-2xl bg-white p-4 text-sm font-black text-[#886B35]">
            {message}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/admin?next=/admin/health"
            className="rounded-3xl bg-[#247A71] px-5 py-4 font-black text-white"
          >
            관리자 로그인
          </Link>

          <Link
            href="/"
            className="rounded-3xl bg-white px-5 py-4 font-black text-[#426C68] ring-1 ring-[#CFE7E2]"
          >
            홈으로 이동
          </Link>
        </div>
      </CareCard>
    )
  }

  return (
    <section className="space-y-6">
      <CareCard tone={data.summary.allOk ? 'green' : 'amber'}>
        <div className="flex flex-wrap gap-2">
          <StatusPill text="운영실 점검" tone="green" />
          <StatusPill text={data.summary.allOk ? '전체 정상' : '확인 필요'} tone="slate" />
        </div>

        <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.05em] md:text-6xl">
          시스템 상태를
          <br />
          한눈에 확인합니다.
        </h1>

        <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#4E6D69]">
          환경변수, Supabase 연결, 필수 테이블, 주요 화면 링크를 점검합니다.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={load}
            className="rounded-3xl bg-white px-5 py-4 font-black text-[#426C68] ring-1 ring-[#CFE7E2]"
          >
            다시 점검
          </button>

          <Link
            href="/ops"
            className="rounded-3xl bg-[#247A71] px-5 py-4 font-black text-white"
          >
            운영실로 이동
          </Link>

          <button
            type="button"
            onClick={() => copyText(data.routeChecks.map((item) => `${item.label}: ${item.url}`).join('\n'), '테스트 링크')}
            className="rounded-3xl bg-white px-5 py-4 font-black text-[#426C68] ring-1 ring-[#CFE7E2]"
          >
            테스트 링크 복사
          </button>
        </div>
      </CareCard>

      {message ? (
        <div className="rounded-2xl bg-[#FFF5DF] p-4 font-black leading-6 text-[#886B35]">
          {message}
        </div>
      ) : null}

      <section className="grid gap-3 md:grid-cols-4">
        <SummaryBox title="환경변수" ok={data.summary.envOk} />
        <SummaryBox title="Supabase" ok={data.summary.supabaseOk} />
        <SummaryBox title="필수 테이블" ok={data.summary.tablesOk} />
        <SummaryBox title="전체 상태" ok={data.summary.allOk} />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <CareCard tone="white">
          <h2 className="text-2xl font-black">환경변수</h2>
          <div className="mt-4 space-y-3">
            {data.envChecks.map((item) => (
              <div key={item.name} className="flex items-center justify-between gap-3 rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#E3EFEC]">
                <div>
                  <div className="text-sm font-black">{item.name}</div>
                  <div className="mt-1 text-xs font-bold text-[#7D9894]">
                    {item.required ? '필수' : '선택'} · {item.valuePreview}
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${statusClass(item.ok)}`}>
                  {statusLabel(item.ok)}
                </span>
              </div>
            ))}
          </div>
        </CareCard>

        <CareCard tone="white">
          <h2 className="text-2xl font-black">필수 테이블</h2>
          <div className="mt-4 space-y-3">
            {data.tableChecks.map((item) => (
              <div key={item.name} className="rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#E3EFEC]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-black">{item.label}</div>
                    <div className="mt-1 text-xs font-bold text-[#7D9894]">{item.name}</div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${statusClass(item.ok)}`}>
                    {item.message}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CareCard>
      </section>

      {failedTables.length ? (
        <CareCard tone="amber">
          <h2 className="text-2xl font-black">확인 필요한 테이블</h2>
          <p className="mt-3 text-sm font-bold leading-6 text-[#6F5B31]">
            아래 테이블이 없거나 접근이 안 됩니다. Supabase SQL Editor에서 해당 SQL을 실행해야 합니다.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {failedTables.map((item) => (
              <span key={item.name} className="rounded-full bg-white px-3 py-2 text-xs font-black text-[#886B35] ring-1 ring-[#F0E0C4]">
                {item.name}
              </span>
            ))}
          </div>
        </CareCard>
      ) : null}

      <CareCard tone="white">
        <h2 className="text-2xl font-black">주요 화면 테스트 링크</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.routeChecks.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className="rounded-2xl bg-[#FAFFFD] p-4 font-black text-[#426C68] ring-1 ring-[#E3EFEC] transition hover:bg-white"
            >
              <div className="text-sm">{item.label}</div>
              <div className="mt-1 text-xs text-[#8AA29E]">{item.path}</div>
            </Link>
          ))}
        </div>
      </CareCard>

      <CareCard tone="green">
        <h2 className="text-2xl font-black">데모 전 체크리스트</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {data.checklist.map((item, index) => (
            <label key={item} className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-[#D3ECE6]">
              <input type="checkbox" className="h-5 w-5" />
              <span className="text-sm font-black text-[#2F756B]">
                {index + 1}. {item}
              </span>
            </label>
          ))}
        </div>
      </CareCard>
    </section>
  )
}

function SummaryBox({
  title,
  ok
}: {
  title: string
  ok: boolean
}) {
  return (
    <div className={`rounded-2xl p-5 ring-1 ${statusClass(ok)}`}>
      <div className="text-sm font-black">{title}</div>
      <div className="mt-2 text-2xl font-black">{statusLabel(ok)}</div>
    </div>
  )
}
