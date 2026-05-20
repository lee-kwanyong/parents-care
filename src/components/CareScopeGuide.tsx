import Link from 'next/link'
import { CareCard } from '@/components/ui/CareCard'
import { StatusPill } from '@/components/ui/StatusPill'

const scopeItems = [
  {
    emoji: '🏥',
    title: '병원 안심동행',
    included: ['병원 앞 만남', '접수·수납 도움', '진료 전후 보호자 공유', '약국 동행', '귀가 확인'],
    excluded: ['의료 판단', '처방 변경', '응급 이송', '개인차량 유상운송']
  },
  {
    emoji: '💊',
    title: '약·복약 확인',
    included: ['약 봉투 확인', '복용 시간 확인', '미복용 여부 공유', '보호자 알림'],
    excluded: ['복약 지시', '처방 변경', '약물 판단', '의료 상담']
  },
  {
    emoji: '🍱',
    title: '식사 안심확인',
    included: ['식사 여부 확인', '식사 사진/메모 공유', '컨디션 확인', '보호자 알림'],
    excluded: ['의학적 식단 처방', '질환별 영양 처방', '강제 식사 도움']
  },
  {
    emoji: '📄',
    title: '서류 챙김',
    included: ['영수증 확인', '처방전 확인', '세부내역서 확인', '보험청구용 자료 정리'],
    excluded: ['보험금 지급 보장', '법률/세무 판단', '의료기록 해석']
  },
  {
    emoji: '🏠',
    title: '퇴원 후 7일 확인',
    included: ['약·식사 확인', '통증/낙상 여부 체크', '다음 외래 확인', '보호자 리포트'],
    excluded: ['간호 행위', '상처 처치', '의료기기 조작', '응급 처치 대체']
  }
]

export function CareScopeGuide({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <CareCard tone="blue" className="p-4 md:p-5">
        <div className="flex flex-wrap gap-2">
          <StatusPill text="케어 범위" tone="blue" />
          <StatusPill text="의료행위 제외" tone="slate" />
        </div>

        <h3 className="mt-3 text-2xl font-black">
          도와드릴 수 있는 일과 아닌 일을 먼저 안내합니다.
        </h3>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {scopeItems.slice(0, 4).map((item) => (
            <div key={item.title} className="rounded-2xl bg-white p-4 ring-1 ring-[#DDEDF5]">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{item.emoji}</span>
                <span className="text-sm font-black text-[#365E78]">{item.title}</span>
              </div>
              <p className="mt-2 text-xs font-bold leading-5 text-[#607D79]">
                포함: {item.included.slice(0, 3).join(', ')}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-4 text-sm font-bold leading-6 text-[#607D79]">
          의료 판단, 처방 변경, 복약 지시, 응급 이송은 제공하지 않습니다. 응급상황은 119 또는 의료기관이 우선입니다.
        </p>

        <Link
          href="/care-scope"
          className="mt-4 inline-flex rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#365E78] ring-1 ring-[#DDEDF5]"
        >
          케어 범위 자세히 보기
        </Link>
      </CareCard>
    )
  }

  return (
    <section className="space-y-5">
      <CareCard tone="green">
        <div className="flex flex-wrap gap-2">
          <StatusPill text="케어 범위" tone="green" />
          <StatusPill text="포함/제외 명확화" tone="slate" />
        </div>

        <h1 className="mt-5 text-4xl font-black leading-tight tracking-[-0.05em] md:text-6xl">
          어떤 도움을 받을 수 있는지
          <br />
          먼저 확인하세요.
        </h1>

        <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-[#4E6D69] md:text-lg">
          부모님 안심케어는 이동, 동행, 확인, 기록, 보호자 공유 중심의 비의료 안심 서비스입니다. 의료행위와 응급대응을 대신하지 않습니다.
        </p>
      </CareCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {scopeItems.map((item) => (
          <CareCard key={item.title} tone="white">
            <div className="text-4xl">{item.emoji}</div>
            <h2 className="mt-4 text-2xl font-black">{item.title}</h2>

            <div className="mt-4 rounded-2xl bg-[#F0FBF7] p-4 ring-1 ring-[#D3ECE6]">
              <div className="text-sm font-black text-[#2F756B]">포함되는 일</div>
              <ul className="mt-2 space-y-1 text-sm font-bold leading-6 text-[#4E6D69]">
                {item.included.map((text) => (
                  <li key={text}>• {text}</li>
                ))}
              </ul>
            </div>

            <div className="mt-3 rounded-2xl bg-[#FFF9EF] p-4 ring-1 ring-[#F0E0C4]">
              <div className="text-sm font-black text-[#8A6C35]">포함되지 않는 일</div>
              <ul className="mt-2 space-y-1 text-sm font-bold leading-6 text-[#6F5B31]">
                {item.excluded.map((text) => (
                  <li key={text}>• {text}</li>
                ))}
              </ul>
            </div>
          </CareCard>
        ))}
      </div>

      <CareCard tone="amber">
        <h2 className="text-2xl font-black">중요 안내</h2>
        <ul className="mt-4 space-y-2 text-sm font-bold leading-6 text-[#6F5B31]">
          <li>• 부모님 안심케어는 의료행위를 대신하지 않습니다.</li>
          <li>• 처방 변경, 복약 지시, 의료 판단은 의료진의 영역입니다.</li>
          <li>• 응급상황은 119 또는 의료기관 연락이 우선입니다.</li>
          <li>• 개인차량을 이용한 직접 유상운송은 기본 서비스에 포함되지 않습니다.</li>
          <li>• 케어파트너 검증은 안전한 연결을 위한 절차이며, 모든 위험을 완전히 보장하는 것은 아닙니다.</li>
        </ul>
      </CareCard>
    </section>
  )
}
