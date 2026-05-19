'use client'

import { FormEvent, useState } from 'react'
import { DischargeCareBoard } from '@/components/DischargeCareBoard'
import { AppFrame } from '@/components/ui/AppFrame'
import { CareButton } from '@/components/ui/CareButton'
import { CareCard } from '@/components/ui/CareCard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { StatusPill } from '@/components/ui/StatusPill'

const worryOptions = [
  {
    key: 'medicationRisk',
    title: '처방약 복용이 걱정돼요',
    desc: '약 봉투, 복용 시간, 먹었어요 확인'
  },
  {
    key: 'mealRisk',
    title: '식사가 걱정돼요',
    desc: '죽, 회복식, 식사량, 안심밥상 연결'
  },
  {
    key: 'mobilityRisk',
    title: '이동이 불편하세요',
    desc: '보행, 화장실, 계단, 귀가 동선'
  },
  {
    key: 'fallRisk',
    title: '넘어질까 걱정돼요',
    desc: '낙상 위험, 욕실, 계단, 야간 이동'
  }
]

export default function CareDischargePage() {
  const [elderName, setElderName] = useState('어머니')
  const [guardianName, setGuardianName] = useState('')
  const [guardianPhone, setGuardianPhone] = useState('')
  const [hospitalName, setHospitalName] = useState('')
  const [dischargeDate, setDischargeDate] = useState('')
  const [nextVisitDate, setNextVisitDate] = useState('')
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState('')
  const [risks, setRisks] = useState<Record<string, boolean>>({
    medicationRisk: true,
    mealRisk: true,
    mobilityRisk: false,
    fallRisk: false
  })
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  function toggleRisk(key: string) {
    setRisks((current) => ({
      ...current,
      [key]: !current[key]
    }))
  }

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
          medicationRisk: risks.medicationRisk,
          mealRisk: risks.mealRisk,
          mobilityRisk: risks.mobilityRisk,
          fallRisk: risks.fallRisk,
          memo
        })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '퇴원 후 안심팩 저장 중 오류가 발생했습니다.')
      }

      setMessage('퇴원 후 7일 안심팩과 7일 체크가 만들어졌습니다.')
      setMemo('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '퇴원 후 안심팩 저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppFrame title="퇴원 후 7일" subtitle="퇴원 직후가 가장 걱정되는 시간입니다" backHref="/child">
      <SectionHeader
        eyebrow="퇴원 후 7일 안심팩"
        title={
          <>
            퇴원 후 7일을
            <br />
            매일 확인합니다.
          </>
        }
        description="약, 식사, 통증, 컨디션, 다음 외래, 낙상 위험을 7일 동안 확인합니다. 가족은 안심/확인 필요만 먼저 보면 됩니다."
        actions={
          <CareButton href="/care-meals" tone="soft">
            회복식도 함께 보기
          </CareButton>
        }
      />

      <form onSubmit={submit} className="mt-8 space-y-6">
        <CareCard tone="white">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill text="1단계" tone="green" />
            <StatusPill text="퇴원 정보" tone="slate" />
          </div>

          <h2 className="mt-4 text-3xl font-black">퇴원 정보를 알려주세요</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <input value={elderName} onChange={(event) => setElderName(event.target.value)} className="tap-target rounded-2xl border border-[#E0EFEC] p-4" placeholder="부모님" />
            <input value={guardianName} onChange={(event) => setGuardianName(event.target.value)} className="tap-target rounded-2xl border border-[#E0EFEC] p-4" placeholder="보호자 이름" />
            <input value={guardianPhone} onChange={(event) => setGuardianPhone(event.target.value)} className="tap-target rounded-2xl border border-[#E0EFEC] p-4" placeholder="010-1234-5678" />
            <input value={hospitalName} onChange={(event) => setHospitalName(event.target.value)} className="tap-target rounded-2xl border border-[#E0EFEC] p-4" placeholder="퇴원 병원" />
            <input value={dischargeDate} onChange={(event) => setDischargeDate(event.target.value)} required type="date" className="tap-target rounded-2xl border border-[#E0EFEC] p-4" />
            <input value={nextVisitDate} onChange={(event) => setNextVisitDate(event.target.value)} type="date" className="tap-target rounded-2xl border border-[#E0EFEC] p-4" />
          </div>

          <input
            value={primaryDiagnosis}
            onChange={(event) => setPrimaryDiagnosis(event.target.value)}
            className="mt-3 tap-target w-full rounded-2xl border border-[#E0EFEC] p-4"
            placeholder="진단/수술/퇴원 메모. 예: 무릎 수술 후 퇴원"
          />
        </CareCard>

        <CareCard tone="white">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill text="2단계" tone="green" />
            <StatusPill text="걱정되는 것" tone="slate" />
          </div>

          <h2 className="mt-4 text-3xl font-black">특히 어떤 안심케어가 필요하세요?</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {worryOptions.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => toggleRisk(item.key)}
                className={
                  'rounded-3xl border p-5 text-left transition ' +
                  (risks[item.key]
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-[#E0EFEC] bg-slate-50 hover:bg-white')
                }
              >
                <div className="text-xl font-black">{item.title}</div>
                <p className="mt-2 text-sm font-bold leading-6 text-[#63807C]">{item.desc}</p>
              </button>
            ))}
          </div>

          <textarea
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            rows={5}
            className="mt-5 w-full rounded-2xl border border-[#E0EFEC] p-4 leading-7"
            placeholder="예: 오른쪽 다리가 불편하고 밤에 화장실 갈 때 넘어질까 걱정됩니다."
          />
        </CareCard>

        {message ? (
          <CareCard tone="green">
            <p className="text-lg font-black">{message}</p>
          </CareCard>
        ) : null}

        <CareButton type="submit" disabled={saving} size="xl" className="md:w-full">
          {saving ? '저장 중...' : '퇴원 후 7일 안심팩 만들기'}
        </CareButton>
      </form>

      <section className="mt-10">
        <DischargeCareBoard mode="family" />
      </section>
    </AppFrame>
  )
}
