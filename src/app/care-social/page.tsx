'use client'

import { FormEvent, useState } from 'react'
import { SocialCareBoard } from '@/components/SocialCareBoard'
import {
  livingSituationOptions,
  socialNeedOptions,
  type LivingSituation,
  type SocialNeedType,
  type SocialUrgency
} from '@/lib/social-care-engine'

export default function CareSocialPage() {
  const [elderName, setElderName] = useState('어머니')
  const [guardianName, setGuardianName] = useState('')
  const [guardianPhone, setGuardianPhone] = useState('')
  const [needTypes, setNeedTypes] = useState<SocialNeedType[]>(['cost_burden'])
  const [urgency, setUrgency] = useState<SocialUrgency>('normal')
  const [livingSituation, setLivingSituation] = useState<LivingSituation>('unknown')
  const [costBurden, setCostBurden] = useState(true)
  const [mealRisk, setMealRisk] = useState(false)
  const [medicationRisk, setMedicationRisk] = useState(false)
  const [postDischargeRisk, setPostDischargeRisk] = useState(false)
  const [noFamilyNearby, setNoFamilyNearby] = useState(false)
  const [preferredContact, setPreferredContact] = useState('phone')
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  function toggleNeed(type: SocialNeedType) {
    setNeedTypes((current) => {
      if (type === 'not_sure') return ['not_sure']
      const withoutNotSure = current.filter((item) => item !== 'not_sure')
      return withoutNotSure.includes(type)
        ? withoutNotSure.filter((item) => item !== type)
        : [...withoutNotSure, type]
    })
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const response = await fetch('/api/social-care', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elderName,
          guardianName,
          guardianPhone,
          needTypes,
          urgency,
          livingSituation,
          costBurden,
          mealRisk,
          medicationRisk,
          postDischargeRisk,
          noFamilyNearby,
          preferredContact,
          memo
        })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '사회공헌 요청 중 오류가 발생했습니다.')
      }

      setMessage('사회공헌·공공지원 검토 요청이 접수됐습니다.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '사회공헌 요청 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-[#2E504D]">
      <section className="mx-auto max-w-6xl">
        <p className="text-sm font-black text-emerald-700">사회공헌·공공지원 연결</p>
        <h1 className="mt-2 text-3xl font-black md:text-5xl">
          비용이나 돌봄 공백이
          <br />
          걱정될 때도 맡길 수 있어야 합니다.
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-[#63807C]">
          비용 부담, 결식 우려, 가족 부재, 독거, 퇴원 후 돌봄 공백이 있으면
          운영실이 공공지원·후원 쿠폰·지역 복지·식사 지원 연결 가능성을 확인합니다.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-6">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">1. 어떤 도움이 필요하세요?</h2>
            <p className="mt-2 text-[#63807C]">
              정확히 몰라도 괜찮습니다. 가장 비슷한 항목만 골라주세요.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {socialNeedOptions.map((option) => (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => toggleNeed(option.code)}
                  className={
                    'rounded-2xl border p-4 text-left transition ' +
                    (needTypes.includes(option.code)
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-[#E0EFEC] bg-white hover:bg-slate-50')
                  }
                >
                  <div className="text-lg font-black">{option.label}</div>
                  <p className="mt-2 text-sm leading-6 text-[#63807C]">{option.description}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">2. 부모님 상황</h2>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <label>
                <span className="mb-2 block text-sm font-black text-[#4E6D69]">부모님</span>
                <input
                  value={elderName}
                  onChange={(event) => setElderName(event.target.value)}
                  className="w-full rounded-2xl border border-[#E0EFEC] p-4 outline-none focus:border-emerald-500"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-black text-[#4E6D69]">보호자 이름</span>
                <input
                  value={guardianName}
                  onChange={(event) => setGuardianName(event.target.value)}
                  className="w-full rounded-2xl border border-[#E0EFEC] p-4 outline-none focus:border-emerald-500"
                  placeholder="예: 홍길동"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-black text-[#4E6D69]">보호자 연락처</span>
                <input
                  value={guardianPhone}
                  onChange={(event) => setGuardianPhone(event.target.value)}
                  className="w-full rounded-2xl border border-[#E0EFEC] p-4 outline-none focus:border-emerald-500"
                  placeholder="010-1234-5678"
                />
              </label>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <label>
                <span className="mb-2 block text-sm font-black text-[#4E6D69]">생활 상황</span>
                <select
                  value={livingSituation}
                  onChange={(event) => setLivingSituation(event.target.value as LivingSituation)}
                  className="w-full rounded-2xl border border-[#E0EFEC] p-4 outline-none focus:border-emerald-500"
                >
                  {livingSituationOptions.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-2 block text-sm font-black text-[#4E6D69]">긴급도</span>
                <select
                  value={urgency}
                  onChange={(event) => setUrgency(event.target.value as SocialUrgency)}
                  className="w-full rounded-2xl border border-[#E0EFEC] p-4 outline-none focus:border-emerald-500"
                >
                  <option value="low">낮음</option>
                  <option value="normal">보통</option>
                  <option value="high">높음</option>
                  <option value="urgent">긴급</option>
                </select>
              </label>

              <label>
                <span className="mb-2 block text-sm font-black text-[#4E6D69]">연락 방식</span>
                <select
                  value={preferredContact}
                  onChange={(event) => setPreferredContact(event.target.value)}
                  className="w-full rounded-2xl border border-[#E0EFEC] p-4 outline-none focus:border-emerald-500"
                >
                  <option value="phone">전화</option>
                  <option value="kakao">카톡</option>
                  <option value="app">앱</option>
                  <option value="ops">운영실 확인</option>
                </select>
              </label>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {[
                {
                  checked: costBurden,
                  set: setCostBurden,
                  title: '비용 부담이 있어요',
                  desc: '공공지원·후원 쿠폰 검토'
                },
                {
                  checked: mealRisk,
                  set: setMealRisk,
                  title: '식사 공백이 걱정돼요',
                  desc: '도시락·밑반찬·회복식 연결 검토'
                },
                {
                  checked: medicationRisk,
                  set: setMedicationRisk,
                  title: '약을 잘 못 챙기실까 걱정돼요',
                  desc: '복약 확인·가족 할 일 연결'
                },
                {
                  checked: postDischargeRisk,
                  set: setPostDischargeRisk,
                  title: '퇴원 후가 걱정돼요',
                  desc: '퇴원 후 7일 안심팩 연결'
                },
                {
                  checked: noFamilyNearby,
                  set: setNoFamilyNearby,
                  title: '가까운 가족이 없어요',
                  desc: '안부 확인·지역기관 연결 검토'
                }
              ].map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => item.set(!item.checked)}
                  className={
                    'rounded-2xl border p-4 text-left transition ' +
                    (item.checked ? 'border-emerald-500 bg-emerald-50' : 'border-[#E0EFEC] bg-white')
                  }
                >
                  <div className="text-lg font-black">{item.title}</div>
                  <p className="mt-2 text-sm leading-6 text-[#63807C]">{item.desc}</p>
                </button>
              ))}
            </div>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-black text-[#4E6D69]">상황 메모</span>
              <textarea
                value={memo}
                onChange={(event) => setMemo(event.target.value)}
                rows={5}
                className="w-full rounded-2xl border border-[#E0EFEC] p-4 leading-7 outline-none focus:border-emerald-500"
                placeholder="예: 어머니가 혼자 계시고 식사를 자주 거르세요. 병원비와 도시락 비용도 부담됩니다. 어떤 지원이 가능한지 잘 모르겠습니다."
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
            className="w-full rounded-3xl bg-[#8CCFC3] px-6 py-6 text-2xl font-black text-[#2E504D] disabled:opacity-50"
          >
            {saving ? '접수 중...' : '사회공헌 지원 검토 요청'}
          </button>
        </form>

        <section className="mt-10">
          <SocialCareBoard mode="family" />
        </section>
      </section>
    </main>
  )
}
