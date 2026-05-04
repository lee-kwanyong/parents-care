'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  buildSocialSupportSummary,
  labelLivingSituation,
  labelSocialCaseStatus,
  labelSocialNeed,
  type SocialCaseStatus,
  type SocialSupportCase,
  type SocialSupportProgram,
  type SupportVoucher
} from '@/lib/social-care-engine'

export function SocialCareBoard({ mode = 'family' }: { mode?: 'family' | 'ops' }) {
  const [cases, setCases] = useState<SocialSupportCase[]>([])
  const [programs, setPrograms] = useState<SocialSupportProgram[]>([])
  const [vouchers, setVouchers] = useState<SupportVoucher[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/social-care', { cache: 'no-store' })
      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '사회공헌 요청을 불러오지 못했습니다.')
      }

      setCases(data.cases || [])
      setPrograms(data.programs || [])
      setVouchers(data.vouchers || [])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '사회공헌 요청을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function updateCase(id: string, status: SocialCaseStatus) {
    setMessage('')

    try {
      const response = await fetch('/api/social-care', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'case', id, status })
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

  async function updateVoucher(id: string, status: 'reserved' | 'used' | 'cancelled') {
    setMessage('')

    try {
      const response = await fetch('/api/social-care', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'voucher', id, status })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '쿠폰 상태 변경 실패')
      }

      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '쿠폰 상태 변경 실패')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const summary = useMemo(() => buildSocialSupportSummary(cases, vouchers), [cases, vouchers])
  const programMap = useMemo(() => {
    const map = new Map<string, SocialSupportProgram>()
    for (const program of programs) map.set(program.program_code, program)
    return map
  }, [programs])

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
        <p className="text-sm font-black text-slate-600">사회공헌 안심판</p>
        <div className="mt-2 text-5xl font-black">{summary.reassuranceState}</div>

        <div className="mt-5 grid gap-3 md:grid-cols-5">
          <Stat label="전체 요청" value={summary.total} />
          <Stat label="열린 요청" value={summary.open} />
          <Stat label="긴급" value={summary.urgent} />
          <Stat label="검토 중" value={summary.reviewing} />
          <Stat label="쿠폰" value={summary.issuedVoucher} />
        </div>
      </div>

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black">가족이 볼 안내</h2>
        <div className="mt-4 space-y-3">
          {summary.familyNextActions.map((action, index) => (
            <div key={action} className="rounded-2xl bg-slate-50 p-4 text-lg font-black">
              {index + 1}. {action}
            </div>
          ))}
        </div>
      </section>

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

      <section className="mt-8 space-y-5">
        {loading ? (
          <div className="rounded-3xl bg-white p-8 text-center font-black shadow-sm">
            불러오는 중...
          </div>
        ) : cases.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <div className="text-xl font-black">아직 사회공헌 요청이 없습니다.</div>
            <p className="mt-2 text-slate-500">/care-social 에서 요청을 만들어보세요.</p>
          </div>
        ) : (
          cases.map((caseItem) => {
            const matchedPrograms = caseItem.recommended_program_codes
              .map((code) => programMap.get(code))
              .filter(Boolean) as SocialSupportProgram[]

            const caseVouchers = vouchers.filter((voucher) => voucher.social_support_case_id === caseItem.id)

            return (
              <article key={caseItem.id} className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge text={labelSocialCaseStatus(caseItem.status)} />
                      <Badge text={caseItem.priority} />
                      <Badge text={labelLivingSituation(caseItem.living_situation)} />
                      {caseItem.cost_burden ? <Badge text="비용 부담" /> : null}
                      {caseItem.meal_risk ? <Badge text="식사 위험" /> : null}
                      {caseItem.no_family_nearby ? <Badge text="가족 부재" /> : null}
                    </div>

                    <h3 className="mt-3 text-3xl font-black">{caseItem.elder_name} 사회공헌 지원 요청</h3>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {caseItem.need_types.map((need) => (
                        <span key={need} className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-900">
                          {labelSocialNeed(need)}
                        </span>
                      ))}
                    </div>

                    {caseItem.memo ? (
                      <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                        {caseItem.memo}
                      </p>
                    ) : null}

                    {matchedPrograms.length > 0 ? (
                      <div className="mt-5 rounded-2xl bg-blue-50 p-4">
                        <h4 className="font-black text-blue-950">추천 연결</h4>
                        <div className="mt-3 space-y-2">
                          {matchedPrograms.map((program) => (
                            <div key={program.program_code} className="rounded-2xl bg-white p-3">
                              <div className="font-black">{program.title}</div>
                              <p className="mt-1 text-sm leading-6 text-slate-600">{program.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {caseVouchers.length > 0 ? (
                      <div className="mt-5 rounded-2xl bg-emerald-50 p-4">
                        <h4 className="font-black text-emerald-950">후원 쿠폰</h4>
                        <div className="mt-3 space-y-2">
                          {caseVouchers.map((voucher) => (
                            <div key={voucher.id} className="rounded-2xl bg-white p-3">
                              <div className="font-black">{voucher.title}</div>
                              <p className="mt-1 text-sm leading-6 text-slate-600">
                                {voucher.value_label} · {voucher.status} · {voucher.voucher_code}
                              </p>
                              {mode === 'ops' ? (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <button onClick={() => updateVoucher(voucher.id, 'reserved')} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-black">
                                    예약
                                  </button>
                                  <button onClick={() => updateVoucher(voucher.id, 'used')} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-black text-white">
                                    사용 완료
                                  </button>
                                  <button onClick={() => updateVoucher(voucher.id, 'cancelled')} className="rounded-xl bg-red-50 px-3 py-2 text-sm font-black text-red-700">
                                    취소
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="grid min-w-[190px] gap-2">
                    {mode === 'ops' ? (
                      <>
                        <button onClick={() => updateCase(caseItem.id, 'reviewing')} className="rounded-2xl bg-slate-100 px-4 py-3 font-black">
                          검토 중
                        </button>
                        <button onClick={() => updateCase(caseItem.id, 'eligible')} className="rounded-2xl bg-blue-100 px-4 py-3 font-black text-blue-900">
                          지원 가능
                        </button>
                        <button onClick={() => updateCase(caseItem.id, 'voucher_issued')} className="rounded-2xl bg-emerald-600 px-4 py-3 font-black text-white">
                          후원 쿠폰 발급
                        </button>
                        <button onClick={() => updateCase(caseItem.id, 'connected')} className="rounded-2xl bg-slate-900 px-4 py-3 font-black text-white">
                          연결 완료
                        </button>
                        <button onClick={() => updateCase(caseItem.id, 'not_eligible')} className="rounded-2xl bg-amber-50 px-4 py-3 font-black text-amber-800">
                          지원 어려움
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => updateCase(caseItem.id, 'closed')} className="rounded-2xl bg-emerald-600 px-4 py-3 font-black text-white">
                          확인했어요
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            )
          })
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
