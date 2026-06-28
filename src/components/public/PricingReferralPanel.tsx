'use client'

import Link from 'next/link'
import { useMemo, useState, type FormEvent } from 'react'

type Props = {
  compact?: boolean
}

const plans = [
  {
    code: 'post-discharge-14',
    badge: '퇴원 직후 추천',
    title: '퇴원 후 14일 케어',
    price: '14일 무료 실증',
    subPrice: '정식가 49,000원 예정',
    desc: '퇴원 후 혼자 계신 부모님의 14일 안부를 확인하고, 미응답·불편·도움 요청이 생기면 확인완료 리포트로 남깁니다.',
    features: [
      '14일 집중 안부 확인',
      '미응답 재확인',
      '불편·도움 요청 즉시 확인 사건 생성',
      '보호자 전화 확인 결과 기록',
      '14일 종료 안부완료 리포트'
    ],
    cta: '14일 실증 신청'
  },
  {
    code: 'monthly-report-9900',
    badge: '월 구독',
    title: '안부완료 리포트',
    price: '월 9,900원',
    subPrice: '부모님 1명 기준',
    desc: '정상 응답은 조용히 저장하고, 확인이 필요한 상황만 사건으로 관리해 매일·매주 리포트로 정리합니다.',
    features: [
      '부모님 3버튼 안부 입력',
      '확인필요 사건함',
      '담당자 지정',
      '전화·방문 결과 입력',
      '안부완료 리포트 저장·공유'
    ],
    cta: '월 9,900원 시작'
  }
]

const referralPoint = 5000

function onlyDigits(value: string) {
  return value.replace(/[^\d]/g, '')
}

function makeReferralCode(name: string, phone: string) {
  const cleanName = name
    .trim()
    .replace(/[^가-힣a-zA-Z0-9]/g, '')
    .slice(0, 4)
    .toUpperCase()

  const last4 = onlyDigits(phone).slice(-4) || Math.random().toString().slice(2, 6)

  return `ANBU${last4}${cleanName ? '-' + cleanName : ''}`
}

