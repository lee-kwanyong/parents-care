import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { Card, CardTitle } from '@/components/Card'

export default async function CheckEmailPage({ searchParams }: { searchParams?: Promise<{ email?: string; demo?: string }> }) {
  const params = searchParams ? await searchParams : {}
  return (
    <AppShell title="이메일을 확인해주세요" subtitle="받은 메일의 로그인 링크를 누르면 부모님 케어 플랫폼으로 돌아옵니다.">
      <Card>
        <CardTitle
          eyebrow={params.demo ? '데모 모드' : '매직링크 발송'}
          title="로그인 링크를 보냈습니다"
          description={params.email ? `${params.email} 주소로 보냈습니다.` : '메일함을 확인해주세요.'}
        />
        <p className="rounded-2xl bg-care-50 p-4 text-sm leading-6 text-care-900">메일이 보이지 않으면 스팸함을 확인하거나 다시 로그인 링크를 요청해주세요.</p>
        <Link href="/login" className="mt-6 inline-block rounded-2xl bg-slate-100 px-5 py-3 font-black">다시 요청하기</Link>
      </Card>
    </AppShell>
  )
}
