'use client'

import { FormEvent, useMemo, useState } from 'react'
import { AppFrame } from '@/components/ui/AppFrame'
import { CareButton } from '@/components/ui/CareButton'
import { CareCard } from '@/components/ui/CareCard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { StatusPill } from '@/components/ui/StatusPill'
import { CareRequestSummaryCard } from '@/components/CareRequestSummaryCard'

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

type ContactMethod = 'phone' | 'kakao' | 'photo' | 'text'

type ChatMessage = {
  role: 'assistant' | 'user'
  text: string
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
    description: '상황만 알려주시면 운영실이 필요한 안심케어를 정리합니다.',
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

const quickPrompts = [
  '어머니 병원 예약이 있는데 혼자 가기 어려우세요.',
  '아버지가 약을 잘 챙겨 드시는지 모르겠어요.',
  '퇴원 후 식사와 통증 확인이 걱정돼요.',
  '보험서류와 영수증을 챙겨야 해요.',
  '정확히 뭘 신청해야 할지 모르겠어요.'
]

function detectWorryCode(text: string): WorryCode {
  const value = text.toLowerCase()

  if (/(병원|진료|예약|검사|외래|수납|접수|동행|응급|수술)/.test(value)) return 'hospital'
  if (/(밥|식사|끼니|도시락|반찬|회복식|영양|당뇨식|저염식)/.test(value)) return 'meal'
  if (/(약|복용|복약|약봉투|혈압약|당뇨약|처방)/.test(value)) return 'medication'
  if (/(퇴원|회복|낙상|통증|수술 후|집에서|재활)/.test(value)) return 'discharge'
  if (/(서류|보험|실손|영수증|처방전|세부내역서|통원확인서)/.test(value)) return 'documents'
  if (/(정기|반복|매달|매주|일정|캘린더|다음 예약)/.test(value)) return 'routine'
  if (/(비용|부담|무료|복지|지원|후원|돌봄 공백|공공)/.test(value)) return 'social'

  return 'not_sure'
}

function detectMethod(text: string): ContactMethod | null {
  const value = text.toLowerCase()

  if (/(전화|통화|연락)/.test(value)) return 'phone'
  if (/(카톡|카카오|문자)/.test(value)) return 'kakao'
  if (/(사진|촬영|예약증|약봉투|영수증)/.test(value)) return 'photo'
  if (/(메모|글|텍스트|한 줄)/.test(value)) return 'text'

  return null
}

function extractPhone(text: string) {
  const match = text.match(/01[016789][\s.-]?\d{3,4}[\s.-]?\d{4}/)
  return match ? match[0] : ''
}

function makeBotReply(worry: WorryOption, text: string) {
  const hasPhone = Boolean(extractPhone(text))

  return [
    `말씀해주신 내용은 “${worry.title}” 쪽 안심케어로 정리할 수 있어요.`,
    '아래 접수 영역에 상황을 반영했습니다.',
    hasPhone ? '연락처도 함께 확인했습니다.' : '연락받을 보호자 정보만 입력하면 운영실이 다음 할 일을 정리할 수 있어요.'
  ].join('\n')
}

export default function CareRequestPage() {
  const [selected, setSelected] = useState<WorryCode>('not_sure')
  const [elderName, setElderName] = useState('어머니')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [method, setMethod] = useState<ContactMethod>('phone')
  const [memo, setMemo] = useState('')
  const [socialCareRequested, setSocialCareRequested] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: '안녕하세요. 안심케어 챗봇입니다. 부모님 상황을 한 줄로 알려주시면 병원·식사·약·서류·퇴원 후 케어 중 필요한 도움을 먼저 정리해드릴게요.'
    }
  ])

  const selectedWorry = useMemo(() => {
    return worries.find((item) => item.code === selected) || worries[worries.length - 1]
  }, [selected])

  function sendChat(text: string) {
    const cleanText = text.trim()
    if (!cleanText) return

    const worryCode = detectWorryCode(cleanText)
    const worry = worries.find((item) => item.code === worryCode) || worries[worries.length - 1]
    const nextMethod = detectMethod(cleanText)
    const phone = extractPhone(cleanText)

    setSelected(worry.code)
    setMemo((current) => (current ? `${current}\n${cleanText}` : cleanText))

    if (nextMethod) setMethod(nextMethod)
    if (phone) setContactPhone(phone)
    if (/(비용|부담|무료|복지|지원|후원|돌봄 공백|공공)/.test(cleanText)) {
      setSocialCareRequested(true)
    }

    setChatMessages((current) => [
      ...current,
      { role: 'user', text: cleanText },
      { role: 'assistant', text: makeBotReply(worry, cleanText) }
    ])
    setChatInput('')
  }

  function submitChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    sendChat(chatInput)
  }

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
        throw new Error(data.message || '안심케어 접수 중 오류가 발생했습니다.')
      }

      setMessage('안심케어가 접수됐습니다. 운영실이 필요한 도움을 정리합니다.')
      setMemo('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '안심케어 접수 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppFrame title="부모님 안심케어하기" subtitle="부모님 상황을 말하면 필요한 도움을 정리합니다">
      <SectionHeader
        eyebrow="안심케어 챗봇"
        title={
          <>
            부모님 상황을 말하면
            <br />
            필요한 도움을 정리합니다.
          </>
        }
        description="정확히 몰라도 괜찮습니다. 챗봇에 한 줄로 상황을 남기면 운영실 접수에 필요한 항목을 먼저 채워드립니다."
        actions={
          <CareButton href="/care-intake" tone="dark">
            사진·카톡으로 바로 맡기기
          </CareButton>
        }
      />

      <CareCard tone="green" className="mt-8">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill text="챗봇 접수" tone="green" />
          <StatusPill text="자동 분류" tone="slate" />
          <StatusPill text={selectedWorry.title} tone="blue" />
        </div>

        <h2 className="mt-4 text-3xl font-black">안심케어 챗봇</h2>
        <p className="mt-2 text-base font-bold leading-7 text-[#4E6D69]">
          부모님 상황을 적으면 필요한 케어 유형, 연락 방식, 메모가 아래 접수 폼에 자동 반영됩니다.
        </p>

        <div className="mt-5 max-h-[28rem] space-y-3 overflow-y-auto rounded-[1.5rem] bg-white p-4">
          {chatMessages.map((item, index) => (
            <div
              key={`${item.role}-${index}`}
              className={
                'flex ' + (item.role === 'user' ? 'justify-end' : 'justify-start')
              }
            >
              <div
                className={
                  'max-w-[85%] whitespace-pre-line rounded-3xl px-4 py-3 text-sm font-bold leading-6 ' +
                  (item.role === 'user'
                    ? 'bg-[#19B99A] text-white'
                    : 'bg-[#F3FAF8] text-[#24423F]')
                }
              >
                {item.text}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => sendChat(prompt)}
              className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#426C68] ring-1 ring-[#CFE7E2] transition hover:bg-[#F2FAF8]"
            >
              {prompt}
            </button>
          ))}
        </div>

        <form onSubmit={submitChat} className="mt-4 flex flex-col gap-3 md:flex-row">
          <textarea
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            rows={2}
            className="min-h-[4.5rem] flex-1 rounded-3xl border border-[#CFE7E2] bg-white p-4 font-bold leading-7 outline-none focus:border-emerald-500"
            placeholder="예: 어머니가 무릎이 아프고 병원 예약 문자가 왔는데 혼자 가기 어려워요."
          />
          <button
            type="submit"
            className="rounded-3xl bg-[#193B38] px-6 py-4 text-base font-black text-white transition hover:bg-[#24423F]"
          >
            챗봇에게 보내기
          </button>
        </form>
      </CareCard>

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
                : 'border-[#E0EFEC] bg-white hover:bg-slate-50')
            }
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">{worry.emoji}</div>
              <div>
                <h2 className="text-2xl font-black">{worry.title}</h2>
                <p className="mt-2 text-sm font-bold leading-6 text-[#63807C]">{worry.description}</p>
                <p className="mt-3 rounded-2xl bg-white/70 p-3 text-sm leading-6 text-[#7A9692]">
                  {worry.example}
                </p>
              </div>
            </div>
          </button>
        ))}
      </section>

      <form onSubmit={submit} className="mt-8 space-y-6">
        <CareRequestSummaryCard
          request={{
            request_title: selectedWorry.title,
            request_type: selected,
            elder_name: elderName,
            guardian_name: contactName,
            guardian_phone: contactPhone,
            region_text: '상담 후 확인',
            meeting_location: method === 'phone' ? '전화 상담' : method === 'kakao' ? '카톡 상담' : '상담 후 확인',
            required_specialties: [selectedWorry.title],
            required_service_scopes: [selectedWorry.description],
            raw_text: memo || selectedWorry.rawText
          }}
          compact
        />

        <CareCard tone="white">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill text="추천 안심케어" tone="green" />
            <StatusPill text={selectedWorry.title} tone="slate" />
          </div>

          <h2 className="mt-4 text-3xl font-black">어떻게 이어가면 좋을까요?</h2>
          <p className="mt-2 text-base font-bold leading-7 text-[#63807C]">
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
                    : 'border-[#E0EFEC] bg-slate-50 hover:bg-white')
                }
              >
                <div className="text-lg font-black">{item.title}</div>
                <p className="mt-2 text-sm leading-6 text-[#63807C]">{item.description}</p>
              </button>
            ))}
          </div>
        </CareCard>

        <CareCard tone="white">
          <h2 className="text-3xl font-black">연락받을 정보</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <label>
              <span className="mb-2 block text-sm font-black text-[#4E6D69]">부모님</span>
              <input
                value={elderName}
                onChange={(event) => setElderName(event.target.value)}
                className="tap-target w-full rounded-2xl border border-[#E0EFEC] p-4 outline-none focus:border-emerald-500"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-black text-[#4E6D69]">보호자 이름</span>
              <input
                value={contactName}
                onChange={(event) => setContactName(event.target.value)}
                className="tap-target w-full rounded-2xl border border-[#E0EFEC] p-4 outline-none focus:border-emerald-500"
                placeholder="예: 홍길동"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-black text-[#4E6D69]">연락처</span>
              <input
                value={contactPhone}
                onChange={(event) => setContactPhone(event.target.value)}
                className="tap-target w-full rounded-2xl border border-[#E0EFEC] p-4 outline-none focus:border-emerald-500"
                placeholder="010-1234-5678"
              />
            </label>
          </div>

          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-black text-[#4E6D69]">상황 메모</span>
            <textarea
              value={memo}
              onChange={(event) => setMemo(event.target.value)}
              rows={5}
              className="w-full rounded-2xl border border-[#E0EFEC] p-4 leading-7 outline-none focus:border-emerald-500"
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
            <span className="text-sm font-bold leading-6 text-[#4E6D69]">
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
          {saving ? '접수 중...' : '부모님 안심케어 신청하기'}
        </CareButton>
      </form>
    </AppFrame>
  )
}
