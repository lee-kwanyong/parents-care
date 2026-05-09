import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/AppShell'
import { Card, CardTitle } from '@/components/Card'
import { createServerSupabaseClient, getCurrentUser } from '@/lib/supabase/server'

export default async function AccountPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/account')

  const supabase = await createServerSupabaseClient()
  const familyResult = supabase ? await supabase.rpc('current_user_family_id') : { data: null }

  return (
    <AppShell title="내 계정과 가족 공간" subtitle="부모님 걱정 접수, 케어팩, 사회공헌 연결이 이 가족 공간에 저장됩니다.">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle eyebrow="로그인됨" title={user.email ?? '보호자'} description="Supabase Auth 세션이 연결되어 있습니다." />
          <p className="rounded-2xl bg-slate-100 p-4 text-sm text-[#63807C]">사용자 ID: {user.id}</p>
          <Link href="/logout" className="mt-6 inline-block rounded-2xl bg-slate-100 px-5 py-3 font-black">로그아웃</Link>
        </Card>
        <Card>
          <CardTitle eyebrow="가족 공간" title={familyResult.data ? '가족 공간 연결됨' : '가족 공간 확인 필요'} description="처음 이용자는 온보딩에서 자동 생성됩니다." />
          <p className="rounded-2xl bg-care-50 p-4 text-sm text-care-900">가족 공간 ID: {familyResult.data ? String(familyResult.data) : '아직 없음'}</p>
          <Link href="/onboarding" className="mt-6 inline-block rounded-2xl bg-care-600 px-5 py-3 font-black text-[#2E504D]">가족 공간 설정</Link>
        </Card>
      </div>
    </AppShell>
  )
}
