import Link from 'next/link'

export const metadata = {
  title: '요금제 | 안부웍스',
  description: '안부온 구독과 케어파트너 연결 요금제'
}

const subscriptionPlans = [
  {
    name: '무료 체험',
    price: '0원',
    period: '체험용',
    desc: '부모님 안부온을 가볍게 시작하는 기본 플랜',
    badge: '무료',
    href: '/family-link',
    features: [
      '하루 1회 안부 체크',
      '보호자 1명 연결',
      '최근 7일 기록 보기',
      '부모님 코드 연결',
      '기본 안부 버튼 사용'
    ]
  },
  {
    name: '안부온 베이직',
    price: '월 9,900원',
    period: '부모님 1명 기준',
    desc: '매일 식사·약·몸 상태를 확인하는 기본 구독',
    badge: '추천 시작',
    href: '/family-link',
    features: [
      '하루 최대 3회 안부 체크',
      '식사·복약·몸 상태 확인',
      '응답 없음 앱 알림',
      '보호자 2명까지 공유',
      '주간 안부 리포트'
    ]
  },
  {
    name: '안부온 패밀리',
    price: '월 19,900원',
    period: '가족 공유형',
    desc: '형제·자매가 함께 부모님 상태를 보는 가족형 플랜',
    badge: '가족 추천',
    href: '/family-link',
    features: [
      '하루 최대 5회 안부 체크',
      '보호자 최대 5명 공유',
      '복약·병원 일정 알림',
      '응답 없음 알림 강화',
      '주간·월간 리포트'
    ]
  },
  {
    name: '안심케어 플러스',
    price: '월 39,900원',
    period: '운영실 연계형',
    desc: 'AI 안부 확인에 운영실 확인 요청을 더한 안심형 플랜',
    badge: '프리미엄',
    href: '/care-request',
    features: [
      '안부온 패밀리 기능 포함',
      '운영실 확인 요청 월 3회 포함',
      '케어파트너 우선 매칭',
      '병원동행·생활확인 신청',
      '월간 보호자 리포트'
    ]
  }
]

const careFees = [
  {
    name: '운영실 전화 확인',
    price: '1회 9,900원',
    desc: '부모님 또는 보호자에게 전화로 상황을 확인합니다.'
  },
  {
    name: '생활확인 케어',
    price: '1회 29,000원부터',
    desc: '식사, 약, 귀가, 생활상태를 케어파트너가 확인합니다.'
  },
  {
    name: '병원동행 기본',
    price: '2시간 59,000원부터',
    desc: '병원 접수, 대기, 약국, 귀가 확인을 도와드립니다.'
  },
  {
    name: '추가 시간',
    price: '1시간 25,000원부터',
    desc: '병원 대기나 이동 시간이 길어질 때 추가됩니다.'
  },
  {
    name: '긴급 확인 요청',
    price: '상담 후 안내',
    desc: '지역, 시간, 업무 범위에 따라 운영실이 가능 여부를 확인합니다.'
  }
]

