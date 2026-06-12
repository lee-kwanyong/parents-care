import Link from 'next/link'
import { CareFileBoard } from '@/components/CareFileBoard'

export default function CareFilesPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 text-[#2E504D]">
      <section className="mx-auto max-w-6xl">
        <p className="text-sm font-black text-emerald-700">파일함</p>
        <h1 className="mt-2 text-3xl font-black md:text-5xl">
          약 봉투, 영수증, 처방전을
          <br />
          안전하게 보관합니다.
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-[#63807C]">
          사진·카톡 접수, 약 봉투, 영수증, 검사결과지, 처방전 파일을 Supabase Storage에 저장하고 운영실이 확인합니다.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/care-intake" className="rounded-2xl bg-[#8CCFC3] px-5 py-4 font-black text-[#2E504D]">
            사진·카톡으로 맡기기
          </Link>
          <Link href="/child/files" className="rounded-2xl bg-slate-100 px-5 py-4 font-black">
            자녀 파일함
          </Link>
          <Link href="/admin/ops/files" className="rounded-2xl bg-[#5F7C92] px-5 py-4 font-black text-[#2E504D]">
            운영실 파일함
          </Link>
        </div>

        <div className="mt-8">
          <CareFileBoard mode="family" />
        </div>
      </section>
    </main>
  )
}
