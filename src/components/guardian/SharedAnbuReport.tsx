'use client'

import { useEffect, useState } from 'react'

type SharedData = {
  ok: boolean
  message?: string
  report?: {
    reportNo: string
    parentName: string
    guardianName: string
    reportText: string
    createdAt: string
    fallback?: boolean
  }
}

function formatDate(value: string) {
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) return value || ''

  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(parsed))
}

export function SharedAnbuReport({ token }: { token: string }) {
  const [data, setData] = useState<SharedData | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch(`/api/anbu-completion?shareToken=${encodeURIComponent(token)}`, {
          cache: 'no-store'
        })

        const result = await response.json().catch(() => ({})) as SharedData

        if (!response.ok || result.ok === false) {
          throw new Error(result.message || '공유 리포트를 불러오지 못했습니다.')
        }

        setData(result)
      } catch (error) {
        setMessage(error instanceof Error ? error.message : '공유 리포트를 불러오지 못했습니다.')
      }
    }

    void load()
  }, [token])

  return (
    <main className="min-h-screen bg-[#F7FFFC] px-4 py-8 text-[#17443F]">
      <section className="mx-auto max-w-4xl rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-[#D6EDE7] sm:p-9">
        <div className="rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7] inline-flex">
          안부완료 리포트 공유본
        </div>

        {message ? (
          <div className="mt-5 rounded-2xl bg-[#FFF9EE] p-5 text-sm font-black text-[#795C22] ring-1 ring-[#F3DEB5]">
            {message}
          </div>
        ) : null}

        {data?.report ? (
          <>
            <h1 className="mt-5 text-4xl font-black tracking-[-0.08em]">
              {data.report.parentName || '부모님'} 안부완료 리포트
            </h1>

            <p className="mt-3 text-sm font-bold leading-7 text-[#637B76]">
              리포트 번호: {data.report.reportNo || '-'} · 생성: {formatDate(data.report.createdAt)}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={() => window.print()}
                className="rounded-2xl bg-[#17443F] px-5 py-3 text-sm font-black text-white"
              >
                인쇄/PDF 저장
              </button>
            </div>

            <pre className="mt-6 whitespace-pre-wrap rounded-[1.5rem] bg-[#F8FFFC] p-5 text-sm font-bold leading-7 text-[#315E58] ring-1 ring-[#D6EDE7]">
              {data.report.reportText}
            </pre>
          </>
        ) : (
          <div className="mt-8 text-sm font-black text-[#637B76]">리포트를 불러오는 중입니다.</div>
        )}
      </section>
    </main>
  )
}
