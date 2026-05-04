'use client'

import { FormEvent, useState } from 'react'
import { RecurringCareBoard } from '@/components/RecurringCareBoard'
import { cadenceOptions, routineTypeOptions, type CadenceType, type RoutineType } from '@/lib/recurring-care-engine'

export default function CareRoutinesPage() {
  const [elderName, setElderName] = useState('어머니')
  const [title, setTitle] = useState('정기진료')
  const [routineType, setRoutineType] = useState<RoutineType>('appointment')
  const [cadenceType, setCadenceType] = useState<CadenceType>('monthly')
  const [customDays, setCustomDays] = useState('')
  const [hospitalName, setHospitalName] = useState('')
  const [department, setDepartment] = useState('')
  const [doctorName, setDoctorName] = useState('')
  const [firstDueDate, setFirstDueDate] = useState('')
  const [preferredDay, setPreferredDay] = useState('')
  const [preferredTime, setPreferredTime] = useState('')
  const [familyOwnerName, setFamilyOwnerName] = useState('')
  const [familyOwnerPhone, setFamilyOwnerPhone] = useState('')
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const response = await fetch('/api/recurring-care', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elderName,
          title,
          routineType,
          cadenceType,
          customDays,
          hospitalName,
          department,
          doctorName,
          firstDueDate,
          preferredDay,
          preferredTime,
          familyOwnerName,
          familyOwnerPhone,
          memo
        })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '정기 케어 저장 중 오류가 발생했습니다.')
      }

      setMessage('정기 케어와 다음 예약 후보가 만들어졌습니다.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '정기 케어 저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900">
      <section className="mx-auto max-w-6xl">
        <p className="text-sm font-black text-emerald-700">정기진료·다음 예약 자동관리</p>
        <h1 className="mt-2 text-3xl font-black md:text-5xl">
          다음 진료를
          <br />
          놓치지 않게 관리합니다.
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
          의사가 “2주 뒤 다시 오세요”라고 말하면, 그 말이 리포트로 끝나지 않고 다음 예약 후보와 가족 할 일로 이어집니다.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-6">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">1. 어떤 정기 케어인가요?</h2>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {routineTypeOptions.map((option) => (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => setRoutineType(option.code)}
                  className={
                    'rounded-2xl border p-4 text-left transition ' +
                    (routineType === option.code
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
            <h2 className="text-2xl font-black">2. 기본 정보</h2>

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
                <span className="mb-2 block text-sm font-black text-slate-700">제목</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-emerald-500"
                  placeholder="예: 정형외과 재진"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-black text-slate-700">첫 확인일</span>
                <input
                  value={firstDueDate}
                  onChange={(event) => setFirstDueDate(event.target.value)}
                  type="date"
                  className="w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-emerald-500"
                />
              </label>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <label>
                <span className="mb-2 block text-sm font-black text-slate-700">병원명</span>
                <input
                  value={hospitalName}
                  onChange={(event) => setHospitalName(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-emerald-500"
                  placeholder="예: 서울OO병원"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-black text-slate-700">진료과</span>
                <input
                  value={department}
                  onChange={(event) => setDepartment(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-emerald-500"
                  placeholder="예: 정형외과"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-black text-slate-700">담당의</span>
                <input
                  value={doctorName}
                  onChange={(event) => setDoctorName(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-emerald-500"
                  placeholder="선택 입력"
                />
              </label>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">3. 반복 주기</h2>

            <div className="mt-5 grid gap-3 md:grid-cols-4">
              {cadenceOptions.map((option) => (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => setCadenceType(option.code)}
                  className={
                    'rounded-2xl border p-4 text-left font-black transition ' +
                    (cadenceType === option.code
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 bg-white hover:bg-slate-50')
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>

            {cadenceType === 'custom' ? (
              <label className="mt-5 block">
                <span className="mb-2 block text-sm font-black text-slate-700">며칠마다 반복할까요?</span>
                <input
                  value={customDays}
                  onChange={(event) => setCustomDays(event.target.value)}
                  inputMode="numeric"
                  className="w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-emerald-500"
                  placeholder="예: 45"
                />
              </label>
            ) : null}

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <label>
                <span className="mb-2 block text-sm font-black text-slate-700">선호 요일</span>
                <input
                  value={preferredDay}
                  onChange={(event) => setPreferredDay(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-emerald-500"
                  placeholder="예: 화요일 오전"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-black text-slate-700">선호 시간</span>
                <input
                  value={preferredTime}
                  onChange={(event) => setPreferredTime(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-emerald-500"
                  placeholder="예: 오전 10시 전후"
                />
              </label>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">4. 가족 담당자</h2>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <label>
                <span className="mb-2 block text-sm font-black text-slate-700">담당자 이름</span>
                <input
                  value={familyOwnerName}
                  onChange={(event) => setFamilyOwnerName(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-emerald-500"
                  placeholder="예: 첫째 아들"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-black text-slate-700">담당자 연락처</span>
                <input
                  value={familyOwnerPhone}
                  onChange={(event) => setFamilyOwnerPhone(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-emerald-500"
                  placeholder="010-1234-5678"
                />
              </label>
            </div>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-black text-slate-700">메모</span>
              <textarea
                value={memo}
                onChange={(event) => setMemo(event.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-slate-200 p-4 leading-7 outline-none focus:border-emerald-500"
                placeholder="예: 무릎 통증 때문에 4주마다 정형외과 재진. 오전 시간 선호."
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
            {saving ? '저장 중...' : '정기 케어 등록하기'}
          </button>
        </form>

        <section className="mt-10">
          <RecurringCareBoard mode="family" />
        </section>
      </section>
    </main>
  )
}
