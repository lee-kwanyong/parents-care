import { AppShell } from '@/components/AppShell'
import { BigButton } from '@/components/BigButton'
import { CarePackGrid } from '@/components/CarePackGrid'
import { TodayReassurancePanel } from '@/components/TodayReassurancePanel'
import { WorryIntakeCenter } from '@/components/WorryIntakeCenter'

export default function HomePage() {
  return <AppShell title="부모님 걱정을 쉽게 맡기는 앱" subtitle="기능을 찾지 않아도 됩니다. 40대 이상 보호자가 걱정만 누르면 병원·밥·약·서류·퇴원 후 케어를 해결 플랜으로 정리합니다."><div className="grid gap-6"><TodayReassurancePanel /><div className="grid gap-3 sm:grid-cols-4"><BigButton href="/care-request">걱정 맡기기</BigButton><BigButton href="/care-meal" tone="secondary">밥·약 확인</BigButton><BigButton href="/care-packs" tone="secondary">케어팩 선택</BigButton><BigButton href="/impact" tone="secondary">사회공헌</BigButton></div><WorryIntakeCenter /><CarePackGrid /></div></AppShell>
}
