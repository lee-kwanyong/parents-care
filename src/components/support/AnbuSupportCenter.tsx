'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo, useState } from 'react'

type Message = {
  role: 'user' | 'bot'
  text: string
}

type SupportMode = 'widget' | 'page'

const SUPPORT_EMAIL = 'mixer0326@gmail.com'

const hiddenWidgetPathPrefixes = [
  '/admin',
  '/mobile/parent',
  '/parent',
  '/reports/anbu'
]

const quickQuestions = [
  '안부웍스가 뭐예요?',
  '요금제가 궁금해요',
  '2주 케어는 뭐가 포함돼요?',
  '부모님은 어떻게 사용하나요?',
  '보호자는 뭘 보면 되나요?',
  '응급상황이면 어떻게 하나요?',
  '추천인 포인트가 궁금해요',
  '문의는 어떻게 남기나요?'
]

const faq = [
  {
    keywords: ['안부웍스', '소개', '뭐예요', '무엇', '서비스', '플랫폼'],
    answer:
      '안부웍스는 부모님의 안부를 단순히 묻고 끝내지 않고, 미응답·불편·도움 요청이 생겼을 때 누가 확인했고 어떤 결과였는지 안부완료 리포트로 남기는 비의료 안부케어 서비스입니다.'
  },
  {
    keywords: ['요금', '가격', '얼마', '결제', '9,900', '9900', '299000', '299,000'],
    answer:
      '현재 요금제는 2가지입니다.\n\n1. 안부완료 리포트: 월 9,900원\n- 가족이 직접 확인하고 기록하는 기본 구독\n- 방문 인력 포함 없음\n\n2. 퇴원 후 2주 안부케어: 299,000원\n- 14일 안부확인\n- 미응답 재확인\n- 운영실 확인\n- 생활확인 파트너 확인 3회\n- 종료 안부완료 리포트'
  },
  {
    keywords: ['2주', '14일', '케어', '퇴원', '파트너'],
    answer:
      '퇴원 후 2주 안부케어는 퇴원 직후 집중 확인이 필요한 경우를 위한 상품입니다.\n\n포함 내용:\n- 14일 안부 확인\n- 미응답 재확인\n- 운영실 확인\n- 생활확인 파트너 확인 3회\n- 종료 안부완료 리포트'
  },
  {
    keywords: ['부모님', '사용', '버튼', '입력', '괜찮아요', '도움이 필요해요', '조금 불편해요'],
    answer:
      '부모님은 복잡하게 입력하지 않고 3가지 중 하나만 누르면 됩니다.\n\n- 괜찮아요\n- 조금 불편해요\n- 도움이 필요해요\n\n불편 또는 도움 요청이 생기면 보호자 화면에 확인 사건이 생성되고, 보호자가 결과를 기록할 수 있습니다.'
  },
  {
    keywords: ['보호자', '자녀', '대시보드', '리포트', '확인'],
    answer:
      '보호자는 보호자 화면에서 오늘 할 일, 미완료 확인 사건, 확인 완료 기록, 안부완료 리포트를 확인합니다.\n\n핵심은 “오늘 부모님께 전화해야 하는지”, “누가 확인했는지”, “결과가 무엇인지”를 기록으로 남기는 것입니다.'
  },
  {
    keywords: ['응급', '119', '병원', '의료', '진단', '치료', '구조'],
    answer:
      '안부웍스는 의료 진단·치료·응급구조를 제공하거나 대체하지 않습니다.\n\n낙상, 의식저하, 호흡곤란, 심한 통증 등 응급상황이 의심되면 앱보다 먼저 119 또는 의료기관에 연락해야 합니다.'
  },
  {
    keywords: ['추천', '포인트', '5000', '5,000', '추천인'],
    answer:
      '추천받은 분이 유료 결제까지 완료하면 추천인에게 서비스 포인트 5,000P를 지급합니다.\n\n포인트는 이용료 차감용이며 현금 환불은 불가합니다.'
  },
  {
    keywords: ['문의', '상담', '연락', '남기기', '작성'],
    answer:
      '아래 문의 작성 칸에 이름과 연락처, 문의 내용을 남겨주시면 운영자에게 바로 전달됩니다.\n\n자동 답변으로 부족한 내용은 운영자가 직접 확인해 안내드립니다.'
  },
  {
    keywords: ['스마트링', '반지', '링'],
    answer:
      '안부웍스의 핵심은 스마트링이 아니라, 부모님 안부 확인이 필요한 상황을 확인 사건으로 만들고 누가 확인했는지 안부완료 리포트로 남기는 구조입니다.'
  }
]

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^\w가-힣0-9]/g, '')
}

