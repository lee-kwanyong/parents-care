import Link from 'next/link'
import { AppFrame } from '@/components/ui/AppFrame'
import { CareButton } from '@/components/ui/CareButton'
import { CareCard } from '@/components/ui/CareCard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { StatusPill } from '@/components/ui/StatusPill'

const checkGroups = [
  {
    title: '자녀앱',
    tone: 'green',
    items: [
      ['오늘의 안심판이 첫 화면에 보이는가', '/child'],
      ['사진·카톡으로 맡기기 버튼이 바로 보이는가', '/care-intake'],
      ['가족 할 일이 3개 이하로 먼저 보이는가', '/child/tasks'],
      ['부모님 케이스가 한 화면에서 이해되는가', '/child/cases']
    ]
  },
  {
    title: '부모님앱',
    tone: 'blue',
    items: [
      ['글씨가 충분히 큰가', '/parent/today'],
      ['만남 암호가 크게 보이는가', '/parent/today'],
      ['자녀 전화 버튼이 바로 보이는가', '/parent/today'],
      ['긴급 도움 버튼이 바로 보이는가', '/parent/today']
    ]
  },
  {
    title: '운영실',
    tone: 'amber',
    items: [
      ['긴급/확인 필요/진행 중/완료가 먼저 보이는가', '/ops'],
      ['검증 매니저만 매칭되는가', '/ops/manager-matching'],
      ['QA 시나리오를 실행할 수 있는가', '/ops/qa'],
      ['알림 큐를 만들 수 있는가', '/ops/notifications']
    ]
  }
]

export default function MobileCheckPage() {
  return (
    <AppFrame title="모바일 최종 점검" subtitle="40대 이상 보호자 기준으로 확인합니다">
      <SectionHeader
        eyebrow="모바일 QA"
        title={
          <>
            기능은 많아도
            <br />
            화면은 쉬워야 합니다.
          </>
        }
        description="출시 전에는 예쁜지보다 40대 이상 보호자가 한눈에 이해하는지, 3번 안에 끝나는지, 부모님이 부담 없이 누를 수 있는지를 먼저 봅니다."
        actions={
          <>
            <CareButton href="/install" tone="primary">
              설치 안내
            </CareButton>
            <CareButton href="/ops/qa" tone="dark">
              QA 보드
            </CareButton>
          </>
        }
      />

      <section className="mt-8 grid gap-4 lg:grid-cols-3">
        {checkGroups.map((group) => (
          <CareCard key={group.title} tone={group.tone as 'green' | 'blue' | 'amber'}>
            <StatusPill text={group.title} tone={group.tone as 'green' | 'blue' | 'amber'} />
            <h2 className="mt-4 text-3xl font-black">{group.title} 점검</h2>
            <div className="mt-5 space-y-3">
              {group.items.map(([label, href]) => (
                <Link key={`${label}-${href}`} href={href} className="block rounded-2xl bg-white p-4">
                  <div className="text-base font-black leading-7">{label}</div>
                  <div className="mt-1 text-xs font-bold text-slate-500">{href}</div>
                </Link>
              ))}
            </div>
          </CareCard>
        ))}
      </section>

      <section className="mt-8 rounded-[2rem] bg-slate-950 p-6 text-white">
        <h2 className="text-3xl font-black">최종 기준</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-5">
          {['3번 안에 완료', '전화·카톡·사진 대체', '큰 버튼', '큰 글씨', '검증된 매니저'].map((item) => (
            <div key={item} className="rounded-2xl bg-white/10 p-4 text-center text-lg font-black">
              {item}
            </div>
          ))}
        </div>
      </section>
    </AppFrame>
  )
}
