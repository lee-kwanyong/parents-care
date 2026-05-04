'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  bodyConditionOptions,
  buildCarePassportSummary,
  dietNeedOptions,
  type AllergyStatus,
  type FallRiskLevel
} from '@/lib/care-passport-engine'

type SavedPassport = {
  id: string
  elder_name: string
  care_summary: any
  updated_at: string
}

export default function CarePassportPage() {
  const [elderName, setElderName] = useState('')
  const [guardianName, setGuardianName] = useState('')
  const [guardianPhone, setGuardianPhone] = useState('')
  const [bodyConditions, setBodyConditions] = useState<string[]>([])
  const [allergyStatus, setAllergyStatus] = useState<AllergyStatus>('unknown')
  const [allergyMemo, setAllergyMemo] = useState('')
  const [medicationsMemo, setMedicationsMemo] = useState('')
  const [dietNeeds, setDietNeeds] = useState<string[]>([])
  const [communicationNotes, setCommunicationNotes] = useState('')
  const [emergencyNotes, setEmergencyNotes] = useState('')
  const [fallRiskLevel, setFallRiskLevel] = useState<FallRiskLevel>('unknown')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [saved, setSaved] = useState<SavedPassport | null>(null)

  const summary = useMemo(() => {
    return buildCarePassportSummary({
      elderName,
      guardianName,
      guardianPhone,
      bodyConditions,
      allergyStatus,
      allergyMemo,
      medicationsMemo,
      dietNeeds,
      communicationNotes,
      emergencyNotes,
      fallRiskLevel
    })
  }, [
    elderName,
    guardianName,
    guardianPhone,
    bodyConditions,
    allergyStatus,
    allergyMemo,
    medicationsMemo,
    dietNeeds,
    communicationNotes,
    emergencyNotes,
    fallRiskLevel
  ])

  function toggleBody(code: string) {
    setBodyConditions((current) =>
      current.includes(code) ? current.filter((item) => item !== code) : [...current, code]
    )
  }

  function toggleDiet(code: string) {
    setDietNeeds((current) =>
      current.includes(code) ? current.filter((item) => item !== code) : [...current, code]
    )
  }

  async function loadLatest() {
    try {
      const response = await fetch('/api/care-passport?limit=1', { cache: 'no-store' })
      const data = await response.json()
      if (data.ok && data.items?.[0]) {
        setSaved(data.items[0])
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadLatest()
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const response = await fetch('/api/care-passport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elderName,
          guardianName,
          guardianPhone,
          bodyConditions,
          allergyStatus,
          allergyMemo,
          medicationsMemo,
          dietNeeds,
          communicationNotes,
          emergencyNotes,
          fallRiskLevel
        })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '저장 중 오류가 발생했습니다.')
      }

      setSaved(data.passport)
      setMessage('부모님 케어패스포트가 저장됐습니다.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900">
      <section className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_380px]">
        <div>
          <p className="text-sm font-black text-emerald-700">부모님 케어패스포트</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">
            부모님 상태를
            <br />
            한 번만 쉽게 적어두세요.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            오른쪽 귀가 잘 안 들리시는지, 오른쪽 다리가 아프신지, 알러지가 있는지,
            복용 중인 약이 있는지 미리 알면 병원동행·식사·약 케어가 훨씬 안전해집니다.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-6">
            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black">1. 기본 정보</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <label>
                  <span className="mb-2 block text-sm font-black text-slate-700">부모님 성함</span>
                  <input
                    value={elderName}
                    onChange={(event) => setElderName(event.target.value)}
                    required
                    className="w-full rounded-2xl border border-slate-200 p-4 text-lg outline-none focus:border-emerald-500"
                    placeholder="예: 어머니"
                  />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-black text-slate-700">보호자 이름</span>
                  <input
                    value={guardianName}
                    onChange={(event) => setGuardianName(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 p-4 text-lg outline-none focus:border-emerald-500"
                    placeholder="예: 이관용"
                  />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-black text-slate-700">보호자 연락처</span>
                  <input
                    value={guardianPhone}
                    onChange={(event) => setGuardianPhone(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 p-4 text-lg outline-none focus:border-emerald-500"
                    placeholder="010-1234-5678"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black">2. 불편한 곳을 골라주세요</h2>
              <p className="mt-2 text-slate-600">모르면 비워둬도 됩니다. 아는 것만 체크하세요.</p>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {bodyConditionOptions.map((option) => (
                  <button
                    type="button"
                    key={option.code}
                    onClick={() => toggleBody(option.code)}
                    className={
                      'rounded-2xl border p-4 text-left text-lg font-black transition ' +
                      (bodyConditions.includes(option.code)
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-950'
                        : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50')
                    }
                  >
                    {option.label}
                    <p className="mt-2 text-sm font-medium leading-6 text-slate-500">{option.managerTip}</p>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black">3. 알러지와 복용약</h2>
              <p className="mt-2 text-slate-600">이 두 가지는 꼭 확인해야 합니다.</p>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {[
                  { value: 'none', label: '알러지 없음' },
                  { value: 'yes', label: '알러지 있음' },
                  { value: 'unknown', label: '잘 모르겠음' }
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setAllergyStatus(item.value as AllergyStatus)}
                    className={
                      'rounded-2xl border p-4 text-lg font-black ' +
                      (allergyStatus === item.value
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 bg-white')
                    }
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <label className="mt-5 block">
                <span className="mb-2 block text-sm font-black text-slate-700">알러지 메모</span>
                <textarea
                  value={allergyMemo}
                  onChange={(event) => setAllergyMemo(event.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-slate-200 p-4 text-lg leading-8 outline-none focus:border-emerald-500"
                  placeholder="예: 페니실린 알러지, 조개류 알러지, 잘 모르겠음"
                />
              </label>

              <label className="mt-5 block">
                <span className="mb-2 block text-sm font-black text-slate-700">복용 중인 약</span>
                <textarea
                  value={medicationsMemo}
                  onChange={(event) => setMedicationsMemo(event.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 p-4 text-lg leading-8 outline-none focus:border-emerald-500"
                  placeholder="예: 혈압약 아침 1정, 당뇨약 식후, 무릎 통증약. 모르면 약 봉투 사진을 나중에 올려도 됩니다."
                />
              </label>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black">4. 식사와 낙상 위험</h2>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {dietNeedOptions.map((option) => (
                  <button
                    type="button"
                    key={option.code}
                    onClick={() => toggleDiet(option.code)}
                    className={
                      'rounded-2xl border p-4 text-left text-lg font-black ' +
                      (dietNeeds.includes(option.code)
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 bg-white')
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-4">
                {[
                  { value: 'low', label: '낮음' },
                  { value: 'medium', label: '보통' },
                  { value: 'high', label: '높음' },
                  { value: 'unknown', label: '잘 모름' }
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setFallRiskLevel(item.value as FallRiskLevel)}
                    className={
                      'rounded-2xl border p-4 text-lg font-black ' +
                      (fallRiskLevel === item.value
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 bg-white')
                    }
                  >
                    낙상 위험 {item.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black">5. 매니저에게 알려줄 말</h2>

              <label className="mt-5 block">
                <span className="mb-2 block text-sm font-black text-slate-700">응대 방식</span>
                <textarea
                  value={communicationNotes}
                  onChange={(event) => setCommunicationNotes(event.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-slate-200 p-4 text-lg leading-8 outline-none focus:border-emerald-500"
                  placeholder="예: 천천히 설명하면 편안해하세요. 관리받는다는 표현보다 도와드린다는 표현을 좋아하세요."
                />
              </label>

              <label className="mt-5 block">
                <span className="mb-2 block text-sm font-black text-slate-700">긴급 메모</span>
                <textarea
                  value={emergencyNotes}
                  onChange={(event) => setEmergencyNotes(event.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-slate-200 p-4 text-lg leading-8 outline-none focus:border-emerald-500"
                  placeholder="예: 어지러움 호소 시 바로 자녀에게 연락. 혼자 계단 이용 금지."
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
              {saving ? '저장 중...' : '부모님 상태 저장하기'}
            </button>
          </form>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-sm">
            <p className="text-sm font-black text-emerald-200">오늘의 안심판</p>
            <div className="mt-2 text-5xl font-black">{summary.reassuranceState}</div>
            <p className="mt-4 text-lg leading-8 text-slate-200">{summary.oneMinuteSummary}</p>

            <div className="mt-5 rounded-2xl bg-white/10 p-4">
              <h3 className="text-lg font-black">가족 확인 질문 3개</h3>
              <div className="mt-3 space-y-2">
                {summary.familyQuestions.map((question, index) => (
                  <div key={question} className="rounded-xl bg-white/10 p-3 text-sm font-bold">
                    {index + 1}. {question}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-white/10 p-4">
              <h3 className="text-lg font-black">매니저 현장 주의사항</h3>
              <div className="mt-3 space-y-2">
                {summary.managerTips.length > 0 ? (
                  summary.managerTips.map((tip, index) => (
                    <div key={tip} className="rounded-xl bg-white/10 p-3 text-sm font-bold">
                      {index + 1}. {tip}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-300">아직 주의사항이 없습니다.</p>
                )}
              </div>
            </div>

            {saved ? (
              <div className="mt-5 rounded-2xl bg-emerald-200 p-4 text-slate-950">
                <div className="text-sm font-black">최근 저장</div>
                <div className="mt-1 font-black">{saved.elder_name}</div>
                <div className="mt-1 text-sm">{new Date(saved.updated_at).toLocaleString('ko-KR')}</div>
              </div>
            ) : null}
          </div>
        </aside>
      </section>
    </main>
  )
}