function findAnswer(input: string) {
  const clean = normalize(input)
  if (!clean) return '궁금한 내용을 입력해 주세요. 예: 요금제, 2주 케어, 부모님 사용법, 문의 남기기'

  let bestAnswer = ''
  let bestScore = 0

  for (const item of faq) {
    let score = 0
    for (const keyword of item.keywords) {
      const key = normalize(keyword)
      if (clean.includes(key)) {
        score += key.length >= 3 ? 3 : 1
      }
    }
    if (score > bestScore) {
      bestScore = score
      bestAnswer = item.answer
    }
  }

  if (bestScore > 0) return bestAnswer

  return (
    '정확한 자동 답변을 찾지 못했어요.\n\n' +
    '아래 문의 작성 칸에 남겨주시면 운영자에게 바로 전달되고, 확인 후 안내드립니다.\n\n' +
    '자주 묻는 질문: 요금제, 2주 케어, 부모님 사용법, 보호자 화면, 응급상황, 추천인 포인트'
  )
}

function initialMessages(): Message[] {
  return [
    {
      role: 'bot',
      text:
        '안녕하세요. 안부웍스 고객센터입니다.\n\n궁금한 내용을 선택하거나 직접 입력해 주세요.\n자동 답변으로 부족하면 아래 문의 작성으로 바로 남길 수 있습니다.'
    }
  ]
}

