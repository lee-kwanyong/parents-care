'use client'

import { FormEvent, useMemo, useState } from 'react'
import { AppFrame } from '@/components/ui/AppFrame'
import { CareButton } from '@/components/ui/CareButton'
import { CareCard } from '@/components/ui/CareCard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { StatusPill } from '@/components/ui/StatusPill'

type WorryCode =
  | 'hospital'
  | 'meal'
  | 'medication'
  | 'discharge'
  | 'documents'
  | 'routine'
  | 'social'
  | 'not_sure'

type WorryOption = {
  code: WorryCode
  title: string
  description: string
  example: string
  emoji: string
  rawText: string
}

const worries: WorryOption[] = [
  {
    code: 'hospital',
    title: '병원에 혼자 못 가세요',
    description: '예약, 이동, 접수, 진료, 약국, 귀가까지 정리합니다.',
    example: '예: 5월 10일 정형외과 예약인데 혼자 가기 어려우세요.',
    emoji: '🏥',
    rawText: '병원에 혼자 못 가세요. 병원동행, 이동, 접수, 진료, 약국, 귀가 확인이 필요합니다.'
  },
  {
    code: 'meal',
    title: '밥을 잘 못 챙겨 드세요',
    description: '식사 확인, 회복식, 도시락, 저염식·당뇨식 상담을 연결합니다.',
    example: '예: 혼자 계시고 점심을 자주 거르세요.',
    emoji: '🍱',
    rawText: '밥을 잘 못 챙겨 드세요. 식사 확인, 안심밥상, 회복식, 정기배송 상담이 필요합니다.'
  },
  {
    code: 'medication',
    title: '약을 잘 드시는지 모르겠어요',
    description: '복용약, 약 봉투, 복용 시간, 미확인 알림을 정리합니다.',
    example: '예: 혈압약을 제때 드시는지 모르겠어요.',
    emoji: '💊',
    rawText: '약을 잘 드시는지 모르겠어요. 복용약 확인, 약 봉투 사진, 복용 시간 정리가 필요합니다.'
  },
  {
    code: 'discharge',
    title: '퇴원 후 집에서 걱정돼요',
    description: '퇴원 후 7일 동안 약, 식사, 통증, 낙상, 다음 외래를 확인합니다.',
    example: '예: 수술 후 퇴원하셨는데 식사와 약이 걱정돼요.',
    emoji: '🏠',
    rawText: '퇴원 후 집에서 걱정돼요. 퇴원 후 7일 안심팩, 약, 식사, 통증, 다음 외래 확인이 필요합니다.'
  },
  {
    code: 'documents',
    title: '보험서류가 필요해요',
    description: '영수증, 세부내역서, 처방전, 통원확인서를 챙깁니다.',
    example: '예: 실손보험 청구 서류가 뭔지 잘 모르겠어요.',
    emoji: '📄',
    rawText: '보험서류가 필요해요. 영수증, 세부내역서, 처방전, 통원확인서, 실손보험 서류 확인이 필요합니다.'
  },
  {
    code: 'routine',
    title: '정기진료를 계속 챙겨야 해요',
    description: '다음 예약 후보와 가족 할 일을 자동으로 정리합니다.',
    example: '예: 당뇨·혈압 진료를 매달 챙겨야 해요.',
    emoji: '📅',
    rawText: '정기진료를 계속 챙겨야 해요. 다음 예약, 반복 진료, 가족 할 일 정리가 필요합니다.'
  },
  {
    code: 'social',
    title: '비용이나 돌봄 공백이 걱정돼요',
    description: '공공지원, 후원 쿠폰, 식사 지원, 무료 안부 확인을 검토합니다.',
    example: '예: 병원비와 식사비가 부담되고 가까운 가족이 없어요.',
    emoji: '🤝',
    rawText: '비용이나 돌봄 공백이 걱정돼요. 공공지원, 후원 쿠폰, 식사 지원, 안부 확인 연결이 필요합니다.'
  },
  {
    code: 'not_sure',
    title: '뭘 해야 할지 모르겠어요',
    description: '상황만 알려주시면 운영실이 필요한 도움을 정리합니다.',
    example: '예: 정확히 뭘 신청해야 할지 모르겠어요.',
    emoji: '💬',
    rawText: '뭘 해야 할지 모르겠어요. 상황을 듣고 필요한 병원, 밥, 약, 서류, 퇴원 후 케어를 정리해주세요.'
  }
]

const contactMethods = [
  {
    code: 'phone',
    title: '전화로 설명받기',
    description: '운영실이 전화로 쉽게 정리해드립니다.'
  },
  {
    code: 'kakao',
    title: '카톡으로 이어가기',
    description: '카톡 내용이나 예약 문자를 보내도 됩니다.'
  },
  {
    code: 'photo',
    title: '사진으로 맡기기',
    description: '예약증, 약 봉투, 영수증 사진을 올리세요.'
  },
  {
    code: 'text',
    title: '한 줄만 적기',
    description: '짧게 상황만 적어도 됩니다.'
  }
] as const

