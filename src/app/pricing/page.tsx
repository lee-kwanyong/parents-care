import Link from 'next/link'
import { anbuPaymentPlans } from '@/lib/anbu-payment-plans'

export const metadata = {
  title: '요금제 | 안부웍스',
  description: '안부온 구독과 케어파트너 연결 요금제'
}

const paidPlans = anbuPaymentPlans.filter((plan) => plan.id !== 'free')
const freePlan = anbuPaymentPlans.find((plan) => plan.id === 'free')

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
            무료 체험으로 부모님을 연결하고, 매일 안부 체크가 필요하면 베이직·패밀리·플러스 플랜으로 전환할 수 있습니다.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/family-link" className="rounded-2xl bg-[#193B38] px-5 py-4 text-sm font-black text-white">
              무료로 시작하기
            </Link>
            <Link href="/billing" className="rounded-2xl bg-[#F2FAF8] px-5 py-4 text-sm font-black text-[#116D5F] ring-1 ring-[#CDEFE5]">
              결제내역 보기
            </Link>
          </div>
        </div>

        {freePlan ? (
          <section className="mt-6 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#D8EEE8] sm:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-black text-[#11977F]">무료 체험</div>
                <h2 className="mt-1 text-3xl font-black tracking-[-0.06em]">{freePlan.displayPrice}</h2>
                <p className="mt-2 text-sm font-bold leading-7 text-[#637B76]">{freePlan.description}</p>
              </div>
              <Link href="/family-link" className="rounded-2xl bg-[#193B38] px-5 py-4 text-center text-sm font-black text-white">
                부모님 연결하기
              </Link>
            </div>
          </section>
        ) : null}

        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {paidPlans.map((plan) => (
            <article
              key={plan.id}
              className={
                'rounded-[2rem] bg-white p-5 shadow-sm ring-1 sm:p-6 ' +
                (plan.id === 'basic'
                  ? 'ring-[#9EEBD8] shadow-[0_18px_48px_rgba(32,197,168,0.12)]'
                  : 'ring-[#D8EEE8]')
              }
            >
              <div className="inline-flex rounded-full bg-[#E8FAF5] px-3 py-1 text-xs font-black text-[#11977F]">
                {plan.planType === 'subscription' ? '구독' : '건별 케어'}
              </div>

              <h2 className="mt-4 text-2xl font-black tracking-[-0.05em]">
                {plan.name}
              </h2>

              <div className="mt-3 text-3xl font-black tracking-[-0.05em] text-[#11977F]">
                {plan.displayPrice}
              </div>

              <p className="mt-3 min-h-[3.5rem] text-sm font-bold leading-7 text-[#637B76]">
                {plan.description}
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
                href={`/checkout?plan=${plan.id}`}
                className={
                  'mt-5 block rounded-2xl px-4 py-4 text-center text-sm font-black ' +
                  (plan.id === 'basic'
                    ? 'bg-[#20C5A8] text-white'
                    : 'bg-[#193B38] text-white')
                }
              >
                결제하기
              </Link>
            </article>
          ))}
        </div>

        <section className="mt-6 rounded-[2rem] bg-[#123F38] p-5 text-white shadow-sm sm:p-6">
          <div className="text-sm font-black text-[#9DF4DD]">결제 안내</div>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">
            결제 완료 후 구독 상태는 결제내역에서 확인할 수 있습니다.
          </h2>
          <p className="mt-3 text-sm font-bold leading-7 text-[#CDEEE6]">
            초기 MVP에서는 월 구독 결제를 결제내역과 구독 상태로 저장합니다.
            정기 자동결제는 빌링키 방식으로 별도 고도화가 필요합니다.
          </p>
        </section>
      </section>
    </main>
  )
}
