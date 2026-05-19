import { completeOnboardingAction } from '@/app/actions'
import { AppShell } from '@/components/AppShell'
import { Card, CardTitle } from '@/components/Card'
import { getCurrentUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function OnboardingPage({ searchParams }: { searchParams?: Promise<{ error?: string; demo?: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/onboarding')
  const params = searchParams ? await searchParams : {}
  return (
    <AppShell title="가족 공간 만들기" subtitle="처음 한 번만 보호자 이름과 가족 이름을 확인합니다. 이후에는 안심케어 접수가 자동으로 이 가족 공간에 저장됩니다.">
      <Card>
        <CardTitle eyebrow="1분 설정" title="우리 가족 케어 공간" description="복잡한 설정 없이 바로 시작합니다." />
        {params.error ? <p className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{params.error}</p> : null}
        <form action={completeOnboardingAction} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-black text-[#4E6D69]">보호자 이름</span>
            <input name="displayName" defaultValue={user.email ?? ''} className="w-full rounded-2xl border border-[#E0EFEC] p-4 outline-none focus:border-care-500" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-black text-[#4E6D69]">가족 공간 이름</span>
            <input name="familyName" defaultValue="우리 가족" className="w-full rounded-2xl border border-[#E0EFEC] p-4 outline-none focus:border-care-500" />
          </label>
          <button className="w-full rounded-3xl bg-care-600 px-6 py-5 text-xl font-black text-[#2E504D] hover:bg-care-700">시작하기</button>
        </form>
      </Card>
    </AppShell>
  )
}
