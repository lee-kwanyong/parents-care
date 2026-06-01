import { ParentLoginPanel } from '@/components/auth/ParentLoginPanel'

export const metadata = {
  title: '부모님 6자리 코드입력 | 부모님 안심케어',
  description: '자녀가 알려준 6자리 연결코드로 부모님 안심 화면에 접속합니다.'
}

export default function ParentLoginPage() {
  return (
    <main className="min-h-[100svh] bg-[linear-gradient(180deg,#F6FFFC_0%,#FFFFFF_55%,#F7FBFF_100%)] px-4 py-5 text-[#173B36] sm:px-5 sm:py-8">
      <ParentLoginPanel />
    </main>
  )
}
