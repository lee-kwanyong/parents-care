'use client'

import { FormEvent, useState } from 'react'
import { MealCareBoard } from '@/components/MealCareBoard'
import { AppFrame } from '@/components/ui/AppFrame'
import { CareButton } from '@/components/ui/CareButton'
import { CareCard } from '@/components/ui/CareCard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { StatusPill } from '@/components/ui/StatusPill'

const supportOptions = [
  {
    code: 'check_only',
    title: '식사 확인만 하기',
    desc: '드셨는지 못 드셨는지만 가족이 확인합니다.',
    emoji: '✅'
  },
  {
    code: 'regular_delivery',
    title: '안심밥상 정기배송',
    desc: '도시락, 반찬, 죽, 부드러운 식사를 연결합니다.',
    emoji: '🍱'
  },
  {
    code: 'recovery_7days',
    title: '퇴원 후 회복식 7일',
    desc: '퇴원 직후 식사와 식사 여부를 7일 동안 확인합니다.',
    emoji: '🏠'
  },
  {
    code: 'diet_consult',
    title: '식단 상담',
    desc: '저염식, 당뇨식, 연화식, 죽 조건을 정리합니다.',
    emoji: '🥣'
  },
  {
    code: 'social_support',
    title: '공공·후원 식사 연결',
    desc: '비용 부담이나 결식 우려가 있으면 지원을 검토합니다.',
    emoji: '🤝'
  }
]

const dietOptions = [
  ['unknown', '잘 모르겠어요'],
  ['normal', '일반식'],
  ['soft_food', '씹기 쉬운 음식'],
  ['porridge', '죽·부드러운 식사'],
  ['low_sodium', '저염식'],
  ['diabetes_friendly', '당뇨식'],
  ['post_discharge_recovery', '퇴원 후 회복식']
]

const mealTimeOptions = [
  ['breakfast', '아침'],
  ['lunch', '점심'],
  ['dinner', '저녁'],
  ['snack', '간식']
]

