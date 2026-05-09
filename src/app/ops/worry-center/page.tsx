
'use client'

import { useEffect, useMemo, useState } from 'react'

type IntakeItem = {
  id: string
  resolved_worry: string
  recommended_pack_code: string | null
  intake_channel: string
  ops_status: string
  contact_name: string | null
  contact_phone: string | null
  raw_text: string | null
  ai_summary: string | null
  social_care_requested: boolean
  created_at: string
}

const statusLabels: Record<string, string> = {
  new: '신규',
  triaged: '확인 완료',
  plan_created: '플랜 작성',
  waiting_family: '가족 확인 대기',
  in_progress: '진행 중',
  resolved: '해결 완료',
  cancelled: '취소'
}

const packLabels: Record<string, string> = {
  hospital_day: '병원 가는 날 안심팩',
  meal_delivery: '안심밥상 케어',
  medication_check: '약 챙김 안심팩',
  discharge_7days: '퇴원 후 7일 안심팩',
  documents_insurance: '보험서류 챙김팩',
  regular_care: '정기진료 자동관리',
  wellbeing_check: '정기 안부 확인',
  urgent_help: '긴급 확인 요청',
  not_sure_consult: '뭘 해야 할지 모르겠어요 상담'
}

export default function OpsWorryCenterPage() {
  const [items, setItems] = useState<IntakeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/ops/intakes', { cache: 'no-store' })
      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '목록을 불러오지 못했습니다.')
      }

      setItems(data.items || [])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id: string, status: string) {
    setMessage('')

    try {
      const response = await fetch('/api/ops/intakes', {
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

  const counts = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.total += 1
        if (item.ops_status === 'new') acc.newCount += 1
        if (item.social_care_requested) acc.socialCare += 1
        if (item.recommended_pack_code === 'meal_delivery') acc.meal += 1
        if (item.recommended_pack_code === 'urgent_help') acc.urgent += 1
        return acc
      },
      { total: 0, newCount: 0, socialCare: 0, meal: 0, urgent: 0 }
    )
  }, [items])

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-[#2E504D]">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-care-700">운영실</p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">부모님 걱정 해결 센터</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-[#63807C]">
              로그인 연동 전까지는 비로그인 접수를 운영실에서 확인합니다. 배포 전에는 이 화면을 운영실 권한으로 잠급니다.
            </p>
          </div>
          <button onClick={load} className="rounded-2xl bg-[#5F7C92] px-5 py-4 font-black text-[#2E504D]">
            새로고침
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-5">
          <Stat label="전체 접수" value={counts.total} />
          <Stat label="신규" value={counts.newCount} />
          <Stat label="식사 케어" value={counts.meal} />
          <Stat label="사회공헌 요청" value={counts.socialCare} />
          <Stat label="긴급" value={counts.urgent} />
        </div>

        {message ? (
          <p className="mt-6 rounded-2xl bg-red-50 p-4 font-bold text-red-700">{message}</p>
        ) : null}

        <div className="mt-8 space-y-4">
          {loading ? (
            <div className="rounded-3xl bg-white p-8 text-center font-black shadow-sm">불러오는 중...</div>
          ) : items.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
              <div className="text-xl font-black">아직 접수된 걱정이 없습니다.</div>
              <p className="mt-2 text-[#7A9692]">/care-request 에서 테스트 접수를 만들어보세요.</p>
            </div>
          ) : (
            items.map((item) => (
              <article key={item.id} className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge text={statusLabels[item.ops_status] || item.ops_status} />
                      <Badge text={packLabels[item.recommended_pack_code || ''] || item.recommended_pack_code || '케어팩 미정'} />
                      <Badge text={item.intake_channel} />
                      {item.social_care_requested ? <Badge text="사회공헌 요청" /> : null}
                    </div>
                    <h2 className="mt-4 text-2xl font-black">
                      {item.contact_name || '보호자 이름 미입력'} · {item.contact_phone || '연락처 미입력'}
                    </h2>
                    <p className="mt-3 whitespace-pre-wrap text-lg leading-8 text-[#4E6D69]">
                      {item.raw_text || item.ai_summary || '내용 없음'}
                    </p>
                    <p className="mt-3 text-sm text-[#7A9692]">
                      접수일: {new Date(item.created_at).toLocaleString('ko-KR')}
                    </p>
                  </div>

                  <div className="grid min-w-[180px] gap-2">
                    <button onClick={() => updateStatus(item.id, 'triaged')} className="rounded-2xl bg-care-50 px-4 py-3 font-black text-care-800">
                      확인 완료
                    </button>
                    <button onClick={() => updateStatus(item.id, 'plan_created')} className="rounded-2xl bg-slate-100 px-4 py-3 font-black">
                      플랜 작성
                    </button>
                    <button onClick={() => updateStatus(item.id, 'waiting_family')} className="rounded-2xl bg-amber-50 px-4 py-3 font-black text-amber-800">
                      가족 확인 대기
                    </button>
                    <button onClick={() => updateStatus(item.id, 'resolved')} className="rounded-2xl bg-emerald-50 px-4 py-3 font-black text-emerald-800">
                      해결 완료
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="text-sm font-black text-[#7A9692]">{label}</div>
      <div className="mt-2 text-3xl font-black">{value}</div>
    </div>
  )
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-[#4E6D69]">
      {text}
    </span>
  )
}
