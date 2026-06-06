import { ParentLoginPanel } from '@/components/auth/ParentLoginPanel'

export const metadata = {
  title: '부모님 6자리 코드입력 | 부모님 안심케어',
  description: '자녀가 알려준 6자리 연결코드와 휴대폰 뒤 4자리로 접속합니다.'
}

export default function ParentLoginPage() {
  return (
    <main className="min-h-[100svh] bg-[linear-gradient(180deg,#F7FFFC_0%,#FFFFFF_56%,#F6FBFF_100%)] px-4 py-5 text-[#17443F] sm:px-5 sm:py-8">
      <ParentLoginPanel />
    </main>
  )
}
