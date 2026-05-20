import Link from 'next/link'
import { CareCard } from '@/components/ui/CareCard'
import { StatusPill } from '@/components/ui/StatusPill'

const trustItems = [
  {
    title: '본인확인',
    desc: '케어파트너 등록 시 본인확인과 기본 신원 정보를 확인합니다.',
    emoji: '🪪'
  },
  {
    title: '활동지역 확인',
    desc: '요청 지역과 케어파트너 활동 가능 지역이 맞는지 확인합니다.',
    emoji: '📍'
  },
  {
    title: '가능 업무 확인',
    desc: '병원동행, 약국동행, 복약 확인, 식사 확인 등 수행 가능한 업무를 확인합니다.',
    emoji: '✅'
  },
  {
    title: '의료행위 금지 원칙',
    desc: '처방 변경, 복약 지시, 의료 판단은 하지 않는다는 원칙을 확인합니다.',
    emoji: '⚕️'
  },
  {
    title: '보호자 리포트',
    desc: '진행 후 부모님 상태와 다음 할 일을 보호자에게 공유합니다.',
    emoji: '📋'
  },
  {
    title: '후기 반영',
    desc: '보호자 평가와 리포트 품질을 신뢰카드에 반영합니다.',
    emoji: '⭐'
  }
]

export function TrustSafetyGuide({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <CareCard tone="green" className="p-4 md:p-5">
        <div className="flex flex-wrap gap-2">
          <StatusPill text="신뢰 기준" tone="green" />
          <StatusPill text="검증·리포트·후기" tone="slate" />
        </div>

        <h3 className="mt-3 text-2xl font-black">
          케어파트너는 신뢰 기준을 확인한 뒤 추천됩니다.
        </h3>

        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {trustItems.slice(0, 6).map((item) => (
            <div key={item.title} className="rounded-2xl bg-white p-4 ring-1 ring-[#D3ECE6]">
              <div className="text-2xl">{item.emoji}</div>
              <div className="mt-2 text-sm font-black text-[#2F756B]">{item.title}</div>
            </div>
          ))}
        </div>

        <p className="mt-4 text-sm font-bold leading-6 text-[#607D79]">
          검증은 안전한 연결을 위한 절차이지만 모든 위험을 100% 보장하지는 않습니다. 응급상황은 119가 우선입니다.
        </p>

        <Link
          href="/trust"
          className="mt-4 inline-flex rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#2F756B] ring-1 ring-[#D3ECE6]"
        >
          신뢰 기준 자세히 보기
        </Link>
      </CareCard>
    )
  }

  return (
    <section className="space-y-5">
      <CareCard tone="green">
        <div className="flex flex-wrap gap-2">
          <StatusPill text="신뢰 기준" tone="green" />
          <StatusPill text="케어파트너 검증" tone="slate" />
        </div>

        <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.05em] md:text-6xl">
          믿고 맡기기 전에
          <br />
          확인할 기준을 보여드립니다.
        </h1>

        <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#4E6D69] md:text-lg">
          보호자가 케어파트너를 더 안심하고 선택할 수 있도록, 검증 상태와 추천 이유, 후기, 리포트 품질을 신뢰카드로 정리합니다.
        </p>
      </CareCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {trustItems.map((item) => (
          <CareCard key={item.title} tone="white">
            <div className="text-4xl">{item.emoji}</div>
            <h2 className="mt-4 text-2xl font-black">{item.title}</h2>
            <p className="mt-3 text-sm font-bold leading-6 text-[#607D79]">{item.desc}</p>
          </CareCard>
        ))}
      </div>

      <CareCard tone="amber">
        <h2 className="text-2xl font-black">검증에 대한 현실적인 안내</h2>
        <p className="mt-4 text-sm font-bold leading-6 text-[#6F5B31]">
          케어파트너 검증은 보호자와 부모님이 더 안심하고 선택할 수 있도록 돕는 절차입니다. 다만 모든 위험을 완전히 제거하거나 모든 상황의 안전을 보장하는 것은 아닙니다. 응급상황은 119 또는 의료기관 연락이 우선이며, 의료 판단은 의료진의 영역입니다.
        </p>
      </CareCard>
    </section>
  )
}
