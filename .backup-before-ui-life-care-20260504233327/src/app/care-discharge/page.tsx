'use client'

import { FormEvent, useState } from 'react'
import { DischargeCareBoard } from '@/components/DischargeCareBoard'

export default function CareDischargePage() {
  const [elderName, setElderName] = useState('어머니')
  const [guardianName, setGuardianName] = useState('')
  const [guardianPhone, setGuardianPhone] = useState('')
  const [hospitalName, setHospitalName] = useState('')
  const [dischargeDate, setDischargeDate] = useState('')
  const [nextVisitDate, setNextVisitDate] = useState('')
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState('')
  const [medicationRisk, setMedicationRisk] = useState(true)
  const [mealRisk, setMealRisk] = useState(true)
  const [mobilityRisk, setMobilityRisk] = useState(false)
  const [fallRisk, setFallRisk] = useState(false)
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const response = await fetch('/api/discharge-care', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elderName,
          guardianName,
          guardianPhone,
          hospitalName,
          dischargeDate,
          nextVisitDate,
          primaryDiagnosis,
          medicationRisk,
          mealRisk,
          mobilityRisk,
          fallRisk,
          memo
        })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '퇴원 후 안심팩 저장 중 오류가 발생했습니다.')
      }

      setMessage('퇴원 후 7일 안심팩과 7일 체크가 만들어졌습니다.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '퇴원 후 안심팩 저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900">
      <section className="mx-auto max-w-6xl">
        <p className="text-sm font-black text-emerald-700">퇴원 후 7일 안심팩</p>
        <h1 className="mt-2 text-3xl font-black md:text-5xl">
          퇴원 후 7일이
          <br />
          가장 걱정되는 시간입니다.
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
          약, 식사, 통증, 컨디션, 다음 외래, 낙상 위험을 7일 동안 확인합니다.
          가족은 복잡한 리포트보다 “안심 / 확인 필요”만 먼저 보면 됩니다.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-6">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">1. 기본 정보</h2>

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

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <label>
                <span className="mb-2 block text-sm font-black text-slate-700">퇴원 병원</span>
                <input
                  value={hospitalName}
                  onChange={(event) => setHospitalName(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-emerald-500"
                  placeholder="예: 서울OO병원"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-black text-slate-700">퇴원일</span>
                <input
                  value={dischargeDate}
                  onChange={(event) => setDischargeDate(event.target.value)}
                  required
                  type="date"
                  className="w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-emerald-500"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-black text-slate-700">다음 외래일</span>
                <input
                  value={nextVisitDate}
                  onChange={(event) => setNextVisitDate(event.target.value)}
                  type="date"
                  className="w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-emerald-500"
                />
              </label>
            </div>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-black text-slate-700">진단/수술/퇴원 메모</span>
              <input
                value={primaryDiagnosis}
                onChange={(event) => setPrimaryDiagnosis(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-emerald-500"
                placeholder="예: 무릎 수술 후 퇴원, 골절 회복, 폐렴 퇴원 등"
              />
            </label>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">2. 특히 걱정되는 것</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {[
                {
                  checked: medicationRisk,
                  set: setMedicationRisk,
                  title: '처방약 복용이 걱정돼요',
                  desc: '약 봉투, 복용 시간, 먹었어요 확인'
                },
                {
                  checked: mealRisk,
                  set: setMealRisk,
                  title: '식사가 걱정돼요',
                  desc: '죽, 회복식, 식사량, 안심밥상 연결'
                },
                {
                  checked: mobilityRisk,
                  set: setMobilityRisk,
                  title: '이동이 불편하세요',
                  desc: '보행, 화장실, 계단, 귀가 동선'
                },
                {
                  checked: fallRisk,
                  set: setFallRisk,
                  title: '넘어질까 걱정돼요',
                  desc: '낙상 위험, 욕실, 계단, 야간 이동'
                }
              ].map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => item.set(!item.checked)}
                  className={
                    'rounded-2xl border p-5 text-left transition ' +
                    (item.checked ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white')
                  }
                >
                  <div className="text-lg font-black">{item.title}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.desc}</p>
                </button>
              ))}
            </div>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-black text-slate-700">가족 메모</span>
              <textarea
                value={memo}
                onChange={(event) => setMemo(event.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-slate-200 p-4 leading-7 outline-none focus:border-emerald-500"
                placeholder="예: 퇴원 후 첫 3일은 식사를 잘 못 하실 수 있습니다. 오른쪽 다리가 불편하고 밤에 화장실 갈 때 넘어질까 걱정됩니다."
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
            {saving ? '저장 중...' : '퇴원 후 7일 안심팩 만들기'}
          </button>
        </form>

        <section className="mt-10">
          <DischargeCareBoard mode="family" />
        </section>
      </section>
    </main>
  )
}
