'use client'

import { FormEvent, useState } from 'react'
import { MealCareBoard } from '@/components/MealCareBoard'
import {
  mealDietOptions,
  mealSupportOptions,
  mealTimeOptions,
  type MealDietType,
  type MealSupportType,
  type MealTime
} from '@/lib/meal-care-engine'

export default function CareMealsPage() {
  const [elderName, setElderName] = useState('어머니')
  const [guardianName, setGuardianName] = useState('')
  const [guardianPhone, setGuardianPhone] = useState('')
  const [supportType, setSupportType] = useState<MealSupportType>('check_only')
  const [dietType, setDietType] = useState<MealDietType>('unknown')
  const [mealTimes, setMealTimes] = useState<MealTime[]>(['lunch'])
  const [startDate, setStartDate] = useState('')
  const [durationDays, setDurationDays] = useState('7')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryNote, setDeliveryNote] = useState('')
  const [socialCareRequested, setSocialCareRequested] = useState(false)
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  function toggleMealTime(time: MealTime) {
    setMealTimes((current) => {
      if (current.includes(time)) {
        const next = current.filter((item) => item !== time)
        return next.length > 0 ? next : ['lunch']
      }

      return [...current, time]
    })
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const response = await fetch('/api/meal-care', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elderName,
          guardianName,
          guardianPhone,
          supportType,
          dietType,
          mealTimes,
          startDate,
          durationDays,
          deliveryAddress,
          deliveryNote,
          socialCareRequested,
          memo
        })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '안심밥상 요청 중 오류가 발생했습니다.')
      }

      setMessage(`안심밥상 요청과 식사 체크 ${data.events?.length || 0}개가 만들어졌습니다.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '안심밥상 요청 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900">
      <section className="mx-auto max-w-6xl">
        <p className="text-sm font-black text-emerald-700">안심밥상·식사 케어</p>
        <h1 className="mt-2 text-3xl font-black md:text-5xl">
          식사를 못 챙겨 드시는
          <br />
          걱정을 줄입니다.
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
          식사 확인만 해도 되고, 필요하면 정기배송, 퇴원 후 회복식, 저염식, 연화식, 당뇨식,
          공공·후원 식사 연결까지 운영실이 정리합니다.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-6">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">1. 어떤 식사 도움이 필요하세요?</h2>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {mealSupportOptions.map((option) => (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => setSupportType(option.code)}
                  className={
                    'rounded-2xl border p-4 text-left transition ' +
                    (supportType === option.code
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 bg-white hover:bg-slate-50')
                  }
                >
                  <div className="text-lg font-black">{option.label}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{option.description}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">2. 식사 조건</h2>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {mealDietOptions.map((option) => (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => setDietType(option.code)}
                  className={
                    'rounded-2xl border p-4 text-left transition ' +
                    (dietType === option.code
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 bg-white hover:bg-slate-50')
                  }
                >
                  <div className="text-lg font-black">{option.label}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{option.description}</p>
                </button>
              ))}
            </div>

            <div className="mt-5">
              <h3 className="text-lg font-black">확인할 식사 시간</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-4">
                {mealTimeOptions.map((option) => (
                  <button
                    key={option.code}
                    type="button"
                    onClick={() => toggleMealTime(option.code)}
                    className={
                      'rounded-2xl border p-4 font-black transition ' +
                      (mealTimes.includes(option.code)
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 bg-white hover:bg-slate-50')
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">3. 기본 정보</h2>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <label>
                <span className="mb-2 block text-sm font-black text-slate-700">부모님</span>
                <input
                  value={elderName}
                  onChange={(event) => setElderName(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-emerald-500"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-black text-slate-700">보호자 이름</span>
                <input
                  value={guardianName}
                  onChange={(event) => setGuardianName(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-emerald-500"
                  placeholder="예: 이관용"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-black text-slate-700">보호자 연락처</span>
                <input
                  value={guardianPhone}
                  onChange={(event) => setGuardianPhone(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-emerald-500"
                  placeholder="010-1234-5678"
                />
              </label>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <label>
                <span className="mb-2 block text-sm font-black text-slate-700">시작일</span>
                <input
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  type="date"
                  className="w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-emerald-500"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-black text-slate-700">며칠 동안 확인할까요?</span>
                <input
                  value={durationDays}
                  onChange={(event) => setDurationDays(event.target.value)}
                  inputMode="numeric"
                  className="w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-emerald-500"
                  placeholder="예: 7"
                />
              </label>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <label>
                <span className="mb-2 block text-sm font-black text-slate-700">배송 주소</span>
                <input
                  value={deliveryAddress}
                  onChange={(event) => setDeliveryAddress(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-emerald-500"
                  placeholder="배송 연결 시 입력"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-black text-slate-700">배송 메모</span>
                <input
                  value={deliveryNote}
                  onChange={(event) => setDeliveryNote(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-emerald-500"
                  placeholder="예: 문 앞에 두지 말고 전화 후 전달"
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
                비용 부담이 있으면 공공지원·후원 도시락·지역 복지 연결도 함께 안내받고 싶습니다.
              </span>
            </label>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-black text-slate-700">메모</span>
              <textarea
                value={memo}
                onChange={(event) => setMemo(event.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-slate-200 p-4 leading-7 outline-none focus:border-emerald-500"
                placeholder="예: 퇴원 후 입맛이 없고 딱딱한 음식은 어려워하세요. 죽이나 부드러운 반찬이 좋습니다."
              />
            </label>
          </section>

          {message ? (
            <p className="rounded-2xl bg-emerald-50 p-4 text-lg font-black text-emerald-900">
              {message}
            </p>
          ) : null}

          <button
            disabled={saving}
            className="w-full rounded-3xl bg-emerald-600 px-6 py-6 text-2xl font-black text-white disabled:opacity-50"
          >
            {saving ? '저장 중...' : '안심밥상 요청하기'}
          </button>
        </form>

        <section className="mt-10">
          <MealCareBoard mode="family" />
        </section>
      </section>
    </main>
  )
}
