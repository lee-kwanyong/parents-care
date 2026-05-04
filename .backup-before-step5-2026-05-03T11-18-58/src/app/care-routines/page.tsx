import { AppShell } from '@/components/AppShell'
import { Card, CardTitle } from '@/components/Card'
export default function CareRoutinesPage() { const items = ['혈압·당뇨 정기진료', '재활·물리치료', '안과·치과 정기검진', '정기 안부 확인', '같은 매니저 우선 배정']; return <AppShell title="정기진료·정기케어 자동관리" subtitle="단건 동행에서 끝나지 않고 계속 필요한 부모님 케어 캘린더로 확장합니다."><div className="grid gap-4 md:grid-cols-2">{items.map((item) => <Card key={item}><CardTitle title={item} description="다음 시점이 오면 보호자에게 쉽게 확인받고, 전화/카톡 접수로 이어집니다." /></Card>)}</div></AppShell> }
