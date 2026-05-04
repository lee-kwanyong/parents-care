import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { Card, CardTitle } from '@/components/Card'

export default async function CareRequestThanksPage({ searchParams }: { searchParams?: Promise<{ id?: string; demo?: string }> }) {
  const params = searchParams ? await searchParams : {}
  return (
    <AppShell title="걱정 접수가 완료됐습니다" subtitle="이제 앱은 접수 내용을 운영실 케어 플랜으로 바꾸고, 보호자는 안심판에서 진행 상태만 확인하면 됩니다.">
      <Card>
        <CardTitle
          eyebrow={params.demo ? '데모 접수' : 'Supabase 저장 완료'}
          title="다음 단계는 운영실 확인입니다"
          description="병원·밥·약·서류·퇴원 후 케어 중 필요한 항목을 묶어서 안내합니다."
        />
        {params.id ? <p className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-600">접수번호: {params.id}</p> : null}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Link href="/child" className="rounded-2xl bg-care-600 px-5 py-4 text-center font-black text-white">오늘의 안심판 보기</Link>
          <Link href="/care-packs" className="rounded-2xl bg-slate-100 px-5 py-4 text-center font-black">케어팩 보기</Link>
          <Link href="/ops/worry-center" className="rounded-2xl bg-slate-100 px-5 py-4 text-center font-black">운영실 보기</Link>
        </div>
      </Card>
    </AppShell>
  )
}
