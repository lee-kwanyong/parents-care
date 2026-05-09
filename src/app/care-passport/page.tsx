'use client'

import { FormEvent, useState } from 'react'
import { AppFrame } from '@/components/ui/AppFrame'
import { CareButton } from '@/components/ui/CareButton'
import { CareCard } from '@/components/ui/CareCard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { StatusPill } from '@/components/ui/StatusPill'

const conditionOptions = [
  {
    code: 'right_ear',
    title: '오른쪽 귀가 잘 안 들려요',
    tip: '왼쪽에서 천천히 설명하세요.'
  },
  {
    code: 'left_ear',
    title: '왼쪽 귀가 잘 안 들려요',
    tip: '오른쪽에서 천천히 설명하세요.'
  },
  {
    code: 'right_leg',
    title: '오른쪽 다리가 아프세요',
    tip: '오른쪽 다리 보행과 계단 이동을 주의하세요.'
  },
  {
    code: 'left_leg',
    title: '왼쪽 다리가 아프세요',
    tip: '왼쪽 다리 보행과 계단 이동을 주의하세요.'
  },
  {
    code: 'stairs',
    title: '계단 이동이 불편하세요',
    tip: '턱, 계단, 화장실 이동을 특히 주의하세요.'
  },
  {
    code: 'long_wait',
    title: '오래 기다리기 힘들어하세요',
    tip: '오래 서 있지 않도록 앉을 곳을 먼저 확인하세요.'
  }
]

const shareOptions = [
  {
    code: 'manager',
    title: '매니저에게 공유',
    desc: '현장에서 꼭 필요한 청력, 보행, 알러지, 복용약 정보'
  },
  {
    code: 'family',
    title: '가족에게 공유',
    desc: '가족이 알아야 할 식사, 약, 컨디션, 다음 할 일'
  },
  {
    code: 'ops',
    title: '운영실에게 공유',
    desc: '배정, 리포트, 위험 플래그 확인에 필요한 정보'
  }
]

