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
  '응급상황도 처리하나요?',
  '추천인 포인트가 궁금해요',
  '문의는 어디로 하나요?'
]

const faq = [
  {
    title: '안부웍스가 뭐예요?',
    keywords: ['뭐', '무엇', '소개', '안부웍스', '플랫폼', '서비스'],
    answer:
      '안부웍스는 부모님 안부를 단순히 묻고 끝내지 않고, 미응답·불편·도움 요청이 생겼을 때 누가 확인했고 어떤 결과였는지 안부완료 리포트로 남기는 비의료 안부케어 서비스입니다.'
  },
  {
    title: '요금제가 궁금해요',
    keywords: ['요금', '가격', '얼마', '결제', '9900', '299000', '비용'],
    answer:
      '현재 요금제는 2가지입니다.\n\n1. 안부완료 리포트: 월 9,900원\n- 가족이 직접 확인하고 기록하는 기본 구독입니다.\n- 방문 인력은 포함되지 않습니다.\n\n2. 퇴원 후 2주 안부케어: 299,000원\n- 14일 안부확인, 미응답 재확인, 운영실 확인, 생활확인 파트너 확인 3회, 종료 리포트가 포함됩니다.'
  },
  {
    title: '2주 케어는 뭐가 포함돼요?',
    keywords: ['2주', '14일', '케어', '퇴원', '299000', '299,000', '파트너', '생활확인'],
    answer:
      '퇴원 후 2주 안부케어는 299,000원입니다.\n\n포함 내용은 다음과 같습니다.\n- 14일 안부 확인\n- 미응답 재확인\n- 운영실 확인\n- 생활확인 파트너 확인 3회 포함\n- 14일 종료 안부완료 리포트\n\n의료 진단이나 응급구조를 대신하는 서비스는 아닙니다.'
  },
  {
    title: '부모님은 어떻게 사용하나요?',
    keywords: ['부모님', '사용', '입력', '버튼', '괜찮아요', '불편', '도움'],
    answer:
      '부모님은 복잡한 내용을 입력하지 않고 3가지 중 하나만 누르면 됩니다.\n\n- 괜찮아요\n- 조금 불편해요\n- 도움이 필요해요\n\n불편 또는 도움 요청이 있으면 보호자 화면에 확인 사건이 만들어지고, 보호자가 전화나 방문 확인 결과를 남길 수 있습니다.'
  },
  {
    title: '보호자는 뭘 보면 되나요?',
    keywords: ['보호자', '자녀', '가족', '화면', '대시보드', '리포트', '확인'],
    answer:
      '보호자는 보호자 화면에서 오늘 할 일, 미완료 확인 사건, 확인 완료 기록, 안부완료 리포트를 확인합니다.\n\n핵심은 “오늘 부모님께 전화해야 하는지”, “누가 확인했는지”, “결과가 무엇인지”를 기록으로 남기는 것입니다.'
  },
  {
    title: '응급상황도 처리하나요?',
    keywords: ['응급', '119', '병원', '의료', '진단', '치료', '구조'],
    answer:
      '안부웍스는 의료 진단, 치료, 응급구조를 제공하거나 대체하지 않습니다.\n\n낙상, 의식저하, 호흡곤란, 심한 통증 등 응급상황이 의심되면 앱보다 먼저 119 또는 의료기관에 연락해야 합니다.\n\n안부웍스는 일상 안부 확인과 확인 결과 기록을 돕는 비의료 서비스입니다.'
  },
  {
    title: '추천인 포인트가 궁금해요',
    keywords: ['추천', '추천인', '포인트', '5000', '5,000', '코드'],
    answer:
      '추천받은 분이 유료 결제까지 완료하면 추천인에게 서비스 포인트 5,000P를 지급합니다.\n\n포인트는 안부웍스 이용료 차감용이며, 현금 환불은 불가합니다. 무료 실증 신청만으로는 포인트가 확정되지 않습니다.'
  },
  {
    title: '문의는 어디로 하나요?',
    keywords: ['문의', '메일', '이메일', '고객센터', '상담', '연락'],
    answer:
      `고객센터 이메일은 ${SUPPORT_EMAIL} 입니다.\n\n서비스 신청, 결제, 이용 방법, 제휴 문의는 고객센터 메일로 보내주세요. 확인 후 순차적으로 답변드립니다.`
  },
  {
    title: '스마트링도 사용하나요?',
    keywords: ['스마트링', '반지', '링', '기기', '센서'],
    answer:
      '스마트링은 필수 상품이 아니라 선택형 실증 장비입니다.\n\n안부웍스의 핵심은 반지가 아니라, 부모님 안부 확인이 필요한 상황을 확인 사건으로 만들고 누가 확인했는지 안부완료 리포트로 남기는 구조입니다.'
  },
  {
    title: '환불이나 취소가 궁금해요',
    keywords: ['환불', '취소', '해지', '중단'],
    answer:
      `환불, 취소, 해지는 이용 상태와 서비스 진행 여부에 따라 확인이 필요합니다.\n\n고객센터 ${SUPPORT_EMAIL} 로 성함, 연락처, 신청 상품을 보내주시면 확인 후 안내드리겠습니다.`
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

  if (!clean) {
    return '궁금한 내용을 입력해 주세요. 예: 요금제, 2주 케어, 부모님 사용법, 고객센터 문의'
  }

  let best = faq[0]
  let bestScore = 0

  for (const item of faq) {
    let score = 0

    for (const keyword of item.keywords) {
      const key = normalize(keyword)
      if (clean.includes(key)) score += key.length >= 3 ? 3 : 1
    }

    if (score > bestScore) {
      best = item
      bestScore = score
    }
  }

  if (bestScore > 0) return best.answer

  return (
    '지금 질문은 자동 답변으로 정확히 찾지 못했습니다.\n\n' +
    `고객센터 ${SUPPORT_EMAIL} 로 문의해 주시면 확인 후 답변드리겠습니다.\n\n` +
    '자주 묻는 질문: 요금제, 2주 케어, 부모님 사용법, 보호자 화면, 응급상황, 추천인 포인트'
  )
}

function initialMessages(): Message[] {
  return [
    {
      role: 'bot',
      text:
        '안녕하세요. 안부웍스 고객센터입니다.\n\n궁금한 내용을 선택하거나 직접 입력해 주세요.'
    }
  ]
}

function ChatBox({ mode }: { mode: SupportMode }) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [copied, setCopied] = useState(false)

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

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className={mode === 'page' ? 'mx-auto max-w-5xl' : ''}>
      <div className="overflow-hidden rounded-[2rem] bg-white shadow-[0_18px_52px_rgba(49,151,136,0.14)] ring-1 ring-[#D6EDE7]">
        <div className="bg-[#EFFFFA] p-5 ring-1 ring-[#CDEFE7]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-black text-[#247A71]">
                안부웍스 고객센터
              </div>
              <h2 className="mt-1 text-2xl font-black tracking-[-0.06em] text-[#17443F]">
                궁금한 점을 바로 확인하세요
              </h2>
              <p className="mt-2 text-sm font-bold leading-6 text-[#637B76]">
                요금제, 2주 케어, 부모님 사용법, 결제, 추천인 포인트를 빠르게 안내합니다.
              </p>
            </div>

            <div className="hidden rounded-2xl bg-white px-4 py-3 text-3xl ring-1 ring-[#D6EDE7] sm:block">
              💬
            </div>
          </div>
        </div>

        <div className={mode === 'page' ? 'grid gap-0 lg:grid-cols-[0.95fr_1.05fr]' : ''}>
          <div className="border-b border-[#EDF6F3] p-4 lg:border-b-0 lg:border-r">
            <div className="text-xs font-black text-[#637B76]">
              빠른 질문
            </div>

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
              <div className="text-xs font-black text-[#637B76]">
                고객센터 이메일
              </div>

              <div className="mt-1 break-all text-base font-black text-[#17443F]">
                {SUPPORT_EMAIL}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={copyEmail}
                  className="rounded-xl bg-white px-3 py-2 text-xs font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
                >
                  {copied ? '복사됨' : '이메일 복사'}
                </button>

                <a
                  href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('[안부웍스 문의]')}`}
                  className="rounded-xl bg-[#17443F] px-3 py-2 text-xs font-black text-white"
                >
                  메일 보내기
                </a>
              </div>
            </div>
          </div>

          <div className="flex min-h-[420px] flex-col p-4">
            <div className="flex-1 space-y-3 overflow-auto rounded-2xl bg-[#FAFFFD] p-4 ring-1 ring-[#EDF6F3]">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={
                    'flex ' +
                    (message.role === 'user' ? 'justify-end' : 'justify-start')
                  }
                >
                  <div
                    className={
                      'max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm font-bold leading-7 ' +
                      (message.role === 'user'
                        ? 'bg-[#247A71] text-white'
                        : 'bg-white text-[#315E58] ring-1 ring-[#D6EDE7]')
                    }
                  >
                    {message.text}
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

            <p className="mt-3 text-xs font-bold leading-5 text-[#8AA09B]">
              자동 답변은 기본 안내용입니다. 개인별 신청·결제·이용 상태 확인은 고객센터 이메일로 문의해 주세요.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export function AnbuSupportCenter({ mode = 'widget' }: { mode?: SupportMode }) {
  const pathname = usePathname() || ''
  const [open, setOpen] = useState(false)

  const shouldHideWidget = useMemo(() => {
    return hiddenWidgetPathPrefixes.some((prefix) => pathname.startsWith(prefix))
  }, [pathname])

  if (mode === 'page') {
    return <ChatBox mode="page" />
  }

  if (shouldHideWidget) return null

  return (
    <>
      {open ? (
        <div className="fixed bottom-5 right-4 z-50 w-[calc(100vw-2rem)] max-w-[420px]">
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full bg-[#17443F] px-4 py-2 text-xs font-black text-white shadow-lg"
            >
              닫기
            </button>
          </div>

          <ChatBox mode="widget" />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-4 z-50 rounded-full bg-[#17443F] px-5 py-4 text-sm font-black text-white shadow-[0_18px_40px_rgba(23,68,63,0.28)]"
        >
          고객센터 💬
        </button>
      )}
    </>
  )
}
