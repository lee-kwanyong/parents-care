import { ParentAutoGate } from '@/components/parent/ParentAutoGate'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '부모님 안부 자동모드 | 안부웍스',
  description: '평소에는 자동으로 확인하고, 필요할 때만 버튼 하나로 안부를 남깁니다.'
}

export default function MobileParentPage() {
  return <ParentAutoGate />
}
