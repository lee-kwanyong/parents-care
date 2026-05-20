import { AppFrame } from '@/components/ui/AppFrame'
import { AdminHealthBoard } from '@/components/admin/AdminHealthBoard'

export default function AdminHealthPage() {
  return (
    <AppFrame
      title="시스템 점검센터"
      subtitle="운영 전 환경변수, Supabase, 주요 화면을 점검합니다"
      showMobileNav={false}
    >
      <AdminHealthBoard />
    </AppFrame>
  )
}
