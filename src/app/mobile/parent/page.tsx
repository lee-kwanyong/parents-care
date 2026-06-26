import { ParentCompletionEntry } from '@/components/parent/ParentCompletionEntry'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '부모님 안부 입력 | 안부웍스',
  description: '부모님이 오늘 안부를 버튼 하나로 남기는 화면입니다.'
}

export default function MobileParentPage() {
  return <ParentCompletionEntry />
}
