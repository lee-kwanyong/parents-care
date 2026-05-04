import { AppShell } from '@/components/AppShell'
import { OpsCommandCenter } from '@/components/OpsCommandCenter'
import { WorryIntakeCenter } from '@/components/WorryIntakeCenter'
export default function OpsWorryCenterPage() { return <AppShell title="운영실 걱정 해결 센터" subtitle="전화·카톡·사진 접수를 케어팩과 실행 태스크로 바꿉니다."><div className="grid gap-6"><OpsCommandCenter /><WorryIntakeCenter /></div></AppShell> }
