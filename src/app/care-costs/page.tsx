import Link from 'next/link'
import { CostApprovalBoard } from '@/components/CostApprovalBoard'
import { AppFrame } from '@/components/ui/AppFrame'
import { CareButton } from '@/components/ui/CareButton'
import { CareCard } from '@/components/ui/CareCard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { StatusPill } from '@/components/ui/StatusPill'

const costPrinciples = [
  {
    title: '먼저 보여드립니다',
    desc: '택시비, 서류 발급비, 식사 배송비, 추가 동행시간을 보호자에게 먼저 안내합니다.'
  },
  {
    title: '승인 후 진행합니다',
    desc: '보호자가 승인하기 전에는 결제 완료나 비용 집행으로 넘어가지 않습니다.'
  },
  {
    title: '이유를 남깁니다',
    desc: '왜 비용이 생겼는지, 어떤 항목인지 쉽게 기록합니다.'
  }
]

export default function CareCostsPage() {
  return (
    <AppFrame title="비용 승인" subtitle="추가비용은 먼저 확인받고 진행합니다" backHref="/child">
      <SectionHeader
        eyebrow="추가비용 사전승인"
        title={
          <>
            비용은
            <br />
            투명해야 합니다.
          </>
        }
        description="택시비, 서류 발급비, 식사 배송비, 추가 동행시간처럼 보호자가 불안할 수 있는 비용은 승인 후에만 진행합니다."
        actions={
          <>
            <CareButton href="/child/costs" tone="primary">
              자녀 비용 확인
            </CareButton>
            <CareButton href="/ops/costs" tone="dark">
              운영실 비용 보드
            </CareButton>
          </>
        }
      />

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {costPrinciples.map((item) => (
          <CareCard key={item.title} tone="amber">
            <StatusPill text="비용 원칙" tone="amber" />
            <h2 className="mt-4 text-2xl font-black">{item.title}</h2>
            <p className="mt-3 text-sm font-bold leading-6">{item.desc}</p>
          </CareCard>
        ))}
      </section>

      <section className="mt-8 rounded-[2rem] bg-white p-5 shadow-sm md:p-7">
        <h2 className="text-2xl font-black">자주 생기는 추가비용</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {['택시비', '서류 발급비', '식사 배송비', '추가 동행시간', '약국 실비', '병원 실비', '제휴 이동비', '주차비'].map((item) => (
            <div key={item} className="rounded-2xl bg-slate-50 p-4 text-lg font-black">
              {item}
            </div>
          ))}
        </div>
      </section>

      <div className="mt-8">
        <CostApprovalBoard mode="family" />
      </div>

      <section className="mt-8 rounded-[2rem] bg-[#5F7C92] p-5 text-[#2E504D] md:p-7">
        <h2 className="text-2xl font-black">차량 정책도 분리합니다</h2>
        <p className="mt-3 text-base font-bold leading-7 text-[#63807C]">
          차량 보유 여부는 참고 정보입니다. 매니저 개인차량 직접 유상운송은 기본 서비스에 포함되지 않습니다.
          기본 이동은 병원 앞 만남, 집 앞 만남 후 택시 동행, 이동지원 제휴 기준입니다.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/manager" className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#2F4948]">
            매니저 정책 보기
          </Link>
          <Link href="/child/cases" className="rounded-2xl bg-white/70 px-4 py-3 text-sm font-black">
            케이스에서 확인
          </Link>
        </div>
      </section>
    </AppFrame>
  )
}
