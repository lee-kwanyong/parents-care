import Link from 'next/link'
import { SocialCareBoard } from '@/components/SocialCareBoard'

export default function ChildSocialCarePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-emerald-700">자녀앱</p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">
              사회공헌·공공지원
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              비용 부담, 식사 공백, 가족 부재, 퇴원 후 돌봄 공백에 대한 지원 검토 상태를 확인합니다.
            </p>
          </div>

          <div className="flex gap-3">
            <Link href="/care-social" className="rounded-2xl bg-emerald-600 px-5 py-4 font-black text-white">
              지원 검토 요청
            </Link>
            <Link href="/child" className="rounded-2xl bg-slate-100 px-5 py-4 font-black">
              자녀 홈
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <SocialCareBoard mode="family" />
        </div>
      </section>
    </main>
  )
}