export default function CareMealsPage() {
  const [elderName, setElderName] = useState('어머니')
  const [guardianName, setGuardianName] = useState('')
  const [guardianPhone, setGuardianPhone] = useState('')
  const [supportType, setSupportType] = useState('check_only')
  const [dietType, setDietType] = useState('unknown')
  const [mealTimes, setMealTimes] = useState<string[]>(['lunch'])
  const [startDate, setStartDate] = useState('')
  const [durationDays, setDurationDays] = useState('7')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryNote, setDeliveryNote] = useState('')
  const [socialCareRequested, setSocialCareRequested] = useState(false)
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  function toggleMealTime(time: string) {
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
      setMemo('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '안심밥상 요청 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppFrame title="안심밥상" subtitle="식사를 못 챙겨 드시는 걱정을 줄입니다" backHref="/child">
      <SectionHeader
        eyebrow="안심밥상·식사 케어"
        title={
          <>
            식사를 못 챙겨
            <br />
            드시는 걱정부터.
          </>
        }
        description="식사 확인만 해도 되고, 필요하면 정기배송, 퇴원 후 회복식, 저염식, 연화식, 당뇨식, 공공·후원 식사 연결까지 운영실이 정리합니다."
      />

      <form onSubmit={submit} className="mt-8 space-y-6">
        <CareCard tone="white">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill text="1단계" tone="green" />
            <StatusPill text="도움 선택" tone="slate" />
          </div>

          <h2 className="mt-4 text-3xl font-black">어떤 식사 도움이 필요하세요?</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {supportOptions.map((option) => (
              <button
                key={option.code}
                type="button"
                onClick={() => setSupportType(option.code)}
                className={
                  'rounded-3xl border p-5 text-left transition ' +
                  (supportType === option.code
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 bg-slate-50 hover:bg-white')
                }
              >
                <div className="text-4xl">{option.emoji}</div>
                <div className="mt-3 text-xl font-black">{option.title}</div>
                <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{option.desc}</p>
              </button>
            ))}
          </div>
        </CareCard>

        <CareCard tone="white">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill text="2단계" tone="green" />
            <StatusPill text="식사 조건" tone="slate" />
          </div>

          <h2 className="mt-4 text-3xl font-black">어떤 식사가 좋을까요?</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {dietOptions.map(([code, label]) => (
              <button
                key={code}
                type="button"
                onClick={() => setDietType(code)}
                className={
                  'rounded-3xl border p-4 text-left text-lg font-black transition ' +
                  (dietType === code
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 bg-slate-50 hover:bg-white')
                }
              >
                {label}
              </button>
            ))}
          </div>

          <h3 className="mt-6 text-xl font-black">확인할 식사 시간</h3>

          <div className="mt-3 grid gap-3 md:grid-cols-4">
            {mealTimeOptions.map(([code, label]) => (
              <button
                key={code}
                type="button"
                onClick={() => toggleMealTime(code)}
                className={
                  'rounded-3xl border p-4 text-left text-lg font-black transition ' +
                  (mealTimes.includes(code)
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 bg-slate-50 hover:bg-white')
                }
              >
                {label}
              </button>
            ))}
          </div>
        </CareCard>

        <CareCard tone="white">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill text="3단계" tone="green" />
            <StatusPill text="기본 정보" tone="slate" />
          </div>

          <h2 className="mt-4 text-3xl font-black">연락과 배송 정보를 남겨주세요</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <input value={elderName} onChange={(event) => setElderName(event.target.value)} className="tap-target rounded-2xl border border-slate-200 p-4" placeholder="부모님" />
            <input value={guardianName} onChange={(event) => setGuardianName(event.target.value)} className="tap-target rounded-2xl border border-slate-200 p-4" placeholder="보호자 이름" />
            <input value={guardianPhone} onChange={(event) => setGuardianPhone(event.target.value)} className="tap-target rounded-2xl border border-slate-200 p-4" placeholder="010-1234-5678" />
            <input value={startDate} onChange={(event) => setStartDate(event.target.value)} type="date" className="tap-target rounded-2xl border border-slate-200 p-4" />
            <input value={durationDays} onChange={(event) => setDurationDays(event.target.value)} inputMode="numeric" className="tap-target rounded-2xl border border-slate-200 p-4" placeholder="며칠 동안 확인할까요?" />
            <input value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} className="tap-target rounded-2xl border border-slate-200 p-4" placeholder="배송 주소" />
          </div>

          <input value={deliveryNote} onChange={(event) => setDeliveryNote(event.target.value)} className="mt-3 tap-target w-full rounded-2xl border border-slate-200 p-4" placeholder="배송 메모. 예: 전화 후 전달" />

          <label className="mt-5 flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
            <input type="checkbox" checked={socialCareRequested} onChange={(event) => setSocialCareRequested(event.target.checked)} className="mt-1 h-5 w-5" />
            <span className="text-sm font-bold leading-6 text-slate-700">
              비용 부담이 있으면 공공지원·후원 도시락·지역 복지 연결도 함께 안내받고 싶습니다.
            </span>
          </label>

          <textarea
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            rows={4}
            className="mt-5 w-full rounded-2xl border border-slate-200 p-4 leading-7"
            placeholder="예: 퇴원 후 입맛이 없고 딱딱한 음식은 어려워하세요."
          />
        </CareCard>

        {message ? (
          <CareCard tone="green">
            <p className="text-lg font-black">{message}</p>
          </CareCard>
        ) : null}

        <CareButton type="submit" disabled={saving} size="xl" className="md:w-full">
          {saving ? '저장 중...' : '안심밥상 요청하기'}
        </CareButton>
      </form>

      <section className="mt-10">
        <MealCareBoard mode="family" />
      </section>
    </AppFrame>
  )
}
