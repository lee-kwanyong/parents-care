'use client'

import { useEffect, useState } from 'react'

type Passport = {
  id: string
  elder_name: string
  guardian_name: string | null
  guardian_phone: string | null
  hearing_attention: boolean
  mobility_attention: boolean
  allergy_status: string
  has_medications: boolean
  fall_risk_level: string
  body_conditions: Array<{ label?: string; managerTip?: string }>
  allergies: Array<{ status?: string; memo?: string }>
  medications: Array<{ memo?: string }>
  diet_needs: Array<{ label?: string }>
  communication_notes: string | null
  emergency_notes: string | null
  care_summary: any
  updated_at: string
}

export default function OpsCarePassportPage() {
  const [items, setItems] = useState<Passport[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/care-passport?limit=20', { cache: 'no-store' })
      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '불러오기 실패')
      }

      setItems(data.items || [])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '불러오기 실패')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-emerald-700">운영실</p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">
              부모님 케어패스포트 확인
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              매니저 배정 전 청력, 통증, 알러지, 복용약, 낙상 위험을 확인합니다.
            </p>
          </div>
          <button onClick={load} className="rounded-2xl bg-slate-900 px-5 py-4 font-black text-white">
            새로고침
          </button>
        </div>

        {message ? (
          <p className="mt-6 rounded-2xl bg-red-50 p-4 font-bold text-red-700">{message}</p>
        ) : null}

        <div className="mt-8 space-y-4">
          {loading ? (
            <div className="rounded-3xl bg-white p-8 text-center font-black shadow-sm">불러오는 중...</div>
          ) : items.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
              <div className="text-xl font-black">등록된 케어패스포트가 없습니다.</div>
              <p className="mt-2 text-slate-500">/care-passport 에서 먼저 등록해보세요.</p>
            </div>
          ) : (
            items.map((item) => (
              <article key={item.id} className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-5 lg:flex-row lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      {item.hearing_attention ? <Badge text="청력 주의" /> : null}
                      {item.mobility_attention ? <Badge text="이동 주의" /> : null}
                      <Badge text={`알러지: ${item.allergy_status}`} />
                      <Badge text={item.has_medications ? '복용약 있음' : '복용약 확인 필요'} />
                      <Badge text={`낙상: ${item.fall_risk_level}`} />
                    </div>

                    <h2 className="mt-4 text-3xl font-black">{item.elder_name}</h2>
                    <p className="mt-2 text-slate-600">
                      보호자: {item.guardian_name || '미입력'} · {item.guardian_phone || '미입력'}
                    </p>

                    <p className="mt-4 rounded-2xl bg-emerald-50 p-4 text-lg font-bold leading-8 text-emerald-950">
                      {item.care_summary?.oneMinuteSummary || '요약 없음'}
                    </p>
                  </div>

                  <div className="lg:w-[360px]">
                    <h3 className="text-xl font-black">현장 주의사항</h3>
                    <div className="mt-3 space-y-2">
                      {(item.care_summary?.managerTips || []).length > 0 ? (
                        item.care_summary.managerTips.map((tip: string, index: number) => (
                          <div key={tip} className="rounded-2xl bg-slate-50 p-3 text-sm font-bold">
                            {index + 1}. {tip}
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl bg-slate-50 p-3 text-sm font-bold">
                          별도 주의사항 없음
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <InfoBox
                    title="불편한 곳"
                    items={(item.body_conditions || []).map((condition) => condition.label || '상태 메모')}
                  />
                  <InfoBox
                    title="알러지"
                    items={(item.allergies || []).map((allergy) => allergy.memo || allergy.status || '알러지 메모 없음')}
                  />
                  <InfoBox
                    title="복용약"
                    items={(item.medications || []).map((medication) => medication.memo || '복용약 메모 없음')}
                  />
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  )
}

function Badge({ text }: { text: string }) {
  return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{text}</span>
}

function InfoBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <h3 className="font-black">{title}</h3>
      <div className="mt-3 space-y-2">
        {items.length > 0 ? (
          items.map((item) => (
            <p key={item} className="text-sm leading-6 text-slate-700">
              • {item}
            </p>
          ))
        ) : (
          <p className="text-sm text-slate-500">미입력</p>
        )}
      </div>
    </div>
  )
}
