import { ParentDailyCareButtons } from '@/components/ParentDailyCareButtons'
import { CareButton } from '@/components/ui/CareButton'
import { CareCard } from '@/components/ui/CareCard'
import { StatusPill } from '@/components/ui/StatusPill'

export default function ParentTodayPage() {
  return (
    <main className="min-h-screen bg-emerald-50 px-5 py-5 text-[#2F4948]">
      <section className="mx-auto max-w-xl space-y-5">
        <CareCard className="p-6" tone="white">
          <StatusPill text="오늘 안심" tone="green" />
          <h1 className="mt-5 text-5xl font-black leading-tight tracking-tight">
            오늘은
            <br />
            안심케어 매니저가
            <br />
            오시는 날이에요.
          </h1>

          <div className="mt-6 rounded-[2rem] bg-[#5F7C92] p-6 text-[#2E504D]">
            <p className="text-lg font-black text-emerald-200">오시는 분</p>
            <div className="mt-2 text-4xl font-black">김OO 매니저</div>
            <p className="mt-4 text-2xl font-black">오전 9시에 방문 예정이에요</p>
          </div>

          <div className="mt-5 rounded-[2rem] bg-amber-50 p-6">
            <p className="text-lg font-black text-amber-700">안심 확인 번호</p>
            <div className="mt-2 text-7xl font-black tracking-widest">2580</div>
            <p className="mt-3 text-lg font-black text-amber-900">
              방문하신 분에게 이 번호를 확인하세요.
            </p>
          </div>
        </CareCard>

        <div className="grid gap-3">
          <CareButton href="tel:01012345678" tone="dark" size="xl">
            자녀에게 바로 전화
          </CareButton>
          <CareButton href="tel:119" tone="danger" size="xl">
            긴급 도움 요청
          </CareButton>
          <CareButton href="/parent/install" tone="white" size="xl">
            앱처럼 사용하기
          </CareButton>
        </div>

        <ParentDailyCareButtons elderName="어머니" />

        <CareCard tone="blue">
          <h2 className="text-2xl font-black">안심케어 받을 때 참고할 내용</h2>
          <ul className="mt-4 space-y-3 text-xl font-black leading-8">
            <li>천천히 설명드릴게요.</li>
            <li>불편하시면 바로 말씀해주세요.</li>
            <li>약이나 알러지는 자녀분과 함께 확인할게요.</li>
          </ul>
        </CareCard>
      </section>
    </main>
  )
}
