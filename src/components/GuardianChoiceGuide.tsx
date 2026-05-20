import { CareCard } from '@/components/ui/CareCard'
import { StatusPill } from '@/components/ui/StatusPill'

const choiceItems = [
  {
    title: '지역이 맞는지',
    desc: '부모님 위치와 케어파트너 활동지역이 가까운지 확인하세요.'
  },
  {
    title: '필요 업무가 가능한지',
    desc: '병원동행, 약국동행, 복약 확인, 서류 챙김 등 요청 업무와 맞는지 확인하세요.'
  },
  {
    title: '추천 이유가 충분한지',
    desc: '운영실이 왜 이 케어파트너를 추천했는지 이유를 확인하세요.'
  },
  {
    title: '신뢰카드가 명확한지',
    desc: '본인확인, 가능 업무, 후기, 리포트 품질을 함께 확인하세요.'
  },
  {
    title: '불안하면 상담 먼저',
    desc: '바로 확정하지 않아도 됩니다. 전화 상담 후 진행할 수 있습니다.'
  }
]

export function GuardianChoiceGuide({ compact = false }: { compact?: boolean }) {
  return (
    <CareCard tone="blue" className={compact ? 'p-4 md:p-5' : undefined}>
      <div className="flex flex-wrap gap-2">
        <StatusPill text="선택 기준" tone="blue" />
        <StatusPill text="보호자 확인" tone="slate" />
      </div>

      <h3 className="mt-3 text-2xl font-black">
        케어파트너를 선택할 때 이렇게 확인하세요.
      </h3>

      <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        {choiceItems.map((item) => (
          <div key={item.title} className="rounded-2xl bg-white p-4 ring-1 ring-[#DDEDF5]">
            <div className="text-sm font-black text-[#365E78]">{item.title}</div>
            <p className="mt-2 text-xs font-bold leading-5 text-[#607D79]">{item.desc}</p>
          </div>
        ))}
      </div>
    </CareCard>
  )
}
