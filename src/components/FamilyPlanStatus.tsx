'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type SimpleCarePlan = {
  reassuranceState: '안심' | '확인 필요' | '긴급'
  title: string
  oneMinuteSummary: string
  primaryActions: string[]
  familyQuestions: string[]
  careBundles: Array<{
    code: string
    title: string
    description: string
    visibleToFamily: boolean
  }>
  easyModeRules: string[]
  elderFriendlyCopy: string[]
  socialCareNote?: string
  nextContactScript: string
  passportApplied?: boolean
  passportElderName?: string
  passportSafetyNotes?: string[]
  passportFamilyQuestions?: string[]
  passportManagerTips?: string[]
}

type StatusResponse = {
  ok: boolean
  message?: string
  planReady?: boolean
  passportApplied?: boolean
  intake?: {
    id: string
    ops_status: string
    contact_name?: string | null
    contact_phone?: string | null
    raw_text?: string | null
    created_at?: string
  }
  plan?: SimpleCarePlan
}

export function FamilyPlanStatus({ intakeId }: { intakeId: string }) {
  const [data, setData] = useState<StatusResponse | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const response = await fetch('/api/intake/status?id=' + encodeURIComponent(intakeId), { cache: 'no-store' })
      const result = await response.json()
      setData(result)
    } catch (error) {
      setData({ ok: false, message: error instanceof Error ? error.message : '불러오지 못했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [intakeId])

  const plan = data?.plan
  const passportSafetyNotes = plan?.passportSafetyNotes || []
  const passportManagerTips = plan?.passportManagerTips || []

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900">
      <section className="mx-auto max-w-4xl">
        <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
          <p className="text-sm font-black text-emerald-700">가족용 간편 케어플랜</p>
          <h1 className="mt-3 text-3xl font-black md:text-5xl">
            부모님 걱정 처리 상태
          </h1>
          <p className="mt-4 break-all text-sm text-slate-500">접수번호: {intakeId}</p>

          {loading ? (
            <div className="mt-8 rounded-3xl bg-slate-50 p-8 text-center text-xl font-black">불러오는 중...</div>
          ) : !data?.ok || !plan ? (
            <div className="mt-8 rounded-3xl bg-red-50 p-6">
              <h2 className="text-xl font-black text-red-700">정보를 불러오지 못했습니다</h2>
              <p className="mt-2 text-red-700">{data?.message || '잠시 후 다시 확인해주세요.'}</p>
            </div>
          ) : (
            <>
              <div
                className={
                  'mt-8 rounded-3xl p-6 ' +
                  (plan.reassuranceState === '안심'
                    ? 'bg-emerald-50'
                    : plan.reassuranceState === '긴급'
                      ? 'bg-red-50'
                      : 'bg-amber-50')
                }
              >
                <p className="text-sm font-black text-slate-600">오늘의 안심판</p>
                <div className="mt-2 text-5xl font-black">{plan.reassuranceState}</div>
                <h2 className="mt-5 text-2xl font-black">{plan.title}</h2>
                <p className="mt-3 text-lg leading-8 text-slate-700">{plan.oneMinuteSummary}</p>

                {plan.passportApplied ? (
                  <p className="mt-4 rounded-2xl bg-white p-4 text-sm font-bold text-slate-700">
                    부모님 상태 정보가 케어플랜에 반영됐습니다.
                    {plan.passportElderName ? ` 대상: ${plan.passportElderName}` : ''}
                  </p>
                ) : (
                  <p className="mt-4 rounded-2xl bg-white p-4 text-sm font-bold text-slate-700">
                    부모님 상태 등록을 하면 청력, 통증, 알러지, 복용약 정보가 플랜에 자동 반영됩니다.
                  </p>
                )}

                {!data.planReady ? (
                  <p className="mt-4 rounded-2xl bg-white p-4 text-sm font-bold text-slate-700">
                    운영실이 아직 확정하지 않은 자동 추천 플랜입니다. 확정 후 안내 문구가 더 정확해집니다.
                  </p>
                ) : null}
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <section className="rounded-3xl bg-white p-6 shadow-sm">
                  <h2 className="text-2xl font-black">가족이 할 일 3개</h2>
                  <div className="mt-4 space-y-3">
                    {plan.primaryActions.slice(0, 3).map((action, index) => (
                      <div key={action} className="rounded-2xl bg-slate-50 p-4 text-lg font-black">
                        {index + 1}. {action}
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-3xl bg-white p-6 shadow-sm">
                  <h2 className="text-2xl font-black">확인 질문 3개</h2>
                  <div className="mt-4 space-y-3">
                    {plan.familyQuestions.slice(0, 3).map((question, index) => (
                      <div key={question} className="rounded-2xl bg-slate-50 p-4 text-lg font-black">
                        {index + 1}. {question}
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-black">부모님 상태 반영</h2>
                {passportSafetyNotes.length > 0 ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {passportSafetyNotes.slice(0, 6).map((note) => (
                      <div key={note} className="rounded-2xl bg-blue-50 p-4 font-bold text-blue-950">
                        {note}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 rounded-2xl bg-slate-50 p-4 text-slate-600">
                    아직 반영된 부모님 상태 정보가 없습니다.
                  </p>
                )}
              </section>

              <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-black">포함된 케어</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {plan.careBundles.filter((bundle) => bundle.visibleToFamily).map((bundle) => (
                    <div key={bundle.code} className="rounded-2xl border border-slate-200 p-4">
                      <div className="text-lg font-black">{bundle.title}</div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{bundle.description}</p>
                    </div>
                  ))}
                </div>
              </section>

              {plan.socialCareNote ? (
                <section className="mt-6 rounded-3xl bg-blue-50 p-6">
                  <h2 className="text-2xl font-black text-blue-900">사회공헌 연결</h2>
                  <p className="mt-3 text-lg leading-8 text-blue-900">{plan.socialCareNote}</p>
                </section>
              ) : null}

              <section className="mt-6 rounded-3xl bg-slate-900 p-6 text-white">
                <h2 className="text-2xl font-black">운영실 안내 문구</h2>
                <p className="mt-3 text-lg leading-8 text-slate-200">{plan.nextContactScript}</p>

                {passportManagerTips.length > 0 ? (
                  <div className="mt-5 rounded-2xl bg-white/10 p-4">
                    <h3 className="font-black text-emerald-200">매니저 현장 주의사항</h3>
                    <div className="mt-3 space-y-2">
                      {passportManagerTips.slice(0, 5).map((tip, index) => (
                        <p key={tip} className="text-sm leading-6 text-slate-100">
                          {index + 1}. {tip}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>
            </>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={load} className="rounded-2xl bg-slate-900 px-5 py-4 font-black text-white">
              다시 확인
            </button>
            <Link href="/care-passport" className="rounded-2xl bg-blue-600 px-5 py-4 font-black text-white">
              부모님 상태 등록
            </Link>
            <Link href="/care-request" className="rounded-2xl bg-emerald-600 px-5 py-4 font-black text-white">
              또 다른 걱정 접수
            </Link>
            <Link href="/" className="rounded-2xl bg-slate-100 px-5 py-4 font-black">
              홈으로
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
