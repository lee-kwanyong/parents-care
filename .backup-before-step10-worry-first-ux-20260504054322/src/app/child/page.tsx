import { AppShell } from '@/components/AppShell'
import { BigButton } from '@/components/BigButton'
import { ManagerTrustCard } from '@/components/ManagerTrustCard'
import { TodayReassurancePanel } from '@/components/TodayReassurancePanel'
import { demoManager } from '@/lib/mock-data'
export default function ChildPage() { return <AppShell title="자녀앱" subtitle="버튼은 적게, 확인은 빠르게. 40대 이상 보호자를 위한 초간단 홈입니다."><div className="grid gap-6"><TodayReassurancePanel /><div className="grid gap-3 sm:grid-cols-4"><BigButton href="/care-request">부모님 걱정 맡기기</BigButton><BigButton href="/care-packs" tone="secondary">케어팩</BigButton><BigButton href="/child/appointments/demo" tone="secondary">리포트</BigButton><BigButton href="/care-passport" tone="secondary">케어패스포트</BigButton></div><ManagerTrustCard manager={demoManager} /></div></AppShell> }
