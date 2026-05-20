import Link from 'next/link'
import { CareCard } from '@/components/ui/CareCard'
import { StatusPill } from '@/components/ui/StatusPill'

const priceItems = [
  {
    title: '병원 안심동행',
    price: '39,000원부터',
    desc: '병원 앞 만남, 접수·수납 도움, 진료 동행, 약국 동행, 귀가 확인',
    tag: '가장 많이 이용'
  },
  {
    title: '식사·약 안심확인',
    price: '19,000원부터',
    desc: '식사 여부, 약 복용 여부, 컨디션 확인 후 보호자에게 공유',
    tag: '생활 안심'
  },
  {
    title: '서류 챙김',
    price: '25,000원부터',
    desc: '영수증, 처방전, 세부내역서, 보험청구용 서류 확인',
    tag: '번거로움 해결'
  },
  {
    title: '퇴원 후 7일 안심케어',
    price: '149,000원부터',
    desc: '퇴원 후 식사, 약, 통증, 낙상, 다음 외래 일정 확인',
    tag: '집중 케어'
  }
]

export function PricingGuide({
  compact = false
}: {
  compact?: boolean
}) {
  if (compact) {
    return (
      <CareCard tone="blue" className="p-4 md:p-5">
        <div className="flex flex-wrap gap-2">
          <StatusPill text="예상 금액" tone="blue" />
          <StatusPill text="결제 전 최종 안내" tone="slate" />
        </div>

        <h3 className="mt-3 text-2xl font-black">
          필요한 케어만 선택해서 이용합니다.
        </h3>

        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {priceItems.slice(0, 4).map((item) => (
            <div key={item.title} className="rounded-2xl bg-white p-4 ring-1 ring-[#DDEDF5]">
              <div className="text-sm font-black text-[#365E78]">{item.title}</div>
              <div className="mt-1 text-xl font-black text-[#193B38]">{item.price}</div>
            </div>
          ))}
        </div>

        <p className="mt-4 text-sm font-bold leading-6 text-[#607D79]">
          정확한 금액은 지역, 일정, 예상 소요시간 확인 후 운영실이 먼저 안내드립니다. 병원비, 약값, 교통비 등 실비는 별도입니다.
        </p>

        <Link
          href="/pricing"
          className="mt-4 inline-flex rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#365E78] ring-1 ring-[#DDEDF5]"
        >
          금액 자세히 보기
        </Link>
      </CareCard>
    )
  }

  return (
    <section className="space-y-5">
      <CareCard tone="green">
        <div className="flex flex-wrap gap-2">
          <StatusPill text="금액 안내" tone="green" />
          <StatusPill text="예상가 기준" tone="slate" />
        </div>

        <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.05em] md:text-6xl">
          필요한 만큼만
          <br />
          부담 없이 이용하세요.
        </h1>

        <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#4E6D69] md:text-lg">
          부모님 안심케어는 상황에 따라 필요한 도움만 선택해 이용합니다. 결제 전 운영실이 최종 금액과 포함 범위를 먼저 안내드립니다.
        </p>
      </CareCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {priceItems.map((item) => (
          <div
            key={item.title}
            className="rounded-[2rem] border border-[#E3EFEC] bg-white p-5 shadow-[0_16px_44px_rgba(93,139,131,0.08)]"
          >
            <div className="inline-flex rounded-full bg-[#F2FAF8] px-3 py-1 text-xs font-black text-[#5B7774] ring-1 ring-[#DDEEEA]">
              {item.tag}
            </div>

            <h2 className="mt-4 text-2xl font-black text-[#24423F]">{item.title}</h2>
            <div className="mt-3 text-3xl font-black text-[#19A98E]">{item.price}</div>
            <p className="mt-3 text-sm font-bold leading-6 text-[#607D79]">{item.desc}</p>
          </div>
        ))}
      </div>

      <CareCard tone="amber">
        <h2 className="text-2xl font-black">꼭 확인해주세요</h2>
        <ul className="mt-4 space-y-2 text-sm font-bold leading-6 text-[#6F5B31]">
          <li>• 위 금액은 초기 예상 안내입니다.</li>
          <li>• 지역, 일정, 이동거리, 소요시간에 따라 최종 금액이 달라질 수 있습니다.</li>
          <li>• 병원비, 약값, 식사비, 택시비 등 실비는 별도입니다.</li>
          <li>• 의료행위, 처방 변경, 복약 지시는 제공하지 않습니다.</li>
          <li>• 결제 전 운영실이 최종 금액과 포함 범위를 먼저 안내드립니다.</li>
        </ul>
      </CareCard>
    </section>
  )
}
