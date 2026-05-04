'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type IntakeItem = {
  id: string
  resolved_worry: string
  recommended_pack_code: string | null
  intake_channel: string
  ops_status: string
  contact_name: string | null
  contact_phone: string | null
  raw_text: string | null
  social_care_requested: boolean
  created_at: string
}

type Plan = {
  reassuranceState: string
  title: string
  oneMinuteSummary: string
  primaryActions: string[]
  familyQuestions: string[]
  opsActions: string[]
  careBundles: Array<{ code: string; title: string; description: string; visibleToFamily: boolean }>
  nextContactScript: string
}

export default function OpsPlanBuilderPage() {
  const [items, setItems] = useState<IntakeItem[]>([])
  const [selected, setSelected] = useState<IntakeItem | null>(null)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/ops/intakes', { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok || !data.ok) throw new Error(data.message || '접수 목록을 불러오지 못했습니다.')
      setItems(data.items || [])
      if (!selected && data.items?.[0]) setSelected(data.items[0])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '접수 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function createPlan(item: IntakeItem) {
    setSelected(item)
    setPlan(null)
    setMessage('')
    try {
      const response = await fetch('/api/ops/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intakeId: item.id })
      })
      const data = await response.json()
      if (!response.ok || !data.ok) throw new Error(data.message || '케어플랜 생성 실패')
      setPlan(data.plan)
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '케어플랜 생성 실패')
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
            <h1 className="mt-2 text-3xl font-black md:text-5xl">간편 케어플랜 만들기</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              보호자의 걱정을 병원·식사·약·서류·퇴원·정기케어 플랜으로 바꿉니다.
              가족에게는 질문 3개와 할 일 3개만 보여줍니다.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={load} className="rounded-2xl bg-slate-900 px-5 py-4 font-black text-white">
              새로고침
            </button>
            <Link href="/ops/worry-center" className="rounded-2xl bg-slate-100 px-5 py-4 font-black">
              걱정센터
            </Link>
          </div>
        </div>

        {message ? (
          <p className="mt-6 rounded-2xl bg-red-50 p-4 font-bold text-red-700">{message}</p>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="space-y-3">
            <h2 className="text-2xl font-black">접수 목록</h2>
            {loading ? (
              <div className="rounded-3xl bg-white p-6 text-center font-black shadow-sm">불러오는 중...</div>
            ) : items.length === 0 ? (
              <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
                <div className="font-black">접수된 걱정이 없습니다.</div>
                <Link href="/care-request" className="mt-4 inline-block rounded-2xl bg-emerald-600 px-5 py-3 font-black text-white">
                  테스트 접수 만들기
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <article
                  key={item.id}
                  className={
                    'rounded-3xl border p-5 shadow-sm ' +
                    (selected?.id === item.id ? 'border-emerald-500 bg-emerald-50' : 'border-transparent bg-white')
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Badge text={item.ops_status} />
                        <Badge text={item.recommended_pack_code || 'pack_pending'} />
                        {item.social_care_requested ? <Badge text="사회공헌" /> : null}
                      </div>
                      <h3 className="mt-3 text-xl font-black">
                        {item.contact_name || '보호자 미입력'} · {item.contact_phone || '연락처 미입력'}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{item.raw_text}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => createPlan(item)} className="rounded-2xl bg-emerald-600 px-4 py-3 font-black text-white">
                      케어플랜 생성
                    </button>
                    <Link href={`/care-request/status/${item.id}`} className="rounded-2xl bg-slate-100 px-4 py-3 font-black">
                      가족 화면
                    </Link>
                  </div>
                </article>
              ))
            )}
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">생성된 간편 플랜</h2>
            {!selected ? (
              <p className="mt-4 text-slate-500">왼쪽에서 접수를 선택하세요.</p>
            ) : !plan ? (
              <div className="mt-5 rounded-3xl bg-slate-50 p-6">
                <p className="text-lg font-black">선택된 접수</p>
                <p className="mt-3 whitespace-pre-wrap text-slate-700">{selected.raw_text}</p>
                <button onClick={() => createPlan(selected)} className="mt-5 rounded-2xl bg-emerald-600 px-5 py-4 font-black text-white">
                  이 접수로 케어플랜 만들기
                </button>
              </div>
            ) : (
              <div className="mt-5 space-y-5">
                <div className="rounded-3xl bg-slate-900 p-6 text-white">
                  <p className="text-sm font-black text-emerald-200">안심 상태</p>
                  <div className="mt-2 text-5xl font-black">{plan.reassuranceState}</div>
                  <h3 className="mt-5 text-3xl font-black">{plan.title}</h3>
                  <p className="mt-3 text-lg leading-8 text-slate-200">{plan.oneMinuteSummary}</p>
                </div>

                <PlanBlock title="가족에게 보여줄 할 일 3개" items={plan.primaryActions} />
                <PlanBlock title="가족에게 물어볼 질문 3개" items={plan.familyQuestions} />
                <PlanBlock title="운영실 체크리스트" items={plan.opsActions} />

                <div className="rounded-3xl bg-emerald-50 p-5">
                  <h3 className="text-xl font-black text-emerald-900">포함된 케어</h3>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {plan.careBundles.map((bundle) => (
                      <div key={bundle.code} className="rounded-2xl bg-white p-4">
                        <div className="font-black">{bundle.title}</div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{bundle.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {selected ? (
                  <Link href={`/care-request/status/${selected.id}`} className="block rounded-2xl bg-slate-900 px-5 py-4 text-center font-black text-white">
                    가족용 화면 확인
                  </Link>
                ) : null}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  )
}

function Badge({ text }: { text: string }) {
  return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{text}</span>
}

function PlanBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-3xl bg-slate-50 p-5">
      <h3 className="text-xl font-black">{title}</h3>
      <div className="mt-3 space-y-2">
        {items.slice(0, title.includes('운영실') ? 6 : 3).map((item, index) => (
          <div key={item} className="rounded-2xl bg-white p-4 font-bold">
            {index + 1}. {item}
          </div>
        ))}
      </div>
    </div>
  )
}
