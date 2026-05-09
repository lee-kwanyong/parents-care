'use client'

import { FormEvent, useState } from 'react'
import { DocumentRequestBoard } from '@/components/DocumentRequestBoard'
import { documentTypeOptions, type DocumentReason, type DocumentType } from '@/lib/document-care-engine'

export default function CareDocumentsPage() {
  const [selected, setSelected] = useState<DocumentType[]>(['insurance_unknown'])
  const [elderName, setElderName] = useState('어머니')
  const [guardianName, setGuardianName] = useState('')
  const [guardianPhone, setGuardianPhone] = useState('')
  const [hospitalName, setHospitalName] = useState('')
  const [visitDate, setVisitDate] = useState('')
  const [reason, setReason] = useState<DocumentReason>('insurance')
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  function toggle(type: DocumentType) {
    setSelected((current) => {
      if (type === 'insurance_unknown') return ['insurance_unknown']

      const withoutUnknown = current.filter((item) => item !== 'insurance_unknown')
      return withoutUnknown.includes(type)
        ? withoutUnknown.filter((item) => item !== type)
        : [...withoutUnknown, type]
    })
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const response = await fetch('/api/documents/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elderName,
          guardianName,
          guardianPhone,
          hospitalName,
          visitDate,
          reason,
          memo,
          documentTypes: selected
        })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '서류 요청 중 오류가 발생했습니다.')
      }

      setMessage(`서류 요청 ${data.items?.length || 0}개가 만들어졌습니다.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '서류 요청 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-[#2E504D]">
      <section className="mx-auto max-w-6xl">
        <p className="text-sm font-black text-emerald-700">보험서류·영수증 챙김팩</p>
        <h1 className="mt-2 text-3xl font-black md:text-5xl">
          필요한 서류를
          <br />
          어렵지 않게 챙깁니다.
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-[#63807C]">
          뭘 발급받아야 할지 몰라도 괜찮습니다. “필요한 서류 추천해주세요”를 누르면
          실손보험에 자주 필요한 기본 서류 묶음으로 정리합니다.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-6">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">1. 필요한 서류 선택</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {documentTypeOptions.map((option) => (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => toggle(option.code)}
                  className={
                    'rounded-2xl border p-4 text-left transition ' +
                    (selected.includes(option.code)
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
            <h2 className="text-2xl font-black">2. 기본 정보</h2>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <label>
                <span className="mb-2 block text-sm font-black text-[#4E6D69]">부모님</span>
                <input
                  value={elderName}
                  onChange={(event) => setElderName(event.target.value)}
                  className="w-full rounded-2xl border border-[#E0EFEC] p-4 outline-none focus:border-emerald-500"
                  placeholder="예: 어머니"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-black text-[#4E6D69]">보호자 이름</span>
                <input
                  value={guardianName}
                  onChange={(event) => setGuardianName(event.target.value)}
                  className="w-full rounded-2xl border border-[#E0EFEC] p-4 outline-none focus:border-emerald-500"
                  placeholder="예: 이관용"
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
                <span className="mb-2 block text-sm font-black text-[#4E6D69]">병원명</span>
                <input
                  value={hospitalName}
                  onChange={(event) => setHospitalName(event.target.value)}
                  className="w-full rounded-2xl border border-[#E0EFEC] p-4 outline-none focus:border-emerald-500"
                  placeholder="예: 서울OO병원"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-black text-[#4E6D69]">방문일</span>
                <input
                  value={visitDate}
                  onChange={(event) => setVisitDate(event.target.value)}
                  type="date"
                  className="w-full rounded-2xl border border-[#E0EFEC] p-4 outline-none focus:border-emerald-500"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-black text-[#4E6D69]">사용 목적</span>
                <select
                  value={reason}
                  onChange={(event) => setReason(event.target.value as DocumentReason)}
                  className="w-full rounded-2xl border border-[#E0EFEC] p-4 outline-none focus:border-emerald-500"
                >
                  <option value="insurance">실손보험</option>
                  <option value="family_record">가족 확인</option>
                  <option value="next_hospital">다음 병원 제출</option>
                  <option value="company">회사 제출</option>
                  <option value="unknown">잘 모름</option>
                </select>
              </label>
            </div>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-black text-[#4E6D69]">메모</span>
              <textarea
                value={memo}
                onChange={(event) => setMemo(event.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-[#E0EFEC] p-4 leading-7 outline-none focus:border-emerald-500"
                placeholder="예: 실손보험 청구용으로 필요한 서류를 잘 모르겠습니다. 운영실에서 추천해주세요."
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
            {saving ? '요청 중...' : '서류 요청하기'}
          </button>
        </form>

        <section className="mt-10">
          <DocumentRequestBoard mode="family" />
        </section>
      </section>
    </main>
  )
}
