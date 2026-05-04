
'use client'

import { FormEvent, useMemo, useState } from 'react'
import { normalizeWorry, recommendCarePack, worryOptions, type WorryType, type IntakeChannel } from '@/lib/worry-care-engine'

const channelOptions: Array<{ code: IntakeChannel; label: string; desc: string }> = [
  { code: 'phone', label: '전화로 답변', desc: '가장 쉬운 방식' },
  { code: 'kakao', label: '카톡으로 답변', desc: '카톡이 편한 보호자' },
  { code: 'photo', label: '사진으로 맡김', desc: '예약 문자·서류 사진' },
  { code: 'simple_form', label: '앱에서 확인', desc: '앱 화면으로 확인' }
]

export default function CareRequestPage() {
  const [worry, setWorry] = useState<WorryType>('not_sure')
  const [memo, setMemo] = useState('')
  const [channel, setChannel] = useState<IntakeChannel>('phone')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [socialCareRequested, setSocialCareRequested] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const recommendation = useMemo(() => {
    return recommendCarePack(normalizeWorry(worry), memo)
  }, [worry, memo])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/intake/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ worry, memo, channel, contactName, contactPhone, socialCareRequested })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '접수 중 오류가 발생했습니다.')
      }

      const params = new URLSearchParams()
      params.set('pack', data.recommendedPackCode || recommendation.packCode)
      params.set('intake', data.intakeId || '')
      if (data.demo) params.set('demo', '1')

      window.location.href = '/care-request/thanks?' + params.toString()
    } catch (err) {
      setError(err instanceof Error ? err.message : '접수 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900">
      <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="mb-3 text-sm font-black text-care-700">부모님 걱정 접수센터</p>
          <h1 className="text-3xl font-black tracking-tight md:text-5xl">
            무엇이 걱정되세요?
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            기능을 찾지 않아도 됩니다. 걱정을 누르면 운영실이 필요한 케어팩으로 정리합니다.
            로그인은 배포 직전에 연결하고, 지금은 간편 접수를 먼저 완성합니다.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-6">
            <section className="rounded-3xl bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black">1. 걱정 선택</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {worryOptions.map((option) => (
                  <button
                    type="button"
                    key={option.code}
                    onClick={() => setWorry(option.code)}
                    className={
                      'rounded-3xl border p-4 text-left transition ' +
                      (worry === option.code
                        ? 'border-care-500 bg-care-50 ring-2 ring-care-100'
                        : 'border-slate-200 bg-white hover:bg-slate-50')
                    }
                  >
                    <div className="text-2xl">{option.emoji}</div>
                    <div className="mt-2 text-lg font-black">{option.label}</div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{option.description}</p>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black">2. 상황을 짧게 알려주세요</h2>
              <textarea
                value={memo}
                onChange={(event) => setMemo(event.target.value)}
                required
                rows={6}
                className="mt-4 w-full rounded-3xl border border-slate-200 p-5 text-lg leading-8 outline-none focus:border-care-500"
                placeholder="예: 어머니가 다음 주 정형외과 진료가 있는데 저는 못 갑니다. 무릎이 안 좋고, 약이랑 보험서류도 챙겨야 해요."
              />
              <p className="mt-2 text-sm text-slate-500">
                길게 쓰지 않아도 됩니다. 사진·카톡·전화 접수는 다음 단계에서 붙입니다.
              </p>
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black">3. 답변 받을 방법</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {channelOptions.map((option) => (
                  <button
                    type="button"
                    key={option.code}
                    onClick={() => setChannel(option.code)}
                    className={
                      'rounded-2xl border p-4 text-left ' +
                      (channel === option.code ? 'border-care-500 bg-care-50' : 'border-slate-200 bg-white')
                    }
                  >
                    <div className="font-black">{option.label}</div>
                    <div className="mt-1 text-sm text-slate-500">{option.desc}</div>
                  </button>
                ))}
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-black text-slate-700">보호자 이름</span>
                  <input
                    value={contactName}
                    onChange={(event) => setContactName(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-care-500"
                    placeholder="예: 이관용"
                  />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-black text-slate-700">연락처</span>
                  <input
                    value={contactPhone}
                    onChange={(event) => setContactPhone(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-care-500"
                    placeholder="예: 010-1234-5678"
                  />
                </label>
              </div>

              <label className="mt-5 flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                <input
                  type="checkbox"
                  checked={socialCareRequested}
                  onChange={(event) => setSocialCareRequested(event.target.checked)}
                  className="mt-1 h-5 w-5"
                />
                <span className="text-sm leading-6 text-slate-700">
                  비용 부담이 있으면 공공지원·후원 쿠폰·지역 복지 연결도 함께 안내받고 싶습니다.
                </span>
              </label>
            </section>

            {error ? (
              <p className="rounded-2xl bg-red-50 p-4 font-bold text-red-700">{error}</p>
            ) : null}

            <button
              disabled={submitting}
              className="w-full rounded-3xl bg-care-600 px-6 py-5 text-xl font-black text-white disabled:opacity-50"
            >
              {submitting ? '접수 중...' : '부모님 걱정 맡기기'}
            </button>
          </form>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-sm">
            <p className="text-sm font-black text-care-200">추천 케어팩</p>
            <h2 className="mt-3 text-3xl font-black">{recommendation.title}</h2>
            <p className="mt-4 text-lg leading-8 text-slate-200">{recommendation.oneLine}</p>

            <div className="mt-6 rounded-2xl bg-white/10 p-4">
              <div className="text-sm font-black text-care-100">진행 흐름</div>
              <ol className="mt-3 space-y-2 text-sm leading-6 text-slate-100">
                {recommendation.steps.map((step, index) => (
                  <li key={step}>
                    {index + 1}. {step}
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-4 rounded-2xl bg-white/10 p-4">
              <div className="text-sm font-black text-care-100">가족이 준비하면 좋은 것</div>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-100">
                {recommendation.familyNextActions.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>

            {recommendation.socialCareHint ? (
              <p className="mt-4 rounded-2xl bg-care-200 p-4 text-sm font-bold leading-6 text-slate-950">
                {recommendation.socialCareHint}
              </p>
            ) : null}
          </div>
        </aside>
      </section>
    </main>
  )
}
