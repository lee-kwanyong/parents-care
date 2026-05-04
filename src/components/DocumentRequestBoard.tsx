'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  buildDocumentSummary,
  labelDocumentReason,
  labelDocumentStatus,
  type CareDocumentRequest,
  type DocumentStatus
} from '@/lib/document-care-engine'

export function DocumentRequestBoard({ mode = 'family' }: { mode?: 'family' | 'ops' }) {
  const [items, setItems] = useState<CareDocumentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/documents/status', { cache: 'no-store' })
      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '서류 요청 목록을 불러오지 못했습니다.')
      }

      setItems(data.items || [])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '서류 요청 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id: string, status: DocumentStatus) {
    setMessage('')

    try {
      const response = await fetch('/api/documents/request', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '상태 변경 실패')
      }

      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '상태 변경 실패')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const summary = useMemo(() => buildDocumentSummary(items), [items])

  return (
    <div>
      <div
        className={
          'rounded-3xl p-6 ' +
          (summary.reassuranceState === '긴급'
            ? 'bg-red-50'
            : summary.reassuranceState === '확인 필요'
              ? 'bg-amber-50'
              : 'bg-emerald-50')
        }
      >
        <p className="text-sm font-black text-slate-600">서류 안심판</p>
        <div className="mt-2 text-5xl font-black">{summary.reassuranceState}</div>
        <div className="mt-5 grid gap-3 md:grid-cols-5">
          <Stat label="전체" value={summary.total} />
          <Stat label="열린 요청" value={summary.open} />
          <Stat label="운영 확인" value={summary.needsOps} />
          <Stat label="수령 가능" value={summary.ready} />
          <Stat label="전달 완료" value={summary.sent} />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={load} className="rounded-2xl bg-slate-900 px-5 py-4 font-black text-white">
          새로고침
        </button>
      </div>

      {message ? (
        <p className="mt-5 rounded-2xl bg-blue-50 p-4 font-bold text-blue-900">
          {message}
        </p>
      ) : null}

      <section className="mt-6 space-y-3">
        {loading ? (
          <div className="rounded-3xl bg-white p-8 text-center font-black shadow-sm">
            불러오는 중...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <div className="text-xl font-black">아직 요청된 서류가 없습니다.</div>
            <p className="mt-2 text-slate-500">/care-documents 에서 서류 요청을 만들어보세요.</p>
          </div>
        ) : (
          items.map((item) => (
            <article key={item.id} className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge text={item.document_label} />
                    <Badge text={labelDocumentReason(item.reason)} />
                    <Badge text={labelDocumentStatus(item.status)} />
                    <Badge text={item.priority} />
                  </div>

                  <h3 className="mt-3 text-2xl font-black">
                    {item.elder_name} · {item.document_label}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    병원: {item.hospital_name || '미입력'} · 방문일: {item.visit_date || '미입력'}
                  </p>

                  {item.memo ? (
                    <p className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                      {item.memo}
                    </p>
                  ) : null}

                  {item.ops_memo ? (
                    <p className="mt-3 rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-blue-900">
                      운영 메모: {item.ops_memo}
                    </p>
                  ) : null}
                </div>

                <div className="grid min-w-[180px] gap-2">
                  {mode === 'ops' ? (
                    <>
                      <button onClick={() => updateStatus(item.id, 'preparing')} className="rounded-2xl bg-slate-100 px-4 py-3 font-black">
                        준비 중
                      </button>
                      <button onClick={() => updateStatus(item.id, 'ready')} className="rounded-2xl bg-amber-100 px-4 py-3 font-black text-amber-900">
                        수령 가능
                      </button>
                      <button onClick={() => updateStatus(item.id, 'collected')} className="rounded-2xl bg-emerald-100 px-4 py-3 font-black text-emerald-900">
                        수령 완료
                      </button>
                      <button onClick={() => updateStatus(item.id, 'sent_to_family')} className="rounded-2xl bg-slate-900 px-4 py-3 font-black text-white">
                        가족 전달
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => updateStatus(item.id, 'collected')} className="rounded-2xl bg-emerald-600 px-4 py-3 font-black text-white">
                        수령했어요
                      </button>
                      <button onClick={() => updateStatus(item.id, 'not_needed')} className="rounded-2xl bg-slate-100 px-4 py-3 font-black">
                        필요 없어요
                      </button>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <div className="text-sm font-black text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-black">{value}</div>
    </div>
  )
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
      {text}
    </span>
  )
}
