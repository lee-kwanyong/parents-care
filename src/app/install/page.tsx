import Link from 'next/link'
import { AppFrame } from '@/components/ui/AppFrame'
import { CareButton } from '@/components/ui/CareButton'
import { CareCard } from '@/components/ui/CareCard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { StatusPill } from '@/components/ui/StatusPill'
import { PWAInstallPanel } from '@/components/PWAInstallPanel'

const quickLinks = [
  ['/child', '자녀앱 홈'],
  ['/care-intake', '사진·카톡 맡기기'],
  ['/child/today', '오늘의 안심판'],
  ['/child/tasks', '가족 할 일'],
  ['/parent/install', '부모님 폰 설치 안내']
]

export default function InstallPage() {
  return (
    <AppFrame title="홈 화면에 추가" subtitle="부모님 케어를 앱처럼 사용하세요">
      <SectionHeader
        eyebrow="설치 안내"
        title={
          <>
            앱처럼 열리게
            <br />
            홈 화면에 추가하세요.
          </>
        }
        description="설치가 어렵지 않도록 자녀용과 부모님용을 분리했습니다. 자녀는 오늘의 안심판 중심, 부모님은 큰 글씨 화면 중심으로 씁니다."
        actions={
          <>
            <CareButton href="/child" tone="primary">
              자녀앱 열기
            </CareButton>
            <CareButton href="/parent/install" tone="dark">
              부모님 폰 안내
            </CareButton>
          </>
        }
      />

      <div className="mt-8">
        <PWAInstallPanel mode="guardian" />
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <CareCard tone="green">
          <StatusPill text="자녀용" tone="green" />
          <h2 className="mt-4 text-2xl font-black">오늘의 안심판</h2>
          <p className="mt-3 text-sm font-bold leading-6">
            안심 / 확인 필요 / 긴급과 가족 할 일 3개를 먼저 확인합니다.
          </p>
        </CareCard>

        <CareCard tone="blue">
          <StatusPill text="부모님용" tone="blue" />
          <h2 className="mt-4 text-2xl font-black">큰 글씨 화면</h2>
          <p className="mt-3 text-sm font-bold leading-6">
            오늘 일정, 만남 암호, 자녀 전화, 도움 요청만 보여줍니다.
          </p>
        </CareCard>

        <CareCard tone="amber">
          <StatusPill text="대체 가능" tone="amber" />
          <h2 className="mt-4 text-2xl font-black">전화·카톡·사진</h2>
          <p className="mt-3 text-sm font-bold leading-6">
            앱 입력이 어려우면 전화, 카톡, 사진으로 맡길 수 있습니다.
          </p>
        </CareCard>
      </section>

      <section className="mt-8 rounded-[2rem] bg-white p-5 shadow-sm md:p-7">
        <h2 className="text-2xl font-black">바로 열기</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {quickLinks.map(([href, label]) => (
            <Link key={href} href={href} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black hover:bg-emerald-50">
              {label}
            </Link>
          ))}
        </div>
      </section>
    </AppFrame>
  )
}