function ChatCore({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname() || ''
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [category, setCategory] = useState('general')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitState, setSubmitState] = useState('')

  function ask(text: string) {
    const question = text.trim()
    if (!question) return

    const answer = findAnswer(question)

    setMessages((prev) => [
      ...prev,
      { role: 'user', text: question },
      { role: 'bot', text: answer }
    ])
    setInput('')
  }

  async function submitInquiry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!name.trim()) {
      setSubmitState('이름을 입력해 주세요.')
      return
    }

    if (message.trim().length < 5) {
      setSubmitState('문의 내용을 조금 더 자세히 입력해 주세요.')
      return
    }

    setSubmitting(true)
    setSubmitState('')

    try {
      const response = await fetch('/api/support/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          name,
          phone,
          email,
          category,
          message,
          pagePath: pathname
        })
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || result.ok === false) {
        throw new Error(result.message || '문의 접수에 실패했습니다.')
      }

      setSubmitState('문의가 접수되었습니다. 운영자가 확인 후 연락드릴게요.')
      setMessage('')
    } catch (error) {
      setSubmitState(error instanceof Error ? error.message : '문의 접수 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-[2rem] bg-white shadow-[0_18px_52px_rgba(49,151,136,0.14)] ring-1 ring-[#D6EDE7]">
      <div className="bg-[#EFFFFA] p-5 ring-1 ring-[#CDEFE7]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-black text-[#247A71]">안부웍스 고객센터</div>
            <h2 className="mt-1 text-2xl font-black tracking-[-0.06em] text-[#17443F]">
              궁금한 점을 바로 확인하세요
            </h2>
            <p className="mt-2 text-sm font-bold leading-6 text-[#637B76]">
              기본 안내는 자동으로 답변하고, 구체적인 문의는 바로 접수됩니다.
            </p>
          </div>

          <div className="hidden rounded-2xl bg-white px-4 py-3 text-3xl ring-1 ring-[#D6EDE7] sm:block">
            💬
          </div>
        </div>
      </div>

      <div className={compact ? '' : 'grid gap-0 lg:grid-cols-[0.95fr_1.05fr]'}>
        <div className="border-b border-[#EDF6F3] p-4 lg:border-b-0 lg:border-r">
          <div className="text-xs font-black text-[#637B76]">빠른 질문</div>

          <div className="mt-3 flex flex-wrap gap-2">
            {quickQuestions.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => ask(question)}
                className="rounded-full bg-[#FAFFFD] px-3 py-2 text-xs font-black text-[#247A71] ring-1 ring-[#D6EDE7]"
              >
                {question}
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-2xl bg-[#F7FFFC] p-4 ring-1 ring-[#D6EDE7]">
            <div className="text-xs font-black text-[#637B76]">기본 설명</div>
            <ul className="mt-3 space-y-2 text-sm font-bold leading-6 text-[#315E58]">
              <li>• 부모님은 3버튼만 누르면 됩니다.</li>
              <li>• 보호자는 확인 사건과 안부완료 리포트를 봅니다.</li>
              <li>• 의료서비스가 아니라 비의료 안부확인 서비스입니다.</li>
              <li>• 필요한 경우 아래 문의 작성으로 바로 접수할 수 있습니다.</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col p-4">
          <div className="flex-1 space-y-3 overflow-auto rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#EDF6F3]">
            {messages.map((item, index) => (
              <div
                key={`${item.role}-${index}`}
                className={item.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
              >
                <div
                  className={
                    'max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm font-bold leading-7 ' +
                    (item.role === 'user'
                      ? 'bg-[#247A71] text-white'
                      : 'bg-white text-[#315E58] ring-1 ring-[#D6EDE7]')
                  }
                >
                  {item.text}
                </div>
              </div>
            ))}
          </div>

          <form
            className="mt-3 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              ask(input)
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="궁금한 점을 입력하세요"
              className="min-w-0 flex-1 rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-black text-[#17443F] outline-none focus:border-[#2AA897] focus:ring-4 focus:ring-[#D8FFF3]"
            />
            <button
              type="submit"
              className="rounded-2xl bg-[#17443F] px-4 py-3 text-sm font-black text-white"
            >
              전송
            </button>
          </form>

          <form onSubmit={submitInquiry} className="mt-4 rounded-2xl bg-[#F7FFFC] p-4 ring-1 ring-[#D6EDE7]">
            <div className="text-sm font-black text-[#247A71]">문의 작성</div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input
                value={name}
                onChange={(event) => setName(event.target.value.slice(0, 50))}
                placeholder="이름"
                className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-black text-[#17443F] outline-none focus:border-[#2AA897] focus:ring-4 focus:ring-[#D8FFF3]"
              />
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value.slice(0, 30))}
                placeholder="연락처"
                className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-black text-[#17443F] outline-none focus:border-[#2AA897] focus:ring-4 focus:ring-[#D8FFF3]"
              />
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value.slice(0, 100))}
                placeholder="이메일(선택)"
                className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-black text-[#17443F] outline-none focus:border-[#2AA897] focus:ring-4 focus:ring-[#D8FFF3]"
              />
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-black text-[#17443F] outline-none focus:border-[#2AA897] focus:ring-4 focus:ring-[#D8FFF3]"
              >
                <option value="general">일반 문의</option>
                <option value="pricing">요금/결제 문의</option>
                <option value="service">서비스 이용 문의</option>
                <option value="care">2주 안부케어 문의</option>
                <option value="partnership">제휴 문의</option>
                <option value="refund">환불/취소 문의</option>
              </select>
            </div>

            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value.slice(0, 4000))}
              placeholder="문의 내용을 입력하세요"
              rows={5}
              className="mt-3 w-full rounded-2xl border border-[#D6EDE7] bg-white px-4 py-3 text-sm font-bold leading-7 text-[#17443F] outline-none focus:border-[#2AA897] focus:ring-4 focus:ring-[#D8FFF3]"
            />

            <button
              type="submit"
              disabled={submitting}
              className="mt-3 w-full rounded-2xl bg-[#17443F] px-4 py-3 text-sm font-black text-white disabled:opacity-60"
            >
              {submitting ? '접수 중...' : '문의 남기기'}
            </button>

            {submitState ? (
              <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm font-black leading-6 text-[#315E58] ring-1 ring-[#D6EDE7]">
                {submitState}
              </div>
            ) : null}
          </form>
        </div>
      </div>
    </div>
  )
}

export function AnbuSupportCenter({ mode = 'widget' }: { mode?: SupportMode }) {
  const pathname = usePathname() || ''
  const [open, setOpen] = useState(false)

  const shouldHideWidget = useMemo(() => {
    return hiddenWidgetPathPrefixes.some((prefix) => pathname.startsWith(prefix))
  }, [pathname])

  if (mode === 'page') {
    return <ChatCore />
  }

  if (shouldHideWidget) return null

  return (
    <>
      {open ? (
        <div className="fixed bottom-[6.3rem] right-4 z-50 w-[calc(100vw-2rem)] max-w-[420px] md:bottom-5">
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full bg-[#17443F] px-4 py-2 text-xs font-black text-white shadow-lg"
            >
              닫기
            </button>
          </div>

          <ChatCore compact />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-[6.3rem] right-4 z-50 rounded-full bg-[#17443F] px-5 py-4 text-sm font-black text-white shadow-[0_18px_40px_rgba(23,68,63,0.28)] md:bottom-5"
        >
          고객센터 💬
        </button>
      )}
    </>
  )
}
