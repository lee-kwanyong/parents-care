import { ParentCheckinPanel } from '@/components/parent/ParentCheckinPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '부모님 안부 앱 | 안부웍스',
  description: '부모님이 오늘 안부 상태를 쉽고 크게 남기는 화면입니다.'
}

export default function MobileParentPage() {
  return <ParentCheckinPanel />
}
