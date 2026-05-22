import Link from 'next/link'
import { CareCard } from '@/components/ui/CareCard'
import { StatusPill } from '@/components/ui/StatusPill'

const membershipPlans = [
  {
    name: '무료 걱정접수',
    price: '0원',
    period: '',
    badge: '처음 시작',
    summary: '부모님 상황만 남기면 운영실이 필요한 케어를 정리합니다.',
    features: ['걱정접수 가능', '필요 케어 안내', '결제 전 최종 금액 안내'],
    href: '/care-request',
    cta: '걱정 접수하기',
    highlighted: false
  },
  {
    name: '안심 멤버십',
    price: '19,900원',
    period: '/월',
    badge: '추천',
    summary: '반복 이용하는 보호자에게 맞는 기본 안심 플랜입니다.',
    features: ['우선 매칭', '리포트 보관', '가족 공유', '다음 할 일 알림'],
    href: '/care-request',
    cta: '멤버십 문의',
    highlighted: true
  },
  {
    name: '안심 플러스',
    price: '49,000원',
    period: '/월',
    badge: '우선 배정',
    summary: '자주 걱정되는 부모님을 운영실이 더 촘촘히 챙깁니다.',
    features: ['월 1회 상태 점검', '긴급 우선 배정', '운영실 상담', '리포트 우선 정리'],
    href: '/care-request',
    cta: '플러스 문의',
    highlighted: false
  },
  {
    name: '프리미엄 가족케어',
    price: '99,000원',
    period: '/월',
    badge: '정기 케어',
    summary: '병원, 식사, 약, 서류를 가족 단위로 통합 관리합니다.',
    features: ['정기 케어 설계', '가족 공유', '병원·약·식사 관리', '서류 정리 상담'],
    href: '/care-request',
    cta: '상담 신청',
    highlighted: false
  }
]

const carePackages = [
  {
    name: '3시간 안심케어',
    price: '99,000원',
    badge: '가장 많이 이용',
    summary: '병원, 식사, 약, 서류 등 기본적인 부모님 케어가 필요할 때',
    includes: ['검증 파트너 매칭', '현장 확인', '보호자 요약 리포트', '귀가 또는 다음 할 일 확인'],
    href: '/care-request',
    highlighted: true
  },
  {
    name: '4시간 병원동행 기본',
    price: '129,000원',
    badge: '병원 일정',
    summary: '예약, 접수, 진료, 약국, 귀가 확인까지 필요한 병원 일정에 적합합니다.',
    includes: ['병원 앞 만남', '접수·수납 도움', '진료 동행', '약국·귀가 확인'],
    href: '/care-request',
    highlighted: false
  },
  {
    name: '6시간 장시간 케어',
    price: '189,000원',
    badge: '장시간 안심',
    summary: '검사, 대기, 이동 시간이 길거나 보호자가 오래 비우는 날에 적합합니다.',
    includes: ['장시간 현장 동행', '식사·약 확인', '상태 변화 공유', '상세 리포트'],
    href: '/care-request',
    highlighted: false
  }
]