export default function CarePassportPage() {
  const [elderName, setElderName] = useState('어머니')
  const [selectedConditions, setSelectedConditions] = useState<string[]>(['right_ear'])
  const [allergyStatus, setAllergyStatus] = useState<'unknown' | 'none' | 'yes'>('unknown')
  const [allergyMemo, setAllergyMemo] = useState('')
  const [medicationMemo, setMedicationMemo] = useState('')
  const [dietMemo, setDietMemo] = useState('')
  const [communicationNotes, setCommunicationNotes] = useState('')
  const [emergencyNotes, setEmergencyNotes] = useState('')
  const [fallRiskLevel, setFallRiskLevel] = useState<'low' | 'medium' | 'high'>('medium')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  function toggleCondition(code: string) {
    setSelectedConditions((current) =>
      current.includes(code)
        ? current.filter((item) => item !== code)
        : [...current, code]
    )
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    const selected = conditionOptions.filter((item) => selectedConditions.includes(item.code))

    try {
      const response = await fetch('/api/care-passport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elderName,
          hearingAttention: selectedConditions.includes('right_ear') || selectedConditions.includes('left_ear'),
          mobilityAttention: selectedConditions.includes('right_leg') || selectedConditions.includes('left_leg') || selectedConditions.includes('stairs') || selectedConditions.includes('long_wait'),
          allergyStatus,
          hasMedications: Boolean(medicationMemo.trim()),
          fallRiskLevel,
          bodyConditions: selected.map((item) => ({
            code: item.code,
            label: item.title,
            managerTip: item.tip
          })),
          allergies: allergyMemo.trim() ? [{ memo: allergyMemo, status: allergyStatus }] : [],
          medications: medicationMemo.trim() ? [{ memo: medicationMemo }] : [],
          dietNeeds: dietMemo.trim() ? [{ label: dietMemo }] : [],
          communicationNotes,
          emergencyNotes
        })
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok || data.ok === false) {
        throw new Error(data.message || '케어패스포트 저장 중 오류가 발생했습니다.')
      }

      setMessage('부모님 케어패스포트가 저장됐습니다. 매니저와 운영실이 현장에서 참고할 수 있습니다.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '케어패스포트 저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppFrame title="케어패스포트" subtitle="부모님을 알수록 케어가 좋아집니다" backHref="/child">
      <SectionHeader
        eyebrow="부모님 케어패스포트"
        title={
          <>
            부모님 상태를
            <br />
            한 번만 알려주세요.
          </>
        }
        description="오른쪽 귀가 잘 안 들리는지, 다리가 불편한지, 알러지와 복용약이 있는지 알려주면 매니저와 운영실이 현장에서 실수 없이 확인합니다."
        actions={
          <CareButton href="/manager/today" tone="soft">
            매니저 화면 보기
          </CareButton>
        }
      />

      <form onSubmit={submit} className="mt-8 space-y-6">
        <CareCard tone="white">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill text="1단계" tone="green" />
            <StatusPill text="부모님 상태" tone="slate" />
          </div>

          <h2 className="mt-4 text-3xl font-black">현장에서 꼭 알아야 할 것</h2>

          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-black text-[#4E6D69]">부모님</span>
            <input
              value={elderName}
              onChange={(event) => setElderName(event.target.value)}
              className="tap-target w-full rounded-2xl border border-[#E0EFEC] p-4 outline-none focus:border-emerald-500"
            />
          </label>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {conditionOptions.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => toggleCondition(item.code)}
                className={
                  'rounded-3xl border p-5 text-left transition ' +
                  (selectedConditions.includes(item.code)
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-[#E0EFEC] bg-slate-50 hover:bg-white')
                }
              >
                <div className="text-xl font-black">{item.title}</div>
                <p className="mt-2 text-sm font-bold leading-6 text-[#63807C]">{item.tip}</p>
              </button>
            ))}
          </div>
        </CareCard>

        <CareCard tone="white">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill text="2단계" tone="green" />
            <StatusPill text="알러지·약·식사" tone="slate" />
          </div>

          <h2 className="mt-4 text-3xl font-black">약과 음식은 꼭 확인해야 해요</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              ['unknown', '잘 모르겠어요'],
              ['none', '알러지 없어요'],
              ['yes', '알러지 있어요']
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setAllergyStatus(value as 'unknown' | 'none' | 'yes')}
                className={
                  'rounded-3xl border p-4 text-left text-lg font-black transition ' +
                  (allergyStatus === value
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-[#E0EFEC] bg-slate-50 hover:bg-white')
                }
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-black text-[#4E6D69]">알러지 메모</span>
              <textarea
                value={allergyMemo}
                onChange={(event) => setAllergyMemo(event.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-[#E0EFEC] p-4 leading-7 outline-none focus:border-emerald-500"
                placeholder="예: 조영제 알러지 의심, 특정 약 복용 후 두드러기"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-black text-[#4E6D69]">복용 중인 약</span>
              <textarea
                value={medicationMemo}
                onChange={(event) => setMedicationMemo(event.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-[#E0EFEC] p-4 leading-7 outline-none focus:border-emerald-500"
                placeholder="예: 혈압약, 당뇨약, 무릎 통증약"
              />
            </label>
          </div>

          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-black text-[#4E6D69]">식사 제한·선호</span>
            <textarea
              value={dietMemo}
              onChange={(event) => setDietMemo(event.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-[#E0EFEC] p-4 leading-7 outline-none focus:border-emerald-500"
              placeholder="예: 딱딱한 음식 어려움, 저염식, 당뇨식, 죽 선호"
            />
          </label>
        </CareCard>

        <CareCard tone="white">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill text="3단계" tone="green" />
            <StatusPill text="응대 방식" tone="slate" />
          </div>

          <h2 className="mt-4 text-3xl font-black">어떻게 도와드리면 편하실까요?</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              ['low', '낙상 위험 낮음'],
              ['medium', '이동 시 주의'],
              ['high', '낙상 고위험']
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFallRiskLevel(value as 'low' | 'medium' | 'high')}
                className={
                  'rounded-3xl border p-4 text-left text-lg font-black transition ' +
                  (fallRiskLevel === value
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-[#E0EFEC] bg-slate-50 hover:bg-white')
                }
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-black text-[#4E6D69]">응대 메모</span>
              <textarea
                value={communicationNotes}
                onChange={(event) => setCommunicationNotes(event.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-[#E0EFEC] p-4 leading-7 outline-none focus:border-emerald-500"
                placeholder="예: 큰 소리보다 천천히 설명하면 좋아하세요. 재촉하면 불안해하세요."
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-black text-[#4E6D69]">긴급 메모</span>
              <textarea
                value={emergencyNotes}
                onChange={(event) => setEmergencyNotes(event.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-[#E0EFEC] p-4 leading-7 outline-none focus:border-emerald-500"
                placeholder="예: 연락 안 되면 첫째 아들에게 전화. 어지러움 호소 시 바로 보호자 확인."
              />
            </label>
          </div>
        </CareCard>

        <CareCard tone="blue">
          <h2 className="text-2xl font-black">공유 범위</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {shareOptions.map((item) => (
              <div key={item.code} className="rounded-2xl bg-white p-4">
                <div className="font-black">{item.title}</div>
                <p className="mt-2 text-sm font-bold leading-6 text-[#63807C]">{item.desc}</p>
              </div>
            ))}
          </div>
        </CareCard>

        {message ? (
          <CareCard tone="green">
            <p className="text-lg font-black">{message}</p>
          </CareCard>
        ) : null}

        <CareButton type="submit" disabled={saving} size="xl" className="md:w-full">
          {saving ? '저장 중...' : '케어패스포트 저장하기'}
        </CareButton>
      </form>
    </AppFrame>
  )
}