export default function CareRequestPage() {
  const [selected, setSelected] = useState<WorryCode>('not_sure')
  const [elderName, setElderName] = useState('어머니')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [method, setMethod] = useState<'phone' | 'kakao' | 'photo' | 'text'>('phone')
  const [memo, setMemo] = useState('')
  const [socialCareRequested, setSocialCareRequested] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const selectedWorry = useMemo(() => {
    return worries.find((item) => item.code === selected) || worries[worries.length - 1]
  }, [selected])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    const rawText = [
      selectedWorry.rawText,
      memo ? `추가 메모: ${memo}` : '',
      method === 'phone' ? '전화 상담을 원합니다.' : '',
      method === 'kakao' ? '카톡으로 이어가고 싶습니다.' : '',
      method === 'photo' ? '사진이나 서류를 올려서 맡기고 싶습니다.' : ''
    ].filter(Boolean).join('\n')

    try {
      const response = await fetch('/api/assisted-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_request',
          elderName,
          contactName,
          contactPhone,
          channel: method === 'photo' ? 'photo' : method === 'kakao' ? 'kakao' : method === 'phone' ? 'phone' : 'text',
          rawText,
          assets: [],
          socialCareRequested
        })
      })

      const data = await response.json()

      if (!response.ok || !data.ok) {
        throw new Error(data.message || '걱정 접수 중 오류가 발생했습니다.')
      }

      setMessage('부모님 걱정이 접수됐습니다. 운영실이 필요한 도움을 정리합니다.')
      setMemo('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '걱정 접수 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppFrame title="부모님 걱정 맡기기" subtitle="기능을 고르지 말고 걱정을 선택하세요">
      <SectionHeader
        eyebrow="걱정 접수센터"
        title={
          <>
            무엇이
            <br />
            걱정되세요?
          </>
        }
        description="정확히 몰라도 괜찮습니다. 가장 비슷한 걱정만 누르면 운영실이 케어 플랜으로 정리합니다."
        actions={
          <CareButton href="/care-intake" tone="dark">
            사진·카톡으로 바로 맡기기
          </CareButton>
        }
      />

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        {worries.map((worry) => (
          <button
            key={worry.code}
            type="button"
            onClick={() => setSelected(worry.code)}
            className={
              'rounded-[2rem] border p-5 text-left transition md:p-6 ' +
              (selected === worry.code
                ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                : 'border-slate-200 bg-white hover:bg-slate-50')
            }
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">{worry.emoji}</div>
              <div>
                <h2 className="text-2xl font-black">{worry.title}</h2>
                <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{worry.description}</p>
                <p className="mt-3 rounded-2xl bg-white/70 p-3 text-sm leading-6 text-slate-500">
                  {worry.example}
                </p>
              </div>
            </div>
          </button>
        ))}
      </section>

      <form onSubmit={submit} className="mt-8 space-y-6">
        <CareCard tone="white">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill text="선택한 걱정" tone="green" />
            <StatusPill text={selectedWorry.title} tone="slate" />
          </div>

          <h2 className="mt-4 text-3xl font-black">어떻게 이어가면 좋을까요?</h2>
          <p className="mt-2 text-base font-bold leading-7 text-slate-600">
            앱 입력이 어렵다면 전화나 카톡으로 이어가면 됩니다.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {contactMethods.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => setMethod(item.code)}
                className={
                  'rounded-3xl border p-4 text-left transition ' +
                  (method === item.code
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 bg-slate-50 hover:bg-white')
                }
              >
                <div className="text-lg font-black">{item.title}</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </button>
            ))}
          </div>
        </CareCard>

        <CareCard tone="white">
          <h2 className="text-3xl font-black">연락받을 정보</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <label>
              <span className="mb-2 block text-sm font-black text-slate-700">부모님</span>
              <input
                value={elderName}
                onChange={(event) => setElderName(event.target.value)}
                className="tap-target w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-emerald-500"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-black text-slate-700">보호자 이름</span>
              <input
                value={contactName}
                onChange={(event) => setContactName(event.target.value)}
                className="tap-target w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-emerald-500"
                placeholder="예: 이관용"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-black text-slate-700">연락처</span>
              <input
                value={contactPhone}
                onChange={(event) => setContactPhone(event.target.value)}
                className="tap-target w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-emerald-500"
                placeholder="010-1234-5678"
              />
            </label>
          </div>

          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-black text-slate-700">상황 메모</span>
            <textarea
              value={memo}
              onChange={(event) => setMemo(event.target.value)}
              rows={5}
              className="w-full rounded-2xl border border-slate-200 p-4 leading-7 outline-none focus:border-emerald-500"
              placeholder="예: 어머니가 무릎이 아프고 병원 예약 문자가 왔는데, 뭘 챙겨야 할지 모르겠습니다."
            />
          </label>

          <label className="mt-5 flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
            <input
              type="checkbox"
              checked={socialCareRequested}
              onChange={(event) => setSocialCareRequested(event.target.checked)}
              className="mt-1 h-5 w-5"
            />
            <span className="text-sm font-bold leading-6 text-slate-700">
              비용 부담이 있으면 공공지원·후원 쿠폰·지역 복지 연결도 함께 안내받고 싶습니다.
            </span>
          </label>
        </CareCard>

        {message ? (
          <CareCard tone="green">
            <p className="text-lg font-black">{message}</p>
          </CareCard>
        ) : null}

        <CareButton type="submit" disabled={saving} size="xl" className="md:w-full">
          {saving ? '접수 중...' : '부모님 걱정 맡기기'}
        </CareButton>
      </form>
    </AppFrame>
  )
}
