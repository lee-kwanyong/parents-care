import Link from 'next/link'
import { CareButton } from '@/components/ui/CareButton'
import { CareCard } from '@/components/ui/CareCard'
import { StatusPill } from '@/components/ui/StatusPill'
import { PWAInstallPanel } from '@/components/PWAInstallPanel'

export default function ParentInstallPage() {
  return (
    <main className="bg-emerald-50 px-5 py-6 text-[#2F4948]">
      <section className="mx-auto max-w-xl space-y-5">
        <CareCard tone="white">
          <StatusPill text="부모님 폰 설치 안내" tone="green" />
          <h1 className="mt-5 text-5xl font-black leading-tight tracking-tight">
            어머니 폰에
            <br />
            큰 버튼으로
            <br />
            추가해드려요.
          </h1>
          <p className="mt-5 text-xl font-bold leading-9 text-[#4E6D69]">
            부모님은 앱 사용법을 외우실 필요가 없습니다. 홈 화면에서 버튼 하나만 누르면 오늘 일정과 만남 암호가 보입니다.
          </p>

          <div className="mt-6 grid gap-3">
            <CareButton href="/parent/today" tone="dark" size="xl">
              부모님 화면 미리보기
            </CareButton>
            <CareButton href="/child" tone="white" size="xl">
              자녀앱으로 돌아가기
            </CareButton>
          </div>
        </CareCard>

        <PWAInstallPanel mode="parent" />

        <CareCard tone="amber">
          <h2 className="text-3xl font-black">부모님께 이렇게 설명하세요</h2>
          <div className="mt-5 space-y-3">
            {[
              '이 버튼만 누르면 오늘 도와드릴 분을 볼 수 있어요.',
              '만남 암호 2580을 아는 분인지 확인하면 돼요.',
              '불편하면 자녀에게 전화 버튼만 누르세요.',
              '긴급하면 도움 요청 버튼을 누르세요.'
            ].map((text) => (
              <div key={text} className="rounded-2xl bg-white p-4 text-xl font-black leading-8">
                {text}
              </div>
            ))}
          </div>
        </CareCard>

        <div className="rounded-[2rem] bg-[#5F7C92] p-5 text-[#2E504D]">
          <h2 className="text-2xl font-black">설치 후 확인</h2>
          <div className="mt-4 space-y-3">
            <Link href="/parent/today" className="block rounded-2xl bg-white/70 p-4 text-lg font-black">
              오늘 일정 화면 열기
            </Link>
            <Link href="/care-passport" className="block rounded-2xl bg-white/70 p-4 text-lg font-black">
              케어패스포트 확인
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
