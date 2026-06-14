import { AdminTodayRunbookPanel } from '@/components/admin/AdminTodayRunbookPanel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '오늘 운영 체크리스트 | 안부웍스 Admin',
  description: '운영실이 오늘 처리해야 할 가입자, 안부 신호, 문자, 스마트링, R&D 후속 액션을 체크합니다.'
}

export default function AdminOpsTodayRunbookPage() {
  return <AdminTodayRunbookPanel />
}
