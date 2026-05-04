import { AppShell } from '@/components/AppShell'
import { WorryIntakeCenter } from '@/components/WorryIntakeCenter'

export default async function CareRequestPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const params = searchParams ? await searchParams : {}
  return (
    <AppShell title="부모님 걱정 접수센터" subtitle="기능을 고르지 말고 걱정을 눌러주세요. 전화·카톡·사진·간단 입력으로 접수하고 운영실이 해결 플랜으로 바꿉니다.">
      <WorryIntakeCenter error={params.error} />
    </AppShell>
  )
}