const notes = [
  '요금은 Care.com의 시니어 홈케어 시간당 비용 구조를 참고하되, 국내 보호자 체감가에 맞춘 MVP 기준가입니다.',
  '교통비, 식비, 병원비, 약값, 주차비 등 실비는 별도입니다.',
  '의료행위, 진단, 처방, 투약 결정은 제공하지 않습니다.',
  '정확한 금액은 지역, 시간, 요청 업무, 케어파트너 가능 여부에 따라 달라질 수 있습니다.',
  '초기 출시 단계에서는 무료 체험과 베이직 플랜 중심으로 운영하고, 사람 케어는 건별로 안내하는 것을 권장합니다.'
]

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-5 py-8 text-[#173B36]">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-[2.5rem] bg-white p-6 shadow-[0_18px_52px_rgba(20,82,70,0.08)] ring-1 ring-[#D8EEE8] sm:p-8">
          <div className="inline-flex rounded-full bg-[#E8FAF5] px-4 py-2 text-sm font-black text-[#11977F]">
            안부웍스 요금제
          </div>

          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-[-0.07em] sm:text-5xl">
            AI 안부온은 구독으로,
            <br />
            사람이 움직이는 케어는 건별로.
          </h1>

          <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#637B76] sm:text-lg sm:leading-8">
            보호자는 부담 없이 안부온으로 시작하고, 응답 없음·복약 누락·몸 불편 같은 확인 필요 신호가 생기면
            운영실 확인이나 케어파트너 연결을 추가로 신청할 수 있습니다.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/family-link"
              className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white"
            >
              무료로 시작하기
            </Link>
            <Link
              href="/care-request"
              className="rounded-2xl bg-[#20C5A8] px-5 py-4 text-sm font-black text-white"
            >
              안심케어 상담
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-4">
          {subscriptionPlans.map((plan) => (
            <article
              key={plan.name}
              className={
                'rounded-[2rem] bg-white p-5 shadow-sm ring-1 sm:p-6 ' +
                (plan.name === '안부온 베이직'
                  ? 'ring-[#9EEBD8] shadow-[0_18px_48px_rgba(32,197,168,0.12)]'
                  : 'ring-[#D8EEE8]')
              }
            >
              <div className="inline-flex rounded-full bg-[#E8FAF5] px-3 py-1 text-xs font-black text-[#11977F]">
                {plan.badge}
              </div>

              <h2 className="mt-4 text-2xl font-black tracking-[-0.05em]">
                {plan.name}
              </h2>

              <div className="mt-3">
                <span className="text-3xl font-black tracking-[-0.05em] text-[#11977F]">
                  {plan.price}
                </span>
              </div>

              <p className="mt-1 text-xs font-black text-[#7A9692]">
                {plan.period}
              </p>

              <p className="mt-3 min-h-[3.5rem] text-sm font-bold leading-7 text-[#637B76]">
                {plan.desc}
              </p>

              <div className="mt-5 space-y-2">
                {plan.features.map((feature) => (
                  <div
                    key={feature}
                    className="rounded-2xl bg-[#F8FCFB] p-3 text-sm font-black leading-6 text-[#173B36] ring-1 ring-[#D8EEE8]"
                  >
                    ✓ {feature}
                  </div>
                ))}
              </div>

              <Link
                href={plan.href}
                className={
                  'mt-5 block rounded-2xl px-4 py-4 text-center text-sm font-black ' +
                  (plan.name === '무료 체험'
                    ? 'bg-[#F2FAF8] text-[#116D5F] ring-1 ring-[#CDEFE5]'
                    : 'bg-[#193B38] text-white')
                }
              >
                {plan.name === '무료 체험' ? '무료 시작' : '신청하기'}
              </Link>
            </article>
          ))}
        </div>

        <section className="mt-6 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-sm font-black text-[#11977F]">
                케어파트너 건별 이용료
              </div>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.06em]">
                사람이 직접 확인하는 케어는 별도 과금
              </h2>
            </div>
            <Link
              href="/care-request"
              className="rounded-2xl bg-[#20C5A8] px-5 py-4 text-center text-sm font-black text-white"
            >
              케어 요청하기
            </Link>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            {careFees.map((item) => (
              <div
                key={item.name}
                className="rounded-[1.5rem] bg-[#F8FCFB] p-4 ring-1 ring-[#D8EEE8]"
              >
                <div className="text-base font-black text-[#173B36]">
                  {item.name}
                </div>
                <div className="mt-2 text-xl font-black text-[#11977F]">
                  {item.price}
                </div>
                <p className="mt-2 text-xs font-bold leading-6 text-[#637B76]">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] bg-[#123F38] p-5 text-white shadow-sm sm:p-6">
          <div className="text-sm font-black text-[#9DF4DD]">
            벤치마킹 기준
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">
            Care.com식 시간당 케어비 구조를 참고하되, 안부웍스는 구독 + 건별 케어 구조로 시작합니다.
          </h2>
          <p className="mt-3 text-sm font-bold leading-7 text-[#CDEEE6]">
            해외 홈케어는 시간당 비용 구조가 일반적이지만, 안부웍스는 매일 안부 확인을 저렴한 구독으로 제공하고,
            사람이 직접 움직이는 생활확인·병원동행만 건별로 과금하는 방식이 보호자에게 설명하기 쉽습니다.
          </p>
        </section>

        <section className="mt-6 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">
            요금 안내 문구
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {notes.map((note) => (
              <div
                key={note}
                className="rounded-2xl bg-[#F8FCFB] p-4 text-sm font-bold leading-7 text-[#5F7772] ring-1 ring-[#D8EEE8]"
              >
                {note}
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}
