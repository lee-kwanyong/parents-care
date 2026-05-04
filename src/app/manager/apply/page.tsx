'use client'

import { FormEvent, useState } from 'react'
import { AppFrame } from '@/components/ui/AppFrame'
import { CareButton } from '@/components/ui/CareButton'
import { CareCard } from '@/components/ui/CareCard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { StatusPill } from '@/components/ui/StatusPill'
import {
  certificationOptions,
  dayOptions,
  digitalSkillOptions,
  managerTypeOptions,
  serviceScopeOptions,
  specialtyOptions,
  timeSlotOptions,
  type ManagerType
} from '@/lib/manager-onboarding-engine'

function toggle(current: string[], value: string) {
  return current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value]
}

export default function ManagerApplyPage() {
  const [applicantName, setApplicantName] = useState('')
  const [applicantPhone, setApplicantPhone] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [addressText, setAddressText] = useState('')
  const [managerType, setManagerType] = useState<ManagerType>('hospital_companion')
  const [certifications, setCertifications] = useState<string[]>([])
  const [specialties, setSpecialties] = useState<string[]>(['정형외과'])
  const [serviceScopes, setServiceScopes] = useState<string[]>(['병원 앞 만남', '접수·수납 도움', '약국 동행'])
  const [digitalSkills, setDigitalSkills] = useState<string[]>(['스마트폰 문자 가능', '지도앱 사용 가능'])
  const [availableRegionsText, setAvailableRegionsText] = useState('')
  const [availableDays, setAvailableDays] = useState<string[]>(['월', '화', '수', '목', '금'])
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>(['오전', '오후'])
  const [careerYears, setCareerYears] = useState('0')
  const [careerSummary, setCareerSummary] = useState('')
  const [introText, setIntroText] = useState('')
  const [motivationText, setMotivationText] = useState('')
  const [vehicleOwned, setVehicleOwned] = useState(false)
  const [drivingLicenseOwned, setDrivingLicenseOwned] = useState(false)
  const [understandsTransportPolicy, setUnderstandsTransportPolicy] = useState(false)
  const [backgroundCheckConsent, setBackgroundCheckConsent] = useState(false)
  const [privacyAgreement, setPrivacyAgreement] = useState(false)
  const [servicePolicyAgreement, setServicePolicyAgreement] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    const availableRegions = availableRegionsText
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

    try {
      const response = await fetch('/api/manager-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_application',
          applicantName,
          applicantPhone,
          birthYear,
          addressText,
          managerType,
          certifications,
          specialties,
          serviceScopes,
          digitalSkills,
          availableRegions,
          availableDays,
          availableTimeSlots,
          careerYears,
          careerSummary,
          introText,
          motivationText,
          vehicleOwned,
          drivingLicenseOwned,
          understandsTransportPolicy,
          backgroundCheckConsent,
          privacyAgreement,
          servicePolicyAgreement
        })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '매니저 지원서 저장 중 오류가 발생했습니다.')
      }

      setMessage('지원서가 접수됐습니다. 운영실이 자격, 가능지역, 차량정책, 면접 여부를 확인합니다.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '매니저 지원서 저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppFrame title="동행케어 매니저 지원" subtitle="부모님을 모실 분을 신중하게 등록합니다" backHref="/manager">
      <SectionHeader
        eyebrow="매니저 등록센터"
        title={
          <>
            부모님을 모실
            <br />
            케어 매니저를 등록합니다.
          </>
        }
        description="단순 이동 인력이 아니라 보호자 역할을 일부 대신하는 분입니다. 자격, 가능지역, 디지털 활용, 차량 정책, 현장 응대 기준을 확인합니다."
        actions={
          <CareButton href="/ops/managers" tone="dark">
            운영실 심사 보드
          </CareButton>
        }
      />

      <form onSubmit={submit} className="mt-8 space-y-6">
        <CareCard tone="white">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill text="1단계" tone="green" />
            <StatusPill text="기본 정보" tone="slate" />
          </div>

          <h2 className="mt-4 text-3xl font-black">연락 가능한 정보를 입력해주세요</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <input value={applicantName} onChange={(event) => setApplicantName(event.target.value)} required className="tap-target rounded-2xl border border-slate-200 p-4" placeholder="이름" />
            <input value={applicantPhone} onChange={(event) => setApplicantPhone(event.target.value)} required className="tap-target rounded-2xl border border-slate-200 p-4" placeholder="010-1234-5678" />
            <input value={birthYear} onChange={(event) => setBirthYear(event.target.value)} inputMode="numeric" className="tap-target rounded-2xl border border-slate-200 p-4" placeholder="출생연도 예: 1975" />
            <input value={addressText} onChange={(event) => setAddressText(event.target.value)} className="tap-target rounded-2xl border border-slate-200 p-4" placeholder="거주지역 예: 서울 강서구" />
          </div>
        </CareCard>

        <CareCard tone="white">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill text="2단계" tone="green" />
            <StatusPill text="활동 유형" tone="slate" />
          </div>

          <h2 className="mt-4 text-3xl font-black">어떤 케어를 할 수 있나요?</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {managerTypeOptions.map((option) => (
              <button
                key={option.code}
                type="button"
                onClick={() => setManagerType(option.code)}
                className={
                  'rounded-3xl border p-5 text-left transition ' +
                  (managerType === option.code
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 bg-slate-50 hover:bg-white')
                }
              >
                <div className="text-xl font-black">{option.label}</div>
                <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{option.description}</p>
              </button>
            ))}
          </div>
        </CareCard>

        <CareCard tone="white">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill text="3단계" tone="green" />
            <StatusPill text="자격·경력" tone="slate" />
          </div>

          <h2 className="mt-4 text-3xl font-black">자격과 경험을 알려주세요</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {certificationOptions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCertifications(toggle(certifications, item))}
                className={
                  'rounded-2xl border p-4 text-left text-sm font-black transition ' +
                  (certifications.includes(item)
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 bg-slate-50 hover:bg-white')
                }
              >
                {item}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-[180px_1fr]">
            <input value={careerYears} onChange={(event) => setCareerYears(event.target.value)} inputMode="decimal" className="tap-target rounded-2xl border border-slate-200 p-4" placeholder="경력연수" />
            <input value={availableRegionsText} onChange={(event) => setAvailableRegionsText(event.target.value)} className="tap-target rounded-2xl border border-slate-200 p-4" placeholder="활동 가능 지역. 예: 강남구, 송파구, 성남시" />
          </div>

          <textarea value={careerSummary} onChange={(event) => setCareerSummary(event.target.value)} rows={4} className="mt-5 w-full rounded-2xl border border-slate-200 p-4 leading-7" placeholder="경력 요약. 예: 요양보호사 3년, 정형외과 동행 경험 다수" />
        </CareCard>

        <CareCard tone="white">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill text="4단계" tone="green" />
            <StatusPill text="가능 업무" tone="slate" />
          </div>

          <h2 className="mt-4 text-3xl font-black">현장에서 가능한 일을 선택해주세요</h2>

          <h3 className="mt-5 text-xl font-black">전문분야</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {specialtyOptions.map((item) => (
              <button key={item} type="button" onClick={() => setSpecialties(toggle(specialties, item))} className={'rounded-2xl border p-4 text-left text-sm font-black transition ' + (specialties.includes(item) ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:bg-white')}>
                {item}
              </button>
            ))}
          </div>

          <h3 className="mt-5 text-xl font-black">업무 범위</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {serviceScopeOptions.map((item) => (
              <button key={item} type="button" onClick={() => setServiceScopes(toggle(serviceScopes, item))} className={'rounded-2xl border p-4 text-left text-sm font-black transition ' + (serviceScopes.includes(item) ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:bg-white')}>
                {item}
              </button>
            ))}
          </div>

          <h3 className="mt-5 text-xl font-black">디지털 활용</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {digitalSkillOptions.map((item) => (
              <button key={item} type="button" onClick={() => setDigitalSkills(toggle(digitalSkills, item))} className={'rounded-2xl border p-4 text-left text-sm font-black transition ' + (digitalSkills.includes(item) ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:bg-white')}>
                {item}
              </button>
            ))}
          </div>
        </CareCard>

        <CareCard tone="white">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill text="5단계" tone="green" />
            <StatusPill text="가능 시간·차량 정책" tone="slate" />
          </div>

          <h2 className="mt-4 text-3xl font-black">언제 활동할 수 있나요?</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-7">
            {dayOptions.map((item) => (
              <button key={item} type="button" onClick={() => setAvailableDays(toggle(availableDays, item))} className={'rounded-2xl border p-4 text-center text-lg font-black transition ' + (availableDays.includes(item) ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:bg-white')}>
                {item}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-5">
            {timeSlotOptions.map((item) => (
              <button key={item} type="button" onClick={() => setAvailableTimeSlots(toggle(availableTimeSlots, item))} className={'rounded-2xl border p-4 text-center text-lg font-black transition ' + (availableTimeSlots.includes(item) ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:bg-white')}>
                {item}
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-3xl bg-amber-50 p-5">
            <h3 className="text-2xl font-black text-amber-950">차량 정책 확인</h3>
            <p className="mt-3 text-sm font-bold leading-6 text-amber-900">
              차량 보유 여부는 표시할 수 있지만, 매니저 개인차량 직접 유상운송은 기본 서비스에 포함되지 않습니다.
              기본 이동은 병원 앞 만남, 집 앞 만남 후 택시 동행, 이동지원 제휴 기준입니다.
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <button type="button" onClick={() => setVehicleOwned(!vehicleOwned)} className={'rounded-2xl border p-4 text-left font-black ' + (vehicleOwned ? 'border-emerald-500 bg-white' : 'border-amber-200 bg-amber-100')}>
                차량 보유
              </button>
              <button type="button" onClick={() => setDrivingLicenseOwned(!drivingLicenseOwned)} className={'rounded-2xl border p-4 text-left font-black ' + (drivingLicenseOwned ? 'border-emerald-500 bg-white' : 'border-amber-200 bg-amber-100')}>
                운전면허 보유
              </button>
              <button type="button" onClick={() => setUnderstandsTransportPolicy(!understandsTransportPolicy)} className={'rounded-2xl border p-4 text-left font-black ' + (understandsTransportPolicy ? 'border-emerald-500 bg-white' : 'border-red-300 bg-red-50')}>
                직접 운송 분리 동의
              </button>
            </div>
          </div>
        </CareCard>

        <CareCard tone="white">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill text="6단계" tone="green" />
            <StatusPill text="소개·동의" tone="slate" />
          </div>

          <h2 className="mt-4 text-3xl font-black">마지막으로 확인해주세요</h2>

          <textarea value={introText} onChange={(event) => setIntroText(event.target.value)} rows={3} className="mt-5 w-full rounded-2xl border border-slate-200 p-4 leading-7" placeholder="자기소개. 예: 어르신 병원동행과 진료 안내 경험이 있습니다." />
          <textarea value={motivationText} onChange={(event) => setMotivationText(event.target.value)} rows={3} className="mt-3 w-full rounded-2xl border border-slate-200 p-4 leading-7" placeholder="지원 동기. 예: 부모님을 모시는 마음으로 차분하게 동행하겠습니다." />

          <div className="mt-5 grid gap-3">
            <label className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
              <input type="checkbox" checked={backgroundCheckConsent} onChange={(event) => setBackgroundCheckConsent(event.target.checked)} className="mt-1 h-5 w-5" />
              <span className="text-sm font-bold leading-6">신원 확인, 경력 확인, 자격 확인 절차에 동의합니다.</span>
            </label>
            <label className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
              <input type="checkbox" checked={privacyAgreement} onChange={(event) => setPrivacyAgreement(event.target.checked)} className="mt-1 h-5 w-5" />
              <span className="text-sm font-bold leading-6">개인정보 수집·이용에 동의합니다.</span>
            </label>
            <label className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
              <input type="checkbox" checked={servicePolicyAgreement} onChange={(event) => setServicePolicyAgreement(event.target.checked)} className="mt-1 h-5 w-5" />
              <span className="text-sm font-bold leading-6">부모님 케어 서비스 정책과 현장 응대 기준에 동의합니다.</span>
            </label>
          </div>
        </CareCard>

        {message ? (
          <CareCard tone="green">
            <p className="text-lg font-black">{message}</p>
          </CareCard>
        ) : null}

        <CareButton type="submit" disabled={saving || !privacyAgreement || !servicePolicyAgreement || !understandsTransportPolicy} size="xl" className="md:w-full">
          {saving ? '지원서 접수 중...' : '동행케어 매니저 지원하기'}
        </CareButton>
      </form>
    </AppFrame>
  )
}