const addOns = [
  {
    name: '추가 1시간',
    price: '32,000원',
    desc: '현장 상황상 시간이 더 필요할 때 추가됩니다.'
  },
  {
    name: '당일·긴급 매칭',
    price: '+30,000원',
    desc: '당일 요청 또는 빠른 배정이 필요한 경우 적용됩니다.'
  },
  {
    name: '실비',
    price: '별도',
    desc: '병원비, 약값, 식사비, 택시비 등 실제 발생 비용은 별도입니다.'
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
          <StatusPill text="금액 안내" tone="blue" />
          <StatusPill text="결제 전 최종 확인" tone="slate" />
        </div>

        <h3 className="mt-3 text-2xl font-black">
          부모님 안심케어는 3시간 99,000원부터 시작합니다.
        </h3>

        <div className="mt-4 grid gap-2 md:grid-cols-2">
          <MiniPrice title="무료 걱정접수" price="0원" />
          <MiniPrice title="안심 멤버십" price="월 19,900원" />
          <MiniPrice title="3시간 안심케어" price="99,000원" />
          <MiniPrice title="4시간 병원동행" price="129,000원" />
        </div>

        <p className="mt-4 text-sm font-bold leading-6 text-[#607D79]">
          지역, 일정, 예상 소요시간 확인 후 결제 전 최종 금액과 포함 범위를 먼저 안내드립니다.
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
    <section className="space-y-6">
      <CareCard tone="green">
        <div className="flex flex-wrap gap-2">
          <StatusPill text="금액 안내" tone="green" />
          <StatusPill text="매칭·현장확인·리포트 포함" tone="slate" />
        </div>

        <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.05em] md:text-6xl">
          부모님 안심케어,
          <br />
          필요한 만큼만 이용하세요.
        </h1>

        <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#4E6D69] md:text-lg">
          보호자가 보기 쉬운 최종 이용 금액으로 안내합니다. 파트너 매칭, 현장 확인, 보호자 요약 리포트가 포함되며
          병원비, 약값, 식사비, 택시비 등 실비는 별도입니다.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/care-request"
            className="rounded-2xl bg-[#19B99A] px-5 py-4 text-sm font-black text-white shadow-[0_12px_30px_rgba(25,185,154,0.20)]"
          >
            걱정 접수하기
          </Link>
          <Link
            href="/care-intake"
            className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#426C68] ring-1 ring-[#CFE7E2]"
          >
            사진·카톡으로 맡기기
          </Link>
        </div>
      </CareCard>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-sm font-black text-[#19A98E]">월 안심 플랜</div>
            <h2 className="mt-1 text-3xl font-black tracking-[-0.04em] text-[#24423F]">
              반복 이용하는 보호자를 위한 멤버십
            </h2>
          </div>
          <p className="text-sm font-bold text-[#78908C]">첫 이용은 무료 걱정접수부터 가능합니다.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {membershipPlans.map((item) => (
            <PlanCard key={item.name} item={item} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-sm font-black text-[#19A98E]">케어 이용 금액</div>
            <h2 className="mt-1 text-3xl font-black tracking-[-0.04em] text-[#24423F]">
              현장 케어는 3시간 99,000원부터
            </h2>
          </div>
          <p className="text-sm font-bold text-[#78908C]">결제 전 운영실이 최종 범위를 안내합니다.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {carePackages.map((item) => (
            <CarePackageCard key={item.name} item={item} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {addOns.map((item) => (
          <div
            key={item.name}
            className="rounded-[1.5rem] border border-[#E3EFEC] bg-white p-5 shadow-[0_12px_32px_rgba(93,139,131,0.08)]"
          >
            <div className="text-sm font-black text-[#718A87]">{item.name}</div>
            <div className="mt-2 text-3xl font-black text-[#24423F]">{item.price}</div>
            <p className="mt-3 text-sm font-bold leading-6 text-[#607D79]">{item.desc}</p>
          </div>
        ))}
      </section>

      <CareCard tone="amber">
        <h2 className="text-2xl font-black">꼭 확인해주세요</h2>
        <ul className="mt-4 space-y-2 text-sm font-bold leading-6 text-[#6F5B31]">
          <li>• 위 금액은 보호자에게 안내되는 기본 이용 금액입니다.</li>
          <li>• 지역, 일정, 이동거리, 예상 소요시간에 따라 결제 전 최종 금액이 달라질 수 있습니다.</li>
          <li>• 병원비, 약값, 식사비, 택시비, 주차비 등 실비는 별도입니다.</li>
          <li>• 의료행위, 처방 변경, 복약 지시는 제공하지 않습니다.</li>
          <li>• 모든 케어는 접수 후 운영실 확인을 거쳐 진행됩니다.</li>
        </ul>
      </CareCard>
    </section>
  )
}

function MiniPrice({ title, price }: { title: string; price: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-[#DDEDF5]">
      <div className="text-sm font-black text-[#365E78]">{title}</div>
      <div className="mt-1 text-xl font-black text-[#193B38]">{price}</div>
    </div>
  )
}

function PlanCard({
  item
}: {
  item: {
    name: string
    price: string
    period: string
    badge: string
    summary: string
    features: string[]
    href: string
    cta: string
    highlighted: boolean
  }
}) {
  return (
    <article
      className={
        'rounded-[2rem] border p-5 shadow-[0_16px_44px_rgba(93,139,131,0.08)] ' +
        (item.highlighted
          ? 'border-[#19B99A] bg-[#F2FFFB]'
          : 'border-[#E3EFEC] bg-white')
      }
    >
      <div className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-[#2F756B] ring-1 ring-[#D3ECE6]">
        {item.badge}
      </div>

      <h3 className="mt-4 text-2xl font-black text-[#24423F]">{item.name}</h3>

      <div className="mt-3 flex items-end gap-1">
        <span className="text-3xl font-black text-[#19A98E]">{item.price}</span>
        {item.period ? <span className="pb-1 text-sm font-black text-[#718A87]">{item.period}</span> : null}
      </div>

      <p className="mt-3 min-h-[3rem] text-sm font-bold leading-6 text-[#607D79]">{item.summary}</p>

      <ul className="mt-4 space-y-2">
        {item.features.map((feature) => (
          <li key={feature} className="flex gap-2 text-sm font-black text-[#426C68]">
            <span className="text-[#19B99A]">✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href={item.href}
        className={
          'mt-5 inline-flex w-full justify-center rounded-2xl px-4 py-3 text-sm font-black ' +
          (item.highlighted
            ? 'bg-[#19B99A] text-white'
            : 'bg-[#F4FAF9] text-[#426C68] ring-1 ring-[#DCEEEA]')
        }
      >
        {item.cta}
      </Link>
    </article>
  )
}

function CarePackageCard({
  item
}: {
  item: {
    name: string
    price: string
    badge: string
    summary: string
    includes: string[]
    href: string
    highlighted: boolean
  }
}) {
  return (
    <article
      className={
        'rounded-[2rem] border p-6 shadow-[0_16px_44px_rgba(93,139,131,0.08)] ' +
        (item.highlighted
          ? 'border-[#19B99A] bg-[#EAFBF6]'
          : 'border-[#E3EFEC] bg-white')
      }
    >
      <div className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-[#2F756B] ring-1 ring-[#D3ECE6]">
        {item.badge}
      </div>

      <h3 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[#24423F]">{item.name}</h3>
      <div className="mt-3 text-4xl font-black tracking-[-0.04em] text-[#19A98E]">{item.price}</div>

      <p className="mt-4 text-sm font-bold leading-6 text-[#607D79]">{item.summary}</p>

      <div className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-[#D5EEE8]">
        <div className="text-sm font-black text-[#718A87]">포함 내용</div>
        <ul className="mt-3 space-y-2">
          {item.includes.map((include) => (
            <li key={include} className="flex gap-2 text-sm font-black text-[#426C68]">
              <span className="text-[#19B99A]">✓</span>
              <span>{include}</span>
            </li>
          ))}
        </ul>
      </div>

      <Link
        href={item.href}
        className="mt-5 inline-flex w-full justify-center rounded-2xl bg-[#193B38] px-4 py-4 text-sm font-black text-white"
      >
        이 케어로 접수하기
      </Link>
    </article>
  )
}
