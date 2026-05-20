import Link from 'next/link'
import { AppFrame } from '@/components/ui/AppFrame'
import { AdminLoginPanel } from '@/components/auth/AdminLoginPanel'

export default function AdminPage() {
  return (
    <AppFrame title="운영실 Admin" subtitle="운영실은 별도 관리자 화면으로 접속합니다" showMobileNav={false}>
      <section className="mx-auto max-w-xl space-y-4">
        <AdminLoginPanel />

        <Link
          href="/admin/health"
          className="block rounded-[1.5rem] bg-[#F0FBF7] p-5 text-center font-black text-[#2F756B] ring-1 ring-[#D3ECE6]"
        >
          시스템 점검센터 보기
        </Link>
      </section>
    </AppFrame>
  )
}