export function PricingReferralPanel({ compact = false }: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [planCode, setPlanCode] = useState('post-discharge-14')
  const [referralCode, setReferralCode] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [generatedCode, setGeneratedCode] = useState('')

  const selectedPlan = useMemo(
    () => plans.find((item) => item.code === planCode) || plans[0],
    [planCode]
  )

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!name.trim()) {
      setMessage('이름을 입력해주세요.')
      return
    }

    if (onlyDigits(phone).length < 8) {
      setMessage('연락처를 입력해주세요.')
      return
    }

    setSaving(true)
    setMessage('')

    const nextCode = makeReferralCode(name, phone)

    try {
      const response = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          name,
          phone,
          planCode,
          planTitle: selectedPlan.title,
          referralCode,
          generatedCode: nextCode,
          pointAmount: referralPoint,
          source: 'pricing_page'
        })
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok || result.ok === false) {
        throw new Error(result.message || '신청 저장에 실패했습니다.')
      }

      setGeneratedCode(String(result.referralCode || nextCode))
      setMessage(
        result.persisted
          ? '신청이 접수되었습니다. 추천인코드는 아래에서 복사할 수 있습니다.'
          : '신청 내용은 화면에 생성됐습니다. 서버 저장은 일부 실패했지만 코드 복사는 가능합니다.'
      )
    } catch (error) {
      setGeneratedCode(nextCode)
      setMessage(error instanceof Error ? error.message : '신청 저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function copyCode() {
    if (!generatedCode) return

    try {
      await navigator.clipboard.writeText(generatedCode)
      setMessage('추천인코드를 복사했습니다.')
    } catch {
      setMessage('복사에 실패했습니다. 코드를 직접 선택해서 복사해주세요.')
    }
  }

  return (
    <section className="rounded-[2rem] bg-white/95 p-5 shadow-sm ring-1 ring-[#D6EDE7] sm:p-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex rounded-full bg-[#EFFFFA] px-4 py-2 text-sm font-black text-[#247A71] ring-1 ring-[#CDEFE7]">
            요금제
          </div>

          <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-0.07em]">
            부모님 안부,
            <br />
            확인 완료까지.
          </h2>

          <p className="mt-4 max-w-3xl text-sm font-bold leading-7 text-[#637B76] sm:text-base">
            안부웍스는 단순 알림 앱이 아니라, 확인필요 상황을 담당자 지정·전화 확인·결과 입력·안부완료 리포트까지 연결하는 비의료 안부확인 서비스입니다.
          </p>
        </div>

        <Link
          href="/pricing"
          className="rounded-2xl bg-[#17443F] px-5 py-4 text-center text-sm font-black text-white"
        >
          전체 요금제 보기
        </Link>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {plans.map((plan) => (
          <article
            key={plan.code}
            className="flex flex-col rounded-[2rem] bg-[#FAFFFD] p-5 ring-1 ring-[#D6EDE7] sm:p-6"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#247A71] ring-1 ring-[#D6EDE7]">
                {plan.badge}
              </span>
              {plan.code === 'monthly-report-9900' ? (
                <span className="rounded-full bg-[#FFF9EE] px-3 py-1 text-xs font-black text-[#795C22] ring-1 ring-[#F3DEB5]">
                  월 9,900원
                </span>
              ) : null}
            </div>

            <h3 className="mt-5 text-3xl font-black tracking-[-0.07em]">{plan.title}</h3>

            <div className="mt-4">
              <div className="text-4xl font-black tracking-[-0.08em] text-[#17443F]">
                {plan.price}
              </div>
              <div className="mt-1 text-sm font-black text-[#637B76]">{plan.subPrice}</div>
            </div>

            <p className="mt-4 text-sm font-bold leading-7 text-[#637B76]">{plan.desc}</p>

            <ul className="mt-5 space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2 text-sm font-black leading-6 text-[#315E58]">
                  <span className="text-[#2AA897]">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href={compact ? '/pricing' : '#referral-form'}
              className="mt-6 rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
            >
              {plan.cta}
            </Link>
          </article>
        ))}
      </div>

      <div className="mt-5 rounded-[2rem] bg-[#EFFFFA] p-5 ring-1 ring-[#CDEFE7] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-black text-[#247A71]">추천인 프로그램</div>
            <h3 className="mt-2 text-3xl font-black tracking-[-0.07em] text-[#17443F]">
              추천인코드로 가입하면 5,000P
            </h3>
            <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
              추천 성사 시 서비스 포인트 5,000P를 지급합니다. 포인트는 안부완료 리포트 또는 14일 케어 이용료에서 차감할 수 있으며 현금 환불은 불가합니다.
            </p>
          </div>

          <Link
            href="/pricing#referral-form"
            className="rounded-2xl bg-[#247A71] px-5 py-4 text-center text-sm font-black text-white"
          >
            추천인코드 만들기
          </Link>
        </div>
      </div>

      {!compact ? (
        <form
          id="referral-form"
          onSubmit={submit}
          className="mt-6 rounded-[2rem] bg-white p-5 ring-1 ring-[#D6EDE7] sm:p-6"
        >
          <div className="inline-flex rounded-full bg-[#FFF9EE] px-4 py-2 text-sm font-black text-[#795C22] ring-1 ring-[#F3DEB5]">
            신청·추천인코드
          </div>

          <h3 className="mt-4 text-3xl font-black tracking-[-0.07em]">
            실증 신청 또는 추천인코드 생성
          </h3>

          <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">
            신청 정보는 안부웍스 운영팀이 확인합니다. 추천인코드를 입력하면 추천 포인트 5,000P가 함께 기록됩니다.
          </p>

          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            <input
              value={name}
              onChange={(event) => setName(event.target.value.slice(0, 30))}
              placeholder="이름"
              className="rounded-2xl border border-[#D6EDE7] bg-white px-5 py-4 text-sm font-black outline-none focus:border-[#2AA897] focus:ring-4 focus:ring-[#D8FFF3]"
            />

            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value.slice(0, 20))}
              placeholder="연락처"
              className="rounded-2xl border border-[#D6EDE7] bg-white px-5 py-4 text-sm font-black outline-none focus:border-[#2AA897] focus:ring-4 focus:ring-[#D8FFF3]"
            />

            <select
              value={planCode}
              onChange={(event) => setPlanCode(event.target.value)}
              className="rounded-2xl border border-[#D6EDE7] bg-white px-5 py-4 text-sm font-black outline-none focus:border-[#2AA897] focus:ring-4 focus:ring-[#D8FFF3]"
            >
              {plans.map((plan) => (
                <option key={plan.code} value={plan.code}>
                  {plan.title} · {plan.price}
                </option>
              ))}
            </select>

            <input
              value={referralCode}
              onChange={(event) => setReferralCode(event.target.value.replace(/[^\w-]/g, '').slice(0, 40).toUpperCase())}
              placeholder="추천인코드가 있으면 입력"
              className="rounded-2xl border border-[#D6EDE7] bg-white px-5 py-4 text-sm font-black outline-none focus:border-[#2AA897] focus:ring-4 focus:ring-[#D8FFF3]"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-5 w-full rounded-2xl bg-[#17443F] px-5 py-4 text-sm font-black text-white disabled:opacity-60"
          >
            {saving ? '저장 중...' : '신청하고 추천인코드 만들기'}
          </button>

          {message ? (
            <div className="mt-4 rounded-2xl bg-[#FFF9EE] p-4 text-sm font-black leading-7 text-[#795C22] ring-1 ring-[#F3DEB5]">
              {message}
            </div>
          ) : null}

          {generatedCode ? (
            <div className="mt-4 rounded-2xl bg-[#EFFFFA] p-5 ring-1 ring-[#CDEFE7]">
              <div className="text-sm font-black text-[#247A71]">내 추천인코드</div>
              <div className="mt-2 break-all text-3xl font-black tracking-[-0.06em] text-[#17443F]">
                {generatedCode}
              </div>
              <button
                type="button"
                onClick={copyCode}
                className="mt-4 rounded-xl bg-white px-4 py-3 text-sm font-black text-[#17443F] ring-1 ring-[#D6EDE7]"
              >
                추천인코드 복사
              </button>
            </div>
          ) : null}
        </form>
      ) : null}
    </section>
  )
}
